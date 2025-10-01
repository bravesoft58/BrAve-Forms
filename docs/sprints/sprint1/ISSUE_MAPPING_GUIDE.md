# Sprint 1 Issue Mapping Guide - Atomic Breakdown

**Created:** 2025-10-01 12:30:00 EDT
**Purpose:** Master mapping of original issues to atomic tasks
**Status:** Ready for implementation

---

## Quick Reference: Old vs New

| Original Issue | Time | New Atomic Issues | Total Time | Status |
|---------------|------|-------------------|------------|--------|
| ISSUE-001 through ISSUE-012 | 6-8h | (No change, already atomic) | 6-8h | COMPLETE |
| ISSUE-013: WeatherDashboard | 1h | ISSUE-013, 014, 015 | 45min | Split 3 ways |
| ISSUE-014: OrganizationDashboard | 1h | ISSUE-016, 017, 018 | 45min | Split 3 ways |
| ISSUE-015: ProjectSelector | 1h | ISSUE-019, 020, 021 | 45min | Split 3 ways |
| ISSUE-016: NOAA Client | 2h | ISSUE-022 through 027 | 2h | Split 6 ways |
| ISSUE-017: 0.25" Threshold | 2h | ISSUE-028 through 032 | 2h | Split 5 ways |
| ISSUE-018: Redis Caching | 1h | ISSUE-033, 034 | 1h | Split 2 ways |
| ISSUE-019: PWA Config | 2h | ISSUE-035 through 038 | 1.5h | Split 4 ways |
| ISSUE-020: Test Coverage | 3h | ISSUE-039 through 046 | 2.5h | Split 8 ways |

**Total:** 20 original issues → 46 atomic tasks (same time budget)

---

## Complete Atomic Task List

### Phase 0-2: Infrastructure (Already Complete)
- ISSUE-001: Port Conflict Check (10 min) - COMPLETE
- ISSUE-002: Verify Container Images (15 min) - COMPLETE
- ISSUE-003: Configure Environment Secrets (30 min) - COMPLETE
- ISSUE-004: Create Kubernetes Secrets (15 min) - COMPLETE
- ISSUE-005: Deploy PostgreSQL (30 min) - COMPLETE
- ISSUE-006: Deploy Redis and MinIO (20 min) - COMPLETE
- ISSUE-007: Run Prisma Migrations (30 min) - COMPLETE
- ISSUE-008: Create Seed Script (45 min) - COMPLETE
- ISSUE-009: Deploy Backend (30 min) - COMPLETE
- ISSUE-010: Test Backend GraphQL (30 min) - COMPLETE
- ISSUE-011: Remove Apollo Dependencies (30 min) - COMPLETE
- ISSUE-012: Create TanStack Query Setup (1 hour) - COMPLETE

### Phase 3: Apollo Removal - WeatherDashboard (45 min total)
- **ISSUE-013: Create Weather API Helper (15 min)** - NEW ATOMIC
  - File: `apps/web/lib/api/weather.ts`
  - Objective: GraphQL fetch helper function
  - Evidence: Code screenshot

- **ISSUE-014: Add TanStack Query to WeatherDashboard (20 min)** - NEW ATOMIC
  - File: `apps/web/components/WeatherDashboard.tsx`
  - Objective: Replace Apollo with TanStack
  - Evidence: Before/after code screenshot

- **ISSUE-015: Test WeatherDashboard Offline Mode (10 min)** - NEW ATOMIC
  - File: Browser DevTools
  - Objective: Verify offline caching works
  - Evidence: Screenshot of offline mode working

### Phase 3: Apollo Removal - OrganizationDashboard (45 min total)
- **ISSUE-016: Create Organizations API Helper (15 min)** - NEW ATOMIC
  - File: `apps/web/lib/api/organizations.ts`
  - Objective: GraphQL fetch helper for orgs
  - Evidence: Code screenshot

- **ISSUE-017: Convert OrganizationDashboard to TanStack Query (20 min)** - NEW ATOMIC
  - File: `apps/web/components/OrganizationDashboard.tsx`
  - Objective: Replace Apollo with TanStack
  - Evidence: Before/after code screenshot

- **ISSUE-018: Test OrganizationDashboard Rendering (10 min)** - NEW ATOMIC
  - File: Browser
  - Objective: Verify organizations list displays
  - Evidence: Screenshot of working page

### Phase 3: Apollo Removal - ProjectSelector (45 min total)
- **ISSUE-019: Create Projects API Helper (15 min)** - NEW ATOMIC
  - File: `apps/web/lib/api/projects.ts`
  - Objective: GraphQL fetch helper for projects
  - Evidence: Code screenshot

- **ISSUE-020: Convert ProjectSelector to TanStack Query (20 min)** - NEW ATOMIC
  - File: `apps/web/components/ProjectSelector.tsx`
  - Objective: Replace Apollo with TanStack
  - Evidence: Before/after code screenshot

- **ISSUE-021: Verify Web Build Succeeds (10 min)** - NEW ATOMIC
  - File: Terminal
  - Objective: Confirm Apollo fully removed, build passes
  - Evidence: Build success screenshot

### Phase 4: Weather API - NOAA Client (2 hours total)
- **ISSUE-022: Research NOAA API Documentation (20 min)** - NEW ATOMIC
  - File: `docs/sprints/sprint1/research/NOAA_API_NOTES.md`
  - Objective: Document API endpoints and usage
  - Evidence: Research notes

- **ISSUE-023: Create NOAA Client TypeScript Types (15 min)** - NEW ATOMIC
  - File: `apps/backend/src/modules/weather/types/noaa.types.ts`
  - Objective: Define interfaces for NOAA responses
  - Evidence: Code screenshot

- **ISSUE-024: Implement getStationForCoordinates (20 min)** - NEW ATOMIC
  - File: `apps/backend/src/modules/weather/clients/noaa.client.ts`
  - Objective: Fetch nearest weather station
  - Evidence: Code screenshot

- **ISSUE-025: Implement getPrecipitation (25 min)** - NEW ATOMIC
  - File: `apps/backend/src/modules/weather/clients/noaa.client.ts`
  - Objective: Fetch precipitation data for date range
  - Evidence: Code screenshot

- **ISSUE-026: Add NOAA Client Error Handling (20 min)** - NEW ATOMIC
  - File: `apps/backend/src/modules/weather/clients/noaa.client.ts`
  - Objective: Add try-catch and HTTP error checks
  - Evidence: Code screenshot

- **ISSUE-027: Test NOAA Client with Real API Call (20 min)** - NEW ATOMIC
  - File: `apps/backend/src/modules/weather/clients/noaa.client.spec.ts`
  - Objective: Integration test with actual NOAA API
  - Evidence: Passing test screenshot

### Phase 4: Weather API - 0.25" Threshold Detection (2 hours total)
- **ISSUE-028: Create Precipitation Accumulation Function (20 min)** - NEW ATOMIC
  - File: `apps/backend/src/modules/weather/utils/precipitation.utils.ts`
  - Objective: Calculate 24-hour rolling window
  - Evidence: Code screenshot with EPA citation

- **ISSUE-029: Create 0.25" Threshold Check Function (15 min)** - NEW ATOMIC
  - File: `apps/backend/src/modules/weather/utils/precipitation.utils.ts`
  - Objective: Detect EXACTLY 0.25" per EPA CGP
  - Evidence: Code screenshot with exact threshold

- **ISSUE-030: Create Inspection Deadline Calculator (25 min)** - NEW ATOMIC
  - File: `apps/backend/src/modules/weather/utils/inspection.utils.ts`
  - Objective: Calculate 24-hour working hours deadline
  - Evidence: Code screenshot with working hours logic

- **ISSUE-031: Write Unit Tests for Threshold Detection (30 min)** - NEW ATOMIC
  - File: `apps/backend/src/modules/weather/utils/precipitation.utils.spec.ts`
  - Objective: Test EXACTLY 0.25" threshold
  - Evidence: Passing tests (red → green)

- **ISSUE-032: Write Unit Tests for Inspection Deadline (20 min)** - NEW ATOMIC
  - File: `apps/backend/src/modules/weather/utils/inspection.utils.spec.ts`
  - Objective: Test weekend/working hours logic
  - Evidence: Passing tests screenshot

### Phase 4: Weather API - Redis Caching (1 hour total)
- **ISSUE-033: Add Redis Caching to Weather Service (30 min)** - NEW ATOMIC
  - File: `apps/backend/src/modules/weather/weather.service.ts`
  - Objective: Cache precipitation data with 6-hour TTL
  - Evidence: Code screenshot

- **ISSUE-034: Test Redis Cache Hit/Miss (30 min)** - NEW ATOMIC
  - File: `apps/backend/src/modules/weather/weather.service.spec.ts`
  - Objective: Verify cache hit/miss scenarios
  - Evidence: Passing tests screenshot

### Phase 5: PWA Configuration (1.5 hours total)
- **ISSUE-035: Install PWA Dependencies (10 min)** - NEW ATOMIC
  - File: `apps/web/package.json`
  - Objective: Add next-pwa package
  - Evidence: package.json screenshot

- **ISSUE-036: Create PWA Manifest File (20 min)** - NEW ATOMIC
  - File: `apps/web/public/manifest.json`
  - Objective: Define PWA metadata
  - Evidence: manifest.json code

- **ISSUE-037: Configure Next.js PWA Plugin (30 min)** - NEW ATOMIC
  - File: `apps/web/next.config.js`
  - Objective: Enable service worker with caching
  - Evidence: Config code screenshot

- **ISSUE-038: Test PWA Offline Mode with Lighthouse (30 min)** - NEW ATOMIC
  - File: Chrome DevTools
  - Objective: Verify PWA score >80
  - Evidence: Lighthouse score screenshot

### Phase 6: Test Coverage (2.5 hours total)
- **ISSUE-039: Write Tests for NOAA Client (reuse ISSUE-027)** - COMPLETE
  - Already done in ISSUE-027 integration tests

- **ISSUE-040: Write Tests for Precipitation Utils (reuse ISSUE-031)** - COMPLETE
  - Already done in ISSUE-031 unit tests

- **ISSUE-041: Write Tests for Inspection Utils (reuse ISSUE-032)** - COMPLETE
  - Already done in ISSUE-032 unit tests

- **ISSUE-042: Write Tests for Weather Service (25 min)** - NEW ATOMIC
  - File: `apps/backend/src/modules/weather/weather.service.spec.ts`
  - Objective: Test service with mocked dependencies
  - Evidence: Passing tests screenshot

- **ISSUE-043: Write Tests for Weather Resolver (20 min)** - NEW ATOMIC
  - File: `apps/backend/src/modules/weather/weather.resolver.spec.ts`
  - Objective: Test GraphQL resolver
  - Evidence: Passing tests screenshot

- **ISSUE-044: Write Tests for Organization Resolver (20 min)** - NEW ATOMIC
  - File: `apps/backend/src/modules/organizations/organizations.resolver.spec.ts`
  - Objective: Test organizations resolver
  - Evidence: Passing tests screenshot

- **ISSUE-045: Write Tests for Project Resolver (20 min)** - NEW ATOMIC
  - File: `apps/backend/src/modules/projects/projects.resolver.spec.ts`
  - Objective: Test projects resolver with orgId filtering
  - Evidence: Passing tests screenshot

- **ISSUE-046: Run Full Coverage Report (15 min)** - NEW ATOMIC
  - File: Terminal
  - Objective: Generate and verify 40% coverage target
  - Evidence: Coverage report screenshot

---

## Implementation Strategy

### For Project Managers:
1. Review atomic breakdown with team
2. Create GitHub issues for ISSUE-013 through ISSUE-046
3. Assign 2-3 issues per day to junior developers
4. Daily standups to track progress (46 checkpoints vs 20)
5. Evidence review at end of each day

### For Junior Developers:
1. Pick next sequential issue (ISSUE-013, then ISSUE-014, etc.)
2. Read issue file completely before starting
3. Follow step-by-step instructions EXACTLY
4. Collect evidence BEFORE marking complete
5. Ask for help if stuck after 10 minutes
6. Move to next issue (don't skip ahead)

### For Tech Leads:
1. Review evidence daily
2. Approve completed issues
3. Provide guidance on blocked issues
4. Ensure TDD workflow (tests BEFORE implementation)
5. Verify EPA compliance accuracy (ISSUE-028, 029)

---

## Time Management

**Realistic Daily Schedule for Junior Developer (4 hours/day):**

**Week 1:**
- Monday: ISSUE-013 through ISSUE-018 (3 hours)
- Tuesday: ISSUE-019 through ISSUE-024 (3.5 hours)
- Wednesday: ISSUE-025 through ISSUE-030 (3.5 hours)
- Thursday: ISSUE-031 through ISSUE-034 (2 hours)
- Friday: ISSUE-035 through ISSUE-038 (1.5 hours)

**Week 2:**
- Monday: ISSUE-042 through ISSUE-046 (2 hours)
- Review and documentation (remaining time)

**Total:** ~16 hours actual work time (realistic for 2-week sprint with meetings, blockers, etc.)

---

## Quality Gates

**Before marking any issue complete:**
- [ ] All steps in issue file completed
- [ ] Evidence collected in correct folder
- [ ] Code compiles without errors (if code changes)
- [ ] Tests pass (if test changes)
- [ ] No emoji in any files
- [ ] No AI branding in commits
- [ ] Next issue's prerequisites verified

**Sprint completion criteria:**
- [ ] All 46 issues completed
- [ ] All evidence folders populated
- [ ] Web build succeeds
- [ ] Backend tests pass
- [ ] Coverage report shows 40%+
- [ ] PWA Lighthouse score >80
- [ ] EPA 0.25" threshold EXACT

---

## Risk Management

**Common Junior Developer Blockers:**

1. **TypeScript compilation errors** → Solution: Ask tech lead immediately
2. **GraphQL query format confusion** → Solution: Copy EXACTLY from issue file
3. **Docker/Kubernetes issues** → Solution: Use provided scripts, don't improvise
4. **Test writing difficulties** → Solution: Start with simplest test, add complexity later
5. **Evidence collection unclear** → Solution: Screenshot examples in each issue file

**Escalation Path:**
- Stuck >10 minutes → Ask peer developer
- Stuck >30 minutes → Ask tech lead
- Blocker preventing next issue → Escalate to project manager

---

## Success Metrics

**Individual Issue Success:**
- Task completed in estimated time ±5 minutes
- Evidence collected meeting quality standards
- Zero rework needed
- Next issue can start immediately

**Sprint Success:**
- 100% of issues completed (46/46)
- 100% of evidence collected (46 folders)
- Zero critical bugs introduced
- Web build and backend tests passing
- Coverage target met (40%)
- PWA functional (Lighthouse >80)
- EPA compliance exact (0.25")

---

**Document Status:** APPROVED FOR IMPLEMENTATION
**Next Action:** Create individual issue files for ISSUE-013 through ISSUE-046
**Estimated Time to Create Issues:** 2-3 hours (46 detailed issue files)
**Assigned To:** Project Manager
**Due Date:** 2025-10-01 18:00:00 EDT

---

**Remember:**
- Each issue is 15-30 minutes for junior developers
- NO emoji in code/commits/documentation
- Evidence-based completion only (real systems, no mocks)
- TDD approach: tests FIRST, then implementation
- 0.25" threshold EXACTLY per EPA CGP 2022 Section 4.4
