-- BF-65 ROLLBACK: remove the submission idempotency key.
-- Pair: supabase/migrations/20260928172044_submission_client_key.sql
--
-- ORDER MATTERS: revert the app code first (deploy the commit before BF-65).
-- The BF-65 server actions write client_key on every new submission, so
-- dropping the column while that code is live makes every new form submission
-- fail. With the old code deployed, nothing reads or writes the column.
--
-- Losing the stored keys is harmless: they only guard retries of a submit that
-- is already over.

DROP INDEX IF EXISTS public.form_submissions_submitter_client_key;
ALTER TABLE public.form_submissions DROP COLUMN IF EXISTS client_key;
