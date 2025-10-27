-- Expand case_documents metadata and permissions
alter table public.case_documents
  add column if not exists document_type text default 'General',
  add column if not exists notes text,
  add column if not exists mime_type text,
  add column if not exists file_size bigint;

drop policy if exists "case_documents_select" on public.case_documents;
create policy "case_documents_select"
on public.case_documents for select
using (
  exists (
    select 1 from public.cases c
    left join public.case_members m on m.case_id = c.id and m.member_id = auth.uid()
    where c.id = case_documents.case_id
      and (c.user_id = auth.uid() or m.member_id is not null)
  )
);

drop policy if exists "case_documents_modify" on public.case_documents;
create policy "case_documents_modify"
on public.case_documents for update using (
  exists (
    select 1 from public.cases c
    left join public.case_members m on m.case_id = c.id and m.member_id = auth.uid()
    where c.id = case_documents.case_id
      and (
        c.user_id = auth.uid() or
        (m.member_id is not null and m.role in ('editor', 'owner'))
      )
  )
) with check (
  exists (
    select 1 from public.cases c
    left join public.case_members m on m.case_id = c.id and m.member_id = auth.uid()
    where c.id = case_documents.case_id
      and (
        c.user_id = auth.uid() or
        (m.member_id is not null and m.role in ('editor', 'owner'))
      )
  )
);
