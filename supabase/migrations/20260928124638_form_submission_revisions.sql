-- BF-63: append-only revision history for form submissions
-- Pair: supabase/migrations/_rollback/20260928124638_rollback.sql
--
-- Every UPDATE that changes a form_submissions row, and every DELETE, copies
-- the previous row into form_submission_revisions. The trigger runs in the
-- database, so every edit path is covered: the NDOT, NDEP and Working in
-- Waterways edits, the dust-log "add entries" append, project deletes that
-- cascade, and admin SQL.
--
-- Separate from public.audit_log on purpose: that table records super-admin
-- cross-organization access and only super admins read it. This one holds
-- record history that the organization's own members may read.
--
-- Design notes:
--   * old_row is the whole previous row as jsonb, so columns added later
--     (BF-61, BF-65) are captured without changing this table. data.photos is
--     part of it, so a removed photo stays findable (photo files are never
--     deleted by the form paths since BF-58.1).
--   * No FK on submission_id: the DELETE revision must outlive the row.
--   * AFTER trigger: it sees the final row, after form_submissions_updated_at.
--   * A save that changes nothing except updated_at writes no revision. That
--     trigger bumps updated_at on every UPDATE, and the dust-log append sets
--     it itself, so a plain row comparison would never see a no-op.
--   * changed_by is auth.uid() (null outside a signed-in request);
--     changed_role is the request's JWT role (authenticated, service_role),
--     null for direct SQL.
--   * Append-only: RLS allows SELECT only, and the grants leave anon nothing,
--     authenticated and service_role SELECT only (Supabase's default
--     privileges would otherwise give all three roles full DML). Only the
--     trigger function, owned by postgres, inserts. The table owner and a
--     superuser can still change it; that is outside the app's reach.
--   * After a whole project is deleted its DELETE revisions stay, but only
--     super admins can read them, because the org check goes through projects.

CREATE TABLE public.form_submission_revisions (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  submission_id uuid NOT NULL,
  project_id    uuid NOT NULL,
  form_type     text NOT NULL,
  op            text NOT NULL CHECK (op IN ('UPDATE', 'DELETE')),
  old_row       jsonb NOT NULL,
  changed_by    uuid,
  changed_role  text,
  changed_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.form_submission_revisions IS
  'BF-63: append-only history of form_submissions. One row per changing UPDATE or DELETE, holding the previous row. Written only by the record_form_submission_revision trigger.';

CREATE INDEX idx_form_submission_revisions_submission
  ON public.form_submission_revisions (submission_id, changed_at);
CREATE INDEX idx_form_submission_revisions_project
  ON public.form_submission_revisions (project_id);

CREATE FUNCTION public.record_form_submission_revision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  IF TG_OP = 'UPDATE'
     AND (to_jsonb(OLD) - 'updated_at') IS NOT DISTINCT FROM (to_jsonb(NEW) - 'updated_at') THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.form_submission_revisions
    (submission_id, project_id, form_type, op, old_row, changed_by, changed_role)
  VALUES (
    OLD.id, OLD.project_id, OLD.form_type, TG_OP, to_jsonb(OLD),
    auth.uid(),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
  );
  RETURN NULL;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.record_form_submission_revision() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER form_submissions_record_revision
  AFTER UPDATE OR DELETE ON public.form_submissions
  FOR EACH ROW EXECUTE FUNCTION public.record_form_submission_revision();

-- Grants: nobody writes except the trigger.
REVOKE ALL ON TABLE public.form_submission_revisions FROM anon, authenticated, service_role;
GRANT SELECT ON TABLE public.form_submission_revisions TO authenticated, service_role;

-- RLS: read access matches form_submissions (BF-42 org-wide viewing).
ALTER TABLE public.form_submission_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY form_submission_revisions_select ON public.form_submission_revisions
  FOR SELECT TO authenticated
  USING (
    (SELECT public.is_super_admin())
    OR project_id IN (
      SELECT p.id FROM public.projects p
      WHERE p.organization_id = ANY(public.current_org_ids())
    )
  );
