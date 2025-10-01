# BrAve Forms - Deployment Requirements Tracker

**Purpose:** Ensure critical deployment requirements are not forgotten
**Last Updated:** 2025-10-01
**Status:** Active tracking
**Owner:** Project Manager

---

## Overview

This tracker maintains a comprehensive list of deployment blockers, monitoring requirements, and production readiness criteria discovered during development. All items must be addressed before production deployment.

**Review Cadence:**
- Weekly: Sprint standup blocker review
- Sprint Planning: Assign deployment requirements to upcoming sprints
- Pre-Release: Full deployment checklist validation
- Post-Release: Lessons learned and tracker updates

---

## Critical Pre-Production Blockers

Issues that MUST be resolved before production deployment. **DO NOT bypass these blockers.**

### BLOCKER-001: TanStack Query Version Lock
- **Source:** ISSUE-012 deployment requirements
- **Issue:** Package.json specifies ^5.14.2, actually running 5.86.0 (72 versions difference)
- **Risk:** Breaking changes in minor versions, unpredictable behavior in production
- **Root Cause:** Caret (^) allows automatic updates, no lock enforcement
- **Action Required:**
  1. Lock package.json to exact version 5.86.0
  2. Verify pnpm-lock.yaml matches
  3. Document rationale for version lock
  4. Test all TanStack Query features after lock
- **Assigned To:** [TBD]
- **Target Sprint:** Sprint 2 (Week 7-8)
- **GitHub Issue:** [TBD - Create issue]
- **Evidence Required:**
  - package.json updated to "5.86.0" (no caret)
  - pnpm-lock.yaml verified
  - All web app tests passing
- **Status:** PENDING
- **Priority:** HIGH - Production stability risk

---

### BLOCKER-002: Valtio Store Dependency Verification
- **Source:** ISSUE-012 deployment requirements
- **Issue:** Query client has hard dependency on apps/web/lib/store/app.store.ts
- **Required Exports:**
  - `appActions.addToOfflineQueue(mutation)`
  - `appActions.setSyncStatus(status)`
  - `appActions.setNetworkStatus(isOnline)`
- **Risk:** Runtime failures if store missing, incomplete, or API changes
- **Root Cause:** Tight coupling between TanStack Query client and Valtio store
- **Action Required:**
  1. Verify app.store.ts exists with all required exports
  2. Create integration tests for query client + store interaction
  3. Test offline queue scenarios (add, process, fail, retry)
  4. Document store contract in JSDoc
- **Assigned To:** [TBD]
- **Target Sprint:** Sprint 2 (Week 7-8)
- **GitHub Issue:** [TBD - Create issue]
- **Evidence Required:**
  - Integration test suite passing (query client + store)
  - JSDoc contract documentation
  - Offline scenario tests (3 scenarios minimum)
- **Status:** PENDING
- **Priority:** HIGH - Core offline functionality

---

### BLOCKER-003: iOS Storage Strategy (CRITICAL for Compliance)
- **Source:** ISSUE-012 deployment requirements, CLAUDE.md iOS warnings
- **Issue:** IndexedDB is transient on iOS - OS WILL reclaim storage under low space
- **Risk:** CATASTROPHIC - Loss of critical compliance data (inspections, photos, audit trails)
- **Compliance Impact:** EPA violation if inspection records lost ($25k-$50k/day fines)
- **Root Cause:** iOS treats IndexedDB as cache, not persistent storage
- **Action Required:**
  1. Audit all compliance-critical data currently using IndexedDB
  2. Migrate to SQLite using @capacitor-community/sqlite
  3. Keep IndexedDB for cache/performance data only
  4. Implement fallback strategy when iOS reclaims storage
  5. Test persistence under iOS low-space conditions
- **Data Classification:**
  - **CRITICAL (SQLite):** Inspections, photos, audit trails, compliance forms
  - **CACHE (IndexedDB):** UI state, query cache, user preferences
- **Assigned To:** [TBD - Mobile Developer]
- **Target Sprint:** Sprint 5 (Week 13-14) - Mobile focus sprint
- **GitHub Issue:** ISSUE-040 (TanStack Persistence - expanded scope)
- **Evidence Required:**
  - iOS 7-day offline persistence tests passing
  - Low-space condition tests (force iOS to reclaim storage)
  - Compliance data integrity verification
  - Migration guide for IndexedDB → SQLite
- **Status:** PENDING (Scheduled for Sprint 5)
- **Priority:** CRITICAL - Regulatory compliance + legal liability

---

## Production Monitoring Requirements

Must be implemented before production launch. These are NOT optional.

### MONITOR-001: localStorage Quota Tracking
- **Source:** ISSUE-012 deployment requirements
- **Requirement:** Alert at 80% capacity, block new data at 95%
- **Implementation Details:**
  - Check quota on app startup
  - Check before large writes (photos, forms)
  - Alert user at 80% with cleanup options
  - Block non-critical data at 95%
- **Code Location:** [TBD - apps/web/lib/monitoring/storage-monitor.ts]
- **Alert Channel:** Datadog + Sentry
- **Assigned To:** [TBD]
- **Target Sprint:** Sprint 3 (Week 9-10)
- **GitHub Issue:** [TBD - Create issue]
- **Evidence Required:**
  - Unit tests for quota calculation
  - Integration test triggering 80% alert
  - Datadog dashboard showing quota metrics
- **Status:** PENDING
- **Priority:** MEDIUM - User experience + data integrity

---

### MONITOR-002: IndexedDB Size Monitoring
- **Source:** ISSUE-012 deployment requirements
- **Requirement:** Track storage growth, cleanup old data automatically
- **Implementation Details:**
  - Daily background job measuring IndexedDB size
  - Automatic cleanup of query cache older than 30 days
  - Alert if growth rate exceeds 10MB/day (indicates sync failure)
- **Code Location:** [TBD - apps/web/lib/monitoring/indexeddb-monitor.ts]
- **Alert Channel:** Datadog + Sentry
- **Cleanup Strategy:** LRU eviction with compliance data protection
- **Assigned To:** [TBD]
- **Target Sprint:** Sprint 3 (Week 9-10)
- **GitHub Issue:** [TBD - Create issue]
- **Evidence Required:**
  - Background job running successfully
  - Cleanup policy tests (30-day retention)
  - Growth rate alert test
- **Status:** PENDING
- **Priority:** MEDIUM - Performance + storage management

---

### MONITOR-003: Offline Queue Health
- **Source:** ISSUE-012 deployment requirements
- **Requirement:** Alert on queue size growth (indicates sync issues)
- **Implementation Details:**
  - Track mutations added to offline queue
  - Track mutations processed successfully
  - Alert if queue size grows >50 items (indicates sync failure)
  - Alert if items in queue >24 hours (stale data)
- **Code Location:** [TBD - apps/web/lib/monitoring/queue-monitor.ts]
- **Alert Channel:** Datadog + Sentry (HIGH priority for 50+ items)
- **Assigned To:** [TBD]
- **Target Sprint:** Sprint 3 (Week 9-10)
- **GitHub Issue:** [TBD - Create issue]
- **Evidence Required:**
  - Queue size metrics in Datadog
  - Alert triggered for 50+ items test
  - Stale data detection test (24+ hours)
- **Status:** PENDING
- **Priority:** HIGH - Core sync functionality

---

### MONITOR-004: Network Event Listener Leaks
- **Source:** ISSUE-012 deployment requirements
- **Requirement:** Detect listeners not cleaned up on unmount
- **Implementation Details:**
  - Track online/offline event listeners registered
  - Verify cleanup in React component unmount
  - Alert if listener count grows unbounded
- **Code Location:** [TBD - apps/web/lib/monitoring/listener-monitor.ts]
- **Alert Channel:** Sentry (memory leak detection)
- **Assigned To:** [TBD]
- **Target Sprint:** Sprint 3 (Week 9-10)
- **GitHub Issue:** [TBD - Create issue]
- **Evidence Required:**
  - Memory leak tests (mount/unmount 100+ times)
  - Listener count tracking
  - Sentry integration verified
- **Status:** PENDING
- **Priority:** MEDIUM - Performance + memory management

---

## Integration into Sprint Planning

### Sprint 2 Requirements (Week 7-8)
- [ ] Create GitHub issues for BLOCKER-001 and BLOCKER-002
- [ ] BLOCKER-001: Lock TanStack Query version to 5.86.0
- [ ] BLOCKER-002: Valtio store integration tests
- [ ] Add deployment blockers to Sprint 2 acceptance criteria
- [ ] Review progress in daily standup

**Sprint 2 Goal:** Resolve critical dependency and integration blockers

---

### Sprint 3 Requirements (Week 9-10)
- [ ] Create GitHub issues for MONITOR-001 through MONITOR-004
- [ ] MONITOR-001: localStorage quota tracking implementation
- [ ] MONITOR-002: IndexedDB size monitoring implementation
- [ ] MONITOR-003: Offline queue health checks
- [ ] MONITOR-004: Network listener leak detection
- [ ] Create production monitoring dashboard in Datadog
- [ ] Configure alert thresholds and notification channels
- [ ] Test all monitoring scenarios

**Sprint 3 Goal:** Production monitoring infrastructure complete

---

### Sprint 5 Requirements (Week 13-14) - Mobile Focus
- [ ] BLOCKER-003: iOS SQLite migration planning (ISSUE-040 scope expansion)
- [ ] Audit all compliance-critical data locations
- [ ] Implement SQLite storage for inspections, photos, audit trails
- [ ] Test 7-day iOS offline persistence
- [ ] Test iOS low-space conditions (force storage reclaim)
- [ ] Verify compliance data integrity after migration
- [ ] Document migration guide for team

**Sprint 5 Goal:** iOS storage strategy production-ready

---

## Pre-Production Deployment Checklist

This checklist MUST be completed before production deployment. **NO EXCEPTIONS.**

### Dependencies & Configuration
- [ ] TanStack Query locked to exact version 5.86.0 (BLOCKER-001)
- [ ] Valtio store integration tests passing (BLOCKER-002)
- [ ] IndexedDB support verified in target browsers (Chrome 119+, Safari 16+, Firefox 115+)
- [ ] Service Worker configured for PWA offline support (ISSUE-037)
- [ ] Network event listeners cleanup verified (no memory leaks - MONITOR-004)
- [ ] All package.json dependencies use exact versions (no ^ or ~)

### Storage & Persistence
- [ ] localStorage quota monitoring implemented (MONITOR-001)
- [ ] IndexedDB storage size tracking active (MONITOR-002)
- [ ] iOS SQLite migration complete for compliance data (BLOCKER-003)
- [ ] 30-day offline capability tested and verified (ISSUE-041)
- [ ] Cache eviction strategy implemented (LRU with compliance protection)
- [ ] Fallback strategy tested when iOS reclaims storage

### Monitoring & Alerts
- [ ] localStorage quota alerts configured (80% threshold - MONITOR-001)
- [ ] IndexedDB size monitoring active (10MB/day growth alert - MONITOR-002)
- [ ] Offline queue health checks enabled (50+ items alert - MONITOR-003)
- [ ] Mutation retry failure tracking configured
- [ ] Network listener leak detection active (MONITOR-004)
- [ ] Datadog dashboard created with all storage/sync metrics
- [ ] Sentry error tracking configured for offline scenarios

### Testing Evidence (MANDATORY Documentation)
- [ ] 30-day offline test evidence documented (apps/web + apps/mobile)
- [ ] iOS 7-day persistence test evidence with screenshots
- [ ] iOS low-space condition test (forced storage reclaim)
- [ ] Cross-tenant isolation verified (multi-org offline sync)
- [ ] EPA compliance data integrity verified (0.25" threshold, 24-hour window)
- [ ] Load testing with 10,000+ concurrent users (evidence in docs/sprints/evidence/)
- [ ] All evidence committed to docs/sprints/evidence/PRODUCTION_READINESS/

### Compliance & Security
- [ ] EPA CGP 0.25" rain threshold verified (exact, not approximated)
- [ ] 24-hour inspection window logic tested (working hours, not calendar hours)
- [ ] Multi-tenant data isolation verified (Clerk + Prisma + RLS)
- [ ] Photo EXIF data privacy reviewed (GPS stripping if required)
- [ ] Audit trail immutability verified (compliance records)

---

## Escalation Path

If deployment requirements are at risk of not being met:

1. **Flag immediately** in daily standup (same day)
2. **Document reason** for delay or blocker in this tracker
3. **Escalate to Product Owner** if impacting production timeline (within 24 hours)
4. **Escalate to Project Manager** if cross-sprint dependencies discovered
5. **DO NOT bypass** critical blockers (especially BLOCKER-003 iOS storage, compliance data)

**Emergency Contact:** [TBD - Product Owner, Project Manager contact info]

---

## Lessons Learned (Post-Release Updates)

After production deployment, document lessons learned here:

### [Date] - [Lesson Title]
- **What happened:** [Description]
- **Root cause:** [Analysis]
- **Prevention:** [Update tracker/process to prevent recurrence]

---

## Related Documentation

- [ISSUE-012 Deployment Requirements](./sprint1/evidence/ISSUE-012/deployment/DEPLOYMENT_REQUIREMENTS.md) - Original discovery
- [ISSUE-040 TanStack Persistence](./sprint1/issues/ISSUE-040-tanstack-persistence.md) - iOS storage migration
- [CLAUDE.md](../../CLAUDE.md) - iOS storage warnings, compliance requirements
- [TECH_STACK_DETAILS.md](../TECH_STACK_DETAILS.md) - Technology stack details
- [COMMON_PITFALLS.md](../COMMON_PITFALLS.md) - iOS IndexedDB transience warning
- [DEPLOYMENT_REQUIREMENTS_RESOLVED.md](./DEPLOYMENT_REQUIREMENTS_RESOLVED.md) - Completed items history

---

## Maintenance Instructions

Update this tracker when:

1. **New deployment requirements discovered:**
   - Add to appropriate section (Blockers or Monitoring)
   - Assign priority (CRITICAL, HIGH, MEDIUM, LOW)
   - Link to source (issue, code review, testing)

2. **Blockers resolved:**
   - Move to DEPLOYMENT_REQUIREMENTS_RESOLVED.md
   - Document resolution details and evidence
   - Update Pre-Production Checklist

3. **Sprint planning assigns issues:**
   - Update "Assigned To" field
   - Link GitHub issue
   - Update sprint integration section

4. **Production deployment occurs:**
   - Archive this version to docs/archive/
   - Create new version for next release cycle
   - Document lessons learned

---

**Last Updated:** 2025-10-01
**Next Review:** Sprint 2 Planning (Week 7)
**Maintained By:** Project Manager + Product Owner
