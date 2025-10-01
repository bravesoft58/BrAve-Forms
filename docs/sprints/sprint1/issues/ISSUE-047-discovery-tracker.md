# ISSUE-047: Discovery Tracker - New Issues Uncovered During Sprint 1

**Status:** TRACKING
**Priority:** HIGH (contains critical blockers)
**Estimated Time:** N/A (coordination issue)
**Phase:** Continuous
**Dependencies:** All Sprint 1 issues
**Created:** 2025-10-01

---

## Purpose

This issue serves as a centralized tracker for new issues, blockers, and technical debt discovered during Sprint 1 implementation. Items tracked here will be:

1. Prioritized and assigned to future sprints
2. Converted to formal GitHub issues
3. Integrated into project planning
4. Tracked until resolution

**Why This Exists:** Real implementation always uncovers issues not visible during planning. This prevents discoveries from being forgotten.

---

## Critical Blockers (Must Resolve Before Production)

### BLOCKER-001: TanStack Query Version Mismatch
- **Discovered During:** ISSUE-012 (TanStack Query Setup)
- **Issue:** Package.json specifies ^5.14.2, actually running 5.86.0 (72 minor versions jump)
- **Risk:** Breaking changes in minor versions, unpredictable production behavior
- **Action Required:**
  - Option A: Lock to exact 5.86.0 (tested version)
  - Option B: Validate compatibility with 5.14.2-5.86.0 range (2-4 hours)
- **Recommendation:** Lock to 5.86.0 (safer, faster)
- **Assigned Sprint:** Sprint 2
- **GitHub Issue:** [TBD]
- **Evidence Location:** docs/sprints/sprint1/evidence/ISSUE-012/deployment/

### BLOCKER-002: Valtio Store Hard Dependency
- **Discovered During:** ISSUE-012 (TanStack Query Setup)
- **Issue:** Query client at apps/web/lib/query/client.ts has hard dependency on Valtio store
- **Required Exports:**
  ```typescript
  appActions.addToOfflineQueue()  // Used in mutation error handling
  appActions.setSyncStatus()      // Used in mutation success
  appActions.setNetworkStatus()   // Used in online/offline detection
  ```
- **Risk:** Runtime failures if store missing or exports incomplete
- **Action Required:**
  1. Verify store exists at apps/web/lib/store/app.store.ts
  2. Create integration tests for query client + store
  3. Add pre-deployment verification
- **Assigned Sprint:** Sprint 2
- **GitHub Issue:** [TBD]
- **Evidence Location:** docs/sprints/sprint1/evidence/ISSUE-012/deployment/

### BLOCKER-003: iOS IndexedDB Storage Transience (CRITICAL for EPA Compliance)
- **Discovered During:** ISSUE-012 (TanStack Query Setup)
- **Issue:** IndexedDB is transient on iOS - OS may reclaim storage when device is low on space
- **Risk:** Loss of critical compliance data (inspections, photos, audit trails)
- **Compliance Impact:** EPA requires 3-year record retention, data loss = $25k-$50k/day fines
- **Action Required:**
  1. Migrate critical compliance data to SQLite (@capacitor-community/sqlite)
  2. Keep IndexedDB for cache/performance data only
  3. Test 7-day offline persistence on iOS
  4. Verify data integrity after iOS storage reclaim
- **Assigned Sprint:** Sprint 5 (ISSUE-040 scope expansion)
- **GitHub Issue:** [TBD]
- **Evidence Location:** docs/sprints/sprint1/evidence/ISSUE-012/deployment/
- **CLAUDE.md Reference:** iOS Storage Persistence section (CRITICAL warning)

### BLOCKER-004: WeatherAlert Missing Authentication ✅ RESOLVED
- **Discovered During:** ISSUE-015 (Weather Dashboard conversion)
- **Issue:** WeatherAlert.tsx fetcher function doesn't include Clerk JWT token in headers
- **Risk:** All requests rejected by ClerkAuthGuard, multi-tenant orgId filtering fails
- **Security Impact:** Broken authentication = security vulnerability
- **Resolution Date:** 2025-10-01
- **Resolution:**
  1. Added Clerk `getToken()` from useAuth hook
  2. Modified fetchPendingInspections to accept token parameter
  3. Added `Authorization: Bearer ${token}` header to fetch requests
  4. Updated queryFn to async call getToken() and pass to fetcher
- **Code Changes:**
  - apps/web/components/Weather/WeatherAlert.tsx (lines 20-26, 58-71)
- **Evidence Location:** docs/sprints/sprint1/evidence/ISSUE-015/deployment/homepage-after-blocker-fixes.png

### BLOCKER-005: WeatherAlert GraphQL Schema Mismatch ✅ RESOLVED
- **Discovered During:** ISSUE-015 (Weather Dashboard conversion)
- **Issue:** Query requests fields (type, dueDate, rainEvent) that don't exist in backend schema
- **Risk:** Runtime GraphQL errors, component breaks
- **Resolution Date:** 2025-10-01
- **Resolution:**
  1. Removed non-existent fields: type, dueDate, rainEvent
  2. Updated query to use only 9 fields from WeatherEvent schema:
     - id, projectId, precipitationInches, eventDate, inspectionDeadline
     - inspectionCompleted, source, notificationsSent, createdAt
  3. Verified against apps/backend/src/schema.gql (lines 11-21)
- **Code Changes:**
  - apps/web/components/Weather/WeatherAlert.tsx (lines 27-42)
- **Evidence Location:** docs/sprints/sprint1/evidence/ISSUE-015/deployment/homepage-after-blocker-fixes.png

### BLOCKER-006: Hardcoded API URLs Throughout Codebase ✅ RESOLVED
- **Discovered During:** ISSUE-014, ISSUE-015 (Apollo removal)
- **Issue:** Multiple components use `http://localhost:30101/graphql` hardcoded
- **Risk:** Production deployment fails, no environment configuration
- **Resolution Date:** 2025-10-01
- **Resolution:**
  1. Updated .env.local: NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:30101/graphql
  2. Updated all fetcher functions to use: `process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:30101/graphql'`
  3. Provides fallback for development, configurable for production
- **Files Updated:**
  - apps/web/.env.local (line 13)
  - apps/web/components/Weather/WeatherAlert.tsx (line 21)
  - apps/web/components/Weather/WeatherDashboard.tsx (lines 50, 78)
  - apps/web/components/Organization/OrganizationProvider.tsx (line 13)
  - apps/web/components/Organization/OrganizationDashboard.tsx (line 41)
  - apps/web/lib/api/weather.ts (line 6)
- **Evidence Location:** docs/sprints/sprint1/evidence/ISSUE-015/deployment/homepage-after-blocker-fixes.png

### BLOCKER-007: Dashboard Pre-rendering Fails with Clerk useAuth
- **Discovered During:** ISSUE-020 (ProjectSelector conversion), ISSUE-021 (build verification)
- **Issue:** Next.js 14 attempts to pre-render /dashboard page, but Clerk useAuth requires runtime
- **Current State:** `export const dynamic = 'force-dynamic'` in client component doesn't prevent pre-rendering
- **Error:** `@clerk/clerk-react: useAuth can only be used within the <ClerkProvider /> component`
- **Build Impact:** Webpack compilation succeeds, but export fails with exit code 1
- **Resolution Date:** [PENDING]
- **Documented In:** WEB_FRONTEND_STATUS.md
- **Root Cause:** Known Next.js + Clerk integration issue in App Router
- **Action Required:**
  1. Research Next.js 14 App Router dynamic rendering patterns
  2. Options: Dynamic imports, route groups, middleware redirect, or remove pre-rendering entirely
  3. Test solution doesn't break Clerk authentication flow
  4. Verify build succeeds with exit code 0
- **Files Affected:**
  - apps/web/app/dashboard/page.tsx (uses ProjectSelector → useAuth)
  - Any page using Clerk hooks in App Router
- **Assigned Sprint:** Sprint 1 (immediate - blocks ISSUE-021)
- **Priority:** P0 (blocks build completion)
- **GitHub Issue:** [TBD]
- **Evidence Location:** docs/sprints/sprint1/evidence/ISSUE-020/ (build error logs)

---

## Production Monitoring Requirements (Must Implement Before Launch)

### MONITOR-001: localStorage Quota Tracking
- **Discovered During:** ISSUE-012
- **Implementation:** Alert at 80% capacity
- **Priority:** HIGH
- **Assigned Sprint:** Sprint 3
- **GitHub Issue:** [TBD]

### MONITOR-002: IndexedDB Size Monitoring
- **Discovered During:** ISSUE-012
- **Implementation:** Track storage growth, cleanup old data
- **Priority:** MEDIUM
- **Assigned Sprint:** Sprint 3
- **GitHub Issue:** [TBD]

### MONITOR-003: Offline Queue Health Checks
- **Discovered During:** ISSUE-012
- **Implementation:** Alert on queue size growth (indicates sync failures)
- **Priority:** HIGH
- **Assigned Sprint:** Sprint 3
- **GitHub Issue:** [TBD]

### MONITOR-004: Network Event Listener Leak Detection
- **Discovered During:** ISSUE-012
- **Implementation:** Detect listeners not cleaned up on unmount
- **Priority:** MEDIUM
- **Assigned Sprint:** Sprint 3
- **GitHub Issue:** [TBD]

---

## Documentation Gaps (To Be Addressed)

### DOC-001: GraphQL Schema Documentation Mismatch
- **Discovered During:** ISSUE-010 (GraphQL API Testing)
- **Issue:** ISSUE-010 documentation references `organizations` query that doesn't exist in schema
- **Actual Schema:** Uses `projects` query instead
- **Action Required:** Update ISSUE-010 documentation
- **Priority:** LOW
- **Assigned Sprint:** Sprint 2
- **GitHub Issue:** [TBD]

### DOC-002: Backend API Documentation Out of Date
- **Discovered During:** ISSUE-010 (GraphQL API Testing)
- **Issue:** No current GraphQL schema documentation
- **Action Required:** Generate API documentation from schema
- **Priority:** MEDIUM
- **Assigned Sprint:** Sprint 2
- **GitHub Issue:** [TBD]

---

## Technical Debt (Non-Blocking but Important)

### DEBT-001: Duplicate Query Client Implementations
- **Discovered During:** ISSUE-012 (TanStack Query Setup)
- **Issue:** Created duplicate query-client.ts before discovering existing implementation
- **Resolution:** Deleted duplicate, consolidated to lib/query/client.ts
- **Status:** RESOLVED
- **Lesson Learned:** Always search codebase before creating new implementations

### DEBT-002: networkMode Configuration Was Wrong
- **Discovered During:** ISSUE-012 (TanStack Query Setup, Code Review)
- **Issue:** Existing implementation had `networkMode: 'online'` instead of `'offlineFirst'`
- **Impact:** Violated CLAUDE.md 30-day offline requirement
- **Resolution:** Changed to `networkMode: 'offlineFirst'` in queries and mutations
- **Status:** RESOLVED
- **Lesson Learned:** Always validate existing code against requirements, don't assume it's correct

### UX-001: Homepage Has Poor Visual Design
- **Discovered During:** ISSUE-015 (Playwright MCP testing)
- **Issue:** Homepage displays with oversized text, poor layout, unprofessional appearance
- **Impact:** Poor first impression, not production-ready UI
- **Visual Problems:**
  - Oversized heading text
  - Poor spacing and alignment
  - Generic placeholder content
  - Construction-themed emoji in heading (violates CLAUDE.md NO emoji rule)
- **Action Required:**
  1. Redesign homepage with proper typography hierarchy
  2. Remove emoji from heading (CLAUDE.md violation)
  3. Professional layout with Mantine v7 components
  4. Construction-industry appropriate branding
  5. Mobile-responsive design (glove-friendly touch targets)
- **Priority:** MEDIUM (not a blocker, but impacts brand perception)
- **Assigned Sprint:** Sprint 2 (UX improvements)
- **GitHub Issue:** [TBD]
- **Evidence:** .playwright-mcp/issue-015-homepage-success.png

---

## Future Sprint Assignment Strategy

### Sprint 2 (Immediate - Backend/Web Focus)
- BLOCKER-001: Version lock
- BLOCKER-002: Valtio store tests
- DOC-001: GraphQL schema docs
- DOC-002: API documentation

### Sprint 3 (Monitoring & Infrastructure)
- MONITOR-001: localStorage quota
- MONITOR-002: IndexedDB size
- MONITOR-003: Offline queue health
- MONITOR-004: Listener leak detection

### Sprint 5 (Mobile Focus - iOS Critical)
- BLOCKER-003: iOS SQLite migration (CRITICAL for compliance)
- Test 7-day iOS offline persistence
- Verify EPA compliance data integrity

---

## How to Use This Tracker

### When You Discover a New Issue:

1. **Add it to this document** in the appropriate section:
   - Critical Blockers: Must fix before production
   - Monitoring Requirements: Observability needs
   - Documentation Gaps: Missing or incorrect docs
   - Technical Debt: Non-blocking improvements

2. **Include Required Information:**
   - Discovered During: Which issue uncovered this
   - Issue: Clear description
   - Risk: Impact if not addressed
   - Action Required: What needs to happen
   - Assigned Sprint: Target resolution sprint
   - GitHub Issue: [TBD] until created

3. **Update Sprint Planning:** Add to relevant sprint plan

4. **Create GitHub Issue:** Convert to trackable issue with assignment

5. **Link Evidence:** Reference completion reports, deployment docs

### When You Resolve an Issue:

1. Update status to RESOLVED
2. Document resolution approach
3. Add "Lesson Learned" section
4. Link to evidence/PR
5. Move to "Resolved" section at bottom

---

## Resolved Issues (Historical Record)

### DEBT-001: Duplicate Query Client (RESOLVED 2025-10-01)
- **Issue:** Created duplicate apps/web/lib/query-client.ts
- **Resolution:** Deleted duplicate, used existing lib/query/client.ts
- **Evidence:** ISSUE-012 completion report
- **Lesson:** Always search codebase first

### DEBT-002: Wrong networkMode Configuration (RESOLVED 2025-10-01)
- **Issue:** networkMode: 'online' violated offline-first requirement
- **Resolution:** Changed to 'offlineFirst' in queries and mutations
- **Evidence:** ISSUE-012 completion report, type-check passed
- **Lesson:** Validate existing code against requirements

---

## Statistics

- **Total Issues Discovered:** 16
- **Critical Blockers:** 7 (4 pending, 3 resolved)
  - BLOCKER-004: WeatherAlert Missing Authentication ✅ RESOLVED (2025-10-01)
  - BLOCKER-005: WeatherAlert GraphQL Schema Mismatch ✅ RESOLVED (2025-10-01)
  - BLOCKER-006: Hardcoded API URLs ✅ RESOLVED (2025-10-01)
  - BLOCKER-007: Dashboard Pre-rendering Fails ⏳ PENDING (P0 - blocks ISSUE-021)
- **Monitoring Requirements:** 4 (4 pending, 0 resolved)
- **Documentation Gaps:** 2 (2 pending, 0 resolved)
- **Technical Debt:** 2 (0 pending, 2 resolved)
- **UX Issues:** 1 (1 pending, 0 resolved)
- **Target Resolution:** Sprint 1-5 (3 blockers resolved 2025-10-01, 1 new blocker added)

---

## Related Documentation

- [DEPLOYMENT_REQUIREMENTS_TRACKER.md](../DEPLOYMENT_REQUIREMENTS_TRACKER.md) - Pre-production checklist
- [ISSUE-012 Deployment Requirements](../sprint1/evidence/ISSUE-012/deployment/DEPLOYMENT_REQUIREMENTS.md)
- [CLAUDE.md](../../../CLAUDE.md) - iOS storage warnings, compliance requirements
- [TECH_STACK_DETAILS.md](../../TECH_STACK_DETAILS.md)
- [COMMON_PITFALLS.md](../../COMMON_PITFALLS.md)

---

**Last Updated:** 2025-10-01
**Maintained By:** Sprint Team (update as issues discovered/resolved)
**Review Frequency:** Weekly in sprint standup
