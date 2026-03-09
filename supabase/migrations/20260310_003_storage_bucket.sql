-- ============================================
-- STORAGE BUCKET: form-attachments
-- Used for photo uploads on NDOT stormwater and
-- potentially other forms in the future.
-- ============================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'form-attachments',
  'form-attachments',
  false,
  10485760, -- 10 MB per file
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Authenticated users can upload photos
create policy "auth_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'form-attachments');

-- Authenticated users can read their own uploads
create policy "auth_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'form-attachments');

-- Authenticated users can delete their own uploads
create policy "auth_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'form-attachments');
