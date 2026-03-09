# BF-14: NDOT Stormwater Read-Only View + Routing (with Photos)

**Sprint:** Sprint 2 - All Forms + Documents + Inspector Portal
**Story Points:** 2
**Priority:** HIGH
**Dependencies:** BF-12, BF-13
**Status:** NOT STARTED
**Created:** 2026-03-09
**Last Updated:** 2026-03-09T16:00:00Z
**Backlog Ref:** Salvage S3-009

---

## Summary

Build the read-only view for submitted NDOT stormwater inspections including attached photos. Follows the dust log view pattern but displays all 3 NDOT sections, 11 BMP categories, dual signatures, and photo gallery.

---

## Acceptance Criteria

- [ ] View page renders all 3 sections of submitted NDOT stormwater form
- [ ] All 11 BMP categories display in table format
- [ ] Conditional fields show values (not show/hide logic -- just display what was submitted)
- [ ] Dual signatures display (Inspector + WPCM)
- [ ] Attached photos display with captions
- [ ] Metadata card shows: report no, form date, submitted at, status badge
- [ ] Submission list in project tab links to view page
- [ ] Back button returns to project form tab

---

## Tasks

- [ ] T-14.1: Build NdotStormwaterView component with photo gallery (~200 lines) (1h)
- [ ] T-14.2: Create view page route (0.5h)
- [ ] T-14.3: Verify end-to-end: submit form with photos -> view shows everything (0.25h)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/app/dashboard/projects/[id]/forms/ndot-stormwater/[submissionId]/page.tsx` | CREATE -- view page (~100 lines) |

---

## Testing

Manual verification:
- Submit NDOT form with photos
- Click submission -> view page shows all data + photos
- Photos display with captions
- Back button works
