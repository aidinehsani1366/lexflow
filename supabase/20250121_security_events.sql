-- Security/audit events for monitoring
create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table public.security_events enable row level security;

drop policy if exists "security_events_admin" on public.security_events;
create policy "security_events_admin"
on public.security_events for all
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);
