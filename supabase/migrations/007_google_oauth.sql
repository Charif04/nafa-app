-- ============================================================
-- Support Google OAuth user creation
--
-- When a user signs up via Google, Supabase populates
-- raw_user_meta_data with Google fields:
--   full_name / name        → "Amadou Diallo"
--   given_name              → "Amadou"
--   family_name             → "Diallo"
--   picture / avatar_url    → profile photo URL
--
-- The original trigger only looked for first_name / last_name,
-- so Google users were created with empty names.
--
-- Also adds avatar_url to the insert so Google profile photos
-- are stored on first login.
-- ============================================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, role, first_name, last_name, phone, country, avatar_url)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'client'),
    -- Email/password signup sets first_name; Google sets given_name; fallback: first word of full_name
    coalesce(
      nullif(new.raw_user_meta_data->>'first_name', ''),
      new.raw_user_meta_data->>'given_name',
      split_part(coalesce(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name', ''
      ), ' ', 1),
      ''
    ),
    -- Same for last_name / family_name / second word of full_name
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
    -- Google provides picture; regular signups have no avatar yet
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  );
  return new;
end;
$$;
