# BF-20: E2E Verification -- All Forms + Portal

**Sprint:** Sprint 2 - All Forms + Documents + Inspector Portal
**Story Points:** 1
**Priority:** MEDIUM
**Dependencies:** BF-09 through BF-19
**Status:** NOT STARTED
**Created:** 2026-03-09
**Last Updated:** 2026-03-09T16:00:00Z
**Backlog Ref:** Salvage S3-010 + S4-010 combined

---

## Summary

Full end-to-end verification of Sprint 2 deliverables. Tests both stormwater forms, both permit application forms, document uploads, project editing, and the inspector QR portal. Covers steps 1-14 of Andy's verification criteria (Section 14 of ANDY_SALVAGE_PLAN.md) that are achievable by this sprint.

---

## Acceptance Criteria

- [ ] Step 1: Admin creates project with all fields + selects SAD, Dust Control, NDEP Stormwater, NDOT Stormwater permits
- [ ] Step 2: Permits auto-trigger correct forms (Dust Log, NDEP SW, NDOT SW, NDEP SAD, NNPH Dust)
- [ ] Step 3: Project detail shows all form tabs + Permits + Documents
- [ ] Step 4: Admin fills and submits NDEP Stormwater form (all 3 sections)
- [ ] Step 5: Admin fills and submits NDOT Stormwater form with photo attachments
- [ ] Step 6: Admin fills and submits NDEP SAD Application
- [ ] Step 7: Admin fills and submits NNPH Dust Control Permit
- [ ] Step 8: All submitted forms appear in form log history
- [ ] Step 9: Click any submission -> read-only view renders correctly
- [ ] Step 10: "Use Previous" works on weekly forms (NDEP SW, NDOT SW)
- [ ] Step 11: Admin uploads document to project, visible in Documents tab
- [ ] Step 12: Admin edits project (update contact, add permit)
- [ ] Step 13: Admin generates QR code, inspector portal shows forms + docs + permits
- [ ] Step 14: No console errors throughout entire flow
- [ ] Data persists correctly in Supabase

---

## Tasks

- [ ] T-20.1: Execute full workflow and document results (0.5h)
- [ ] T-20.2: Fix any bugs discovered during verification (0.5h)

---

## Files to Modify

| File | Change |
|------|--------|
| `docs/sprints/sprint-2/BF-20-verification-results.md` | CREATE -- verification results log |

---

## Testing

This IS the test. Document pass/fail for each step above. Use browser automation for thorough testing where possible.
