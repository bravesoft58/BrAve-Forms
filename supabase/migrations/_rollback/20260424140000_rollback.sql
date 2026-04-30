-- BF-32 ROLLBACK: restore pre-BF-32 storage state.
-- Pair: supabase/migrations/20260424140000_private_storage.sql
--
-- Re-flips both buckets to public:true and restores the six pre-BF-32
-- storage.objects policies verbatim from backups/pre_bf32_storage_policies.sql.
-- App keeps working through this rollback because the BF-32 client code
-- uses signed URLs, which work against public buckets too.

-- =========================================================================
-- 1. Drop BF-32 policies
-- =========================================================================

DROP POLICY IF EXISTS "form_attachments_read"     ON storage.objects;
DROP POLICY IF EXISTS "form_attachments_upload"   ON storage.objects;
DROP POLICY IF EXISTS "form_attachments_delete"   ON storage.objects;
DROP POLICY IF EXISTS "project_documents_read"    ON storage.objects;
DROP POLICY IF EXISTS "project_documents_upload"  ON storage.objects;
DROP POLICY IF EXISTS "project_documents_delete"  ON storage.objects;

-- =========================================================================
-- 2. Flip buckets back to public
-- =========================================================================

UPDATE storage.buckets
   SET public = true
 WHERE id IN ('form-attachments', 'project-documents');

-- =========================================================================
-- 3. Recreate pre-BF-32 policies
-- =========================================================================

CREATE POLICY "auth_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'form-attachments');

CREATE POLICY "auth_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'form-attachments');

CREATE POLICY "auth_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'form-attachments');

CREATE POLICY "docs_storage_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'project-documents');

CREATE POLICY "docs_storage_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-documents');

CREATE POLICY "docs_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'project-documents' AND (SELECT public.is_admin()));
