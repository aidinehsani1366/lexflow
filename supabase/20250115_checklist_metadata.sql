-- Adds metadata columns for documents/checklists
alter table public.checklists
  add column if not exists document_type text default 'General';

alter table public.checklists
  add column if not exists notes text;
