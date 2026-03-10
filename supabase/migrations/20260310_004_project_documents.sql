-- ============================================
-- PROJECT DOCUMENTS: table + storage bucket
-- Used for document uploads (permits, contracts,
-- maps, plans) on the project Documents tab.
-- ============================================

-- 1. Metadata table
create table if not exists public.project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  category text not null check (category in ('permit', 'contract', 'map', 'plan', 'other')),
  file_path text not null,
  file_size bigint not null default 0,
  mime_type text not null default '',
  uploaded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.project_documents enable row level security;

-- RLS: admin can see all, users can see their projects
create policy "docs_select" on public.project_documents
  for select to authenticated
  using (
    (select is_admin())
    or project_id = any(get_user_project_ids())
  );

create policy "docs_insert" on public.project_documents
  for insert to authenticated
  with check (
    (select is_admin())
    or project_id = any(get_user_project_ids())
  );

create policy "docs_delete" on public.project_documents
  for delete to authenticated
  using (
    (select is_admin())
  );

-- 2. Storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-documents',
  'project-documents',
  true,
  26214400, -- 25 MB per file
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png'
  ]
)
on conflict (id) do nothing;

-- Storage policies (same pattern as form-attachments)
create policy "docs_storage_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'project-documents');

create policy "docs_storage_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'project-documents');

create policy "docs_storage_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'project-documents');
