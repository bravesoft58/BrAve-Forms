-- BF-31: Multi-Tenant RLS Rewrite + Profiles Leak Fix
-- Pair: supabase/migrations/_rollback/20260430120000_rollback.sql
--
-- Rewrites every RLS policy on public.* to scope through organization
-- membership. Fixes two pre-existing live leaks:
--   (1) profiles_select USING true -- every authenticated user could list
--       every profile.
--   (2) qr_tokens (BF-36 hotfix) used unwrapped is_admin() and didn't fold
--       into the org-scoped model.
--
-- This migration is SQL-only. No application code changes.
-- is_admin() is preserved as a compatibility shim per BF-35 deferral.
-- New helpers (current_org_ids, is_org_admin, is_super_admin) have no app-
-- code references yet (verified via grep) -- they're invoked only inside
-- RLS policies at the DB layer.
--
-- Five refinements over the BF-31 story spec (scout fact b9b424d7):
--   1. Wrap SCALAR no-arg helpers as `(select helper())` for initPlan
--      caching (boolean/uuid returns: is_super_admin, auth.uid, auth.jwt).
--      Array-returning helpers (current_org_ids, get_user_project_ids)
--      stay UNWRAPPED inside `= ANY(...)` -- wrapping them in `(select ...)`
--      makes Postgres treat the subquery as a set, not an array, and
--      fails with `operator does not exist: uuid = uuid[]`. Matches the
--      BF-01 convention exactly.
--   2. Drop duplicate `docs_*` and `documents_*` policies on
--      project_documents; create one canonical set. Closes
--      multiple_permissive_policies advisor warning.
--   3. SET search_path = public on all five RLS helpers (3 new + 2
--      existing). Closes function_search_path_mutable advisor warnings.
--   4. REVOKE EXECUTE FROM PUBLIC, anon on all five helpers; keep
--      authenticated granted (required for RLS policy evaluation --
--      SECURITY DEFINER changes execution privilege, NOT call privilege).
--      Closes anon_security_definer_function_executable advisors.
--      authenticated_security_definer warning persists by design: every
--      policy below references a helper, and revoking the call privilege
--      from authenticated breaks the RLS path with 42501.
--   5. Free-tier pre-flight: pre-state captured at backups/pre_bf31/*.json
--      via Supabase MCP; rollback ready in same MCP session.
--
-- Behavior change worth flagging: today a non-admin profile sees only
-- projects via project_users. Post-BF-31 every org member sees every
-- project in their org (projects.SELECT widens to organization_id ANY
-- current_org_ids). Project-level data (forms, photos, documents,
-- permits) still respects project_users via get_user_project_ids().

-- =========================================================================
-- 1. DROP every existing public-schema policy (DROP IF EXISTS is idempotent
--    and safe; ordering does not matter -- policies do not have inter-
--    dependencies).
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

-- project_documents (drop BOTH old name pairs -- duplicates from prior migrations)
DROP POLICY IF EXISTS "docs_select"           ON public.project_documents;
DROP POLICY IF EXISTS "docs_insert"           ON public.project_documents;
DROP POLICY IF EXISTS "docs_delete"           ON public.project_documents;
DROP POLICY IF EXISTS "documents_select"      ON public.project_documents;
DROP POLICY IF EXISTS "documents_insert"      ON public.project_documents;

-- form_submissions
DROP POLICY IF EXISTS "submissions_select"    ON public.form_submissions;
DROP POLICY IF EXISTS "submissions_insert"    ON public.form_submissions;
DROP POLICY IF EXISTS "submissions_update"    ON public.form_submissions;

-- form_photos
DROP POLICY IF EXISTS "photos_select"         ON public.form_photos;
DROP POLICY IF EXISTS "photos_insert"         ON public.form_photos;

-- qr_tokens (BF-36 left this name; subsuming into the org-scoped rewrite)
DROP POLICY IF EXISTS "Users can manage QR tokens for assigned projects or admin" ON public.qr_tokens;
DROP POLICY IF EXISTS "Users can manage QR tokens for assigned projects"          ON public.qr_tokens;
DROP POLICY IF EXISTS "qr_tokens_all"                                             ON public.qr_tokens;

-- BF-30 placeholder policies on the new tables
DROP POLICY IF EXISTS "bf30_placeholder_select" ON public.organizations;
DROP POLICY IF EXISTS "bf30_placeholder_select" ON public.organization_members;
DROP POLICY IF EXISTS "bf30_placeholder_select" ON public.organization_invitations;

-- =========================================================================
-- 2. HELPERS -- new (org-scoped) + existing (tighten in-pass)
-- =========================================================================

-- New helper: array of org_ids the current user is a member of.
-- SECURITY DEFINER bypasses RLS on organization_members inside the body, so
-- this does NOT recurse into the organization_members policy that itself
-- calls current_org_ids().
CREATE OR REPLACE FUNCTION public.current_org_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY(
    SELECT org_id
    FROM organization_members
    WHERE user_id = auth.uid()
  )
$$;

-- New helper: is the current user owner|admin of a specific org?
-- Argument is row-dependent; do NOT wrap callers as `(select is_org_admin(...))`
-- (Postgres can't initPlan-cache row-dependent function arguments).
-- Same applies to current_org_ids() / get_user_project_ids() inside ANY():
-- wrapping array-returning helpers in `(select ...)` makes Postgres treat
-- the subquery as a set, breaking `= ANY(...)`. Use the function directly.
CREATE OR REPLACE FUNCTION public.is_org_admin(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE user_id = auth.uid()
      AND org_id  = p_org_id
      AND role    IN ('owner', 'admin')
  )
$$;

-- New helper: platform-wide super_admin (audited cross-org read access).
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND platform_role = 'super_admin'
  )
$$;

-- Existing helper: get_user_project_ids -- rewrite body to filter through
-- organization membership. JOIN ensures a project_users row only counts if
-- the project's organization_id is in the caller's current_org_ids(). This
-- defends against stale project_users rows after an org membership change.
CREATE OR REPLACE FUNCTION public.get_user_project_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY(
    SELECT pu.project_id
    FROM project_users pu
    JOIN projects p ON p.id = pu.project_id
    WHERE pu.user_id = auth.uid()
      AND p.organization_id = ANY(current_org_ids())
  )
$$;

-- Existing helper: is_admin -- BODY UNCHANGED (compat shim per BF-35).
-- Only attribute change: pin search_path so the advisor warning closes.
ALTER FUNCTION public.is_admin() SET search_path = public;

-- REVOKE EXECUTE from PUBLIC and anon, but KEEP granted to authenticated.
-- Closes the anon_security_definer_function_executable advisor.
-- The authenticated_security_definer warning remains BY DESIGN: every
-- policy below references one or more of these helpers, and Postgres
-- requires the calling role to have EXECUTE on a function to invoke it
-- even from inside an RLS policy expression. SECURITY DEFINER affects
-- WHAT the function can do (runs as owner), not WHO can call it.
-- Revoking EXECUTE from authenticated would surface as
-- `42501: permission denied for function current_org_ids` on every
-- authenticated query touching projects/forms/etc -- verified during
-- post-apply two-org isolation testing.
REVOKE EXECUTE ON FUNCTION public.is_admin()              FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_project_ids()  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_org_ids()       FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_org_admin(uuid)      FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_super_admin()        FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.is_admin()              TO authenticated;
GRANT  EXECUTE ON FUNCTION public.get_user_project_ids()  TO authenticated;
GRANT  EXECUTE ON FUNCTION public.current_org_ids()       TO authenticated;
GRANT  EXECUTE ON FUNCTION public.is_org_admin(uuid)      TO authenticated;
GRANT  EXECUTE ON FUNCTION public.is_super_admin()        TO authenticated;

-- =========================================================================
-- 3. SUPPORTING INDEX -- already created in BF-30 line 36; re-emit
--    idempotent CREATE for completeness.
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_organization_members_user_org
  ON public.organization_members (user_id, org_id);

-- =========================================================================
-- 4. POLICIES -- existing tables (org-scoped rewrite)
-- =========================================================================

-- --- profiles -----------------------------------------------------------
-- FIX LEAK: scope to self + super_admin + co-org-members.
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    (select auth.uid()) = id
    OR (select public.is_super_admin())
    OR id IN (
      SELECT user_id FROM public.organization_members
      WHERE org_id = ANY(public.current_org_ids())
    )
  );

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id);

-- --- projects -----------------------------------------------------------
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT TO authenticated
  USING (
    (select public.is_super_admin())
    OR organization_id = ANY(public.current_org_ids())
  );

CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id));

CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE TO authenticated
  USING (public.is_org_admin(organization_id));

-- --- project_users ------------------------------------------------------
CREATE POLICY "project_users_select" ON public.project_users
  FOR SELECT TO authenticated
  USING (
    (select public.is_super_admin())
    OR user_id = (select auth.uid())
    OR public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = project_id))
  );

CREATE POLICY "project_users_insert" ON public.project_users
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = project_id)));

CREATE POLICY "project_users_update" ON public.project_users
  FOR UPDATE TO authenticated
  USING (public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = project_id)));

CREATE POLICY "project_users_delete" ON public.project_users
  FOR DELETE TO authenticated
  USING (public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = project_id)));

-- --- project_permits ----------------------------------------------------
CREATE POLICY "permits_select" ON public.project_permits
  FOR SELECT TO authenticated
  USING (
    (select public.is_super_admin())
    OR project_id = ANY(public.get_user_project_ids())
  );

CREATE POLICY "permits_insert" ON public.project_permits
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = project_id)));

CREATE POLICY "permits_update" ON public.project_permits
  FOR UPDATE TO authenticated
  USING (public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = project_id)));

CREATE POLICY "permits_delete" ON public.project_permits
  FOR DELETE TO authenticated
  USING (public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = project_id)));

-- --- project_form_requirements ------------------------------------------
CREATE POLICY "form_requirements_select" ON public.project_form_requirements
  FOR SELECT TO authenticated
  USING (
    (select public.is_super_admin())
    OR project_id = ANY(public.get_user_project_ids())
  );

CREATE POLICY "form_requirements_insert" ON public.project_form_requirements
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = project_id)));

CREATE POLICY "form_requirements_update" ON public.project_form_requirements
  FOR UPDATE TO authenticated
  USING (public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = project_id)));

CREATE POLICY "form_requirements_delete" ON public.project_form_requirements
  FOR DELETE TO authenticated
  USING (public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = project_id)));

-- --- project_documents (canonical names; old docs_*/documents_* dropped) -
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

CREATE POLICY "project_documents_delete" ON public.project_documents
  FOR DELETE TO authenticated
  USING (
    (select public.is_super_admin())
    OR public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = project_id))
  );

-- --- form_submissions ---------------------------------------------------
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

-- --- form_photos --------------------------------------------------------
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

-- --- qr_tokens ----------------------------------------------------------
-- Subsumes the BF-36 hotfix: super_admin OR org admin for the project's
-- org OR member of the project. TO authenticated (was 'public' pre-BF-36).
CREATE POLICY "qr_tokens_all" ON public.qr_tokens
  FOR ALL TO authenticated
  USING (
    (select public.is_super_admin())
    OR public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = project_id))
    OR project_id = ANY(public.get_user_project_ids())
  )
  WITH CHECK (
    (select public.is_super_admin())
    OR public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = project_id))
    OR project_id = ANY(public.get_user_project_ids())
  );

-- =========================================================================
-- 5. POLICIES -- new tables (replacing BF-30 placeholders)
-- =========================================================================

-- --- organizations ------------------------------------------------------
CREATE POLICY "organizations_select" ON public.organizations
  FOR SELECT TO authenticated
  USING (
    (select public.is_super_admin())
    OR id = ANY(public.current_org_ids())
  );

CREATE POLICY "organizations_insert" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK ((select public.is_super_admin()));

CREATE POLICY "organizations_update" ON public.organizations
  FOR UPDATE TO authenticated
  USING ((select public.is_super_admin()));

CREATE POLICY "organizations_delete" ON public.organizations
  FOR DELETE TO authenticated
  USING ((select public.is_super_admin()));

-- --- organization_members -----------------------------------------------
CREATE POLICY "organization_members_select" ON public.organization_members
  FOR SELECT TO authenticated
  USING (
    (select public.is_super_admin())
    OR org_id = ANY(public.current_org_ids())
  );

CREATE POLICY "organization_members_insert" ON public.organization_members
  FOR INSERT TO authenticated
  WITH CHECK (
    (select public.is_super_admin())
    OR public.is_org_admin(org_id)
  );

CREATE POLICY "organization_members_update" ON public.organization_members
  FOR UPDATE TO authenticated
  USING (
    (select public.is_super_admin())
    OR public.is_org_admin(org_id)
  );

CREATE POLICY "organization_members_delete" ON public.organization_members
  FOR DELETE TO authenticated
  USING (
    (select public.is_super_admin())
    OR public.is_org_admin(org_id)
  );

-- --- organization_invitations -------------------------------------------
CREATE POLICY "organization_invitations_select" ON public.organization_invitations
  FOR SELECT TO authenticated
  USING (
    (select public.is_super_admin())
    OR public.is_org_admin(org_id)
    OR email = ((select auth.jwt())->>'email')::citext
  );

CREATE POLICY "organization_invitations_insert" ON public.organization_invitations
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin(org_id));

CREATE POLICY "organization_invitations_update" ON public.organization_invitations
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(org_id));

CREATE POLICY "organization_invitations_delete" ON public.organization_invitations
  FOR DELETE TO authenticated
  USING (public.is_org_admin(org_id));

-- --- audit_log ----------------------------------------------------------
-- Append-only across the public surface. Service role bypasses RLS for
-- inserts (BF-33/BF-34 drives audit writes). No INSERT/UPDATE/DELETE
-- policies for authenticated -- absence = denied.
CREATE POLICY "audit_log_select" ON public.audit_log
  FOR SELECT TO authenticated
  USING ((select public.is_super_admin()));
