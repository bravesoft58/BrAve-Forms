-- BF-31 follow-up ROLLBACK: restore the post-BF-31 (pre-Option-A) policies.
-- Pair: supabase/migrations/20260430140000_admin_org_access.sql
--
-- This rollback DOES NOT touch BF-31 itself. It restores the five project-
-- level tables to the exact state they had immediately after BF-31's
-- forward migration applied (i.e. without the org-admin branch). To revert
-- BF-31 itself, run supabase/migrations/_rollback/20260430120000_rollback.sql
-- AFTER this one.
--
-- Re-introducing this rollback re-creates the admin-visibility regression
-- (Andy 7/14, Claude 6/14, Gracie 0/14 of submissions). Only run it if a
-- specific bug in the org-admin clause is forcing you back to BF-31 base
-- state -- it is NOT a "things broke, revert to safe" path.

-- =========================================================================
-- 1. DROP the Option-A widened policies
-- =========================================================================

DROP POLICY IF EXISTS "submissions_select"        ON public.form_submissions;
DROP POLICY IF EXISTS "submissions_insert"        ON public.form_submissions;
DROP POLICY IF EXISTS "submissions_update"        ON public.form_submissions;

DROP POLICY IF EXISTS "photos_select"             ON public.form_photos;
DROP POLICY IF EXISTS "photos_insert"             ON public.form_photos;

DROP POLICY IF EXISTS "project_documents_select"  ON public.project_documents;
DROP POLICY IF EXISTS "project_documents_insert"  ON public.project_documents;

DROP POLICY IF EXISTS "permits_select"            ON public.project_permits;

DROP POLICY IF EXISTS "form_requirements_select"  ON public.project_form_requirements;

-- =========================================================================
-- 2. RECREATE the BF-31 versions (no org-admin branch)
-- =========================================================================

CREATE POLICY "submissions_select" ON public.form_submissions
  FOR SELECT TO authenticated
  USING (
    (select public.is_super_admin())
    OR project_id = ANY(public.get_user_project_ids())
  );

CREATE POLICY "submissions_insert" ON public.form_submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    (select public.is_super_admin())
    OR project_id = ANY(public.get_user_project_ids())
  );

CREATE POLICY "submissions_update" ON public.form_submissions
  FOR UPDATE TO authenticated
  USING (
    (select public.is_super_admin())
    OR project_id = ANY(public.get_user_project_ids())
  );

CREATE POLICY "photos_select" ON public.form_photos
  FOR SELECT TO authenticated
  USING (
    (select public.is_super_admin())
    OR submission_id IN (
      SELECT id FROM public.form_submissions
      WHERE project_id = ANY(public.get_user_project_ids())
    )
  );

CREATE POLICY "photos_insert" ON public.form_photos
  FOR INSERT TO authenticated
  WITH CHECK (
    (select public.is_super_admin())
    OR submission_id IN (
      SELECT id FROM public.form_submissions
      WHERE project_id = ANY(public.get_user_project_ids())
    )
  );

CREATE POLICY "project_documents_select" ON public.project_documents
  FOR SELECT TO authenticated
  USING (
    (select public.is_super_admin())
    OR project_id = ANY(public.get_user_project_ids())
  );

CREATE POLICY "project_documents_insert" ON public.project_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    (select public.is_super_admin())
    OR project_id = ANY(public.get_user_project_ids())
  );

CREATE POLICY "permits_select" ON public.project_permits
  FOR SELECT TO authenticated
  USING (
    (select public.is_super_admin())
    OR project_id = ANY(public.get_user_project_ids())
  );

CREATE POLICY "form_requirements_select" ON public.project_form_requirements
  FOR SELECT TO authenticated
  USING (
    (select public.is_super_admin())
    OR project_id = ANY(public.get_user_project_ids())
  );
