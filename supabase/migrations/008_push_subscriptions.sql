-- Push notification subscriptions
-- Stores Web Push API subscriptions for each user/device

create table if not exists public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  endpoint     text not null,
  p256dh       text not null,
  auth         text not null,
  user_agent   text,
  created_at   timestamptz not null default now(),
  -- One subscription per endpoint (device)
  unique (user_id, endpoint)
);

-- Users can only manage their own subscriptions
alter table public.push_subscriptions enable row level security;

create policy "Users manage own push subscriptions"
  on public.push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for fast lookup when sending push to a user
create index push_subscriptions_user_id_idx on public.push_subscriptions(user_id);
