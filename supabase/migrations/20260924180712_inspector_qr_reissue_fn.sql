-- BF-56 verify round 1, findings 1 and 2: atomic, idempotent revoke-and-reissue.
-- Pair: supabase/migrations/_rollback/20260924180712_rollback.sql
--
-- The round-1 server action ran revoke, a check and the insert as separate
-- autocommitted requests: a failed insert left the project with no active
-- code, and a retried or stale confirm revoked the replacement just issued.
-- This function does the whole thing in one transaction:
--   * serialized per project with a transaction-scoped advisory lock;
--   * refuses non-admins explicitly (42501) rather than letting an
--     RLS-filtered UPDATE no-op silently;
--   * compare-and-swap on the code the caller saw (p_expected_token): if the
--     project's active stable code is a different one, nothing changes and
--     the current code is returned (reissued = false), so a retry or a second
--     admin's stale confirm is harmless;
--   * otherwise revokes every active token on the project (stable and legacy)
--     and inserts the new stable code, both or neither.
-- SECURITY INVOKER: it runs with the caller's rights, so the qr_tokens
-- policies (org admins and super admins write) still apply underneath.

CREATE OR REPLACE FUNCTION public.reissue_inspector_qr(
  p_project_id uuid,
  p_expected_token uuid
)
RETURNS TABLE (qr_token uuid, issued_at timestamptz, reissued boolean)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $fn$
DECLARE
  v_current public.qr_tokens%ROWTYPE;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('bf56_qr_reissue:' || p_project_id::text, 0));

  IF NOT ((SELECT public.is_super_admin())
          OR public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = p_project_id))) THEN
    RAISE EXCEPTION 'Only project administrators can manage the inspector QR code.'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_current
    FROM public.qr_tokens
   WHERE project_id = p_project_id AND expires_at IS NULL AND revoked_at IS NULL;

  IF v_current.id IS NOT NULL AND v_current.token IS DISTINCT FROM p_expected_token THEN
    RETURN QUERY SELECT v_current.token, v_current.created_at, false;
    RETURN;
  END IF;

  UPDATE public.qr_tokens SET revoked_at = now()
   WHERE project_id = p_project_id AND revoked_at IS NULL;

  RETURN QUERY
    INSERT INTO public.qr_tokens (project_id, expires_at, created_by)
    VALUES (p_project_id, NULL, auth.uid())
    RETURNING public.qr_tokens.token, public.qr_tokens.created_at, true;
END
$fn$;

REVOKE EXECUTE ON FUNCTION public.reissue_inspector_qr(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reissue_inspector_qr(uuid, uuid) TO authenticated;
