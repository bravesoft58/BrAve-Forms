-- BF-42 — Org-scoped visibility for all members
--
-- Construction users move project-to-project; per-project access control adds
-- friction without security benefit. This migration drops the
-- project_users / get_user_project_ids() gate and replaces it with org
-- membership: any member of the org sees all org content (projects, permits,
-- form requirements, submissions, photos, documents, qr tokens, storage).
-- Admin-only writes (create/edit/delete projects, permits, form_requirements,
-- project_documents) keep their is_org_admin gate — unchanged.
--
-- Pattern used everywhere:
--   project_id IN (SELECT p.id FROM projects p WHERE p.organization_id = ANY(current_org_ids()))
-- This avoids the BF-32 alias-collision class of bug by keeping the outer
-- table's column outside any inner subquery.
--
-- get_user_project_ids() is left in place but no longer referenced by any
-- policy; safe to drop in a follow-up after monitoring.

-- ============================================================================
-- public.form_submissions
-- ============================================================================
DROP POLICY IF EXISTS submissions_select ON public.form_submissions;
DROP POLICY IF EXISTS submissions_insert ON public.form_submissions;
DROP POLICY IF EXISTS submissions_update ON public.form_submissions;

CREATE POLICY submissions_select ON public.form_submissions
  FOR SELECT TO authenticated
  USING (
    (SELECT public.is_super_admin())
    OR project_id IN (
      SELECT p.id FROM public.projects p
      WHERE p.organization_id = ANY(public.current_org_ids())
    )
  );

CREATE POLICY submissions_insert ON public.form_submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.is_super_admin())
    OR project_id IN (
      SELECT p.id FROM public.projects p
      WHERE p.organization_id = ANY(public.current_org_ids())
    )
  );

CREATE POLICY submissions_update ON public.form_submissions
  FOR UPDATE TO authenticated
  USING (
    (SELECT public.is_super_admin())
    OR project_id IN (
      SELECT p.id FROM public.projects p
      WHERE p.organization_id = ANY(public.current_org_ids())
    )
  );

-- ============================================================================
-- public.form_photos
-- ============================================================================
DROP POLICY IF EXISTS photos_select ON public.form_photos;
DROP POLICY IF EXISTS photos_insert ON public.form_photos;

CREATE POLICY photos_select ON public.form_photos
  FOR SELECT TO authenticated
  USING (
    (SELECT public.is_super_admin())
    OR submission_id IN (
      SELECT fs.id FROM public.form_submissions fs
      JOIN public.projects p ON p.id = fs.project_id
      WHERE p.organization_id = ANY(public.current_org_ids())
    )
  );

CREATE POLICY photos_insert ON public.form_photos
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.is_super_admin())
    OR submission_id IN (
      SELECT fs.id FROM public.form_submissions fs
      JOIN public.projects p ON p.id = fs.project_id
      WHERE p.organization_id = ANY(public.current_org_ids())
    )
  );

-- ============================================================================
-- public.project_documents
-- ============================================================================
DROP POLICY IF EXISTS project_documents_select ON public.project_documents;
DROP POLICY IF EXISTS project_documents_insert ON public.project_documents;

CREATE POLICY project_documents_select ON public.project_documents
  FOR SELECT TO authenticated
  USING (
    (SELECT public.is_super_admin())
    OR project_id IN (
      SELECT p.id FROM public.projects p
      WHERE p.organization_id = ANY(public.current_org_ids())
    )
  );

CREATE POLICY project_documents_insert ON public.project_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.is_super_admin())
    OR project_id IN (
      SELECT p.id FROM public.projects p
      WHERE p.organization_id = ANY(public.current_org_ids())
    )
  );

-- project_documents_delete stays admin-only (untouched).

-- ============================================================================
-- public.project_form_requirements (only SELECT changes)
-- ============================================================================
DROP POLICY IF EXISTS form_requirements_select ON public.project_form_requirements;

CREATE POLICY form_requirements_select ON public.project_form_requirements
  FOR SELECT TO authenticated
  USING (
    (SELECT public.is_super_admin())
    OR project_id IN (
      SELECT p.id FROM public.projects p
      WHERE p.organization_id = ANY(public.current_org_ids())
    )
  );

-- ============================================================================
-- public.project_permits (only SELECT changes)
-- ============================================================================
DROP POLICY IF EXISTS permits_select ON public.project_permits;

CREATE POLICY permits_select ON public.project_permits
  FOR SELECT TO authenticated
  USING (
    (SELECT public.is_super_admin())
    OR project_id IN (
      SELECT p.id FROM public.projects p
      WHERE p.organization_id = ANY(public.current_org_ids())
    )
  );

-- ============================================================================
-- public.qr_tokens (single ALL policy with both qual + with_check)
-- ============================================================================
DROP POLICY IF EXISTS qr_tokens_all ON public.qr_tokens;

CREATE POLICY qr_tokens_all ON public.qr_tokens
  FOR ALL TO authenticated
  USING (
    (SELECT public.is_super_admin())
    OR project_id IN (
      SELECT p.id FROM public.projects p
      WHERE p.organization_id = ANY(public.current_org_ids())
    )
  )
  WITH CHECK (
    (SELECT public.is_super_admin())
    OR project_id IN (
      SELECT p.id FROM public.projects p
      WHERE p.organization_id = ANY(public.current_org_ids())
    )
  );

-- ============================================================================
-- storage.objects — form-attachments + project-documents (read/upload only;
--   delete policies are admin-only and untouched here)
-- ============================================================================
DROP POLICY IF EXISTS form_attachments_read ON storage.objects;
DROP POLICY IF EXISTS form_attachments_upload ON storage.objects;
DROP POLICY IF EXISTS project_documents_read ON storage.objects;

CREATE POLICY form_attachments_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'form-attachments'
    AND (
      (SELECT public.is_super_admin())
      OR ((storage.foldername(name))[2])::uuid IN (
        SELECT p.id FROM public.projects p
        WHERE p.organization_id = ANY(public.current_org_ids())
      )
    )
  );

CREATE POLICY form_attachments_upload ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'form-attachments'
    AND (
      (SELECT public.is_super_admin())
      OR ((storage.foldername(name))[2])::uuid IN (
        SELECT p.id FROM public.projects p
        WHERE p.organization_id = ANY(public.current_org_ids())
      )
    )
  );

CREATE POLICY project_documents_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'project-documents'
    AND (
      (SELECT public.is_super_admin())
      OR ((storage.foldername(name))[2])::uuid IN (
        SELECT p.id FROM public.projects p
        WHERE p.organization_id = ANY(public.current_org_ids())
      )
    )
  );
