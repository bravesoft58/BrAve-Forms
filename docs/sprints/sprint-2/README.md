# Sprint 2: All Forms + Documents + Inspector Portal

**Sprint Goal:** Build all 4 remaining forms (NDEP Stormwater, NDOT Stormwater, NDEP SAD, NNPH Dust Permit), document uploads, project editing, and inspector QR portal. By sprint end, all 5 Andy-specified forms are functional with read-only views, documents uploadable per project, and inspectors can access everything via QR code.
**Duration:** 2026-03-10 to 2026-03-23
**Capacity:** 48 SP (2 weeks)
**Priority:** CRITICAL -- delivers all core forms and inspector access
**Risk Level:** MEDIUM

---

## CEO Directives Embedded

| Directive | How It's Addressed |
|-----------|--------------------|
| "5 specific Nevada construction forms" | BF-10/11 (NDEP SW), BF-12/13/14 (NDOT SW), BF-15 (SAD), BF-16 (NNPH Dust) complete all 4 remaining forms |
| "One section for documents related to the project" | BF-17 builds document upload + Documents tab |
| "QR code that an inspector could scan" | BF-19 builds full inspector portal |
| "Use the form from the previous day as your baseline" | All new forms inherit "Use Previous" pattern from Sprint 1 |
| "Attach digital photographs of deficiencies" | BF-13 adds photo attachment for NDOT stormwater |

---

## Stories

| Story | Title | SP | Priority | Dependencies | Status |
|-------|-------|----|----------|-------------|--------|
| [BF-09](stories/BF-09-form-infrastructure.md) | Form infrastructure (constants, routes, permit triggers) | 3 | HIGH | None | COMPLETE |
| [BF-10](stories/BF-10-ndep-stormwater-form.md) | NDEP Weekly Stormwater form (3 sections) | 8 | HIGH | BF-09 | COMPLETE |
| [BF-11](stories/BF-11-ndep-stormwater-view.md) | NDEP Stormwater read-only view + routing | 2 | HIGH | BF-10 | COMPLETE |
| [BF-12](stories/BF-12-ndot-stormwater-form.md) | NDOT Weekly Stormwater form (3 sections) | 8 | HIGH | BF-09 | COMPLETE |
| [BF-13](stories/BF-13-ndot-photo-attachment.md) | NDOT photo attachment (Supabase Storage) | 3 | HIGH | BF-12 | COMPLETE |
| [BF-14](stories/BF-14-ndot-stormwater-view.md) | NDOT Stormwater read-only view + routing (with photos) | 2 | HIGH | BF-12, BF-13 | COMPLETE |
| [BF-15](stories/BF-15-ndep-sad-form.md) | NDEP SAD Application form + view | 5 | HIGH | BF-09 | COMPLETE |
| [BF-16](stories/BF-16-nnph-dust-permit-form.md) | NNPH Dust Control Permit form + view | 5 | HIGH | BF-09 | COMPLETE |
| [BF-17](stories/BF-17-document-upload.md) | Document upload system (Supabase Storage + Documents tab) | 3 | MEDIUM | None | COMPLETE |
| [BF-18](stories/BF-18-project-edit.md) | Project edit page | 3 | MEDIUM | None | NOT STARTED |
| [BF-19](stories/BF-19-inspector-qr-portal.md) | Inspector QR Portal | 5 | MEDIUM | BF-11, BF-14, BF-15, BF-16, BF-17 | NOT STARTED |
| [BF-20](stories/BF-20-e2e-verification.md) | E2E verification -- all forms + portal | 1 | MEDIUM | All above | NOT STARTED |
| [BF-21](stories/BF-21-ndot-form-compliance-gaps.md) | NDOT Stormwater form compliance gap fixes | 2 | MEDIUM | BF-12 | NOT STARTED |
| [BF-22](stories/BF-22-ndep-form-compliance-gaps.md) | NDEP Stormwater form compliance gap fixes | 5 | HIGH | BF-10 | NOT STARTED |
| **Total** | | **55** | | | |

---

## Sprint Progress

| Metric | Value |
|--------|-------|
| Stories Complete | 9/14 |
| Story Points Complete | 39/55 (71%) |
| Tests at Sprint Start | 0 (no test suite) |

---

## Execution Order

Stories should be executed in this order based on dependencies and priority:

1. **BF-09** -- Infrastructure first: constants, route maps, permit triggers for all 4 new form types
2. **BF-10** -- NDEP Stormwater form (establishes weekly inspection pattern)
3. **BF-12** -- NDOT Stormwater form (follows NDEP pattern, more complex)
4. **BF-11** -- NDEP view (quick, pattern from dust log view)
5. **BF-13** -- NDOT photo attachment (Supabase Storage setup)
6. **BF-14** -- NDOT view with photos
7. **BF-15** -- NDEP SAD Application (one-time permit form, different pattern)
8. **BF-16** -- NNPH Dust Control Permit (one-time permit form)
9. **BF-17** -- Document upload (independent, can slot earlier if blocking)
10. **BF-18** -- Project edit page (independent, can slot earlier)
11. **BF-19** -- Inspector QR Portal (needs all views done)
12. **BF-20** -- E2E verification (final)

**Parallelization:** After BF-09, stories BF-10/12/15/16 are independent. BF-17 and BF-18 have zero dependencies.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| 48 SP is ambitious for 2 weeks | Schedule slip | Patterns established in Sprint 1; 80% of 60 SP capacity |
| Can't read source PDFs on Windows (pdftoppm unavailable) | Form fields might not match original layout | Andy's salvage plan has detailed field specs for all 5 forms |
| Supabase Storage setup for photos + documents | Blocks BF-13, BF-17 | Well-documented, straightforward bucket + RLS |
| QR Portal is new infrastructure (no token table yet) | BF-19 underestimated | 5 SP includes token gen + validation + public routes |
| NDOT form is the most complex (11 BMPs, conditionals, dual signatures, photos) | BF-12 could exceed 8 SP | NDEP first establishes pattern; NDOT follows same structure |

---

## Research Basis

| Area | Scope | Key Finding |
|------|-------|-------------|
| Form pattern | useActionState + Zod + server actions | Proven in Sprint 1 (dust log). All new forms follow same pattern |
| Storage | Supabase Storage for photos + documents | Bucket + RLS policy, upload via signed URLs |
| Inspector portal | Token-based public access | New qr_tokens table, no auth required, read-only views |
| Form specs | Andy's salvage plan Sections 5.2-5.5 | Complete field specifications for all 4 remaining forms |

---

## Sprint Retrospective

*(Completed at sprint end)*

- [ ] All stories marked COMPLETE or explicitly deferred
- [ ] Velocity calculated and recorded
- [ ] Lessons documented
- [ ] Backlog updated with any new stories discovered

---

**Last Updated:** 2026-03-10T23:15:00Z
