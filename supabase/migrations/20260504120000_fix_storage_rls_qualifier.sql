-- BF-32 (reopened) — Storage RLS column-qualifier fix (UAT round 3, 2026-05-04)
--
-- Root cause: the policies from 20260424140000_private_storage.sql nested
-- `EXISTS (SELECT 1 FROM projects p WHERE p.id = ((storage.foldername(name))[2])::uuid ...)`.
-- Postgres resolved the unqualified `name` to `p.name` (project display name) instead of
-- `storage.objects.name` (path). Project names contain no '/', so storage.foldername
-- returned [], [2] returned NULL, EXISTS never matched. Only is_super_admin() succeeded.
--
-- Fix shape: extract the path-derived project id at the OUTER scope, then check membership
-- via a flat IN-subquery. `name` only appears at the storage.objects level, so the
-- alias-collision class of bug is structurally impossible.

DROP POLICY IF EXISTS form_attachments_read   ON storage.objects;
DROP POLICY IF EXISTS form_attachments_upload ON storage.objects;
DROP POLICY IF EXISTS form_attachments_delete ON storage.objects;
DROP POLICY IF EXISTS project_documents_read   ON storage.objects;
DROP POLICY IF EXISTS project_documents_upload ON storage.objects;
DROP POLICY IF EXISTS project_documents_delete ON storage.objects;

-- form-attachments: photo uploads from the form components (PhotoAttachment.tsx).
-- Path layout: projects/{project_id}/{form_type}/{filename}.
-- Read + upload allow org-admins and project-members; delete allows org-admins only.

CREATE POLICY form_attachments_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'form-attachments'
    AND (
      (SELECT public.is_super_admin())
      OR ((storage.foldername(name))[2])::uuid IN (
        SELECT p.id FROM public.projects p
        WHERE public.is_org_admin(p.organization_id)
           OR p.id = ANY(public.get_user_project_ids())
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
        WHERE public.is_org_admin(p.organization_id)
           OR p.id = ANY(public.get_user_project_ids())
      )
    )
  );

CREATE POLICY form_attachments_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'form-attachments'
    AND (
      (SELECT public.is_super_admin())
      OR ((storage.foldername(name))[2])::uuid IN (
        SELECT p.id FROM public.projects p
        WHERE public.is_org_admin(p.organization_id)
      )
    )
  );

-- project-documents: admin doc uploads from the project Documents tab.
-- Path layout: projects/{project_id}/{filename}.
-- Read allows org-admins and project-members; upload + delete allow org-admins only.

CREATE POLICY project_documents_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'project-documents'
    AND (
      (SELECT public.is_super_admin())
      OR ((storage.foldername(name))[2])::uuid IN (
        SELECT p.id FROM public.projects p
        WHERE public.is_org_admin(p.organization_id)
           OR p.id = ANY(public.get_user_project_ids())
      )
    )
  );

CREATE POLICY project_documents_upload ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'project-documents'
    AND (
      (SELECT public.is_super_admin())
      OR ((storage.foldername(name))[2])::uuid IN (
        SELECT p.id FROM public.projects p
        WHERE public.is_org_admin(p.organization_id)
      )
    )
  );

CREATE POLICY project_documents_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'project-documents'
    AND (
      (SELECT public.is_super_admin())
      OR ((storage.foldername(name))[2])::uuid IN (
        SELECT p.id FROM public.projects p
        WHERE public.is_org_admin(p.organization_id)
      )
    )
  );
