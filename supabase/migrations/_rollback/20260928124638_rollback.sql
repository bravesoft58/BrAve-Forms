-- BF-63 ROLLBACK: remove the form submission revision history.
-- Pair: supabase/migrations/20260928124638_form_submission_revisions.sql
--
-- DESTRUCTIVE: drops every recorded revision. Export it first if it must be
-- kept:
--   SELECT * FROM public.form_submission_revisions ORDER BY id;
-- No app code reads the table, so no deploy is needed with this rollback.

DROP TRIGGER IF EXISTS form_submissions_record_revision ON public.form_submissions;
DROP FUNCTION IF EXISTS public.record_form_submission_revision();
DROP TABLE IF EXISTS public.form_submission_revisions;
