-- Partner firms table
create table if not exists public.firms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email text,
  created_at timestamptz not null default now()
);

alter table public.firms enable row level security;

drop policy if exists "firms_admin_access" on public.firms;
create policy "firms_admin_access"
on public.firms for all
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);
