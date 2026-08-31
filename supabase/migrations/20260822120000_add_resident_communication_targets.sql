alter table public.notification_deliveries
  drop constraint if exists notification_deliveries_event_type_check;

alter table public.notification_deliveries
  alter column entity_id type text using entity_id::text;

alter table public.notification_deliveries
  add constraint notification_deliveries_event_type_check
  check (event_type in (
    'admission_created',
    'bill_generated',
    'receipt_submitted',
    'payment_verified',
    'payment_rejected',
    'contract_approved',
    'resident_notice_created',
    'resident_login_details_sent'
  ));

alter table public.notification_deliveries
  add column if not exists requested_channels text[] not null default array['email', 'whatsapp']::text[],
  add column if not exists sms_status text,
  add column if not exists email_provider_message_id text,
  add column if not exists whatsapp_provider_message_id text,
  add column if not exists sms_provider_message_id text;

alter table public.notification_deliveries
  drop constraint if exists notification_deliveries_requested_channels_check,
  drop constraint if exists notification_deliveries_sms_status_check;

alter table public.notification_deliveries
  add constraint notification_deliveries_requested_channels_check
    check (
      cardinality(requested_channels) > 0
      and requested_channels <@ array['email', 'whatsapp', 'sms']::text[]
    ),
  add constraint notification_deliveries_sms_status_check
    check (sms_status is null or sms_status in ('sent', 'skipped', 'configuration_required', 'failed'));

alter table public.notices
  add column if not exists notification_recipient_type text,
  add column if not exists notification_channels text[] not null default '{}'::text[];

alter table public.notices
  drop constraint if exists notices_notification_recipient_type_check,
  drop constraint if exists notices_notification_channels_check;

alter table public.notices
  add constraint notices_notification_recipient_type_check
    check (
      notification_recipient_type is null
      or notification_recipient_type in ('all_active_residents', 'selected_residents', 'individual_resident')
    ),
  add constraint notices_notification_channels_check
    check (notification_channels <@ array['email', 'whatsapp', 'sms']::text[]);

create table if not exists public.notice_recipients (
  -- public.notices.id is bigint, so the referencing column must also be bigint.
  notice_id bigint not null references public.notices(id) on delete cascade,
  resident_id uuid not null references public.residents(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (notice_id, resident_id)
);

create index if not exists notice_recipients_resident_id_idx
  on public.notice_recipients (resident_id, created_at desc);

alter table public.notice_recipients enable row level security;

revoke all on table public.notice_recipients from anon;
grant select, insert, update, delete on table public.notice_recipients to authenticated;

drop policy if exists "Residents can read their own notice targets" on public.notice_recipients;
create policy "Residents can read their own notice targets"
  on public.notice_recipients
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.residents
      where residents.id = notice_recipients.resident_id
        and lower(residents.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and lower(coalesce(residents.status, '')) <> 'archived'
    )
  );

drop policy if exists "Active staff can manage notice targets" on public.notice_recipients;
create policy "Active staff can manage notice targets"
  on public.notice_recipients
  for all
  to authenticated
  using (
    exists (
      select 1 from public.staff_users
      where lower(staff_users.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and lower(coalesce(staff_users.status, '')) = 'active'
    )
  )
  with check (
    exists (
      select 1 from public.staff_users
      where lower(staff_users.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and lower(coalesce(staff_users.status, '')) = 'active'
    )
  );

comment on table public.notice_recipients is
  'Explicit resident audience for notices targeted to multiple selected residents.';

comment on column public.notification_deliveries.requested_channels is
  'Channels explicitly requested for this recipient delivery.';

comment on column public.notification_deliveries.sms_status is
  'Reserved SMS delivery status; configuration_required until an SMS provider is connected.';
