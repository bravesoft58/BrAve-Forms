-- BF-36: qr_tokens RLS hotfix
--
-- Two changes to the qr_tokens policy:
--   1. Add is_admin() to USING and WITH CHECK so admin users (e.g. Tim, Andy)
--      can manage QR tokens for any project, not only those they're listed in
--      via project_users. Matches the global is_admin() pattern used by every
--      other write policy in the system.
--   2. Target role 'authenticated' instead of 'public' (the original migration
--      omitted the TO clause, which defaults to public). BF-31's RLS rewrite
--      already had this on its docket; folding the one-word fix in here while
--      we're authoring a fresh policy avoids drift.
--
-- BF-31 will replace this entire policy with org-scoped helpers
-- (is_org_admin(project.org_id) OR project_id = ANY(get_user_project_ids())).
-- Until then, this widens admin to all qr_tokens system-wide; today this is
-- identical to the pre-BF-30 admin scope because Q&D is the only org. If a
-- second org is seeded before BF-31 ships, BF-31 must close the gap.
--
-- Pair: supabase/migrations/_rollback/20260429143427_rollback.sql

DROP POLICY IF EXISTS "Users can manage QR tokens for assigned projects" ON public.qr_tokens;
DROP POLICY IF EXISTS "Users can manage QR tokens for assigned projects or admin" ON public.qr_tokens;

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
