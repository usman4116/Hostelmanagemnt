create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  event_type text not null check (event_type in ('admission_created', 'bill_generated', 'receipt_submitted', 'payment_verified', 'payment_rejected', 'contract_approved')),
  entity_id uuid not null,
  resident_id uuid references public.residents(id) on delete restrict,
  email_status text check (email_status is null or email_status in ('sent', 'skipped', 'configuration_required', 'failed')),
  whatsapp_status text check (whatsapp_status is null or whatsapp_status in ('sent', 'skipped', 'configuration_required', 'failed')),
  status text not null default 'processing' check (status in ('processing', 'complete', 'partial', 'configuration_required', 'failed')),
  attempt_count integer not null default 1 check (attempt_count > 0),
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists notification_deliveries_resident_id_idx
  on public.notification_deliveries (resident_id, created_at desc);

alter table public.notification_deliveries enable row level security;
revoke all on table public.notification_deliveries from anon, authenticated;
