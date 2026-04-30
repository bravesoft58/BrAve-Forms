-- BF-32 Step 3b: Storage privatization + path-aware RLS.
-- Pair: supabase/migrations/_rollback/20260424140000_rollback.sql
--
-- Apply ONLY after Step 3a (signed-URL code) has been live in production
-- for 24h with clean runtime logs. Step 3a code works against both public
-- AND private buckets; once this migration runs the buckets are private and
-- direct-fetch URLs return 403 — only signed URLs work.
--
-- Path convention (verified pre-flight): every object lives under
--   projects/{project_id}/{filename}
-- so storage.foldername(name) returns:
--   [1] = 'projects'
--   [2] = project_id (uuid as text)
-- The RLS policies below join on [2] to scope by project organization.
--
-- BF-31 helpers re-used:
--   * is_super_admin()       — wrapped (select ...) for initPlan caching
--   * is_org_admin(uuid)     — UNWRAPPED (row-dependent argument)
--   * current_org_ids()      — UNWRAPPED inside = ANY(...)
--   * get_user_project_ids() — UNWRAPPED inside = ANY(...)

-- =========================================================================
-- 1. Flip buckets private
-- =========================================================================

UPDATE storage.buckets
   SET public = false
 WHERE id IN ('form-attachments', 'project-documents');

-- =========================================================================
-- 2. Drop pre-BF-32 policies
-- =========================================================================

DROP POLICY IF EXISTS "auth_read"            ON storage.objects;
DROP POLICY IF EXISTS "auth_upload"          ON storage.objects;
DROP POLICY IF EXISTS "auth_delete"          ON storage.objects;
DROP POLICY IF EXISTS "docs_storage_read"    ON storage.objects;
DROP POLICY IF EXISTS "docs_storage_upload"  ON storage.objects;
DROP POLICY IF EXISTS "docs_storage_delete"  ON storage.objects;

-- =========================================================================
-- 3. form-attachments policies (path-aware)
-- =========================================================================

-- Read: super_admin, org admin of the project's org, or project member.
CREATE POLICY "form_attachments_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'form-attachments'
    AND (
      (select public.is_super_admin())
      OR EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = ((storage.foldername(name))[2])::uuid
          AND (
            public.is_org_admin(p.organization_id)
            OR p.id = ANY(public.get_user_project_ids())
          )
      )
    )
  );

-- Upload: same shape as read (project members + org admins may attach photos).
CREATE POLICY "form_attachments_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'form-attachments'
    AND (
      (select public.is_super_admin())
      OR EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = ((storage.foldername(name))[2])::uuid
          AND (
            public.is_org_admin(p.organization_id)
            OR p.id = ANY(public.get_user_project_ids())
          )
      )
    )
  );

-- Delete: org admin of the project's org (or super_admin). Matches the
-- BF-31 mutation pattern on permits/form_requirements.
CREATE POLICY "form_attachments_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'form-attachments'
    AND (
      (select public.is_super_admin())
      OR EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = ((storage.foldername(name))[2])::uuid
          AND public.is_org_admin(p.organization_id)
      )
    )
  );

-- =========================================================================
-- 4. project-documents policies (path-aware)
-- =========================================================================

-- Read: super_admin, org admin, or project member.
CREATE POLICY "project_documents_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'project-documents'
    AND (
      (select public.is_super_admin())
      OR EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = ((storage.foldername(name))[2])::uuid
          AND (
            public.is_org_admin(p.organization_id)
            OR p.id = ANY(public.get_user_project_ids())
          )
      )
    )
  );

-- Upload: org admin of the project's org. Matches the BF-31 admin-only
-- write pattern on project_documents.
CREATE POLICY "project_documents_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'project-documents'
    AND (
      (select public.is_super_admin())
      OR EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = ((storage.foldername(name))[2])::uuid
          AND public.is_org_admin(p.organization_id)
      )
    )
  );

-- Delete: org admin of the project's org.
CREATE POLICY "project_documents_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'project-documents'
    AND (
      (select public.is_super_admin())
      OR EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = ((storage.foldername(name))[2])::uuid
          AND public.is_org_admin(p.organization_id)
      )
    )
  );
