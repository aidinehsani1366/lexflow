-- Cases & collaboration schema bootstrap
-- Run inside your Supabase SQL editor or via supabase migrate.

-- 1. Cases table
create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  status text default 'open',
  created_at timestamptz not null default now()
);

-- 2. Case members
create table if not exists public.case_members (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor',
  created_at timestamptz not null default now(),
  constraint case_members_unique unique(case_id, member_id)
);

-- 3. Messages (AI / collaboration)
create table if not exists public.case_messages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  sender text not null check (sender in ('user','ai')),
  content text not null,
  created_at timestamptz not null default now()
);

-- 4. Checklists now relate to cases (nullable for legacy rows)
alter table if exists public.checklists
  add column if not exists case_id uuid references public.cases(id) on delete set null;
alter table if exists public.checklists
  add column if not exists document_type text default 'General';
alter table if exists public.checklists
  add column if not exists notes text;

-- 5. Enable row-level security
alter table public.cases enable row level security;
alter table public.case_members enable row level security;
alter table public.case_messages enable row level security;

-- 6. Policies -------------------------------------------------------------

drop policy if exists "cases_select_owner_or_member" on public.cases;
drop policy if exists "cases_modify_owner_only" on public.cases;
drop policy if exists "case_members_select_self_only" on public.case_members;
drop policy if exists "case_members_delete_self_only" on public.case_members;
drop policy if exists "case_messages_select_members" on public.case_messages;
drop policy if exists "case_messages_insert_members" on public.case_messages;
drop policy if exists "checklists_case_members" on public.checklists;

-- Helper policy condition: owner or member
create policy "cases_select_owner_or_member"
on public.cases for select
using (
  auth.uid() = user_id or
  exists (
    select 1 from public.case_members m
    where m.case_id = cases.id and m.member_id = auth.uid()
  )
);

create policy "cases_modify_owner_only"
on public.cases for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Case members can read/remove only their own membership rows.
create policy "case_members_select_self_only"
on public.case_members for select
using (member_id = auth.uid());

create policy "case_members_delete_self_only"
on public.case_members for delete
using (member_id = auth.uid());

create policy "case_messages_select_members"
on public.case_messages for select
using (
  exists (
    select 1 from public.cases c
    left join public.case_members m on m.case_id = c.id and m.member_id = auth.uid()
    where c.id = case_messages.case_id
      and (c.user_id = auth.uid() or m.member_id is not null)
  )
);

create policy "case_messages_insert_members"
on public.case_messages for insert
with check (
  exists (
    select 1 from public.cases c
    left join public.case_members m on m.case_id = c.id and m.member_id = auth.uid()
    where c.id = case_messages.case_id
      and (c.user_id = auth.uid() or m.member_id is not null)
  )
);

-- Checklist access for case members (select/update/delete)
create policy "checklists_case_members"
on public.checklists for select
using (
  user_id = auth.uid() or
  (case_id is not null and exists (
    select 1 from public.cases c
    left join public.case_members m on m.case_id = c.id and m.member_id = auth.uid()
    where c.id = checklists.case_id
      and (c.user_id = auth.uid() or m.member_id is not null)
  ))
);
