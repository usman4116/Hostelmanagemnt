alter table public.residents
  add column if not exists resident_code text,
  add column if not exists father_name text,
  add column if not exists dob date,
  add column if not exists gender text,
  add column if not exists emergency_contact text,
  add column if not exists permanent_address text,
  add column if not exists city text,
  add column if not exists nationality text,
  add column if not exists occupation text,
  add column if not exists company_university text,
  add column if not exists photo_url text,
  add column if not exists id_card_url text;

update public.residents
set status = coalesce(status, 'Active')
where status is null;
