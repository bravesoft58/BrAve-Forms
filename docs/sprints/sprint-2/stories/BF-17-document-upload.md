# BF-17: Document Upload System (Supabase Storage + Documents Tab)

**Sprint:** Sprint 2 - All Forms + Documents + Inspector Portal
**Story Points:** 3
**Priority:** MEDIUM
**Dependencies:** None
**Status:** NOT STARTED
**Created:** 2026-03-09
**Last Updated:** 2026-03-09T16:00:00Z
**Backlog Ref:** Salvage S4-005, S4-006

---

## Summary

Build document upload capability for projects. Andy specified "One section for documents related to the project" -- permits, contracts, maps, plans. Uses Supabase Storage for file storage and the existing Documents tab (currently a placeholder) on the project detail page. Includes upload, categorize, list, download, and delete.

---

## CEO Directives

- "One section for permits. One section for documents related to the project." -- Andy transcript
- Inspector portal should show documents (read-only) -- handled in BF-19
- Categories: Permit, Contract, Map, Plan, Other

---

## Acceptance Criteria

- [ ] Supabase Storage bucket `project-documents` created with RLS policy
- [ ] Documents tab on project detail page shows upload UI (file picker or drag-drop)
- [ ] Category selection dropdown: Permit, Contract, Map, Plan, Other
- [ ] Document list displays: name, category, size, upload date, download link
- [ ] Download links work (signed URLs or public URLs)
- [ ] Admin can delete documents
- [ ] `project_documents` table stores metadata (name, category, file_url, file_size, mime_type, uploaded_by)
- [ ] Empty state: "No documents uploaded yet"
- [ ] File validation: max 25MB, common types (PDF, DOCX, JPG, PNG, XLSX)

---

## Tasks

- [ ] T-17.1: Create Supabase Storage bucket + RLS policy (0.25h)
- [ ] T-17.2: Create `project_documents` table via Supabase migration or direct SQL (0.5h)
- [ ] T-17.3: Create server actions: uploadDocument, deleteDocument (0.5h)
- [ ] T-17.4: Build DocumentsTab client component -- upload, list, download, delete (1.5h)
- [ ] T-17.5: Wire DocumentsTab into ProjectTabs replacing placeholder (0.25h)
- [ ] T-17.6: Test upload/download/delete flow (0.25h)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/projects/DocumentsTab.tsx` | CREATE -- upload + list component (~180 lines) |
| `src/app/dashboard/projects/[id]/actions.ts` | CREATE or MODIFY -- document upload/delete server actions (~60 lines) |
| `src/lib/queries/projects.ts` | MODIFY -- add getProjectDocuments query |
| `src/components/projects/ProjectTabs.tsx` | MODIFY -- replace Documents placeholder with DocumentsTab |

---

## Key Interfaces

```typescript
interface ProjectDocument {
  id: string;
  project_id: string;
  name: string;
  category: 'permit' | 'contract' | 'map' | 'plan' | 'other';
  file_url: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
}
```

---

## Testing

Manual verification:
- Upload PDF document with "Permit" category
- Document appears in list with correct metadata
- Download link works
- Delete removes document from list and storage
- File validation rejects oversized files
