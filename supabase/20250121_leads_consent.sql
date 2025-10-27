-- Add consent + metadata fields to leads
alter table if exists public.leads
  add column if not exists consent_text text,
  add column if not exists consented_at timestamptz,
  add column if not exists submitted_ip text;
