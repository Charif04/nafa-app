-- ============================================================
-- Categories table
-- Replaces hardcoded category lists in shop/home pages.
-- Admin can create, update, reorder and delete categories.
-- ============================================================

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,   -- slug used in products.category
  label       text not null,          -- display label (fr)
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Pre-populate with the existing hardcoded categories
insert into public.categories (name, label, sort_order) values
  ('mode',          'Mode',          1),
  ('électronique',  'Électronique',  2),
  ('maison',        'Maison',        3),
  ('beauté',        'Beauté',        4),
  ('sport',         'Sport',         5),
  ('alimentation',  'Alimentation',  6),
  ('artisanat',     'Artisanat',     7),
  ('bijoux',        'Bijoux',        8),
  ('autre',         'Autre',         9)
on conflict (name) do nothing;

-- RLS
alter table public.categories enable row level security;

-- Everyone can read active categories
create policy "categories_select_all" on public.categories
  for select using (true);

-- Only admins can insert / update / delete
create policy "categories_insert_admin" on public.categories
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "categories_update_admin" on public.categories
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "categories_delete_admin" on public.categories
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create index if not exists categories_sort_order_idx on public.categories(sort_order);
