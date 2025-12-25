-- Calendar events attached to cases
create table if not exists public.case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  title text not null,
  description text,
  event_date timestamptz not null,
  reminder_minutes int default 1440,
  source text default 'manual',
  suggested boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_case_events_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists case_events_updated_at on public.case_events;
create trigger case_events_updated_at
before update on public.case_events
for each row execute function public.set_case_events_updated_at();

alter table public.case_events enable row level security;

drop policy if exists "case_events_select" on public.case_events;
create policy "case_events_select"
on public.case_events for select
using (
  exists (
    select 1 from public.cases c
    where c.id = case_events.case_id
      and (
        c.user_id = auth.uid() or
        exists (
          select 1 from public.case_members m
          where m.case_id = case_events.case_id
            and m.member_id = auth.uid()
        )
      )
  )
);

drop policy if exists "case_events_modify" on public.case_events;
create policy "case_events_modify"
on public.case_events for all
using (
  exists (
    select 1 from public.cases c
    where c.id = case_events.case_id
      and (
        c.user_id = auth.uid() or
        exists (
          select 1 from public.case_members m
          where m.case_id = case_events.case_id
            and m.member_id = auth.uid()
            and m.role in ('editor', 'owner')
        )
      )
  )
)
with check (
  exists (
    select 1 from public.cases c
    where c.id = case_events.case_id
      and (
        c.user_id = auth.uid() or
        exists (
          select 1 from public.case_members m
          where m.case_id = case_events.case_id
            and m.member_id = auth.uid()
            and m.role in ('editor', 'owner')
        )
      )
  )
);
