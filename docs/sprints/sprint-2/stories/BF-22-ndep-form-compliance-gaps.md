# BF-22: NDEP Stormwater Form — Compliance Gap Fixes

**Sprint:** Backlog (Sprint 3 candidate)
**Story Points:** 5
**Priority:** HIGH
**Dependencies:** BF-10
**Status:** NOT STARTED
**Created:** 2026-03-10
**Last Updated:** 2026-03-10
**Source:** `Testing/form-compliance-comparison-2026-03-10.md` — field-by-field comparison against NDEP Construction Site Inspection Checklist

---

## Summary

Fix 9 gaps identified in the NDEP stormwater inspection form when compared field-by-field against the official NDEP Construction Site Inspection Checklist (from `Dev Notes/NDEP Weekly Stormwater Log.pdf`). Current match rate is ~65%; these fixes bring it to ~95%. The highest-priority fix is the control measures list, which has 3 missing items and 1 extra item vs. the official form.

---

## Acceptance Criteria

### Control Measures (G8 — HIGH priority)
- [ ] Control measures list updated to match official NDEP checklist exactly (16 items):
  1. Silt Fence
  2. Straw Wattles/Fiber Rolls
  3. Check Dams ← **ADD**
  4. Sediment Basins/Traps ← **ADD**
  5. Inlet Protection
  6. Stabilized Construction Entrance/Exit
  7. Concrete Washout Area
  8. Portable Sanitation
  9. Vehicle/Equipment Fueling Area
  10. Vehicle/Equipment Wash Area ← **ADD**
  11. Material/Stockpile Management
  12. Spill Prevention & Control
  13. Solid Waste Management
  14. Hazardous Waste Management
  15. Dewatering Operations
  16. Paving & Grinding Operations
- [ ] "Illicit Connection/Discharge" removed from control measures (not on official form)
- [ ] "Effective?" (Y/N) column added to control measures table (G9)

### Weather & Site Conditions
- [ ] Weather field changed from single-select to multi-select checkbox (G4)
- [ ] "Active discharges at time of inspection?" (Y/N) field added to Site Conditions (G5)

### SWPPP Elements
- [ ] "NOI posted on-site?" (Y/N) field added to SWPPP section (G6)
- [ ] "SWPPP amendments needed based on this inspection?" (Y/N + notes) field added (G7)

### Stabilization Section
- [ ] Add compliance questions above the stabilization methods table (G10):
  - "Are inactive areas (no activity >14 days) temporarily stabilized?" (Y/N)
  - "Are finished areas permanently stabilized?" (Y/N)
- [ ] Keep existing stabilization methods table below compliance questions (useful supplementary data)

### Certification
- [ ] Add "Inspector Title/Qualifications" text field (G11)
- [ ] Add "Owner/Operator Reviewer" signature + date fields (G12)

### Backward Compatibility
- [ ] All new fields are optional in schema (existing submissions must still load)
- [ ] View page displays new fields when present, omits gracefully when absent

---

## Tasks

- [ ] T-22.1: Update `NDEP_CONTROL_MEASURES` constant to match official 16 items (0.5h)
- [ ] T-22.2: Add `effective` column to `controlMeasureSchema` — `z.enum(YN).optional()` (0.5h)
- [ ] T-22.3: Update control measures table UI — add "Effective?" column (0.5h)
- [ ] T-22.4: Change `weather` from single enum to multi-select array (schema + UI) (0.5h)
- [ ] T-22.5: Add `active_discharges` field (Y/N) to schema + Site Conditions section (0.25h)
- [ ] T-22.6: Add `noi_posted` and `swppp_amendments_needed` + `swppp_amendments_notes` to schema + SWPPP section (0.5h)
- [ ] T-22.7: Add stabilization compliance questions above methods table (0.5h)
- [ ] T-22.8: Add `inspector_title`, `reviewer_name`, `reviewer_date` to certification section (0.5h)
- [ ] T-22.9: Update NDEP view component to display all new fields (0.5h)
- [ ] T-22.10: Verify existing NDEP submissions still load without errors (0.25h)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/schemas/ndep-stormwater.ts` | Update control measures list, add `effective` to control measure schema, change weather to array, add new fields |
| `src/components/forms/ndep-stormwater/Section1.tsx` | Weather → multi-select, add active discharges field |
| `src/components/forms/ndep-stormwater/Section2.tsx` | Update control measures table (items + Effective column), add SWPPP fields |
| `src/components/forms/ndep-stormwater/Section3.tsx` | Add stabilization compliance questions, add certification fields |
| `src/app/dashboard/projects/[id]/forms/ndep-stormwater/[submissionId]/page.tsx` | Display new fields in view |

---

## Gap Reference

From `Testing/form-compliance-comparison-2026-03-10.md`:

| Gap ID | Description | Severity |
|--------|-------------|----------|
| G4 | Weather single-select → multi-select | Medium |
| G5 | Missing "active discharges at time of inspection" | Medium |
| G6 | Missing "NOI posted on-site?" | Low |
| G7 | Missing "SWPPP amendments needed?" | Low |
| G8 | Control measures list mismatches official form | **High** |
| G9 | Missing "Effective?" column on control measures | Medium |
| G10 | Stabilization section structural mismatch | Medium |
| G11 | Missing inspector qualifications | Low |
| G12 | Missing owner/operator review signature | Medium |

---

## Testing

Manual verification:
- New NDEP form shows updated 16 control measures (verify Check Dams, Sediment Basins/Traps, Vehicle/Equipment Wash Area present; Illicit Connection/Discharge gone)
- Control measures table has 3 columns: Implemented / Maintenance Needed / Effective
- Weather allows multiple selections
- SWPPP section shows NOI posted + amendments needed questions
- Stabilization section has compliance questions above methods table
- Certification has title field + reviewer signature
- Submit form, verify all new data saved
- Load existing (pre-fix) submission — no errors, new fields show as empty/N/A
