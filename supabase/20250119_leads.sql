-- Public leads captured from intake chatbot / referrals
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  contact_name text not null,
  email text,
  phone text,
  case_type text,
  jurisdiction text,
  summary text,
  source text,
  status text not null default 'new',
  assigned_to uuid references auth.users(id),
  referral_notes text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_leads_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists leads_updated_at on public.leads;
create trigger leads_updated_at
before update on public.leads
for each row execute function public.set_leads_updated_at();

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
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
  or assigned_to = auth.uid()
);
