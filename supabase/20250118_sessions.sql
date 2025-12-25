-- Case AI sessions & message metadata
create table if not exists public.case_sessions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);

alter table public.case_sessions enable row level security;

drop policy if exists "case_sessions_access" on public.case_sessions;
create policy "case_sessions_access"
on public.case_sessions for select
using (
  exists (
    select 1 from public.cases c
    where c.id = case_sessions.case_id
      and (
        c.user_id = auth.uid() or
        exists (
          select 1 from public.case_members m
          where m.case_id = c.id and m.member_id = auth.uid()
        )
      )
  )
);

drop policy if exists "case_sessions_insert_access" on public.case_sessions;
create policy "case_sessions_insert_access"
on public.case_sessions for insert
with check (
  exists (
    select 1 from public.cases c
    where c.id = case_sessions.case_id
      and (
        c.user_id = auth.uid() or
        exists (
          select 1 from public.case_members m
          where m.case_id = c.id and m.member_id = auth.uid()
        )
      )
  )
);

alter table if exists public.case_messages
  add column if not exists session_id uuid references public.case_sessions(id) on delete cascade;

alter table if exists public.case_messages
  add column if not exists user_id uuid references auth.users(id);
