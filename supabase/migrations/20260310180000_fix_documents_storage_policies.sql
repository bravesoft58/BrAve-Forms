-- ============================================
-- FIX: Add missing storage policies for project-documents bucket
-- Migration 004 failed mid-way during db push, so the storage
-- policies at the end were never applied. Bucket exists but
-- uploads are blocked without these policies.
-- Also: restrict storage delete to admin only.
-- ============================================

drop policy if exists "docs_storage_upload" on storage.objects;
create policy "docs_storage_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'project-documents');

drop policy if exists "docs_storage_read" on storage.objects;
create policy "docs_storage_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'project-documents');

drop policy if exists "docs_storage_delete" on storage.objects;
create policy "docs_storage_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'project-documents' and (select is_admin()));
