-- BF-56: Stable inspector QR codes plus short-lived scan sessions
-- Pair: supabase/migrations/_rollback/20260924162749_rollback.sql
--
-- Before this migration every "Inspector QR" modal open inserted a new
-- 30-day qr_tokens row, and the token URL itself was the access: expiry meant
-- a new URL and a reprint. After it:
--   * A stable token is a qr_tokens row with expires_at IS NULL. It never
--     expires; an admin can revoke it (revoked_at). At most one active stable
--     token per project (partial unique index).
--   * Scanning /inspector/<token> mints an inspector_sessions row (12 hours,
--     set by the app) and the portal checks the session, not the token URL.
--   * Legacy 30-day rows keep working as scan entries until their own expiry
--     (Tim, 2026-09-23). No bulk migration of existing rows.
--   * qr_tokens writes are restricted to org admins and super admins; reads
--     stay org-scoped (Tim, 2026-09-23). Before this, qr_tokens_all (BF-42)
--     let any org member insert, update or delete tokens.
--
-- Compatibility with the code deployed before BF-56 merges: that code inserts
-- rows with a 30-day expires_at and validates with expires_at > now(), both
-- unaffected. Its only writer is the admin-gated QR button, so the tightened
-- write policy changes nothing for it.

-- =========================================================================
-- 1. qr_tokens: stable tokens and revocation
-- =========================================================================

ALTER TABLE public.qr_tokens ALTER COLUMN expires_at DROP NOT NULL;
ALTER TABLE public.qr_tokens ADD COLUMN IF NOT EXISTS revoked_at timestamptz;

COMMENT ON COLUMN public.qr_tokens.expires_at IS
  'NULL = stable project QR (never expires, BF-56). Non-NULL = legacy 30-day token.';
COMMENT ON COLUMN public.qr_tokens.revoked_at IS
  'Set when an admin revokes the token; a revoked token opens nothing and its sessions stop working.';

CREATE UNIQUE INDEX IF NOT EXISTS qr_tokens_one_active_stable_per_project
  ON public.qr_tokens (project_id)
  WHERE expires_at IS NULL AND revoked_at IS NULL;

-- =========================================================================
-- 2. inspector_sessions: service-client only
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.inspector_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_token_id uuid NOT NULL REFERENCES public.qr_tokens(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS inspector_sessions_qr_token_id_idx
  ON public.inspector_sessions (qr_token_id);

-- RLS on with no policies: anon and authenticated see and write nothing.
-- The explicit REVOKE makes the grants say the same thing (Supabase default
-- privileges grant new tables to anon/authenticated; BF-60 direction).
ALTER TABLE public.inspector_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.inspector_sessions FROM anon, authenticated;

-- =========================================================================
-- 3. qr_tokens policies: reads org-scoped, writes org admins only
-- =========================================================================

DROP POLICY IF EXISTS qr_tokens_all ON public.qr_tokens;

CREATE POLICY qr_tokens_select ON public.qr_tokens
  FOR SELECT TO authenticated
  USING (
    (SELECT public.is_super_admin())
    OR project_id IN (
      SELECT p.id FROM public.projects p
      WHERE p.organization_id = ANY(public.current_org_ids())
    )
  );

CREATE POLICY qr_tokens_insert ON public.qr_tokens
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.is_super_admin())
    OR public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = project_id))
  );

CREATE POLICY qr_tokens_update ON public.qr_tokens
  FOR UPDATE TO authenticated
  USING (
    (SELECT public.is_super_admin())
    OR public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = project_id))
  )
  WITH CHECK (
    (SELECT public.is_super_admin())
    OR public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = project_id))
  );

CREATE POLICY qr_tokens_delete ON public.qr_tokens
  FOR DELETE TO authenticated
  USING (
    (SELECT public.is_super_admin())
    OR public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = project_id))
  );
