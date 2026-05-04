-- BF-43 — Submission edit ownership
--
-- Rule (per Andy 2026-05-04 in-meeting): general users may edit ONLY their own
-- submissions. Org admins continue to edit any submission in their org.
-- super_admin unchanged.
--
-- Changes:
--   • form_submissions.submissions_update — tightened from "any org member" to
--     "owner OR org_admin OR super_admin"
--   • form_photos.photos_insert — same tightening (photo writes track submission writes)
--   • form_photos.photos_delete — NEW policy. updateNdotStormwater action does
--     DELETE-then-INSERT on form_photos; without a DELETE policy, edits failed
--     silently for non-superuser.
--
-- read paths (submissions_select, photos_select) remain org-scoped — any
-- org member may read all org content, unchanged from BF-42.

-- ============================================================================
-- form_submissions.submissions_update
-- ============================================================================
DROP POLICY IF EXISTS submissions_update ON public.form_submissions;

CREATE POLICY submissions_update ON public.form_submissions
  FOR UPDATE TO authenticated
  USING (
    (SELECT public.is_super_admin())
    OR (
      submitted_by = auth.uid()
      AND project_id IN (
        SELECT p.id FROM public.projects p
        WHERE p.organization_id = ANY(public.current_org_ids())
      )
    )
    OR project_id IN (
      SELECT p.id FROM public.projects p
      WHERE public.is_org_admin(p.organization_id)
    )
  );

-- ============================================================================
-- form_photos.photos_insert
-- ============================================================================
DROP POLICY IF EXISTS photos_insert ON public.form_photos;

CREATE POLICY photos_insert ON public.form_photos
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.is_super_admin())
    OR submission_id IN (
      SELECT fs.id FROM public.form_submissions fs
      WHERE fs.submitted_by = auth.uid()
        AND fs.project_id IN (
          SELECT p.id FROM public.projects p
          WHERE p.organization_id = ANY(public.current_org_ids())
        )
    )
    OR submission_id IN (
      SELECT fs.id FROM public.form_submissions fs
      JOIN public.projects p ON p.id = fs.project_id
      WHERE public.is_org_admin(p.organization_id)
    )
  );

-- ============================================================================
-- form_photos.photos_delete (NEW)
-- ============================================================================
DROP POLICY IF EXISTS photos_delete ON public.form_photos;

CREATE POLICY photos_delete ON public.form_photos
  FOR DELETE TO authenticated
  USING (
    (SELECT public.is_super_admin())
    OR submission_id IN (
      SELECT fs.id FROM public.form_submissions fs
      WHERE fs.submitted_by = auth.uid()
        AND fs.project_id IN (
          SELECT p.id FROM public.projects p
          WHERE p.organization_id = ANY(public.current_org_ids())
        )
    )
    OR submission_id IN (
      SELECT fs.id FROM public.form_submissions fs
      JOIN public.projects p ON p.id = fs.project_id
      WHERE public.is_org_admin(p.organization_id)
    )
  );
