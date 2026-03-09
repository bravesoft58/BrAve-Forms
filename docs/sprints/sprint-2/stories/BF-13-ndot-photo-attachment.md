# BF-13: NDOT Photo Attachment (Supabase Storage)

**Sprint:** Sprint 2 - All Forms + Documents + Inspector Portal
**Story Points:** 3
**Priority:** HIGH
**Dependencies:** BF-12
**Status:** NOT STARTED
**Created:** 2026-03-09
**Last Updated:** 2026-03-09T16:00:00Z
**Backlog Ref:** Salvage S3-008

---

## Summary

Build photo upload capability for the NDOT stormwater form. NDOT form instructions explicitly require "Attach digital photographs of deficiencies or other noted issues of concern." This needs Supabase Storage bucket setup, an upload component, and linking photos to the form submission. The same storage infrastructure will be reused for document uploads (BF-17).

---

## CEO Directives

- "Attach digital photographs of deficiencies" -- NDOT form instructions (mandatory per regulation)
- Photos should display in both the editable form and the read-only view

---

## Acceptance Criteria

- [ ] Supabase Storage bucket created for form attachments (e.g., `form-attachments`)
- [ ] RLS policy allows authenticated users to upload/read from the bucket
- [ ] PhotoAttachment component allows selecting/uploading multiple photos
- [ ] Each photo has a caption/description text field
- [ ] Uploaded photos display as thumbnails in the form
- [ ] Photo URLs stored in the form submission JSONB data (array of {url, caption})
- [ ] Photos can be removed before submission
- [ ] Component integrates into NDOT stormwater form (Section 3, before signatures)
- [ ] Photos display in the NDOT read-only view (BF-14)

---

## Tasks

- [ ] T-13.1: Create Supabase Storage bucket `form-attachments` with RLS policy (0.5h)
- [ ] T-13.2: Build PhotoAttachment client component -- upload, preview, caption, remove (1.5h)
- [ ] T-13.3: Create upload server action using Supabase Storage API (0.5h)
- [ ] T-13.4: Integrate PhotoAttachment into NDOT stormwater form (0.25h)
- [ ] T-13.5: Test upload flow end-to-end (0.25h)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/forms/shared/PhotoAttachment.tsx` | CREATE -- reusable photo upload component (~150 lines) |
| `src/app/dashboard/projects/[id]/forms/ndot-stormwater/actions.ts` | MODIFY -- add photo upload action |
| `src/components/forms/ndot-stormwater/NdotStormwater.tsx` | MODIFY -- integrate PhotoAttachment |
| `src/lib/schemas/ndot-stormwater.ts` | MODIFY -- add photos array to schema |

---

## Key Interfaces

```typescript
interface PhotoAttachmentProps {
  photos: FormPhoto[];
  onPhotosChange: (photos: FormPhoto[]) => void;
  bucketName?: string; // default: 'form-attachments'
  maxPhotos?: number;
}

interface FormPhoto {
  url: string;
  caption: string;
  file_name: string;
  uploaded_at: string;
}
```

---

## Technical Approach

| Component | Verdict | Rationale |
|-----------|---------|-----------|
| Storage | Supabase Storage | Built-in, RLS-enabled, no external service needed |
| Upload flow | Client uploads via signed URL | Supabase JS client handles upload, returns public URL |
| Photo data | Stored in JSONB alongside form data | No separate photos table -- keeps form self-contained |
| Component location | `src/components/forms/shared/` | Reusable across forms (NDOT now, potentially others later) |

---

## Testing

Manual verification:
- Upload 1-3 photos with captions during NDOT form fill
- Verify photos appear as thumbnails
- Remove a photo, verify it's gone
- Submit form, verify photo URLs in JSONB payload
- View submitted form, verify photos display in read-only view
