-- BF-72: alerts sent about a submission (first kind: visible sheen/plume on a
-- Working in Waterways inspection). Pair: _rollback/20261008182217_rollback.sql
--
-- Why a separate table, not columns on form_submissions: every UPDATE of a
-- submission bumps updated_at (the BF-61/BF-65 edit version, so an open form
-- would report "changed since you opened it") and, for any other change,
-- writes a BF-63 revision row. Alert bookkeeping must touch neither.
--
-- One row per (submission, kind). The app claims the row with
-- INSERT ... ON CONFLICT DO NOTHING RETURNING before it sends, so a retried
-- submit or a second request never sends twice. One alert per inspection
-- (Tim, 2026-10-08): no automatic retry of a failed send.
--
-- Access: written only by the service client (a user must never be able to
-- mark an alert "sent"). Readable by exactly the users who can read the
-- inspection: the SELECT policy defers to form_submissions' own RLS through
-- the subquery. Per BF-60, every privilege is granted explicitly.

CREATE TABLE public.submission_alerts (
  submission_id uuid NOT NULL REFERENCES public.form_submissions (id) ON DELETE CASCADE,
  kind          text NOT NULL CHECK (kind IN ('sheen_plume')),
  status        text NOT NULL CHECK (status IN ('sending', 'sent', 'failed', 'no_contact', 'not_configured')),
  recipient     text,
  reason        text,
  detail        text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (submission_id, kind)
);

CREATE TRIGGER submission_alerts_updated_at
  BEFORE UPDATE ON public.submission_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.submission_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY submission_alerts_select ON public.submission_alerts
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.form_submissions s WHERE s.id = submission_id));

REVOKE ALL ON TABLE public.submission_alerts FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.submission_alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.submission_alerts TO service_role;
