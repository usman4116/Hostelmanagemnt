-- =====================================================================
-- PROPOSAL ONLY - NOT A MIGRATION. DO NOT APPLY WITHOUT REVIEW.
-- Deliberately stored outside supabase/migrations/ so apply_migrations.sh
-- cannot run it. Review, test against a staging database, then move a
-- vetted copy into supabase/migrations/ when you are ready.
-- =====================================================================
--
-- FINDING (critical)
-- ------------------
-- Row Level Security is ENABLED on all 26 public tables, but fix_rls.sql
-- created this policy on every one of them:
--
--   CREATE POLICY "Allow authenticated full access" ON <table>
--     FOR ALL TO authenticated USING (true) WITH CHECK (true);
--
-- USING (true) means *any* signed-in user - including every resident with
-- portal credentials - can SELECT, INSERT, UPDATE and DELETE every row of
-- every table using nothing but the public anon key. Concretely, today a
-- resident's own access token can:
--   * read staff_users (admin roster and roles),
--   * read residents.portal_temp_password for every resident - temporary
--     portal passwords are stored in PLAINTEXT,
--   * read and edit other residents' bills, payments and contracts,
--   * flip bills.bill_status, so hiding unapproved bills in
--     app/api/resident-portal/data/route.ts is defence-in-depth only.
--
-- Two separate fixes are needed:
--   1. Replace the permissive policies (below).
--   2. Stop storing residents.portal_temp_password in plaintext. Prefer
--      showing the generated password once in the admin UI and never
--      persisting it; if it must persist, store a hash plus an expiry.
--
-- Approach below: staff get full access via a membership check on
-- staff_users; residents get row-scoped access limited to the tables the
-- resident portal actually touches; everything else is staff-only and
-- keeps working because all server routes use the service role key, which
-- bypasses RLS.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- Helper predicates. SECURITY DEFINER so they can read staff_users and
-- residents without recursing through those tables' own policies.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_staff_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff_users s
    WHERE lower(s.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      AND lower(coalesce(s.status, 'active')) = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.current_resident_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id
  FROM public.residents r
  WHERE lower(r.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    AND lower(coalesce(r.status, '')) <> 'archived'
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.is_staff_user() FROM public;
REVOKE EXECUTE ON FUNCTION public.current_resident_id() FROM public;
GRANT EXECUTE ON FUNCTION public.is_staff_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_resident_id() TO authenticated;

-- ---------------------------------------------------------------------
-- 1. Drop the blanket policy and give staff full access on every table.
-- ---------------------------------------------------------------------
DO $$
DECLARE
  target text;
BEGIN
  FOR target IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS "Allow authenticated full access" ON public.%I',
      target
    );
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target);
    EXECUTE format('DROP POLICY IF EXISTS "Staff full access" ON public.%I', target);
    EXECUTE format(
      'CREATE POLICY "Staff full access" ON public.%I
         FOR ALL TO authenticated
         USING (public.is_staff_user())
         WITH CHECK (public.is_staff_user())',
      target
    );
  END LOOP;
END
$$;

-- ---------------------------------------------------------------------
-- 2. Resident-scoped policies, limited to what the portal really needs.
--    Reads: own profile, admission, contract, bills, payments, receipts,
--    room/bed of the current admission, notices addressed to them,
--    inspections of their room, and their maintenance requests.
--    Writes: contract signature, maintenance requests + photos, and
--    payment/receipt submissions for their own bills. Verified against the
--    resident-portal pages: notices and inspections are read-only there.
-- ---------------------------------------------------------------------

-- Own resident row (read only; the plaintext password column should be
-- removed - see the finding above - and until then it stays readable to
-- the resident it belongs to only).
CREATE POLICY "Resident reads own profile" ON public.residents
  FOR SELECT TO authenticated
  USING (id = public.current_resident_id());

CREATE POLICY "Resident reads own admissions" ON public.admissions
  FOR SELECT TO authenticated
  USING (resident_id = public.current_resident_id());

CREATE POLICY "Resident reads own contracts" ON public.contracts
  FOR SELECT TO authenticated
  USING (resident_id = public.current_resident_id());

-- Signing is the only contract write the portal performs.
CREATE POLICY "Resident signs own contract" ON public.contracts
  FOR UPDATE TO authenticated
  USING (resident_id = public.current_resident_id())
  WITH CHECK (resident_id = public.current_resident_id());

-- Unapproved bills stay invisible at the database level too, so the API
-- filter is no longer the only thing hiding them.
CREATE POLICY "Resident reads own approved bills" ON public.bills
  FOR SELECT TO authenticated
  USING (
    resident_id = public.current_resident_id()
    AND lower(coalesce(bill_status, '')) NOT IN ('pending approval', 'draft')
  );

CREATE POLICY "Resident reads own payments" ON public.payments
  FOR SELECT TO authenticated
  USING (resident_id = public.current_resident_id());

CREATE POLICY "Resident submits own payments" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (resident_id = public.current_resident_id());

CREATE POLICY "Resident reads own receipts" ON public.payment_receipts
  FOR SELECT TO authenticated
  USING (resident_id = public.current_resident_id());

CREATE POLICY "Resident submits own receipts" ON public.payment_receipts
  FOR INSERT TO authenticated
  WITH CHECK (resident_id = public.current_resident_id());

-- Rooms and beds: only the ones tied to the resident's own admission.
CREATE POLICY "Resident reads own room" ON public.rooms
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admissions a
      WHERE a.room_id = rooms.id
        AND a.resident_id = public.current_resident_id()
    )
  );

CREATE POLICY "Resident reads own bed" ON public.beds
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admissions a
      WHERE a.bed_id = beds.id
        AND a.resident_id = public.current_resident_id()
    )
  );

-- Maintenance: residents raise and track their own requests.
CREATE POLICY "Resident reads own maintenance requests" ON public.maintenance_requests
  FOR SELECT TO authenticated
  USING (resident_id = public.current_resident_id());

CREATE POLICY "Resident raises maintenance requests" ON public.maintenance_requests
  FOR INSERT TO authenticated
  WITH CHECK (resident_id = public.current_resident_id());

CREATE POLICY "Resident reads own maintenance photos" ON public.maintenance_photos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.maintenance_requests m
      WHERE m.id = maintenance_photos.maintenance_request_id
        AND m.resident_id = public.current_resident_id()
    )
  );

CREATE POLICY "Resident attaches maintenance photos" ON public.maintenance_photos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.maintenance_requests m
      WHERE m.id = maintenance_photos.maintenance_request_id
        AND m.resident_id = public.current_resident_id()
    )
  );

-- Notices addressed to the resident (or published to everyone).
CREATE POLICY "Resident reads own notice recipients" ON public.notice_recipients
  FOR SELECT TO authenticated
  USING (resident_id = public.current_resident_id());

CREATE POLICY "Resident reads addressed notices" ON public.notices
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.notice_recipients nr
      WHERE nr.notice_id = notices.id
        AND nr.resident_id = public.current_resident_id()
    )
  );

-- Inspections of the resident's own room.
CREATE POLICY "Resident reads own inspections" ON public.inspections
  FOR SELECT TO authenticated
  USING (resident_id = public.current_resident_id());

CREATE POLICY "Resident reads own room inspections" ON public.room_inspections
  FOR SELECT TO authenticated
  USING (resident_id = public.current_resident_id());

-- ---------------------------------------------------------------------
-- 3. Verification queries to run as a resident after applying.
--    Each must return zero rows.
--      select * from staff_users;
--      select id, portal_temp_password from residents where id <> <self>;
--      select * from bills where bill_status = 'Pending Approval';
--      update bills set bill_status = 'Paid' where id = <own bill>;
-- ---------------------------------------------------------------------

COMMIT;

-- Column names above were checked against the current schema
-- (maintenance_photos.maintenance_request_id, notice_recipients.resident_id,
-- inspections.resident_id, room_inspections.resident_id). Re-check after any
-- schema change before applying.
