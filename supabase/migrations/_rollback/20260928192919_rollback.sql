-- BF-60 ROLLBACK: restore the pre-BF-60 grants, policies and default privileges.
-- Pair: supabase/migrations/20260928192919_default_table_grants.sql
--
-- Restores Supabase's defaults exactly as read from production on 2026-09-28:
-- full table privileges for anon and authenticated on the 12 tables, the two
-- insert policies without the submitter/uploader binding, default privileges
-- for postgres-created objects in public, and handle_new_user callable by
-- everyone with no search_path. Running this re-opens TRUNCATE to every
-- signed-in and anonymous API request; use it only if the forward migration
-- broke a legitimate write, and re-apply the forward migration once fixed.
--
-- Supabase itself removes the default-privilege grants from existing projects
-- on 2026-10-30, so section 3 is only meaningful before that date.

-- =========================================================================
-- 1. Insert policies (the exact pre-BF-60 expressions)
-- =========================================================================

DROP POLICY IF EXISTS "submissions_insert" ON public.form_submissions;
CREATE POLICY "submissions_insert" ON public.form_submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.is_super_admin())
    OR project_id IN (SELECT p.id FROM public.projects p WHERE p.organization_id = ANY (public.current_org_ids()))
  );

DROP POLICY IF EXISTS "project_documents_insert" ON public.project_documents;
CREATE POLICY "project_documents_insert" ON public.project_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.is_super_admin())
    OR project_id IN (SELECT p.id FROM public.projects p WHERE p.organization_id = ANY (public.current_org_ids()))
  );

-- =========================================================================
-- 2. Table privileges. Dropping the column grants first leaves no stray
--    column-level privilege behind the restored table grant.
-- =========================================================================

REVOKE UPDATE (data, form_date) ON TABLE public.form_submissions FROM authenticated;
REVOKE UPDATE (
  name, address, start_date, completion_date, description, acres_disturbed,
  soil_type, parcel_numbers,
  superintendent_name, superintendent_phone, superintendent_email,
  foreman_name, foreman_phone, foreman_email,
  pm_name, pm_phone, pm_email,
  owner_rep_name, owner_rep_phone, owner_rep_email, owner_rep_address,
  waterway_sites
) ON TABLE public.projects FROM authenticated;
REVOKE UPDATE (revoked_at, expires_at) ON TABLE public.qr_tokens FROM authenticated;

GRANT ALL ON TABLE
  public.audit_log, public.form_photos, public.form_submissions,
  public.organization_invitations, public.organization_members, public.organizations,
  public.project_documents, public.project_form_requirements, public.project_permits,
  public.project_users, public.projects, public.qr_tokens
TO anon, authenticated;
GRANT TRUNCATE, REFERENCES, TRIGGER ON TABLE public.profiles TO authenticated;

-- =========================================================================
-- 3. Default privileges for postgres-created objects in public
-- =========================================================================

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;
-- (The pre-BF-60 entry already carried no PUBLIC grant, so none is restored.)

-- =========================================================================
-- 4. handle_new_user
-- =========================================================================

ALTER FUNCTION public.handle_new_user() RESET search_path;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO PUBLIC, anon, authenticated;
