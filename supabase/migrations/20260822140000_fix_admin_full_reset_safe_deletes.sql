-- The production database has safe-update protection enabled. A WHERE clause is
-- therefore required even when an administrator intentionally clears a table.
-- This migration changes only the full-reset function; its deletion scope and
-- transaction behavior remain unchanged.
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

  delete from public.notification_deliveries where true;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('notification_deliveries', v_count);

  delete from public.notice_recipients where true;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('notice_recipients', v_count);

  delete from public.maintenance_photos where true;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('maintenance_photos', v_count);

  update public.payment_receipts set payment_id = null where payment_id is not null;
  delete from public.payment_receipts where true;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('payment_receipts', v_count);

  delete from public.payments where true;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('payments', v_count);

  delete from public.ac_bills where true;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('ac_bills', v_count);

  delete from public.bills where true;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('bills', v_count);

  delete from public.contracts where true;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('contracts', v_count);

  delete from public.room_inspections where true;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('room_inspections', v_count);

  delete from public.inspections where true;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('inspections', v_count);

  delete from public.maintenance_requests where true;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('maintenance_requests', v_count);

  delete from public.inventory_assignments where true;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('inventory_assignments', v_count);

  delete from public.inventory_movements where true;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('inventory_movements', v_count);

  delete from public.inventory where true;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('inventory', v_count);

  delete from public.complaints where true;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('complaints', v_count);

  delete from public.visitors where true;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('visitors', v_count);

  delete from public.notices where true;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('notices', v_count);

  delete from public.resident_portal_links where true;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('resident_portal_links', v_count);

  delete from public.admissions where true;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('admissions', v_count);

  delete from public.beds where true;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('beds', v_count);

  delete from public.rooms where true;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('rooms', v_count);

  delete from public.residents where true;
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

revoke all on function public.admin_full_hostel_reset(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.admin_full_hostel_reset(uuid, text, text)
  to service_role;
