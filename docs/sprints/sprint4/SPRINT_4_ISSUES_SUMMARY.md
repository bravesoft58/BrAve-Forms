# Sprint 4 Issues Summary - Quick Reference

**Created:** 2025-10-23
**Total Issues:** 24 (ISSUE-100 through ISSUE-123)
**Total Time:** 50 hours
**Sprint Goal:** QR Inspector Portal & Q&D Agency Templates (100% coverage)

## Issue List Overview

### Phase 1: QR Inspector Portal (6 issues, 12 hours)

| Issue     | Title                              | Time | Priority | Dependencies      |
| --------- | ---------------------------------- | ---- | -------- | ----------------- |
| ISSUE-100 | Time-Limited QR Token Generation   | 2h   | P0       | Sprint 3 complete |
| ISSUE-101 | Inspector Portal Layout            | 3h   | P0       | ISSUE-100         |
| ISSUE-102 | Project-Level QR Code Display      | 1h   | P0       | ISSUE-101         |
| ISSUE-103 | Form Submission Viewer (Read-Only) | 2h   | P0       | ISSUE-102         |
| ISSUE-104 | Photo Gallery Viewer               | 2h   | P1       | ISSUE-103         |
| ISSUE-105 | QR Portal Tests                    | 2h   | P0       | ISSUE-104         |

### Phase 2: Q&D Agency-Specific Templates (12 issues, 24 hours)

| Issue     | Title                         | Time | Priority | Dependencies     | Source PDF                               |
| --------- | ----------------------------- | ---- | -------- | ---------------- | ---------------------------------------- |
| ISSUE-106 | NDEP BWPC SWPPP Template      | 3h   | P0       | Phase 1 complete | NDEP BWPC SWPPP Template.pdf             |
| ISSUE-107 | NDOT SWPPP Template           | 3h   | P0       | ISSUE-106        | NDOT SWPPP Template.pdf                  |
| ISSUE-108 | NDEP Weekly Stormwater Log    | 2h   | P0       | ISSUE-107        | NDEP Weekly Stormwater Log.pdf           |
| ISSUE-109 | NDOT Weekly Stormwater Logs   | 2h   | P0       | ISSUE-108        | NDOT Weekly Stormwater Logs.pdf          |
| ISSUE-110 | TMWA Inspection Checklist     | 3h   | P0       | ISSUE-109        | Inspection Checklist TMWA.pdf            |
| ISSUE-111 | Quarterly Visual Assessment   | 2h   | P0       | ISSUE-110        | Quarterly Visual Assessment Fillable.pdf |
| ISSUE-112 | Visual Assessment Report      | 2h   | P0       | ISSUE-111        | Visual_Assessment_Report Fillable.pdf    |
| ISSUE-113 | Routine Facility Inspection   | 2h   | P0       | ISSUE-112        | Routine Facility Inspection Fillable.pdf |
| ISSUE-114 | Daily Dust Logs               | 2h   | P0       | ISSUE-113        | Daily Dust Logs.pdf                      |
| ISSUE-115 | Validate All Templates        | 1h   | P0       | ISSUE-114        | N/A (runs validation script)             |
| ISSUE-116 | Seed All Q&D Templates        | 1h   | P0       | ISSUE-115        | N/A (runs seed script)                   |
| ISSUE-117 | Template Documentation Update | 1h   | P1       | ISSUE-116        | N/A (updates README.md)                  |

### Phase 3: Testing & Polish (6 issues, 14 hours)

| Issue     | Title                      | Time | Priority | Dependencies     |
| --------- | -------------------------- | ---- | -------- | ---------------- |
| ISSUE-118 | QR Portal E2E Tests        | 3h   | P0       | Phase 2 complete |
| ISSUE-119 | Template Rendering Tests   | 3h   | P0       | ISSUE-118        |
| ISSUE-120 | Cross-Browser Testing      | 2h   | P1       | ISSUE-119        |
| ISSUE-121 | Mobile Device Testing      | 3h   | P0       | ISSUE-120        |
| ISSUE-122 | Performance Optimization   | 2h   | P1       | ISSUE-121        |
| ISSUE-123 | Sprint 4 Completion Report | 1h   | P0       | All complete     |

## Critical Path

**Week 1 Focus:**

- ISSUE-100, 101, 102 (QR portal foundation - Day 1-3)
- ISSUE-103, 104, 105 (Inspector features + tests - Day 4-5)

**Week 2 Focus:**

- ISSUE-106, 107 (Complex SWPPP templates - Day 1-2)
- ISSUE-108, 109, 110 (Weekly logs + TMWA - Day 3-5)

**Week 3 Focus:**

- ISSUE-111, 112, 113, 114 (Visual assessments + facility + dust - Day 1-3)
- ISSUE-115, 116, 117 (Validation + seeding + docs - Day 4)
- ISSUE-118 (E2E tests - Day 5)

**Week 4 Focus:**

- ISSUE-119, 120, 121 (Template tests + cross-browser + mobile - Day 1-3)
- ISSUE-122, 123 (Performance + completion report - Day 4)

## Issue Status Tracking

**Last Updated:** 2025-11-26

**Completed:** 19/25 issues (76%) - includes ISSUE-105.5 integration work
**In Progress:** None
**Not Started:** 6/25 issues (24%)

### Phase Status

- **Phase 1 (QR Portal):** 6/6 issues (100%) - COMPLETE
- **Integration (ISSUE-105.5):** 1/1 issues (100%) - COMPLETE
- **Phase 2 (Agency Templates):** 12/12 issues (100%) - COMPLETE
- **Phase 3 (Testing):** 0/6 issues (0%)

### Completed Issues

| Issue       | Title                                         | Completed  |
| ----------- | --------------------------------------------- | ---------- |
| ISSUE-100   | Time-Limited QR Token Generation              | 2025-11-26 |
| ISSUE-101   | Inspector Portal Layout                       | 2025-11-26 |
| ISSUE-102   | Project-Level QR Code Display                 | 2025-11-26 |
| ISSUE-103   | Form Submission Viewer (Read-Only)            | 2025-11-26 |
| ISSUE-104   | Photo Gallery Viewer                          | 2025-11-26 |
| ISSUE-105   | QR Portal Tests                               | 2025-11-26 |
| ISSUE-105.5 | Web UI Integration & Template Rendering Fixes | 2025-11-26 |
| ISSUE-106   | NDEP BWPC SWPPP Template                      | 2025-11-26 |
| ISSUE-107   | NDOT SWPPP Template                           | 2025-11-26 |
| ISSUE-108   | NDEP Weekly Stormwater Log                    | 2025-11-26 |
| ISSUE-109   | NDOT Weekly Stormwater Logs                   | 2025-11-26 |
| ISSUE-110   | TMWA Inspection Checklist                     | 2025-11-26 |
| ISSUE-111   | Quarterly Visual Assessment                   | 2025-11-26 |
| ISSUE-112   | Visual Assessment Report                      | 2025-11-26 |
| ISSUE-113   | Routine Facility Inspection                   | 2025-11-26 |
| ISSUE-114   | Daily Dust Logs                               | 2025-11-26 |
| ISSUE-115   | Validate All Templates                        | 2025-11-26 |
| ISSUE-116   | Seed All Q&D Templates                        | 2025-11-26 |
| ISSUE-117   | Template Documentation Update                 | 2025-11-26 |

## Evidence Collection Requirements

Each issue requires evidence in: `docs/sprints/sprint4/evidence/ISSUE-###/`

**Required Folders:**

- test-results/ (red phase → green phase screenshots)
- code/ (implementation screenshots or diffs)
- deployment/ (QR portal screenshots, template rendering)
- performance/ (Lighthouse scores, load times)

## Developer Assignment Recommendation

**Frontend Developer 1 (10 issues, 22 hours):**

- Phase 1: ISSUE-100 through ISSUE-105 (QR portal)
- Phase 3: ISSUE-118, ISSUE-119 (E2E tests)
- Phase 3: ISSUE-120, ISSUE-121 (cross-browser, mobile)

**Backend Developer 1 (6 issues, 12 hours):**

- Phase 2: ISSUE-106, ISSUE-107 (NDEP/NDOT SWPPP)
- Phase 2: ISSUE-110 (TMWA)
- Phase 2: ISSUE-115, ISSUE-116, ISSUE-117 (validation, seeding, docs)

**Backend Developer 2 (6 issues, 11 hours):**

- Phase 2: ISSUE-108, ISSUE-109 (NDEP/NDOT Weekly)
- Phase 2: ISSUE-111, ISSUE-112, ISSUE-113, ISSUE-114 (Visual assessments, facility, dust)

**Project Manager (2 issues, 5 hours):**

- Phase 3: ISSUE-122 (performance optimization)
- Phase 3: ISSUE-123 (completion report)

## Quick Commands Reference

```bash
# Check all issue files exist
ls docs/sprints/sprint4/issues/ISSUE-*.md | wc -l
# Expected: 24

# Create evidence folder for specific issue
mkdir -p docs/sprints/sprint4/evidence/ISSUE-100/{test-results,code,deployment}

# Run template validation
pnpm --filter backend validate:templates

# Seed templates to database
pnpm --filter backend seed:templates

# Run web tests
pnpm --filter web test

# Run backend tests
pnpm --filter backend test

# Deploy to Kubernetes
kubectl rollout restart deployment/web -n braveforms
kubectl rollout restart deployment/backend -n braveforms

# Check deployment status
kubectl get all -n braveforms
```

## Definition of Done Checklist (Per Issue)

- [ ] Code written and committed to Git
- [ ] Tests written using TDD approach (red → green)
- [ ] Manual testing completed (QR portal if applicable)
- [ ] Evidence collected in proper folder structure
- [ ] README or docs updated (if applicable)
- [ ] NO emoji in any files
- [ ] NO AI branding in commits or code
- [ ] Next issue's prerequisites met
- [ ] QR token expiration verified (Phase 1 issues)
- [ ] Template validation passing (Phase 2 issues)

## Sprint Success Criteria

**Must Complete (P0 - 18 issues):**

- [ ] QR portal functional (5 issues)
- [ ] All 9 agency templates created (9 issues)
- [ ] All 15 templates validated and seeded (2 issues)
- [ ] E2E tests passing (2 issues)

**Should Complete (P1 - 6 issues):**

- [ ] Photo gallery viewer (1 issue)
- [ ] Cross-browser testing (1 issue)
- [ ] Performance optimization (1 issue)
- [ ] Template documentation (1 issue)
- [ ] Mobile device testing (1 issue)
- [ ] Completion report (1 issue)

---

**Last Updated:** 2025-10-23
**Next Review:** Daily standup
**Maintained By:** Project Manager Agent

## Q&D Construction Template Coverage Tracker

| Template ID | Template Name                | Status    | Sprint   | PDF Source                               |
| ----------- | ---------------------------- | --------- | -------- | ---------------------------------------- |
| 1           | Daily Inspection Log         | EXISTS    | Sprint 2 | N/A (generic)                            |
| 2           | Weekly Stormwater Log        | EXISTS    | Sprint 2 | N/A (generic)                            |
| 3           | Monthly SWPPP Inspection     | EXISTS    | Sprint 2 | N/A (generic)                            |
| 4           | BMP Maintenance Log          | EXISTS    | Sprint 2 | N/A (generic)                            |
| 5           | Erosion Control Daily Report | EXISTS    | Sprint 2 | N/A (generic)                            |
| 6           | Safety Inspection Checklist  | EXISTS    | Sprint 2 | N/A (generic)                            |
| 7           | NDEP BWPC SWPPP Template     | ISSUE-106 | Sprint 4 | NDEP BWPC SWPPP Template.pdf             |
| 8           | NDOT SWPPP Template          | ISSUE-107 | Sprint 4 | NDOT SWPPP Template.pdf                  |
| 9           | NDEP Weekly Stormwater Log   | ISSUE-108 | Sprint 4 | NDEP Weekly Stormwater Log.pdf           |
| 10          | NDOT Weekly Stormwater Logs  | ISSUE-109 | Sprint 4 | NDOT Weekly Stormwater Logs.pdf          |
| 11          | TMWA Inspection Checklist    | ISSUE-110 | Sprint 4 | Inspection Checklist TMWA.pdf            |
| 12          | Quarterly Visual Assessment  | ISSUE-111 | Sprint 4 | Quarterly Visual Assessment Fillable.pdf |
| 13          | Visual Assessment Report     | ISSUE-112 | Sprint 4 | Visual_Assessment_Report Fillable.pdf    |
| 14          | Routine Facility Inspection  | ISSUE-113 | Sprint 4 | Routine Facility Inspection Fillable.pdf |
| 15          | Daily Dust Logs              | ISSUE-114 | Sprint 4 | Daily Dust Logs.pdf                      |

**Coverage:**

- Before Sprint 4: 6/15 templates (40%)
- After Sprint 4: 15/15 templates (100%)

## Completed Evidence Links

### Phase 1: QR Inspector Portal (COMPLETE)

- **ISSUE-100:** Backend QRTokenService - 77 tests passing
- **ISSUE-101:** Inspector portal layout - Mobile-optimized
- **ISSUE-102:** ProjectQRCode component - QR generation modal
- **ISSUE-103:** SubmissionViewer component - Read-only
- **ISSUE-104:** PhotoGalleryViewer component - Lightbox with GPS
- **ISSUE-105:** QR Portal Tests - 77 tests across all components

### Integration Work (COMPLETE)

- **ISSUE-105.5:** Web UI Integration & Template Rendering Fixes
  - Fixed Zod schema generation bug ("s.max is not a function")
  - Fixed GraphQL endpoint configuration
  - Verified 21 templates load and render
  - Evidence: `.playwright-mcp/ndot-swppp-form-*.png`
  - Details: [ISSUE-105.5.md](issues/ISSUE-105.5.md)

### Phase 2: Q&D Agency Templates (COMPLETE)

**ISSUE-106 through ISSUE-117: Nevada Agency-Specific Templates** - COMPLETE

- **Templates Created:** 20 JSON template files (packages/database/templates/)
- **Tests Passing:** 236 template tests
- **Code Review:** 11 compliance.agency fields fixed per code review findings
- **Templates Include:**
  - NDEP BWPC SWPPP (12-ndep-bwpc-swppp.json)
  - NDOT SWPPP (13-ndot-swppp.json)
  - NDEP Weekly Stormwater Log (14-ndep-weekly-stormwater-log.json)
  - NDOT Weekly Stormwater Logs (15-ndot-weekly-stormwater-logs.json)
  - TMWA Inspection Checklist (16-tmwa-inspection-checklist.json)
  - Quarterly Visual Assessment (17-quarterly-visual-assessment.json)
  - Visual Assessment Report (18-visual-assessment-report.json)
  - Routine Facility Inspection (19-routine-facility-inspection.json)
  - Daily Dust Logs (20-daily-dust-logs.json)
- **Compliance Agency Fields Added:** All 11 templates missing agency field fixed
  - Internal: 01, 02, 06, 09
  - OSHA: 03, 04, 05, 08
  - ACI: 07
  - EPA: 10
  - Nevada DEP / Clark County: 11
- **Evidence:** Template validation passing, tests passing in CI
