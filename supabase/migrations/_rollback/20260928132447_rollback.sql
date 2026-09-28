-- BF-63 ROLLBACK: remove the form submission revision history.
-- Pair: supabase/migrations/20260928132447_form_submission_revisions.sql
--
-- DESTRUCTIVE: drops every recorded revision. No app code reads the table, so
-- no deploy is needed with this rollback.
--
-- If the history must be kept, export it -- but only AFTER step 1, never before
-- running this file. A plain SELECT takes only an ACCESS SHARE lock and does
-- not block concurrent form edits, so exporting while the trigger is still live
-- can miss revisions written between the export and the DROP, which DROP TABLE
-- then destroys. Step 1 drops the trigger, which stops all new revisions and
-- freezes the table, so an export taken between steps 1 and 3 is complete:
--   SELECT * FROM public.form_submission_revisions ORDER BY id;

-- 1. Stop new revisions being written (freezes form_submission_revisions).
DROP TRIGGER IF EXISTS form_submissions_record_revision ON public.form_submissions;

-- 2. If keeping the history: export it HERE. The table is now frozen -- no
--    further revisions can be written -- so the snapshot cannot miss any.

-- 3. Remove the history and its writer.
DROP FUNCTION IF EXISTS public.record_form_submission_revision();
DROP TABLE IF EXISTS public.form_submission_revisions;
