-- BF-56 ROLLBACK: return qr_tokens to the pre-BF-56 shape.
-- Pair: supabase/migrations/20260924163446_inspector_stable_qr_sessions.sql
--
-- Drops inspector_sessions (all open inspector sessions end), restores the
-- BF-42 org-member qr_tokens_all policy, and makes expires_at NOT NULL again.
-- Stable tokens (expires_at IS NULL) cannot satisfy NOT NULL, so they are
-- given a 30-day expiry first; printed stable codes then behave like the old
-- 30-day tokens. Revoked tokens are expired immediately so revocation holds.
-- Deploy the pre-BF-56 app code together with this rollback.

DROP POLICY IF EXISTS qr_tokens_select ON public.qr_tokens;
DROP POLICY IF EXISTS qr_tokens_insert ON public.qr_tokens;
DROP POLICY IF EXISTS qr_tokens_update ON public.qr_tokens;
DROP POLICY IF EXISTS qr_tokens_delete ON public.qr_tokens;

CREATE POLICY qr_tokens_all ON public.qr_tokens
  FOR ALL TO authenticated
  USING (
    (SELECT public.is_super_admin())
    OR project_id IN (
      SELECT p.id FROM public.projects p
      WHERE p.organization_id = ANY(public.current_org_ids())
    )
  )
  WITH CHECK (
    (SELECT public.is_super_admin())
    OR project_id IN (
      SELECT p.id FROM public.projects p
      WHERE p.organization_id = ANY(public.current_org_ids())
    )
  );

DROP TABLE IF EXISTS public.inspector_sessions;

DROP INDEX IF EXISTS public.qr_tokens_one_active_stable_per_project;

UPDATE public.qr_tokens SET expires_at = now() WHERE revoked_at IS NOT NULL;
UPDATE public.qr_tokens SET expires_at = now() + interval '30 days' WHERE expires_at IS NULL;

ALTER TABLE public.qr_tokens DROP COLUMN IF EXISTS revoked_at;
ALTER TABLE public.qr_tokens ALTER COLUMN expires_at SET NOT NULL;

COMMENT ON COLUMN public.qr_tokens.expires_at IS NULL;
