# BF-21: NDOT Stormwater Form — Compliance Gap Fixes

**Sprint:** Backlog (Sprint 3 candidate)
**Story Points:** 2
**Priority:** MEDIUM
**Dependencies:** BF-12
**Status:** NOT STARTED
**Created:** 2026-03-10
**Last Updated:** 2026-03-10
**Source:** `Testing/form-compliance-comparison-2026-03-10.md` — field-by-field comparison against Form 018-001WPCM

---

## Summary

Fix 3 gaps identified in the NDOT stormwater inspection form when compared field-by-field against the official NDOT Form 018-001WPCM. Current match rate is ~85%; these fixes bring it to ~98%.

---

## Acceptance Criteria

- [ ] `inspection_time` field added to schema and form (Section 1, next to inspection_date)
- [ ] `illicit_discharge_action` free-text field added, visible when `illicit_discharges` = "Y" (Section 3)
- [ ] BMP Required column supports N/A option in addition to Y/N (schema change: `z.enum(["Y", "N", "NA"])`)
- [ ] Existing submissions still render correctly (backward compatible — new fields optional)
- [ ] View page displays new fields when present

---

## Tasks

- [ ] T-21.1: Add `inspection_time` to schema + Section 1 form UI (0.5h)
- [ ] T-21.2: Add `illicit_discharge_action` to schema + Section 3 conditional field (0.5h)
- [ ] T-21.3: Change BMP `required` field from `z.enum(YN)` to `z.enum(YN_NA)` in schema + update radio/select UI (0.5h)
- [ ] T-21.4: Update NDOT view component to display new fields (0.25h)
- [ ] T-21.5: Verify existing submissions still load without errors (0.25h)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/schemas/ndot-stormwater.ts` | Add `inspection_time`, `illicit_discharge_action`; change BMP required to YN_NA |
| `src/components/forms/ndot-stormwater/Section1.tsx` | Add time input next to date |
| `src/components/forms/ndot-stormwater/Section3.tsx` | Add conditional illicit discharge action field |
| `src/components/forms/ndot-stormwater/Section2.tsx` | Add N/A option to BMP Required column |
| NDOT view component (TBD, created in BF-14) | Display new fields |

---

## Gap Reference

From `Testing/form-compliance-comparison-2026-03-10.md`:

| Gap ID | Description | Severity |
|--------|-------------|----------|
| G1 | Missing `inspection_time` field | Medium |
| G2 | Missing "action taken" for illicit discharge | Medium |
| G3 | BMP Required column lacks N/A option | Low |

---

## Testing

Manual verification:
- New NDOT form shows time field in Section 1
- Setting `illicit_discharges` to Y reveals action text field
- BMP Required column shows Y/N/NA options
- Submit form with new fields, verify data saved correctly
- Load an existing (pre-fix) submission — no errors
