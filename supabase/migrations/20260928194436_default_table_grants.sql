-- BF-60: Tighten Supabase default grants across the public schema
-- Pair: supabase/migrations/_rollback/20260928194436_rollback.sql
--
-- Before this migration anon and authenticated held every table privilege
-- (SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER) on 12 public
-- tables, and the schema's default privileges re-granted all of it on every
-- future table, sequence and function. Row-level security gates SELECT,
-- INSERT, UPDATE and DELETE, but TRUNCATE and REFERENCES are not subject to
-- row security at all (PostgreSQL 15 docs, 5.8).
--
-- What this migration leaves each API role (derived from the live policies and
-- from what the app actually writes, 2026-09-28):
--   anon           nothing on these 12 tables. No policy targets anon; the
--                  inspector portal uses the service client.
--   authenticated  per table below; never TRUNCATE, REFERENCES or TRIGGER.
--   service_role   unchanged on existing tables (it bypasses RLS and backs the
--                  inspector portal and user administration).
--
-- Column privileges are additive to table privileges, so a column lock is
-- REVOKE UPDATE ON TABLE then GRANT UPDATE (allowed columns), as in BF-59.
-- Columns set by triggers (updated_at) are not privilege-checked.
--
-- CONVENTION FROM HERE ON: default privileges no longer grant anything to
-- anon, authenticated or service_role (section 4; Supabase applies the same
-- change to every existing project on 2026-10-30). A migration that creates a
-- table, sequence or function must GRANT exactly what each role needs, in the
-- same migration, including service_role for anything the service client uses.
--
-- profiles loses only TRUNCATE, REFERENCES and TRIGGER (BF-59 owns the rest
-- of its grants); inspector_sessions and
-- form_submission_revisions were already created with explicit grants.

-- =========================================================================
-- 1. Everyone: anon loses everything, authenticated loses the table-wide
--    privileges RLS cannot govern.
-- =========================================================================

REVOKE ALL ON TABLE
  public.audit_log, public.form_photos, public.form_submissions,
  public.organization_invitations, public.organization_members, public.organizations,
  public.project_documents, public.project_form_requirements, public.project_permits,
  public.project_users, public.projects, public.qr_tokens
FROM anon;

REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLE
  public.audit_log, public.form_photos, public.form_submissions,
  public.organization_invitations, public.organization_members, public.organizations,
  public.project_documents, public.project_form_requirements, public.project_permits,
  public.project_users, public.projects, public.qr_tokens
FROM authenticated;

-- profiles keeps everything BF-59 decided; only the three table-wide
-- privileges no API role should hold come off here too.
REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLE public.profiles FROM authenticated;

-- =========================================================================
-- 2. authenticated: drop commands no policy allows, lock ownership columns
-- =========================================================================

-- audit_log has a SELECT policy only.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.audit_log FROM authenticated;

-- form_submissions: no DELETE policy. Edits change only the answers and the
-- form date (submission-writes.ts, dust-log append); who submitted it, which
-- project and which form it is are fixed once filed.
REVOKE DELETE, UPDATE ON TABLE public.form_submissions FROM authenticated;
GRANT UPDATE (data, form_date) ON TABLE public.form_submissions TO authenticated;

-- form_photos and project_documents: no UPDATE policy; the app deletes and
-- re-inserts photo rows and never edits a document row.
REVOKE UPDATE ON TABLE public.form_photos FROM authenticated;
REVOKE UPDATE ON TABLE public.project_documents FROM authenticated;

-- projects: the edit form writes exactly these columns (buildProjectFields in
-- dashboard/projects/actions.ts). organization_id, created_by and the legacy
-- qr_token are fixed.
REVOKE UPDATE ON TABLE public.projects FROM authenticated;
GRANT UPDATE (
  name, address, start_date, completion_date, description, acres_disturbed,
  soil_type, parcel_numbers,
  superintendent_name, superintendent_phone, superintendent_email,
  foreman_name, foreman_phone, foreman_email,
  pm_name, pm_phone, pm_email,
  owner_rep_name, owner_rep_phone, owner_rep_email, owner_rep_address,
  waterway_sites
) ON TABLE public.projects TO authenticated;

-- organization_members: every column is membership or scope. The app changes
-- memberships only through the service client (dashboard/users/actions.ts).
-- A later story that moves role changes to the user client must grant
-- UPDATE (role) back deliberately (BF-34).
REVOKE UPDATE ON TABLE public.organization_members FROM authenticated;

-- qr_tokens: reissue_inspector_qr is SECURITY INVOKER and retires the old code
-- as the calling admin, setting revoked_at and expires_at. Nothing else changes.
REVOKE UPDATE ON TABLE public.qr_tokens FROM authenticated;
GRANT UPDATE (revoked_at, expires_at) ON TABLE public.qr_tokens TO authenticated;

-- =========================================================================
-- 3. Insert policies: a row is filed under the person who is signed in
-- =========================================================================

DROP POLICY IF EXISTS "submissions_insert" ON public.form_submissions;
CREATE POLICY "submissions_insert" ON public.form_submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    submitted_by = (SELECT auth.uid())
    AND (
      (SELECT public.is_super_admin())
      OR project_id IN (SELECT p.id FROM public.projects p WHERE p.organization_id = ANY (public.current_org_ids()))
    )
  );

DROP POLICY IF EXISTS "project_documents_insert" ON public.project_documents;
CREATE POLICY "project_documents_insert" ON public.project_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = (SELECT auth.uid())
    AND (
      (SELECT public.is_super_admin())
      OR project_id IN (SELECT p.id FROM public.projects p WHERE p.organization_id = ANY (public.current_org_ids()))
    )
  );

-- =========================================================================
-- 4. Default privileges for objects created later by migrations (postgres)
-- =========================================================================

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated, service_role, PUBLIC;

-- The supabase_admin default ACL cannot be changed from here (postgres is not a
-- member). It only covers objects supabase_admin itself creates, not ours.

-- =========================================================================
-- 5. handle_new_user: the auth.users trigger function was callable over
--    /rest/v1/rpc by anon and authenticated (Security Advisor 0028/0029).
--    A trigger fires without the caller holding EXECUTE, as
--    record_form_submission_revision (BF-63) already shows in production.
-- =========================================================================

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.handle_new_user() SET search_path = '';
