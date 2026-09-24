-- BF-56 ROLLBACK: restore reissue_inspector_qr as of 20260924180712 (revoke
-- sets revoked_at only; legacy expires_at untouched).
-- Pair: supabase/migrations/20260924191740_inspector_qr_reissue_caps_legacy_expiry.sql
--
-- Rows already revoked by the v2 function keep their capped expires_at;
-- that is the safe direction and needs no undo.

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
