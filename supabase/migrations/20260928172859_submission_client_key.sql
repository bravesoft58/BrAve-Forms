-- BF-65: idempotent form submission (no duplicate inspections on retry)
-- Pair: supabase/migrations/_rollback/20260928172859_rollback.sql
--
-- The browser makes a random key (crypto.randomUUID) the first time a new
-- entry is submitted and sends the same key on every retry of that submit.
-- The server stores it here. If the first attempt committed but its reply was
-- lost, the retry hits this unique index (SQLSTATE 23505) and the app returns
-- the saved row instead of creating a second inspection.
--
-- Design notes:
--   * Unique on (submitted_by, client_key), not client_key alone: one user's
--     key can never block or reach another user's row.
--   * A plain unique index, not partial: NULLs are distinct in a Postgres
--     unique index by default, so every existing row (key NULL) and any
--     submit from a browser bundle older than this change are unaffected.
--     A partial index would also be unusable by PostgREST's on_conflict.
--   * The column is new and all NULL, so building the index cannot fail on
--     existing data.
--   * BF-63's revision trigger copies whole rows, so revisions will carry
--     client_key too; no change is needed there.

ALTER TABLE public.form_submissions
  ADD COLUMN client_key uuid;

COMMENT ON COLUMN public.form_submissions.client_key IS
  'BF-65: per-submit idempotency key from the browser; unique per submitter. NULL for rows created before BF-65.';

CREATE UNIQUE INDEX form_submissions_submitter_client_key
  ON public.form_submissions (submitted_by, client_key);
