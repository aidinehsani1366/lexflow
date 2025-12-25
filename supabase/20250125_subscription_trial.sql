-- Add trial metadata to subscriptions
alter table if exists public.subscriptions
  add column if not exists trial_ends_at timestamptz;

-- index to quickly find expiring trials
create index if not exists subscriptions_trial_ends_at_idx
  on public.subscriptions(trial_ends_at);
