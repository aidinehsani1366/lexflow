-- Add firm relationship to leads and tighten policies
alter table if exists public.leads
  add column if not exists firm_id uuid references public.firms(id);

alter table public.leads enable row level security;

drop policy if exists "leads_select_access" on public.leads;
create policy "leads_select_access"
on public.leads for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
  or assigned_to = auth.uid()
  or (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.firm_id is not null
        and p.firm_id = leads.firm_id
    )
  )
);

drop policy if exists "leads_update_access" on public.leads;
create policy "leads_update_access"
on public.leads for update
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
  or assigned_to = auth.uid()
  or (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'firm_admin'
        and p.firm_id = leads.firm_id
    )
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
  or assigned_to = auth.uid()
  or (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'firm_admin'
        and p.firm_id = leads.firm_id
    )
  )
);
