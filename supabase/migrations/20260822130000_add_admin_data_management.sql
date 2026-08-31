create table if not exists public.admin_data_action_audits (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null,
  admin_staff_user_id uuid,
  admin_email text not null,
  action_type text not null,
  deleted_resident_id uuid,
  deleted_resident_name text,
  deleted_record_counts jsonb not null default '{}'::jsonb,
  status text not null,
  error_message text,
  created_at timestamptz not null default now(),
  constraint admin_data_action_audits_action_type_check
    check (action_type in ('FULL_RESET', 'RESIDENT_DELETE')),
  constraint admin_data_action_audits_status_check
    check (status in ('SUCCESS', 'FAILED'))
);

create index if not exists admin_data_action_audits_created_at_idx
  on public.admin_data_action_audits (created_at desc);

alter table public.admin_data_action_audits enable row level security;
revoke all on table public.admin_data_action_audits from anon, authenticated;
grant select, insert on table public.admin_data_action_audits to service_role;

drop policy if exists "Admins can read data action audits" on public.admin_data_action_audits;
create policy "Admins can read data action audits"
  on public.admin_data_action_audits
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.staff_users
      where lower(staff_users.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and lower(coalesce(staff_users.status, '')) = 'active'
        and lower(coalesce(staff_users.role, '')) in ('admin', 'super admin')
    )
  );

create or replace function public.admin_full_hostel_reset(
  p_admin_user_id uuid,
  p_admin_email text,
  p_confirmation text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_admin_staff_id uuid;
  v_counts jsonb := '{}'::jsonb;
  v_count bigint;
begin
  if p_confirmation is distinct from 'RESET HOSTEL DATA' then
    raise exception 'Invalid reset confirmation.' using errcode = '22023';
  end if;

  select id into v_admin_staff_id
  from public.staff_users
  where lower(email) = lower(trim(p_admin_email))
    and lower(coalesce(status, '')) = 'active'
    and lower(coalesce(role, '')) in ('admin', 'super admin')
  limit 1;

  if v_admin_staff_id is null then
    raise exception 'Administrator permission is required.' using errcode = '42501';
  end if;

  delete from public.notification_deliveries;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('notification_deliveries', v_count);

  delete from public.notice_recipients;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('notice_recipients', v_count);

  delete from public.maintenance_photos;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('maintenance_photos', v_count);

  -- Break the optional payment/receipt link before deleting either side.
  update public.payment_receipts set payment_id = null where payment_id is not null;
  delete from public.payment_receipts;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('payment_receipts', v_count);

  delete from public.payments;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('payments', v_count);

  delete from public.ac_bills;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('ac_bills', v_count);

  delete from public.bills;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('bills', v_count);

  delete from public.contracts;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('contracts', v_count);

  delete from public.room_inspections;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('room_inspections', v_count);

  delete from public.inspections;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('inspections', v_count);

  delete from public.maintenance_requests;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('maintenance_requests', v_count);

  delete from public.inventory_assignments;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('inventory_assignments', v_count);

  delete from public.inventory_movements;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('inventory_movements', v_count);

  delete from public.inventory;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('inventory', v_count);

  delete from public.complaints;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('complaints', v_count);

  delete from public.visitors;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('visitors', v_count);

  delete from public.notices;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('notices', v_count);

  delete from public.resident_portal_links;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('resident_portal_links', v_count);

  delete from public.admissions;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('admissions', v_count);

  delete from public.beds;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('beds', v_count);

  delete from public.rooms;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('rooms', v_count);

  delete from public.residents;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('residents', v_count);

  insert into public.admin_data_action_audits (
    admin_user_id, admin_staff_user_id, admin_email, action_type,
    deleted_record_counts, status
  ) values (
    p_admin_user_id, v_admin_staff_id, lower(trim(p_admin_email)), 'FULL_RESET',
    v_counts, 'SUCCESS'
  );

  return v_counts;
end;
$$;

create or replace function public.admin_delete_resident_data(
  p_admin_user_id uuid,
  p_admin_email text,
  p_resident_id uuid,
  p_resident_name_confirmation text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_admin_staff_id uuid;
  v_resident_name text;
  v_counts jsonb := '{}'::jsonb;
  v_count bigint;
  v_bed_ids uuid[];
  v_room_ids uuid[];
begin
  select id into v_admin_staff_id
  from public.staff_users
  where lower(email) = lower(trim(p_admin_email))
    and lower(coalesce(status, '')) = 'active'
    and lower(coalesce(role, '')) in ('admin', 'super admin')
  limit 1;

  if v_admin_staff_id is null then
    raise exception 'Administrator permission is required.' using errcode = '42501';
  end if;

  select full_name into v_resident_name
  from public.residents
  where id = p_resident_id
  for update;

  if v_resident_name is null then
    raise exception 'Resident not found.' using errcode = 'P0002';
  end if;

  if lower(trim(p_resident_name_confirmation)) is distinct from lower(trim(v_resident_name)) then
    raise exception 'Resident name confirmation does not match.' using errcode = '22023';
  end if;

  select array_remove(array_agg(distinct bed_id), null),
         array_remove(array_agg(distinct room_id), null)
    into v_bed_ids, v_room_ids
  from public.admissions
  where resident_id = p_resident_id;

  delete from public.notification_deliveries where resident_id = p_resident_id;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('notification_deliveries', v_count);

  delete from public.notice_recipients where resident_id = p_resident_id;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('notice_recipients', v_count);

  delete from public.notice_recipients
  where notice_id in (select id from public.notices where resident_id = p_resident_id);
  get diagnostics v_count = row_count;
  v_counts := jsonb_set(v_counts, '{notice_recipients}', to_jsonb(coalesce((v_counts ->> 'notice_recipients')::bigint, 0) + v_count));

  delete from public.notices where resident_id = p_resident_id;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('notices', v_count);

  delete from public.maintenance_photos
  where maintenance_request_id in (
    select id from public.maintenance_requests where resident_id = p_resident_id
  );
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('maintenance_photos', v_count);

  update public.payment_receipts
  set payment_id = null
  where resident_id = p_resident_id and payment_id is not null;

  delete from public.payment_receipts where resident_id = p_resident_id;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('payment_receipts', v_count);

  delete from public.payments where resident_id = p_resident_id;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('payments', v_count);

  delete from public.ac_bills where resident_id = p_resident_id;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('ac_bills', v_count);

  delete from public.bills where resident_id = p_resident_id;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('bills', v_count);

  delete from public.contracts where resident_id = p_resident_id;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('contracts', v_count);

  delete from public.room_inspections where resident_id = p_resident_id;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('room_inspections', v_count);

  delete from public.inspections where resident_id = p_resident_id;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('inspections', v_count);

  delete from public.maintenance_requests where resident_id = p_resident_id;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('maintenance_requests', v_count);

  delete from public.inventory_assignments where resident_id = p_resident_id;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('inventory_assignments', v_count);

  delete from public.complaints where resident_id = p_resident_id;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('complaints', v_count);

  delete from public.visitors where resident_id = p_resident_id;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('visitors', v_count);

  delete from public.resident_portal_links where resident_id = p_resident_id;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('resident_portal_links', v_count);

  delete from public.admissions where resident_id = p_resident_id;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('admissions', v_count);

  delete from public.residents where id = p_resident_id;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('residents', v_count);

  if coalesce(array_length(v_bed_ids, 1), 0) > 0 then
    update public.beds b
    set status = 'Vacant', updated_at = now()
    where b.id = any(v_bed_ids)
      and not exists (
        select 1 from public.admissions a
        where a.bed_id = b.id
          and lower(coalesce(a.status, '')) not in ('checked out', 'cancelled', 'rejected')
      );
  end if;

  if coalesce(array_length(v_room_ids, 1), 0) > 0 then
    update public.rooms r
    set occupied_beds = (
      select count(*)::integer from public.beds b
      where b.room_id = r.id and lower(coalesce(b.status, '')) = 'occupied'
    ), updated_at = now()
    where r.id = any(v_room_ids);
  end if;

  insert into public.admin_data_action_audits (
    admin_user_id, admin_staff_user_id, admin_email, action_type,
    deleted_resident_id, deleted_resident_name, deleted_record_counts, status
  ) values (
    p_admin_user_id, v_admin_staff_id, lower(trim(p_admin_email)), 'RESIDENT_DELETE',
    p_resident_id, v_resident_name, v_counts, 'SUCCESS'
  );

  return v_counts;
end;
$$;

revoke all on function public.admin_full_hostel_reset(uuid, text, text) from public, anon, authenticated;
revoke all on function public.admin_delete_resident_data(uuid, text, uuid, text) from public, anon, authenticated;
grant execute on function public.admin_full_hostel_reset(uuid, text, text) to service_role;
grant execute on function public.admin_delete_resident_data(uuid, text, uuid, text) to service_role;

comment on table public.admin_data_action_audits is
  'Immutable audit trail for destructive admin data-management operations.';
