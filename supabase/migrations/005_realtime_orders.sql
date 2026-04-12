-- ============================================================
-- Enable Supabase Realtime on orders table with filtered
-- subscriptions support.
--
-- Problem: Filtered postgres_changes subscriptions
-- (e.g. client_id=eq.X) require REPLICA IDENTITY FULL on
-- the table. Without it, only the primary key (id) is
-- included in the WAL for UPDATE events, so the filter
-- cannot match against client_id or vendor_id, and the
-- Realtime event is never delivered to subscribers.
--
-- Fix: Set REPLICA IDENTITY FULL on orders so that all
-- column values are written to the WAL on every UPDATE,
-- enabling per-user filtered channels.
-- ============================================================

-- Allow Realtime to deliver filtered UPDATE events
alter table orders replica identity full;

-- Add orders table to the Supabase Realtime publication
-- (safe to run even if already added — do nothing on conflict)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table orders;
  end if;
end
$$;
