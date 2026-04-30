-- BF-31 follow-up: Org Admin → All Project Data (Option A)
-- Pair: supabase/migrations/_rollback/20260430140000_rollback.sql
--
-- Closes the admin-visibility regression introduced when BF-31 dropped the
-- legacy is_admin() short-circuit. Pre-BF-31 every profiles.role='admin'
-- user saw all submissions/photos/documents/permits/form_requirements via
-- is_admin() in every policy. BF-31 narrowed that to is_super_admin()
-- (Tim only) plus project_users gating, which silently hid 7-14 records
-- per Q&D org admin (Andy 7/14, Claude 6/14, Gracie 0/14).
--
-- This migration adds the missing is_org_admin branch to the five project-
-- level tables. The pattern matches qr_tokens_all, project_documents_delete,
-- permits_insert/update/delete, and form_requirements_insert/update/delete,
-- all of which were already correct under BF-31. The five tables touched
-- here were the only asymmetric ones.
--
-- Tier matrix after this migration:
--   * super_admin    -> sees everything platform-wide.
--   * org admin      -> sees and manages every project's data in their org.
--   * project member -> sees data only for projects in project_users.
--   * orphan         -> sees nothing (isolation preserved).
--
-- Helper-call conventions inherited from BF-31:
--   * is_super_admin()       -> wrapped (select ...) for initPlan caching.
--   * is_org_admin(uuid)     -> UNWRAPPED (row-dependent argument).
--   * get_user_project_ids() -> UNWRAPPED inside = ANY(...).
--
-- Free-tier apply path: applied direct to production via Supabase MCP
-- (no branching available). Pre-state captured in BF-31 backups; rollback
-- in this same MCP session if needed.

-- =========================================================================
-- 1. DROP target policies (idempotent)
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
-- 2. RECREATE with org-admin branch
-- =========================================================================

-- --- form_submissions ---------------------------------------------------
CREATE POLICY "submissions_select" ON public.form_submissions
  FOR SELECT TO authenticated
  USING (
    (select public.is_super_admin())
    OR public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = project_id))
    OR project_id = ANY(public.get_user_project_ids())
  );

CREATE POLICY "submissions_insert" ON public.form_submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    (select public.is_super_admin())
    OR public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = project_id))
    OR project_id = ANY(public.get_user_project_ids())
  );

CREATE POLICY "submissions_update" ON public.form_submissions
  FOR UPDATE TO authenticated
  USING (
    (select public.is_super_admin())
    OR public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = project_id))
    OR project_id = ANY(public.get_user_project_ids())
  );

-- --- form_photos --------------------------------------------------------
-- The org-admin OR clause lives inside the existing submission_id IN (...)
-- subquery so that admins can see photos for ANY submission whose project
-- belongs to their org -- not just the ones they're project_users-assigned to.
CREATE POLICY "photos_select" ON public.form_photos
  FOR SELECT TO authenticated
  USING (
    (select public.is_super_admin())
    OR submission_id IN (
      SELECT id FROM public.form_submissions
      WHERE public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = project_id))
         OR project_id = ANY(public.get_user_project_ids())
    )
  );

CREATE POLICY "photos_insert" ON public.form_photos
  FOR INSERT TO authenticated
  WITH CHECK (
    (select public.is_super_admin())
    OR submission_id IN (
      SELECT id FROM public.form_submissions
      WHERE public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = project_id))
         OR project_id = ANY(public.get_user_project_ids())
    )
  );

-- --- project_documents --------------------------------------------------
-- DELETE policy already carried the org-admin clause under BF-31; untouched.
CREATE POLICY "project_documents_select" ON public.project_documents
  FOR SELECT TO authenticated
  USING (
    (select public.is_super_admin())
    OR public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = project_id))
    OR project_id = ANY(public.get_user_project_ids())
  );

CREATE POLICY "project_documents_insert" ON public.project_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    (select public.is_super_admin())
    OR public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = project_id))
    OR project_id = ANY(public.get_user_project_ids())
  );

-- --- project_permits ----------------------------------------------------
-- INSERT/UPDATE/DELETE were admin-only under BF-31 and stay admin-only.
-- Only SELECT needed widening so org admins can read the org's permits.
CREATE POLICY "permits_select" ON public.project_permits
  FOR SELECT TO authenticated
  USING (
    (select public.is_super_admin())
    OR public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = project_id))
    OR project_id = ANY(public.get_user_project_ids())
  );

-- --- project_form_requirements ------------------------------------------
-- Same shape as project_permits: writes admin-only, SELECT widened to org admins.
CREATE POLICY "form_requirements_select" ON public.project_form_requirements
  FOR SELECT TO authenticated
  USING (
    (select public.is_super_admin())
    OR public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = project_id))
    OR project_id = ANY(public.get_user_project_ids())
  );
