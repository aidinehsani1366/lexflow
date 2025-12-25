-- Case documents and chunks for AI context
create table if not exists public.case_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.case_documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  embedding jsonb,
  created_at timestamptz not null default now()
);

alter table public.case_documents enable row level security;
alter table public.document_chunks enable row level security;

drop policy if exists "case_documents_access" on public.case_documents;
create policy "case_documents_access"
on public.case_documents for select
using (
  exists (
    select 1 from public.cases c
    where c.id = case_documents.case_id
      and (
        c.user_id = auth.uid() or
        exists (
          select 1 from public.case_members m
          where m.case_id = c.id and m.member_id = auth.uid()
        )
      )
  )
);

drop policy if exists "document_chunks_access" on public.document_chunks;
create policy "document_chunks_access"
on public.document_chunks for select
using (
  exists (
    select 1 from public.case_documents cd
    join public.cases c on c.id = cd.case_id
    where cd.id = document_chunks.document_id
      and (
        c.user_id = auth.uid() or
        exists (
          select 1 from public.case_members m
          where m.case_id = c.id and m.member_id = auth.uid()
        )
      )
  )
);
