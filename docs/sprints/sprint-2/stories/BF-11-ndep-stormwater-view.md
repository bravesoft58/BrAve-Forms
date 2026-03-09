# BF-11: NDEP Stormwater Read-Only View + Routing

**Sprint:** Sprint 2 - All Forms + Documents + Inspector Portal
**Story Points:** 2
**Priority:** HIGH
**Dependencies:** BF-10
**Status:** NOT STARTED
**Created:** 2026-03-09
**Last Updated:** 2026-03-09T16:00:00Z
**Backlog Ref:** Salvage S3-004

---

## Summary

Build the read-only view for submitted NDEP stormwater inspections and wire up the view route. Follows the same pattern as the dust log view page -- displays all 3 sections in a clean, printable layout with metadata card and status badge.

---

## Acceptance Criteria

- [ ] View page renders all 3 sections of a submitted NDEP stormwater form
- [ ] Control measures display as a clean table (name, implemented, maintenance, notes)
- [ ] Corrective actions table displays with completion status
- [ ] Metadata card shows: permit info, form date, submitted at, status badge
- [ ] No edit controls in view mode
- [ ] Submission list in project tab links to view page (clickable)
- [ ] Back button returns to project form tab

---

## Tasks

- [ ] T-11.1: Build NdepStormwaterView component (~150 lines) (1h)
- [ ] T-11.2: Create view page at /dashboard/projects/[id]/forms/ndep-stormwater/[submissionId] (0.5h)
- [ ] T-11.3: Verify clickable submissions in project tab work (0.25h)

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
