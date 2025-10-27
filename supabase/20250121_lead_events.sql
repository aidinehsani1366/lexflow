-- Log every lead change for auditing
create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  actor_id uuid references auth.users(id),
  event_type text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table public.lead_events enable row level security;

drop policy if exists "lead_events_access" on public.lead_events;
create policy "lead_events_access"
on public.lead_events for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
  or exists (
    select 1 from public.leads l
    where l.id = lead_events.lead_id
      and (
        l.assigned_to = auth.uid() or
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.firm_id is not null
            and p.firm_id = l.firm_id
        )
      )
  )
);
