# BF-11: NDEP Stormwater Read-Only View + Routing

**Sprint:** Sprint 2 - All Forms + Documents + Inspector Portal
**Story Points:** 2
**Priority:** HIGH
**Dependencies:** BF-10
**Status:** COMPLETE
**Created:** 2026-03-09
**Completed:** 2026-03-09T22:35:00Z
**Last Updated:** 2026-03-09T22:35:00Z
**Backlog Ref:** Salvage S3-004

---

## Summary

Build the read-only view for submitted NDEP stormwater inspections and wire up the view route. Follows the same pattern as the dust log view page -- displays all 3 sections in a clean, printable layout with metadata card and status badge.

---

## Acceptance Criteria

- [x] View page renders all 3 sections of a submitted NDEP stormwater form
- [x] Control measures display as a clean table (name, implemented, maintenance, notes)
- [x] Corrective actions table displays with completion status
- [x] Metadata card shows: permit info, form date, submitted at, status badge
- [x] No edit controls in view mode
- [x] Submission list in project tab links to view page (clickable)
- [x] Back button returns to project form tab

---

## Tasks

- [x] T-11.1: Build NdepStormwaterView component (~150 lines) (1h)
- [x] T-11.2: Create view page at /dashboard/projects/[id]/forms/ndep-stormwater/[submissionId] (0.5h)
- [x] T-11.3: Verify clickable submissions in project tab work (0.25h)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/app/dashboard/projects/[id]/forms/ndep-stormwater/[submissionId]/page.tsx` | CREATE -- view page (~80 lines) |

---

## Testing

Manual verification:
- Submit NDEP stormwater form
- Click submission in project tab -> view page renders correctly
- All 16 control measures display
- Corrective actions display
- Back button works

## Comprehensive Validation (2026-03-09T22:35:00Z)

Verified 9.5/10 in fresh session. TypeScript + Next.js build clean. All 7 AC met.

| # | Test | Result | Key Finding |
|---|------|--------|-------------|
| 1 | Tier 1 pattern scan (10 patterns) | PASS | 0 blockers |
| 2 | TypeScript type check | PASS | Zero errors |
| 3 | Next.js production build | PASS | Route registered as dynamic |
| 4 | Hostile code review (6 lenses) | PASS | 1 Tier 2 warning (statusBadge duplication) |
| 5 | Merge integrity check | PASS | Implementation file confirmed on master |
