# BF-18: Project Edit Page

**Sprint:** Sprint 2 - All Forms + Documents + Inspector Portal
**Story Points:** 3
**Priority:** MEDIUM
**Dependencies:** None
**Status:** COMPLETE
**Created:** 2026-03-09
**Completed:** 2026-03-10T17:00:00Z
**Last Updated:** 2026-03-10T17:00:00Z
**Backlog Ref:** Salvage S4-009

---

## Summary

Build the project edit page -- same form as project creation but pre-filled with existing data. Users need to update contacts, add/remove permits (which triggers form requirement changes), and modify project details after initial creation. Accessible from project detail page header.

---

## Acceptance Criteria

- [x] Edit page at /dashboard/projects/[id]/edit
- [x] All fields pre-filled from existing project data
- [x] Can update any field (name, address, contacts, site details)
- [x] Can add/remove permits
- [x] Permit changes trigger form requirement updates (add/remove form tabs)
- [x] "Edit Project" button/link on project detail page header
- [x] Server action validates + updates, redirects back to project detail
- [x] No data loss on partial update

---

## Tasks

- [x] T-18.1: Create edit page route, fetch existing project data (0.5h)
- [x] T-18.2: Refactor project creation form into reusable component (or duplicate with pre-fill) (1h)
- [x] T-18.3: Create updateProject server action (0.5h)
- [x] T-18.4: Handle permit changes -> form requirement updates (0.5h)
- [x] T-18.5: Add "Edit Project" link to project detail header (0.25h)
- [x] T-18.6: Test update flow end-to-end (0.25h)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/app/dashboard/projects/[id]/edit/page.tsx` | CREATE -- edit page (41 lines) |
| `src/components/projects/project-form.tsx` | MODIFY -- accept action/defaults/existingPermits props (286 lines) |
| `src/app/dashboard/projects/actions.ts` | MODIFY -- add updateProject + buildProjectFields + deriveFormTypes (227 lines) |
| `src/app/dashboard/projects/[id]/page.tsx` | MODIFY -- add "Edit Project" link in header (79 lines) |

---

## Testing

Manual verification:
- Navigate to project, click "Edit Project"
- All existing data pre-filled
- Change a contact field, save
- Verify change persists
- Add a new permit, verify form tab appears
- Remove a permit, verify form tab disappears

---

## Comprehensive Validation (2026-03-10T17:00:00Z)

Verified 9.6/10. 1 issue found and fixed.

| # | Test | Result | Key Finding |
|---|------|--------|-------------|
| 1 | Pattern scan (Tier 1) | PASS | Zero blockers across all 4 files |
| 2 | Code duplication check | FIXED | createProject had inline field mapping duplicating buildProjectFields — refactored |
| 3 | Security (auth + validation) | PASS | Auth check + Zod validation on both actions |
| 4 | Permit sync logic | PASS | Delete-all + re-insert with auto_permit filter |
| 5 | Build verification | PASS | Zero TypeScript errors |
| 6 | AC verification | PASS | All 8 ACs MET |
