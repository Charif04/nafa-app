-- Migration 012 — New notification types + push_subscriptions RLS fix

-- 1. Add new notification types needed for vendor + admin
alter type notification_type add value if not exists 'new_order';
alter type notification_type add value if not exists 'low_stock';
alter type notification_type add value if not exists 'account_verified';
alter type notification_type add value if not exists 'account_suspended';
alter type notification_type add value if not exists 'order_cancelled';
alter type notification_type add value if not exists 'order_delivered';

-- 2. Allow the server-side push API route (using service_role key) to read
--    push subscriptions. The anon key cannot read other users' subscriptions.
--    service_role bypasses RLS automatically — no policy change needed.
--    Just ensure the existing policy does not inadvertently block service_role.
--    (In Supabase, service_role always bypasses RLS — this migration is a no-op
--     for that purpose, but documents the intent.)

-- 3. Ensure notifications table is in the realtime publication
--    (should already be there from migration 005, but idempotent)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table notifications;
  end if;
end $$;
