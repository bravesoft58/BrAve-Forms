# Sprint 3 Issues Summary - Quick Reference

**Created:** 2025-10-23
**Updated:** 2025-10-23 (EXPANDED with navigation layer)
**Total Issues:** 38 (ISSUE-076 through ISSUE-113)
**Total Time:** 80 hours
**Sprint Goal:** Complete Forms UI with Navigation (Single-Tenant for Q&D Construction)

## Issue List Overview

### Phase 1: Navigation Layer (8 issues, 14 hours) - NEW

| Issue     | Title                            | Time | Priority | Dependencies      |
| --------- | -------------------------------- | ---- | -------- | ----------------- |
| ISSUE-076 | Create AppShell Layout Component | 2h   | P0       | Sprint 2 complete |
| ISSUE-077 | Build AppHeader Component        | 2h   | P0       | ISSUE-076         |
| ISSUE-078 | Build AppNavbar Component        | 2h   | P0       | ISSUE-077         |
| ISSUE-079 | Build DashboardNav Component     | 2h   | P0       | ISSUE-078         |
| ISSUE-080 | Build UserNav Dropdown           | 1h   | P0       | ISSUE-077         |
| ISSUE-081 | Build OfflineBanner Component    | 1h   | P0       | ISSUE-076         |
| ISSUE-082 | Build PageContainer Component    | 2h   | P0       | ISSUE-076         |
| ISSUE-083 | Build Breadcrumbs Component      | 2h   | P0       | ISSUE-082         |

### Phase 2: Core Pages (6 issues, 12 hours) - NEW

| Issue     | Title                             | Time | Priority | Dependencies     |
| --------- | --------------------------------- | ---- | -------- | ---------------- |
| ISSUE-084 | Build Dashboard Home Page         | 2h   | P0       | Phase 1 complete |
| ISSUE-085 | Build Projects List Page          | 2h   | P0       | ISSUE-084        |
| ISSUE-086 | Build ProjectCard Component       | 1h   | P0       | ISSUE-085        |
| ISSUE-087 | Build Project Detail Page         | 3h   | P0       | ISSUE-086        |
| ISSUE-088 | Build Template Selector Component | 2h   | P0       | ISSUE-087        |
| ISSUE-089 | Build Submitted Forms List        | 2h   | P0       | ISSUE-088        |

### Phase 3: Single-Tenant Simplification (3 issues, 4 hours) - RENUMBERED

| Issue     | Title                             | Time | Priority | Dependencies     |
| --------- | --------------------------------- | ---- | -------- | ---------------- |
| ISSUE-090 | Remove Organization Switching UI  | 1h   | P0       | Phase 2 complete |
| ISSUE-091 | Hard-Code Default Organization ID | 2h   | P0       | ISSUE-090        |
| ISSUE-092 | Simplify Clerk Authentication     | 1h   | P0       | ISSUE-091        |

### Phase 4: Dynamic Form Renderer (6 issues, 15 hours) - RENUMBERED

| Issue     | Title                         | Time | Priority | Dependencies     |
| --------- | ----------------------------- | ---- | -------- | ---------------- |
| ISSUE-093 | Build FormRenderer Component  | 4h   | P0       | Phase 3 complete |
| ISSUE-094 | Implement 15 Field Types      | 5h   | P0       | ISSUE-093        |
| ISSUE-095 | Conditional Display Logic     | 2h   | P1       | ISSUE-094        |
| ISSUE-096 | Computed Fields               | 2h   | P1       | ISSUE-095        |
| ISSUE-097 | Form Validation               | 1h   | P0       | ISSUE-096        |
| ISSUE-098 | Auto-Save Draft Functionality | 1h   | P1       | ISSUE-097        |

### Phase 5: Form Submission Workflow (6 issues, 14 hours) - RENUMBERED

| Issue     | Title                           | Time | Priority | Dependencies     |
| --------- | ------------------------------- | ---- | -------- | ---------------- |
| ISSUE-099 | Mobile Form Filling Page        | 4h   | P0       | Phase 4 complete |
| ISSUE-100 | Web Form Filling Page           | 3h   | P0       | ISSUE-099        |
| ISSUE-101 | Photo Attachment to Form Fields | 2h   | P0       | ISSUE-100        |
| ISSUE-102 | Signature Capture Integration   | 2h   | P0       | ISSUE-101        |
| ISSUE-103 | Form Submission Confirmation    | 1h   | P0       | ISSUE-102        |
| ISSUE-104 | Submission Detail View          | 2h   | P1       | ISSUE-103        |

### Phase 6: Form Cloning (4 issues, 8 hours) - RENUMBERED

| Issue     | Title                         | Time | Priority | Dependencies     |
| --------- | ----------------------------- | ---- | -------- | ---------------- |
| ISSUE-105 | SubmissionCloningService      | 2h   | P1       | Phase 5 complete |
| ISSUE-106 | "Copy Yesterday's Log" Button | 2h   | P1       | ISSUE-105        |
| ISSUE-107 | "Use as Template" Feature     | 2h   | P1       | ISSUE-106        |
| ISSUE-108 | Cloning Workflow Tests        | 2h   | P1       | ISSUE-107        |

### Phase 7: Testing & Polish (5 issues, 12 hours) - RENUMBERED

| Issue     | Title                             | Time | Priority | Dependencies     |
| --------- | --------------------------------- | ---- | -------- | ---------------- |
| ISSUE-109 | Navigation and Pages Unit Tests   | 3h   | P0       | Phase 6 complete |
| ISSUE-110 | Form Renderer Unit Tests          | 3h   | P0       | ISSUE-109        |
| ISSUE-111 | Form Submission Integration Tests | 3h   | P0       | ISSUE-110        |
| ISSUE-112 | E2E Complete User Workflow        | 2h   | P0       | ISSUE-111        |
| ISSUE-113 | Sprint 3 Completion Report        | 1h   | P0       | All complete     |

## Critical Path

**Week 1 Focus (14h):**

- Phase 1: Navigation Layer (ISSUE-076 through ISSUE-083) - 14h
  - Day 1-2: AppShell, AppHeader, AppNavbar (6h)
  - Day 3-4: DashboardNav, UserNav, OfflineBanner (4h)
  - Day 5: PageContainer, Breadcrumbs (4h)

**Week 2 Focus (20h):**

- Phase 2: Core Pages (ISSUE-084 through ISSUE-089) - 12h
  - Day 1-2: Dashboard, Projects List, ProjectCard (5h)
  - Day 3-5: Project Detail, Template Selector, Forms List (7h)
- Phase 3: Single-Tenant (ISSUE-090 through ISSUE-092) - 4h
  - Day 5: Single-tenant simplification (4h)
- Phase 4: Start Renderer (ISSUE-093) - 4h

**Week 3 Focus (20h):**

- Phase 4: Complete Renderer (ISSUE-094 through ISSUE-098) - 11h
  - Day 1-3: 15 field types, conditional logic, computed fields (9h)
  - Day 4: Validation, auto-save (2h)
- Phase 5: Start Submission (ISSUE-099, ISSUE-100) - 7h
- Phase 5: Continue (ISSUE-101) - 2h

**Week 4 Focus (20h):**

- Phase 5: Complete Submission (ISSUE-102 through ISSUE-104) - 5h
- Phase 6: Form Cloning (ISSUE-105 through ISSUE-108) - 8h
- Phase 7: Start Testing (ISSUE-109, ISSUE-110) - 6h

**Week 5 Focus (6h overflow):**

- Phase 7: Complete Testing (ISSUE-111, ISSUE-112, ISSUE-113) - 6h
  - Day 1-2: Integration tests, E2E workflow (5h)
  - Day 3: Sprint completion report (1h)

## Issue Status Tracking

**Last Updated:** 2025-10-23 (Sprint Start - EXPANDED PLAN)

**Completed:** 0/38 issues (0%)
**In Progress:** None
**Not Started:** 38/38 issues (100%)

### Phase Status

- **Phase 1 (Navigation Layer):** 0/8 issues (0%)
- **Phase 2 (Core Pages):** 0/6 issues (0%)
- **Phase 3 (Single-Tenant):** 0/3 issues (0%)
- **Phase 4 (Form Renderer):** 0/6 issues (0%)
- **Phase 5 (Submission Workflow):** 0/6 issues (0%)
- **Phase 6 (Form Cloning):** 0/4 issues (0%)
- **Phase 7 (Testing & Polish):** 0/5 issues (0%)

## Evidence Collection Requirements

Each issue requires evidence in: `docs/sprints/sprint3/evidence/ISSUE-###/`

**Required Folders:**

- test-results/ (red phase → green phase screenshots)
- code/ (implementation screenshots or diffs)
- deployment/ (mobile testing videos, device screenshots)
- performance/ (form rendering times, auto-save performance)

**NEW for Navigation Issues (ISSUE-076 through ISSUE-089):**

- ui-screenshots/ (desktop and mobile navigation screenshots)
- breadcrumb-navigation/ (breadcrumb hierarchy demonstration)
- offline-banner/ (offline/online state screenshots)

## Developer Assignment Recommendation

**Frontend Developer 1 (20 issues, 42 hours):**

- Phase 1: ISSUE-076 through ISSUE-083 (navigation layer)
- Phase 2: ISSUE-084 through ISSUE-089 (core pages)
- Phase 3: ISSUE-090 through ISSUE-092 (single-tenant)

**Frontend Developer 2 (12 issues, 29 hours):**

- Phase 4: ISSUE-093 through ISSUE-098 (form renderer)
- Phase 5: ISSUE-099 through ISSUE-104 (submission workflow)

**Backend Developer (6 issues, 8 hours):**

- Phase 6: ISSUE-105 through ISSUE-108 (cloning service)

**QA Engineer (5 issues, 12 hours):**

- Phase 7: ISSUE-109 through ISSUE-113 (testing & completion)

## Quick Commands Reference

```bash
# Check all issue files exist
ls docs/sprints/sprint3/issues/ISSUE-*.md | wc -l
# Expected: 38 (was 24, added 14 navigation/UI issues)

# Create evidence folder for navigation issue
mkdir -p docs/sprints/sprint3/evidence/ISSUE-076/{test-results,code,ui-screenshots}

# Create evidence folder for form issue
mkdir -p docs/sprints/sprint3/evidence/ISSUE-093/{test-results,code,deployment}

# Run web tests
pnpm --filter web test

# Run backend tests
pnpm --filter backend test

# Deploy to Kubernetes
kubectl rollout restart deployment/web -n braveforms

# Check deployment status
kubectl get all -n braveforms

# View web logs
kubectl logs -f deployment/web -n braveforms
```

## Definition of Done Checklist (Per Issue)

- [ ] Code written and committed to Git
- [ ] Tests written using TDD approach (red → green)
- [ ] Manual testing completed (mobile if applicable)
- [ ] Evidence collected in proper folder structure
- [ ] README or docs updated (if applicable)
- [ ] NO emoji in any files
- [ ] NO AI branding in commits or code
- [ ] Next issue's prerequisites met
- [ ] Hard-coded orgId verified (Phase 3 issues)
- [ ] Mantine v7 components used (navigation issues)

## Sprint Success Criteria

**Must Complete (P0 - 27 issues, 71%):**

- [ ] Navigation layer functional (8 issues - Phase 1)
- [ ] Core pages functional (6 issues - Phase 2)
- [ ] Single-tenant simplification (3 issues - Phase 3)
- [ ] FormRenderer renders 15 field types (2 issues - Phase 4)
- [ ] Form validation functional (1 issue - Phase 4)
- [ ] Mobile and web form filling (2 issues - Phase 5)
- [ ] Photo and signature capture (2 issues - Phase 5)
- [ ] Form submission workflow (1 issue - Phase 5)
- [ ] Test coverage 68% overall (4 issues - Phase 7)

**Should Complete (P1 - 11 issues, 29%):**

- [ ] Conditional logic and computed fields (2 issues - Phase 4)
- [ ] Auto-save draft (1 issue - Phase 4)
- [ ] Submission detail view (1 issue - Phase 5)
- [ ] Form cloning (4 issues - Phase 6)
- [ ] Completion report (1 issue - Phase 7)

## Scope Expansion Summary

**Original Sprint 3 Plan:**

- 24 issues, 52 hours
- Focus: FormRenderer + Submission + Cloning only
- Gap: NO navigation (users can't reach forms)

**Expanded Sprint 3 Plan:**

- 38 issues, 80 hours (+14 issues, +28 hours)
- Added: Navigation Layer (8 issues, 14h)
- Added: Core Pages (6 issues, 12h)
- Rationale: Users must be able to navigate TO forms before filling them

**Impact:**

- Sprint extended from 4 weeks to 5 weeks (1 week overflow)
- Risk: Medium-High (increased scope, but clear requirements)
- Confidence: 75% (navigation components are simple, using Mantine AppShell)

## Parallel Work Opportunities

**After ISSUE-077 (AppHeader):**

- Can run ISSUE-080 (UserNav) and ISSUE-081 (OfflineBanner) in parallel

**After ISSUE-078 (AppNavbar):**

- Can run ISSUE-079 (DashboardNav) and ISSUE-082 (PageContainer) in parallel

**During Phase 7:**

- ISSUE-109 (nav tests) and ISSUE-110 (renderer tests) can run in parallel
- ISSUE-111 (integration tests) can start before ISSUE-110 completes

---

**Last Updated:** 2025-10-23 (EXPANDED PLAN)
**Next Review:** Daily standup
**Maintained By:** Project Manager Agent

## Completed Evidence Links

(Will be populated as issues complete)

**Phase 1 (Navigation Layer) Evidence:**

- ISSUE-076: (Pending - AppShell)
- ISSUE-077: (Pending - AppHeader)
- ISSUE-078: (Pending - AppNavbar)
- ISSUE-079: (Pending - DashboardNav)
- ISSUE-080: (Pending - UserNav)
- ISSUE-081: (Pending - OfflineBanner)
- ISSUE-082: (Pending - PageContainer)
- ISSUE-083: (Pending - Breadcrumbs)

**Phase 2 (Core Pages) Evidence:**

- ISSUE-084: (Pending - Dashboard)
- ISSUE-085: (Pending - Projects List)
- ISSUE-086: (Pending - ProjectCard)
- ISSUE-087: (Pending - Project Detail)
- ISSUE-088: (Pending - Template Selector)
- ISSUE-089: (Pending - Forms List)

**Phase 3-7 Evidence:** (Pending - ISSUE-090 through ISSUE-113)
