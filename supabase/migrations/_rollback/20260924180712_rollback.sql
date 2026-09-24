-- BF-56 ROLLBACK: remove the atomic reissue function.
-- Pair: supabase/migrations/20260924180712_inspector_qr_reissue_fn.sql
--
-- Deploy app code that no longer calls reissue_inspector_qr before running
-- this, or the admin "Revoke and reissue" action fails. Roll this back
-- before 20260924163446_rollback.sql, which the function depends on.

DROP FUNCTION IF EXISTS public.reissue_inspector_qr(uuid, uuid);
