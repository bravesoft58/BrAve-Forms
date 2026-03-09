# BF-18: Project Edit Page

**Sprint:** Sprint 2 - All Forms + Documents + Inspector Portal
**Story Points:** 3
**Priority:** MEDIUM
**Dependencies:** None
**Status:** NOT STARTED
**Created:** 2026-03-09
**Last Updated:** 2026-03-09T16:00:00Z
**Backlog Ref:** Salvage S4-009

---

## Summary

Build the project edit page -- same form as project creation but pre-filled with existing data. Users need to update contacts, add/remove permits (which triggers form requirement changes), and modify project details after initial creation. Accessible from project detail page header.

---

## Acceptance Criteria

- [ ] Edit page at /dashboard/projects/[id]/edit
- [ ] All fields pre-filled from existing project data
- [ ] Can update any field (name, address, contacts, site details)
- [ ] Can add/remove permits
- [ ] Permit changes trigger form requirement updates (add/remove form tabs)
- [ ] "Edit Project" button/link on project detail page header
- [ ] Server action validates + updates, redirects back to project detail
- [ ] No data loss on partial update

---

## Tasks

- [ ] T-18.1: Create edit page route, fetch existing project data (0.5h)
- [ ] T-18.2: Refactor project creation form into reusable component (or duplicate with pre-fill) (1h)
- [ ] T-18.3: Create updateProject server action (0.5h)
- [ ] T-18.4: Handle permit changes -> form requirement updates (0.5h)
- [ ] T-18.5: Add "Edit Project" link to project detail header (0.25h)
- [ ] T-18.6: Test update flow end-to-end (0.25h)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/app/dashboard/projects/[id]/edit/page.tsx` | CREATE -- edit page (~40 lines) |
| `src/components/projects/ProjectForm.tsx` | CREATE or MODIFY -- reusable form component |
| `src/app/dashboard/projects/actions.ts` | MODIFY -- add updateProject server action |
| `src/app/dashboard/projects/[id]/page.tsx` | MODIFY -- add "Edit Project" link in header |

---

## Testing

Manual verification:
- Navigate to project, click "Edit Project"
- All existing data pre-filled
- Change a contact field, save
- Verify change persists
- Add a new permit, verify form tab appears
- Remove a permit, verify form tab disappears
