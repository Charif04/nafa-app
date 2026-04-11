-- ============================================================
-- NAFA Marketplace — Initial Schema
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ── Enums ────────────────────────────────────────────────────

create type user_role as enum ('client', 'vendor', 'admin');

create type order_status as enum (
  'placed', 'confirmed', 'preparing',
  'in_transit_warehouse', 'at_warehouse',
  'delivering', 'delivered', 'cancelled'
);

create type payment_method as enum ('orange_money', 'moov_money', 'card');
create type payment_status as enum ('pending', 'paid', 'failed');
create type shop_type as enum ('online', 'physical');
create type review_type as enum ('client_to_vendor', 'vendor_to_client');
create type alert_type as enum ('vendor_inactive', 'delivery_late', 'payment_failed', 'high_cancellation');
create type alert_severity as enum ('warning', 'critical');
create type withdrawal_status as enum ('pending', 'completed', 'failed');
create type notification_type as enum ('order_update', 'promo', 'review', 'system');

-- ── Profiles ─────────────────────────────────────────────────
-- Extends auth.users. Created automatically on signup via trigger.

create table profiles (
  id          uuid references auth.users on delete cascade primary key,
  role        user_role not null default 'client',
  first_name  text not null default '',
  last_name   text not null default '',
  phone       text,
  country     text not null default 'Burkina Faso',
  region      text,
  language    text not null default 'fr',
  currency    text not null default 'FCFA',
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Trigger: auto-create profile on auth.users insert
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, role, first_name, last_name, phone, country)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'client'),
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'country', 'Burkina Faso')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── Vendor Profiles ──────────────────────────────────────────
-- Only exists for users with role = 'vendor'

create table vendor_profiles (
  id                uuid references profiles on delete cascade primary key,
  shop_name         text not null,
  shop_description  text,
  cover_photo_url   text,
  cnib_url          text,
  shop_type         shop_type not null default 'online',
  shop_address      text,
  is_verified       boolean not null default false,
  is_suspended      boolean not null default false,
  is_pending        boolean not null default true,
  rating            numeric(3,2) not null default 0,
  review_count      integer not null default 0,
  total_sales       integer not null default 0,
  total_revenue     numeric(14,2) not null default 0,
  follower_count    integer not null default 0,
  created_at        timestamptz not null default now()
);

-- ── Products ─────────────────────────────────────────────────

create table products (
  id          uuid primary key default gen_random_uuid(),
  vendor_id   uuid references profiles on delete cascade not null,
  title       text not null,
  description text,
  price       numeric(12,2) not null check (price > 0),  -- vendor price (pre-commission)
  currency    text not null default 'FCFA',
  images      text[] not null default '{}',
  category    text,
  stock       integer not null default 0 check (stock >= 0),
  rating      numeric(3,2) not null default 0,
  review_count integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger products_updated_at
  before update on products
  for each row execute procedure set_updated_at();

-- ── Orders ───────────────────────────────────────────────────

create table orders (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid references profiles not null,
  vendor_id        uuid references profiles not null,
  subtotal         numeric(12,2) not null,
  delivery_fee     numeric(12,2) not null default 0,
  total            numeric(12,2) not null,
  currency         text not null default 'FCFA',
  -- Delivery address (denormalized for immutability)
  delivery_street  text not null,
  delivery_city    text not null,
  delivery_region  text,
  delivery_country text not null default 'Burkina Faso',
  -- Payment
  payment_method   payment_method not null,
  payment_status   payment_status not null default 'pending',
  -- Status
  order_status     order_status not null default 'placed',
  created_at       timestamptz not null default now()
);

-- ── Order Items ──────────────────────────────────────────────
-- Snapshot of product at time of order (price, title, image)

create table order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid references orders on delete cascade not null,
  product_id  uuid references products,  -- nullable: product may be deleted
  title       text not null,
  price       numeric(12,2) not null,    -- vendor price at time of purchase
  quantity    integer not null check (quantity > 0),
  image       text
);

-- ── Order Status History ─────────────────────────────────────

create table order_status_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid references orders on delete cascade not null,
  status      order_status not null,
  updated_by  uuid references profiles,
  created_at  timestamptz not null default now()
);

-- Trigger: auto-insert history entry on order status change
create or replace function track_order_status()
returns trigger language plpgsql as $$
begin
  if (old.order_status is distinct from new.order_status) then
    insert into order_status_history (order_id, status, updated_by)
    values (new.id, new.order_status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger orders_status_history
  after update on orders
  for each row execute procedure track_order_status();

-- Trigger: insert initial 'placed' on order creation
create or replace function init_order_status()
returns trigger language plpgsql as $$
begin
  insert into order_status_history (order_id, status, updated_by)
  values (new.id, 'placed', new.client_id);
  return new;
end;
$$;

create trigger orders_init_status
  after insert on orders
  for each row execute procedure init_order_status();

-- ── Notifications ─────────────────────────────────────────────

create table notifications (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references profiles on delete cascade not null,
  type             notification_type not null,
  title            text not null,
  body             text,
  is_read          boolean not null default false,
  linked_order_id  uuid references orders on delete set null,
  created_at       timestamptz not null default now()
);

-- ── Reviews ──────────────────────────────────────────────────

create table reviews (
  id           uuid primary key default gen_random_uuid(),
  from_user_id uuid references profiles not null,
  to_user_id   uuid references profiles not null,
  order_id     uuid references orders not null,
  rating       integer not null check (rating between 1 and 5),
  comment      text,
  type         review_type not null,
  created_at   timestamptz not null default now(),
  unique (from_user_id, order_id, type)  -- one review per role per order
);

-- ── Follows ──────────────────────────────────────────────────

create table follows (
  follower_id  uuid references profiles on delete cascade not null,
  vendor_id    uuid references profiles on delete cascade not null,
  created_at   timestamptz not null default now(),
  primary key  (follower_id, vendor_id)
);

-- Update follower_count on follows changes
create or replace function update_follower_count()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    update vendor_profiles set follower_count = follower_count + 1 where id = new.vendor_id;
  elsif (tg_op = 'DELETE') then
    update vendor_profiles set follower_count = follower_count - 1 where id = old.vendor_id;
  end if;
  return null;
end;
$$;

create trigger follows_count
  after insert or delete on follows
  for each row execute procedure update_follower_count();

-- ── Wallets ──────────────────────────────────────────────────

create table wallets (
  vendor_id  uuid references profiles on delete cascade primary key,
  balance    numeric(14,2) not null default 0
);

-- Auto-create wallet when vendor_profile is created
create or replace function create_wallet_for_vendor()
returns trigger language plpgsql security definer as $$
begin
  insert into wallets (vendor_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger vendor_wallet_init
  after insert on vendor_profiles
  for each row execute procedure create_wallet_for_vendor();

-- ── Withdrawals ──────────────────────────────────────────────

create table withdrawals (
  id          uuid primary key default gen_random_uuid(),
  vendor_id   uuid references profiles not null,
  amount      numeric(12,2) not null check (amount > 0),
  method      payment_method not null,
  status      withdrawal_status not null default 'pending',
  created_at  timestamptz not null default now()
);

-- ── Alerts ───────────────────────────────────────────────────

create table alerts (
  id                 uuid primary key default gen_random_uuid(),
  type               alert_type not null,
  severity           alert_severity not null,
  related_order_id   uuid references orders on delete set null,
  related_vendor_id  uuid references profiles on delete set null,
  description        text,
  is_resolved        boolean not null default false,
  created_at         timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Helper: get current user role
create or replace function get_my_role()
returns user_role language sql security definer stable as $$
  select role from profiles where id = auth.uid();
$$;

-- ── Profiles RLS ─────────────────────────────────────────────

alter table profiles enable row level security;

-- Everyone can read any profile (needed for vendor pages)
create policy "profiles_select_all" on profiles
  for select using (true);

-- Users can only update their own profile
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- Admins can update any profile (suspend vendors, etc.)
create policy "profiles_update_admin" on profiles
  for update using (get_my_role() = 'admin');

-- ── Vendor Profiles RLS ──────────────────────────────────────

alter table vendor_profiles enable row level security;

create policy "vendor_profiles_select_all" on vendor_profiles
  for select using (true);

create policy "vendor_profiles_insert_own" on vendor_profiles
  for insert with check (auth.uid() = id);

create policy "vendor_profiles_update_own" on vendor_profiles
  for update using (auth.uid() = id);

create policy "vendor_profiles_update_admin" on vendor_profiles
  for update using (get_my_role() = 'admin');

-- ── Products RLS ─────────────────────────────────────────────

alter table products enable row level security;

-- Anyone can browse active products
create policy "products_select_active" on products
  for select using (is_active = true);

-- Vendors can see all their own products (including inactive)
create policy "products_select_own_vendor" on products
  for select using (auth.uid() = vendor_id);

-- Vendors can create/update/delete their own products
create policy "products_insert_own" on products
  for insert with check (auth.uid() = vendor_id);

create policy "products_update_own" on products
  for update using (auth.uid() = vendor_id);

create policy "products_delete_own" on products
  for delete using (auth.uid() = vendor_id);

-- Admins have full access
create policy "products_all_admin" on products
  for all using (get_my_role() = 'admin');

-- ── Orders RLS ───────────────────────────────────────────────

alter table orders enable row level security;

-- Clients see their own orders
create policy "orders_select_client" on orders
  for select using (auth.uid() = client_id);

-- Vendors see orders for their shop
create policy "orders_select_vendor" on orders
  for select using (auth.uid() = vendor_id);

-- Admins see all orders
create policy "orders_select_admin" on orders
  for select using (get_my_role() = 'admin');

-- Clients can place orders
create policy "orders_insert_client" on orders
  for insert with check (auth.uid() = client_id);

-- Vendors can update status (confirmed → preparing → in_transit_warehouse)
create policy "orders_update_vendor" on orders
  for update using (auth.uid() = vendor_id);

-- Admins can update any order
create policy "orders_update_admin" on orders
  for update using (get_my_role() = 'admin');

-- ── Order Items RLS ───────────────────────────────────────────

alter table order_items enable row level security;

create policy "order_items_select" on order_items
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_id
        and (o.client_id = auth.uid() or o.vendor_id = auth.uid() or get_my_role() = 'admin')
    )
  );

create policy "order_items_insert_client" on order_items
  for insert with check (
    exists (
      select 1 from orders o
      where o.id = order_id and o.client_id = auth.uid()
    )
  );

-- ── Order Status History RLS ──────────────────────────────────

alter table order_status_history enable row level security;

create policy "status_history_select" on order_status_history
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_id
        and (o.client_id = auth.uid() or o.vendor_id = auth.uid() or get_my_role() = 'admin')
    )
  );

-- ── Notifications RLS ─────────────────────────────────────────

alter table notifications enable row level security;

create policy "notifications_select_own" on notifications
  for select using (auth.uid() = user_id);

create policy "notifications_update_own" on notifications
  for update using (auth.uid() = user_id);

create policy "notifications_insert_service" on notifications
  for insert with check (get_my_role() = 'admin' or auth.uid() = user_id);

-- ── Reviews RLS ──────────────────────────────────────────────

alter table reviews enable row level security;

create policy "reviews_select_all" on reviews
  for select using (true);

create policy "reviews_insert_own" on reviews
  for insert with check (auth.uid() = from_user_id);

-- ── Follows RLS ──────────────────────────────────────────────

alter table follows enable row level security;

create policy "follows_select_all" on follows
  for select using (true);

create policy "follows_insert_own" on follows
  for insert with check (auth.uid() = follower_id);

create policy "follows_delete_own" on follows
  for delete using (auth.uid() = follower_id);

-- ── Wallets RLS ──────────────────────────────────────────────

alter table wallets enable row level security;

create policy "wallets_select_own" on wallets
  for select using (auth.uid() = vendor_id);

create policy "wallets_select_admin" on wallets
  for select using (get_my_role() = 'admin');

-- ── Withdrawals RLS ──────────────────────────────────────────

alter table withdrawals enable row level security;

create policy "withdrawals_select_own" on withdrawals
  for select using (auth.uid() = vendor_id);

create policy "withdrawals_insert_own" on withdrawals
  for insert with check (auth.uid() = vendor_id);

create policy "withdrawals_select_admin" on withdrawals
  for select using (get_my_role() = 'admin');

-- ── Alerts RLS ───────────────────────────────────────────────

alter table alerts enable row level security;

create policy "alerts_all_admin" on alerts
  for all using (get_my_role() = 'admin');

-- ============================================================
-- INDEXES (performance)
-- ============================================================

create index on orders (client_id);
create index on orders (vendor_id);
create index on orders (order_status);
create index on orders (created_at desc);
create index on order_items (order_id);
create index on order_status_history (order_id);
create index on notifications (user_id, is_read);
create index on notifications (created_at desc);
create index on products (vendor_id);
create index on products (category);
create index on reviews (to_user_id);
create index on follows (vendor_id);
