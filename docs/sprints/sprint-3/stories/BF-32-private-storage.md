# BF-32: Storage Privatization + Signed URLs

**Type:** Security / Code + Schema
**Priority:** CRITICAL
**Points:** 4 (rescoped from 3 post-scout — adds NDOT photo display sites + write-path change)
**Status:** IN PROGRESS
**Sprint:** 3
**Depends on:** BF-31

## Problem

Both Supabase Storage buckets (`form-attachments`, `project-documents`) are `public: true`. Anyone with a URL — leaked, cached, or shared — can download the file without authentication, bypassing RLS entirely. Under multi-tenant, every org's files are one-leaked-URL away from exposure.

Storage RLS policies exist but only check `bucket_id`, not path-to-project ownership. Need to flip both buckets to `public: false`, tighten RLS to join storage path → project → organization membership, and convert three app-side code paths from `getPublicUrl()` to `createSignedUrl()`.

## Design

### Two-step deploy for safe rollback

1. **Step 3a — Code change** (deploys first, bucket still public): switch all photo/doc display code to `createSignedUrl()`. Signed URLs work against public buckets too — just unnecessary. The app is visually identical. Rollback = Vercel revert.

2. **Step 3b — Bucket flip** (runs 24h after Step 3a is stable): migration flips `storage.buckets.public=false` and rewrites storage RLS. App is already using signed URLs, keeps working. Rollback = flip back to public, restore old policies.

### Path convention (verified)

All existing paths follow `projects/{project_id}/{filename}`. Confirmed from DB query in planning. `storage.foldername(name)` returns `text[]` where `[1]='projects'` and `[2]=project_id`.

### Storage RLS rewrite

```sql
-- form-attachments read
CREATE POLICY "form_attachments_read" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'form-attachments' AND (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = ((storage.foldername(name))[2])::uuid
        AND p.organization_id = ANY(current_org_ids())
    )
  )
);

-- form-attachments upload (same join)
-- form-attachments delete: org admin of project's org
-- project-documents read: project-member or org-admin of project's org
-- project-documents upload: org-admin of project's org
-- project-documents delete: org-admin of project's org
```

### Data migration verified NOT needed

During planning: `SELECT ... FROM form_submissions WHERE data::text LIKE '%supabase.co%'` returned zero rows. File paths are stored as path-only in `form_photos.file_path` and `project_documents.file_path`. No URLs embedded in JSONB data. Bucket flip is clean.

## Files

### New

- `src/lib/supabase/signed-urls.ts` — server-only helper:
  - `signFileUrlServer(bucket, path, ttlSec=3600)` — uses authenticated server client (RLS-enforced).
  - `signFileUrlService(bucket, path, ttlSec=3600)` — uses service client (for inspector portal + PDF gen where token is capability).
- `supabase/migrations/20260424140000_private_storage.sql` — forward (runs at Step 3b).
- `supabase/migrations/_rollback/20260424140000_rollback.sql` — inverse.

### Modified (Step 3a, deploys first)

- `src/components/forms/shared/PhotoAttachment.tsx` — drops `getPublicUrl`; signs render-time previews client-side via anon-key `createSignedUrl`. **No longer writes `url` to form_submissions.data JSONB** (BF-32 write-path change).
- `src/lib/schemas/ndot-stormwater.ts` — `photoSchema.url` becomes optional (deprecated; renderers reconstruct path from `${storagePath}/${file_name}`).
- `src/components/projects/DocumentsTab.tsx` — accepts `download_url` per doc; parent RSC (`src/app/dashboard/projects/[id]/page.tsx`) signs each via `signFileUrlServer`.
- `src/components/projects/ProjectTabs.tsx` — pass-through type extends `ProjectDocument` with `download_url: string | null`.
- `src/components/inspector/DocumentsTab.tsx` — accepts `download_url` per doc; no anon-key client. Inspector page batch-signs via `signFileUrlsService`.
- `src/lib/queries/inspector.ts` — `getPortalData` batch-signs all documents AND walks each NDOT submission's `data.photos[]`, signing each via `signFileUrlsService` before returning.
- `src/app/dashboard/projects/[id]/forms/ndot-stormwater/[submissionId]/page.tsx` — admin form-view: signs each photo via `signFileUrlServer` and replaces `photo.url` before rendering.
- `src/app/api/forms/[submissionId]/pdf/route.ts` — walks `data.photos[]`, signs each via `signFileUrlServer` before passing to renderFn. 3600s TTL easily outlives seconds-long render.

All call sites that previously read `photo.url` from JSONB get a freshly signed URL injected at render time. The inspector `FormDetail.tsx` continues to read `photo.url` unchanged — its parent has already replaced the field.

## Pre-Flight

- Grep confirms exactly 3 `getPublicUrl` call sites (already verified).
- Grep confirms no embedded URLs in stored data (already verified).
- Supabase branch: deploy Step 3a code against the branch DB, smoke-test photos + docs UI.
- Supabase branch: run Step 3b migration, re-smoke-test.

## Rollback

### Step 3a (code only)
Vercel rollback. No data side effects.

### Step 3b (bucket + policies)

```sql
UPDATE storage.buckets SET public = true WHERE id IN ('form-attachments','project-documents');
-- Drop new policies
DROP POLICY IF EXISTS "form_attachments_read" ON storage.objects;
DROP POLICY IF EXISTS "form_attachments_upload" ON storage.objects;
DROP POLICY IF EXISTS "form_attachments_delete" ON storage.objects;
DROP POLICY IF EXISTS "project_documents_read" ON storage.objects;
DROP POLICY IF EXISTS "project_documents_upload" ON storage.objects;
DROP POLICY IF EXISTS "project_documents_delete" ON storage.objects;
-- Recreate old 6 policies verbatim from pre_bf32_storage_policies.sql
```

App keeps working because signed URLs work against public buckets too.

## Acceptance Criteria

- [ ] `src/lib/supabase/signed-urls.ts` created with `signFileUrlServer`, `signFileUrlService`, `signFileUrlsService` (batch).
- [ ] `PhotoAttachment.tsx` no longer calls `getPublicUrl`; client-side signs render-time previews via anon-key `createSignedUrl`.
- [ ] `PhotoAttachment` no longer writes `url` to JSONB; downstream renderers reconstruct path and sign.
- [ ] `photoSchema.url` is optional (legacy submissions still parse, new submissions write without it).
- [ ] Admin NDOT view page signs each photo server-side before render.
- [ ] Inspector portal `getPortalData` batch-signs documents AND NDOT photos via service client.
- [ ] `DocumentsTab.tsx` (projects) accepts `download_url` from server parent.
- [ ] `DocumentsTab.tsx` (inspector) receives signed URLs from the page loader via service client.
- [ ] PDF API route signs photo URLs via authenticated server client before passing to template.
- [ ] Grep `getPublicUrl` in `src/` returns zero matches after Step 3a.
- [ ] Step 3a deployed to production, stable 24h, no errors.
- [ ] Step 3b migration applied to production; bucket flip + policy rewrite clean.
- [ ] After Step 3b: direct fetch of a bucket URL without signature → 403.
- [ ] Inspector portal loads docs and photos correctly after bucket flip.
- [ ] PDF generation embeds photos correctly after bucket flip.
- [ ] Pre-flight backup of old storage policies captured to `backups/pre_bf32_storage_policies.sql`.
- [ ] Rollback migration prepared (`supabase/migrations/_rollback/20260424140000_rollback.sql`).

## Go/No-Go Gate → BF-33

- Dashboard photos render for Q&D users.
- Documents download from Documents tab.
- Inspector portal renders photos + documents.
- PDF generation includes photos.
- Raw bucket URL fetched without signature returns 403.
- Zero `getPublicUrl` grep hits.
- 24h of clean production runtime logs after Step 3b.

## Related

- Plan: `C:\Users\Tim\.claude\plans\bright-whistling-knuth.md` (Phase 3)
- Previous: BF-31 (RLS rewrite)
- Next: BF-33 (org switcher, invites, super-admin routes)
