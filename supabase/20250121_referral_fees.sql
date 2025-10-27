-- Track referral fees / payouts per lead + firm
create table if not exists public.referral_fees (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  firm_id uuid references public.firms(id),
  amount numeric(12,2) not null,
  due_date date,
  status text not null default 'pending' check (status in ('pending','paid')),
  notes text,
  paid_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_referral_fees_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists referral_fees_updated_at on public.referral_fees;
create trigger referral_fees_updated_at
before update on public.referral_fees
for each row execute function public.set_referral_fees_updated_at();

alter table public.referral_fees enable row level security;

drop policy if exists "referral_fees_select" on public.referral_fees;
create policy "referral_fees_select"
on public.referral_fees for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
  or exists (
    select 1 from public.leads l
    where l.id = referral_fees.lead_id
      and (
        l.assigned_to = auth.uid() or
        (exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.firm_id is not null
            and p.firm_id = l.firm_id
        ))
      )
  )
);

drop policy if exists "referral_fees_write" on public.referral_fees;
create policy "referral_fees_write"
on public.referral_fees for all
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
  or exists (
    select 1 from public.leads l
    where l.id = referral_fees.lead_id
      and (
        l.assigned_to = auth.uid() or
        (exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role in ('firm_admin','firm_staff')
            and p.firm_id = l.firm_id
        ))
      )
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
  or exists (
    select 1 from public.leads l
    where l.id = referral_fees.lead_id
      and (
        l.assigned_to = auth.uid() or
        (exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role in ('firm_admin','firm_staff')
            and p.firm_id = l.firm_id
        ))
      )
  )
);
