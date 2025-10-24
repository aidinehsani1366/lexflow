-- Patch to fix recursive case/case_members policies.
-- Run this in Supabase SQL editor after the original schema.

alter table public.case_members enable row level security;

drop policy if exists "case_members_select_self" on public.case_members;
drop policy if exists "case_members_owner_manage" on public.case_members;

create policy "case_members_select_self_only"
on public.case_members for select
using (member_id = auth.uid());

create policy "case_members_delete_self_only"
on public.case_members for delete
using (member_id = auth.uid());
