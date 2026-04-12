-- ============================================================
-- Fix trigger functions missing SECURITY DEFINER
--
-- Problem: These triggers fire in the security context of the
-- calling user (authenticated). The tables they write to have
-- RLS enabled with no INSERT/UPDATE policies for regular users,
-- so every trigger insert/update is silently blocked and rolls
-- back the parent transaction.
--
-- Fix: Add SECURITY DEFINER so the functions run as the
-- postgres superuser (which bypasses RLS), matching the pattern
-- already used by handle_new_user() and create_wallet_for_vendor().
-- ============================================================

-- ── 1. init_order_status ─────────────────────────────────────
-- Fires AFTER INSERT on orders → inserts the initial 'placed' row
-- into order_status_history. Without SECURITY DEFINER the client
-- user cannot insert into that table (no INSERT RLS policy).

create or replace function init_order_status()
returns trigger language plpgsql security definer as $$
begin
  insert into order_status_history (order_id, status, updated_by)
  values (new.id, 'placed', new.client_id);
  return new;
end;
$$;

-- ── 2. track_order_status ────────────────────────────────────
-- Fires AFTER UPDATE on orders → records every status change.
-- Vendors and admins update orders; without SECURITY DEFINER
-- the insert into order_status_history is also blocked.

create or replace function track_order_status()
returns trigger language plpgsql security definer as $$
begin
  if (old.order_status is distinct from new.order_status) then
    insert into order_status_history (order_id, status, updated_by)
    values (new.id, new.order_status, auth.uid());
  end if;
  return new;
end;
$$;

-- ── 3. update_follower_count ─────────────────────────────────
-- Fires AFTER INSERT/DELETE on follows → increments/decrements
-- follower_count on vendor_profiles. The follower user cannot
-- update another user's vendor_profiles row, so the trigger
-- was silently failing for all follow/unfollow actions.

create or replace function update_follower_count()
returns trigger language plpgsql security definer as $$
begin
  if (tg_op = 'INSERT') then
    update vendor_profiles set follower_count = follower_count + 1 where id = new.vendor_id;
  elsif (tg_op = 'DELETE') then
    update vendor_profiles set follower_count = follower_count - 1 where id = old.vendor_id;
  end if;
  return null;
end;
$$;

-- ── 4. order_status_history INSERT policy ────────────────────
-- Allow clients and vendors to explicitly read their own history
-- entries. Inserts are handled exclusively by the triggers above
-- so no user-facing INSERT policy is needed, but we add a
-- permissive policy to avoid accidental future breakage.

drop policy if exists "status_history_insert_own" on order_status_history;
create policy "status_history_insert_own" on order_status_history
  for insert with check (
    exists (
      select 1 from orders o
      where o.id = order_id
        and (o.client_id = auth.uid() or o.vendor_id = auth.uid() or get_my_role() = 'admin')
    )
  );
