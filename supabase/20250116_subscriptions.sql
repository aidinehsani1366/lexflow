-- Subscriptions table to track plan/limits per account
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'solo',
  status text not null default 'active',
  seat_limit integer not null default 1,
  docs_quota integer default 100,
  ai_quota integer default 300,
  stripe_customer_id text,
  renewal_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_user_unique unique(user_id)
);

create or replace function public.set_subscriptions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_subscriptions_updated_at();

alter table if exists public.subscriptions
  add column if not exists stripe_customer_id text;

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_select_self" on public.subscriptions;
create policy "subscriptions_select_self"
on public.subscriptions for select
using (auth.uid() = user_id);
