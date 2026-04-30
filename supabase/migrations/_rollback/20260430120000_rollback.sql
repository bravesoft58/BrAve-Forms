-- BF-31 ROLLBACK: Multi-Tenant RLS Rewrite + Profiles Leak Fix
-- Pair: supabase/migrations/20260430120000_multi_tenant_rls.sql
--
-- Reverts every BF-31 policy back to its pre-BF-31 form. Re-emits the
-- verbatim 31 pre-BF-31 policy definitions sourced from the captured
-- snapshot at backups/pre_bf31/policies.json.
--
-- get_user_project_ids() body is reverted to the BF-01 plpgsql form.
-- is_admin() body was never changed by BF-31 (only its search_path attr);
-- this rollback restores the unset search_path.
-- The three new helpers (current_org_ids, is_org_admin, is_super_admin)
-- and the supporting index are LEFT in place -- harmless if unused, and
-- dropping them would force the rollback to also re-emit the BF-30
-- placeholder policies that pulled them in indirectly.
--
-- App impact: zero (no application code references any of the affected
-- helpers; verified via grep of src/ for is_admin / get_user_project_ids /
-- profiles.role / current_org_ids / is_org_admin / is_super_admin).

-- =========================================================================
-- 1. DROP every BF-31 policy
-- =========================================================================

-- profiles
DROP POLICY IF EXISTS "profiles_select"       ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"   ON public.profiles;

-- projects
DROP POLICY IF EXISTS "projects_select"       ON public.projects;
DROP POLICY IF EXISTS "projects_insert"       ON public.projects;
DROP POLICY IF EXISTS "projects_update"       ON public.projects;
DROP POLICY IF EXISTS "projects_delete"       ON public.projects;

-- project_users
DROP POLICY IF EXISTS "project_users_select"  ON public.project_users;
DROP POLICY IF EXISTS "project_users_insert"  ON public.project_users;
DROP POLICY IF EXISTS "project_users_update"  ON public.project_users;
DROP POLICY IF EXISTS "project_users_delete"  ON public.project_users;

-- project_permits
DROP POLICY IF EXISTS "permits_select"        ON public.project_permits;
DROP POLICY IF EXISTS "permits_insert"        ON public.project_permits;
DROP POLICY IF EXISTS "permits_update"        ON public.project_permits;
DROP POLICY IF EXISTS "permits_delete"        ON public.project_permits;

-- project_form_requirements
DROP POLICY IF EXISTS "form_requirements_select" ON public.project_form_requirements;
DROP POLICY IF EXISTS "form_requirements_insert" ON public.project_form_requirements;
DROP POLICY IF EXISTS "form_requirements_update" ON public.project_form_requirements;
DROP POLICY IF EXISTS "form_requirements_delete" ON public.project_form_requirements;

-- project_documents (canonical names from BF-31)
DROP POLICY IF EXISTS "project_documents_select" ON public.project_documents;
DROP POLICY IF EXISTS "project_documents_insert" ON public.project_documents;
DROP POLICY IF EXISTS "project_documents_delete" ON public.project_documents;

-- form_submissions
DROP POLICY IF EXISTS "submissions_select"    ON public.form_submissions;
DROP POLICY IF EXISTS "submissions_insert"    ON public.form_submissions;
DROP POLICY IF EXISTS "submissions_update"    ON public.form_submissions;

-- form_photos
DROP POLICY IF EXISTS "photos_select"         ON public.form_photos;
DROP POLICY IF EXISTS "photos_insert"         ON public.form_photos;

-- qr_tokens
DROP POLICY IF EXISTS "qr_tokens_all"         ON public.qr_tokens;

-- new tables
DROP POLICY IF EXISTS "organizations_select"  ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert"  ON public.organizations;
DROP POLICY IF EXISTS "organizations_update"  ON public.organizations;
DROP POLICY IF EXISTS "organizations_delete"  ON public.organizations;

DROP POLICY IF EXISTS "organization_members_select" ON public.organization_members;
DROP POLICY IF EXISTS "organization_members_insert" ON public.organization_members;
DROP POLICY IF EXISTS "organization_members_update" ON public.organization_members;
DROP POLICY IF EXISTS "organization_members_delete" ON public.organization_members;

DROP POLICY IF EXISTS "organization_invitations_select" ON public.organization_invitations;
DROP POLICY IF EXISTS "organization_invitations_insert" ON public.organization_invitations;
DROP POLICY IF EXISTS "organization_invitations_update" ON public.organization_invitations;
DROP POLICY IF EXISTS "organization_invitations_delete" ON public.organization_invitations;

DROP POLICY IF EXISTS "audit_log_select"      ON public.audit_log;

-- =========================================================================
-- 2. REVERT existing helpers to pre-BF-31 state
-- =========================================================================

-- get_user_project_ids: revert body to BF-01 form (no org filter).
CREATE OR REPLACE FUNCTION public.get_user_project_ids()
RETURNS uuid[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN ARRAY(
    SELECT project_id FROM public.project_users
    WHERE user_id = auth.uid()
  );
END;
$$;

-- is_admin: body was never changed, just remove the SET search_path attr.
ALTER FUNCTION public.is_admin() RESET search_path;
ALTER FUNCTION public.get_user_project_ids() RESET search_path;

-- Restore EXECUTE grants to match pre-BF-31 posture.
GRANT EXECUTE ON FUNCTION public.is_admin()              TO PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_project_ids()  TO PUBLIC, anon, authenticated;

-- =========================================================================
-- 3. RECREATE pre-BF-31 policies VERBATIM (sourced from
--    backups/pre_bf31/policies.json snapshot)
-- =========================================================================

-- profiles
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id);

-- projects
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT TO authenticated
  USING (
    (select is_admin())
    OR id = ANY(get_user_project_ids())
  );

CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK ((select is_admin()));

CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE TO authenticated
  USING ((select is_admin()));

-- project_users
CREATE POLICY "project_users_select" ON public.project_users
  FOR SELECT TO authenticated
  USING (
    (select is_admin())
    OR user_id = (select auth.uid())
  );

CREATE POLICY "project_users_insert" ON public.project_users
  FOR INSERT TO authenticated
  WITH CHECK ((select is_admin()));

CREATE POLICY "project_users_update" ON public.project_users
  FOR UPDATE TO authenticated
  USING ((select is_admin()));

CREATE POLICY "project_users_delete" ON public.project_users
  FOR DELETE TO authenticated
  USING ((select is_admin()));

-- project_permits
CREATE POLICY "permits_select" ON public.project_permits
  FOR SELECT TO authenticated
  USING (
    (select is_admin())
    OR project_id = ANY(get_user_project_ids())
  );

CREATE POLICY "permits_insert" ON public.project_permits
  FOR INSERT TO authenticated
  WITH CHECK ((select is_admin()));

CREATE POLICY "permits_update" ON public.project_permits
  FOR UPDATE TO authenticated
  USING ((select is_admin()));

CREATE POLICY "permits_delete" ON public.project_permits
  FOR DELETE TO authenticated
  USING ((select is_admin()));

-- project_form_requirements
CREATE POLICY "form_requirements_select" ON public.project_form_requirements
  FOR SELECT TO authenticated
  USING (
    (select is_admin())
    OR project_id = ANY(get_user_project_ids())
  );

CREATE POLICY "form_requirements_insert" ON public.project_form_requirements
  FOR INSERT TO authenticated
  WITH CHECK ((select is_admin()));

CREATE POLICY "form_requirements_update" ON public.project_form_requirements
  FOR UPDATE TO authenticated
  USING ((select is_admin()));

CREATE POLICY "form_requirements_delete" ON public.project_form_requirements
  FOR DELETE TO authenticated
  USING ((select is_admin()));

-- project_documents (recreate BOTH old name pairs to match pre-BF-31 state)
CREATE POLICY "docs_select" ON public.project_documents
  FOR SELECT TO authenticated
  USING (
    (select is_admin())
    OR project_id = ANY(get_user_project_ids())
  );

CREATE POLICY "docs_insert" ON public.project_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    (select is_admin())
    OR project_id = ANY(get_user_project_ids())
  );

CREATE POLICY "docs_delete" ON public.project_documents
  FOR DELETE TO authenticated
  USING ((select is_admin()));

CREATE POLICY "documents_select" ON public.project_documents
  FOR SELECT TO authenticated
  USING (
    (select is_admin())
    OR project_id = ANY(get_user_project_ids())
  );

CREATE POLICY "documents_insert" ON public.project_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    (select is_admin())
    OR project_id = ANY(get_user_project_ids())
  );

-- form_submissions
CREATE POLICY "submissions_select" ON public.form_submissions
  FOR SELECT TO authenticated
  USING (
    (select is_admin())
    OR project_id = ANY(get_user_project_ids())
  );

CREATE POLICY "submissions_insert" ON public.form_submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    (select is_admin())
    OR project_id = ANY(get_user_project_ids())
  );

CREATE POLICY "submissions_update" ON public.form_submissions
  FOR UPDATE TO authenticated
  USING (
    (select is_admin())
    OR project_id = ANY(get_user_project_ids())
  );

-- form_photos
CREATE POLICY "photos_select" ON public.form_photos
  FOR SELECT TO authenticated
  USING (
    (select is_admin())
    OR submission_id IN (
      SELECT id FROM public.form_submissions
      WHERE project_id = ANY(get_user_project_ids())
    )
  );

CREATE POLICY "photos_insert" ON public.form_photos
  FOR INSERT TO authenticated
  WITH CHECK (
    (select is_admin())
    OR submission_id IN (
      SELECT id FROM public.form_submissions
      WHERE project_id = ANY(get_user_project_ids())
    )
  );

-- qr_tokens (BF-36 hotfix form)
CREATE POLICY "Users can manage QR tokens for assigned projects or admin"
  ON public.qr_tokens FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR project_id IN (SELECT project_id FROM public.project_users WHERE user_id = auth.uid())
  )
  WITH CHECK (
    public.is_admin()
    OR project_id IN (SELECT project_id FROM public.project_users WHERE user_id = auth.uid())
  );

-- BF-30 placeholder policies on the new tables
CREATE POLICY "bf30_placeholder_select" ON public.organizations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "bf30_placeholder_select" ON public.organization_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "bf30_placeholder_select" ON public.organization_invitations
  FOR SELECT TO authenticated USING (true);

-- audit_log: pre-BF-31 had RLS enabled with NO policies (service-role only).
-- This is restored by simply not creating any policies on it.
