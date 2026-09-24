-- BF-56 verify round 3, finding 1: revocation must hold for validators that
-- only check expires_at.
-- Pair: supabase/migrations/_rollback/20260924191740_rollback.sql
--
-- The pre-BF-56 portal (still deployed until BF-56 merges, and again after
-- any code rollback) validates a token with expires_at > now() and ignores
-- revoked_at. Revoking only set revoked_at, so a revoked legacy 30-day token
-- stayed live on that code until its own expiry. reissue_inspector_qr now also
-- caps a legacy token's expires_at to now() in the same UPDATE; stable tokens
-- keep expires_at NULL. Otherwise identical to 20260924180712.

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
  -- One reissue per project at a time; a concurrent caller waits here and
  -- then sees the replacement, so it takes the stale branch below.
  PERFORM pg_advisory_xact_lock(hashtextextended('bf56_qr_reissue:' || p_project_id::text, 0));

  -- Explicit check: an RLS-refused UPDATE would otherwise no-op silently.
  IF NOT ((SELECT public.is_super_admin())
          OR public.is_org_admin((SELECT organization_id FROM public.projects WHERE id = p_project_id))) THEN
    RAISE EXCEPTION 'Only project administrators can manage the inspector QR code.'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_current
    FROM public.qr_tokens
   WHERE project_id = p_project_id AND expires_at IS NULL AND revoked_at IS NULL;

  -- Stale or retried request: the code the caller saw is no longer current.
  -- Return the current code unchanged instead of revoking a fresh one.
  IF v_current.id IS NOT NULL AND v_current.token IS DISTINCT FROM p_expected_token THEN
    RETURN QUERY SELECT v_current.token, v_current.created_at, false;
    RETURN;
  END IF;

  -- Revoke every active token on the project (stable and legacy), then issue
  -- the replacement, in one transaction: both happen or neither does.
  -- Legacy tokens also get expires_at capped to now(), so a validator that
  -- only checks expiry (the pre-BF-56 code, or a code rollback) refuses them
  -- too. Stable tokens keep expires_at NULL.
  UPDATE public.qr_tokens
     SET revoked_at = now(),
         expires_at = CASE WHEN expires_at IS NULL THEN NULL ELSE LEAST(expires_at, now()) END
   WHERE project_id = p_project_id AND revoked_at IS NULL;

  RETURN QUERY
    INSERT INTO public.qr_tokens (project_id, expires_at, created_by)
    VALUES (p_project_id, NULL, auth.uid())
    RETURNING public.qr_tokens.token, public.qr_tokens.created_at, true;
END
$fn$;

REVOKE EXECUTE ON FUNCTION public.reissue_inspector_qr(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reissue_inspector_qr(uuid, uuid) TO authenticated;
