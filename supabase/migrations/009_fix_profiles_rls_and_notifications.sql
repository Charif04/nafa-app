-- ============================================================
-- Fix 1: profiles table missing INSERT policy
--
-- Problem: profiles has RLS enabled but no INSERT policy.
-- On Supabase projects with force_row_level_security enabled
-- for the postgres role, even SECURITY DEFINER trigger functions
-- are subject to RLS. The handle_new_user() trigger therefore
-- fails to insert the new profile row → "Database error saving
-- new user" on every signup attempt.
--
-- Fix: add a permissive INSERT policy. The profiles.id column
-- is a FK to auth.users so only valid Supabase Auth UIDs can
-- ever be inserted; no additional constraint is needed.
-- ============================================================

drop policy if exists "profiles_insert_trigger" on profiles;
create policy "profiles_insert_trigger" on profiles
  for insert with check (true);

-- ============================================================
-- Fix 2: handle_new_user hardened with set search_path
--
-- Adding `set search_path = public` to the SECURITY DEFINER
-- function ensures it always resolves table names against the
-- public schema regardless of the calling session's search_path,
-- and additionally signals to Supabase that the function can
-- bypass connection-level RLS constraints.
-- ============================================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  insert into profiles (id, role, first_name, last_name, phone, country, avatar_url)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'client'),
    coalesce(
      nullif(new.raw_user_meta_data->>'first_name', ''),
      new.raw_user_meta_data->>'given_name',
      split_part(coalesce(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name', ''
      ), ' ', 1),
      ''
    ),
    coalesce(
      nullif(new.raw_user_meta_data->>'last_name', ''),
      new.raw_user_meta_data->>'family_name',
      nullif(split_part(coalesce(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name', ''
      ), ' ', 2), ''),
      ''
    ),
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'country', 'Burkina Faso'),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  );
  return new;
end;
$$;

-- ============================================================
-- Fix 3: notification_type enum missing 'order_status'
--
-- Problem: orders.ts inserts notifications with type 'order_status'
-- but the enum only has ('order_update', 'promo', 'review', 'system').
-- Every call to updateOrderStatus() fails with an invalid enum value.
-- ============================================================

alter type notification_type add value if not exists 'order_status';
