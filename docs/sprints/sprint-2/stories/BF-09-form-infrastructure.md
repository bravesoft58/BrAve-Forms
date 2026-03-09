# BF-09: Form Infrastructure (Constants, Routes, Permit Triggers)

**Sprint:** Sprint 2 - All Forms + Documents + Inspector Portal
**Story Points:** 3
**Priority:** HIGH
**Dependencies:** None
**Status:** COMPLETE
**Created:** 2026-03-09
**Completed:** 2026-03-09T18:45:00Z
**Last Updated:** 2026-03-09T18:45:00Z
**Backlog Ref:** Salvage S3 + S4 shared infrastructure

---

## Summary

Wire all 4 new form types into the existing infrastructure: constants, labels, route maps, permit-to-form triggers, and Zod schema stubs. After this story, the project detail page shows tabs for all form types when the right permits are selected, and the routing is ready for form/view pages.

---

## Acceptance Criteria

- [x] `FormType` in permits.ts includes: `ndep_weekly_stormwater`, `ndot_weekly_stormwater`, `ndep_sad_application`, `nnph_dust_permit`
- [x] `FORM_LABELS` has human-readable labels for all 4 new types
- [x] `PERMIT_FORM_MAP` maps stormwater_ndot -> ndot_weekly_stormwater, stormwater_ndep -> ndep_weekly_stormwater
- [x] `FORM_ROUTE_MAP` in ProjectTabs.tsx and forms/page.tsx includes route slugs for all 4 new form types
- [x] Project detail page shows correct form tabs when stormwater permits are selected
- [x] Forms index page (/dashboard/forms) renders new form type labels correctly
- [x] No TypeScript errors, `pnpm build` succeeds

---

## Tasks

- [x] T-09.1: Update `src/lib/constants/permits.ts` -- already had all entries (pre-existing from BF-01) [Completed: 2026-03-09T17:30:00Z]
- [x] T-09.2: Update `FORM_ROUTE_MAP` in ProjectTabs.tsx and forms/page.tsx (0.25h) [Completed: 2026-03-09T17:35:00Z]
- [x] T-09.3: Route directories deferred to form-specific stories (BF-10 through BF-13) [Completed: 2026-03-09T17:35:00Z]
- [x] T-09.4: Create Zod schemas for all 4 forms in `src/lib/schemas/` (1h) [Completed: 2026-03-09T18:00:00Z]
- [x] T-09.5: Verified permit-to-form mapping in permits.ts PERMIT_FORM_MAP [Completed: 2026-03-09T18:10:00Z]
- [x] T-09.6: Build and verify no errors -- tsc + pnpm build clean [Completed: 2026-03-09T18:15:00Z]

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/constants/permits.ts` | MODIFY -- add 4 FormType values, labels, permit map entries |
| `src/components/projects/ProjectTabs.tsx` | MODIFY -- add FORM_ROUTE_MAP entries |
| `src/app/dashboard/forms/page.tsx` | MODIFY -- add FORM_ROUTE_MAP entries |
| `src/lib/schemas/ndep-stormwater.ts` | CREATE -- Zod schema + types (~80 lines) |
| `src/lib/schemas/ndot-stormwater.ts` | CREATE -- Zod schema + types (~100 lines) |
| `src/lib/schemas/ndep-sad.ts` | CREATE -- Zod schema + types (~60 lines) |
| `src/lib/schemas/nnph-dust-permit.ts` | CREATE -- Zod schema + types (~70 lines) |

---

## Technical Approach

| Component | Verdict | Rationale |
|-----------|---------|-----------|
| Constants | Extend existing | permits.ts already has the pattern |
| Route maps | Extend existing | FORM_ROUTE_MAP pattern from dust log |
| Zod schemas | New files per form | Match dust-log.ts pattern |
| Permit triggers | Extend PERMIT_FORM_MAP | Server action already reads this map |

---

## Testing

Manual verification:
- Create project with NDEP + NDOT stormwater permits
- Verify correct form tabs appear on project detail
- Verify Forms index page shows correct labels
- `pnpm build` succeeds with no errors

---

## Comprehensive Validation (2026-03-09T18:45:00Z)

Verified 9.8/10. 6 files, 498 insertions. tsc + pnpm build clean.

| # | Check | Result | Key Finding |
|---|-------|--------|-------------|
| 1 | Tier 1 pattern scan | PASS | 0 blockers across all patterns |
| 2 | TypeScript type check | PASS | tsc --noEmit clean |
| 3 | Production build | PASS | 14/14 pages generated |
| 4 | Schema completeness | PASS | All 4 forms cover every section from Nevada PDFs |
| 5 | Route map consistency | PASS | Both FORM_ROUTE_MAP instances match |
| 6 | Acceptance criteria | PASS | 7/7 MET |
| 7 | Merge integrity | PASS | All 4 .ts files verified on master via git ls-tree |
