-- AI discussion threads tied to specific documents
create table if not exists public.document_ai_sessions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.case_documents(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Document chat',
  created_at timestamptz not null default now()
);

create table if not exists public.document_ai_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.document_ai_sessions(id) on delete cascade,
  document_id uuid not null references public.case_documents(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.document_ai_sessions enable row level security;
alter table public.document_ai_messages enable row level security;

drop policy if exists "document_ai_sessions_access" on public.document_ai_sessions;
create policy "document_ai_sessions_access"
on public.document_ai_sessions for select using (
  exists (
    select 1 from public.cases c
    left join public.case_members m on m.case_id = c.id and m.member_id = auth.uid()
    where c.id = document_ai_sessions.case_id
      and (c.user_id = auth.uid() or m.member_id is not null)
  )
);

drop policy if exists "document_ai_sessions_insert" on public.document_ai_sessions;
create policy "document_ai_sessions_insert"
on public.document_ai_sessions for insert with check (
  exists (
    select 1 from public.cases c
    left join public.case_members m on m.case_id = c.id and m.member_id = auth.uid()
    where c.id = document_ai_sessions.case_id
      and (c.user_id = auth.uid() or (m.member_id is not null and m.role in ('editor','owner')))
  )
);

drop policy if exists "document_ai_messages_access" on public.document_ai_messages;
create policy "document_ai_messages_access"
on public.document_ai_messages for select using (
  exists (
    select 1 from public.document_ai_sessions s
    join public.cases c on c.id = s.case_id
    left join public.case_members m on m.case_id = c.id and m.member_id = auth.uid()
    where s.id = document_ai_messages.session_id
      and (c.user_id = auth.uid() or m.member_id is not null)
  )
);

drop policy if exists "document_ai_messages_insert" on public.document_ai_messages;
create policy "document_ai_messages_insert"
on public.document_ai_messages for insert with check (
  exists (
    select 1 from public.document_ai_sessions s
    join public.cases c on c.id = s.case_id
    left join public.case_members m on m.case_id = c.id and m.member_id = auth.uid()
    where s.id = document_ai_messages.session_id
      and (c.user_id = auth.uid() or (m.member_id is not null and m.role in ('editor','owner')))
  )
);
