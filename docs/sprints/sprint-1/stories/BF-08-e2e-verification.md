# BF-08: End-to-End Verification

**Sprint:** Sprint 1 - Foundation + First Form
**Story Points:** 1
**Priority:** MEDIUM
**Dependencies:** BF-01 through BF-07
**Status:** NOT STARTED
**Created:** 2026-03-05
**Last Updated:** 2026-03-05T00:00:00Z
**Backlog Ref:** Andy Salvage Plan Section 14 (Verification Criteria), Salvage Sprint S2-010

---

## Summary

Run through the complete end-to-end workflow that proves Sprint 1 delivers on its goal. Create a project with permits, fill out a dust log, view the completed log, and use "Use Previous" for the next entry. This is the first 10 of Andy's 14-step verification criteria -- remaining steps (user assignment, QR portal, etc.) will be verified in future sprints.

---

## Acceptance Criteria

- [ ] Step 1: Admin creates project with all fields + selects SAD and Dust Control permits
- [ ] Step 2: Permits auto-trigger Daily Dust Log as required form
- [ ] Step 3: Project detail page shows Dust Log tab
- [ ] Step 4: Admin opens Dust Log tab -> clicks "New Entry" -> project data auto-fills header
- [ ] Step 5: Admin fills dust log entry with multiple observations, submits
- [ ] Step 6: Submitted entry appears in form log history
- [ ] Step 7: Admin clicks submitted entry -> read-only view renders correctly
- [ ] Step 8: Admin starts new dust log -> clicks "Use Previous" -> data pre-fills, date/time cleared
- [ ] Step 9: No console errors throughout entire flow
- [ ] Step 10: Data persists correctly in Supabase (verify via Table Editor)

---

## Tasks

- [ ] T-08.1: Execute full workflow and document results (0.5h)
- [ ] T-08.2: Fix any bugs discovered during verification (0.5h)

---

## Files to Modify

| File | Change |
|------|--------|
| None | This is a verification story -- no new code unless bugs found |

---

## Testing

This IS the test. Document pass/fail for each step above.
