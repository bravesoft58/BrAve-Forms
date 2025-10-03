# ISSUE-075: Sprint 2 Code Issues & Tech Debt Tracker

**Sprint:** Sprint 2 | **Phase:** Continuous | **Priority:** P1
**Time:** Ongoing throughout sprint | **Complexity:** N/A
**Created:** 2025-10-02
**Type:** Tracking Issue (Not a development task)

---

## Purpose

This issue serves as a **running log** of all code issues, bugs, tech debt, and improvements identified during Sprint 2 development. The code-reviewer agent will add entries here after reviewing each completed issue.

**Use this to:**

- Track code quality issues found during development
- Document tech debt for future sprints
- Identify patterns of problems
- Create action items before sprint close

---

## How to Use This Tracker

### After Each Issue Completion:

1. Developer completes issue (e.g., ISSUE-051)
2. Developer runs: `/review` (launches code-reviewer agent)
3. Code-reviewer agent reviews the code
4. Code-reviewer agent updates this document with findings
5. Developer reviews findings and decides:
   - **Fix Now:** Critical issues, fix before closing issue
   - **Track for Sprint Close:** Minor issues, fix before Sprint Review
   - **Defer to Sprint 3:** Tech debt, document and move on

### Format for Entries:

```markdown
## ISSUE-XXX: [Issue Title]

**Date:** YYYY-MM-DD
**Reviewer:** code-reviewer agent
**Severity:** Critical / High / Medium / Low

**Findings:**

1. [Description of issue]
   - **Impact:** [What this affects]
   - **Recommendation:** [How to fix]
   - **Action:** Fix Now / Sprint Close / Defer to Sprint 3

2. [Next finding...]
```

---

## Sprint 2 Code Issues Log

### Summary Statistics

**Total Issues Reviewed:** 1/27
**Critical Issues Found:** 0
**High Priority Issues:** 2 (2 fixed ✅)
**Medium Priority Issues:** 4
**Low Priority Issues:** 3
**Tech Debt Items:** 4

**Status:**

- Fixed During Development: 2 (2 High) ✅
- To Fix Before Sprint Close: 4 (Medium only)
- Deferred to Sprint 3: 3 (Low priority)

---

## Issues Identified

## ISSUE-047: Sprint 1 Carryover Blockers (TanStack Query Version Lock)

**Date:** 2025-10-02
**Reviewer:** code-reviewer agent
**Severity:** Mixed (2 High, 4 Medium, 3 Low)

**Files Reviewed:** 4

- apps/web/package.json (lines 34-37)
- apps/web/lib/store/app.store.ts (lines 162-175)
- apps/web/lib/query/**tests**/query-client-store-integration.test.ts (NEW, 270+ lines)
- apps/web/docs/TANSTACK_QUERY_VERSION_LOCK.md (NEW)

**Lines Changed:** +450 / -3

**Overall Code Quality Score:** 8.7/10

- Zero tolerance compliance: 10/10
- Type safety: 8.5/10 (one `any` usage)
- Error handling: 8.0/10 (network listener missing try-catch)
- Documentation: 8.5/10 (JSDoc incomplete)
- Testing: 9.0/10 (comprehensive but missing edge cases)

---

### HIGH PRIORITY FINDINGS (Must fix before closing ISSUE-047)

#### 1. Type Safety Violation - Generic `any` Type

**Severity:** High
**File:** apps/web/lib/store/app.store.ts:244
**Impact:** Violates TypeScript strict mode, bypasses type checking
**CLAUDE.md Violation:** Line 127 - "NO `any` types"

**Code:**

```typescript
const notification = appStore.notifications.find((n: any) => n.id === notificationId);
```

**Recommendation:**

```typescript
// Type inference works correctly from AppState['notifications'][0]
const notification = appStore.notifications.find((n) => n.id === notificationId);
```

**Action:** Fix Now
**Status:** ✅ FIXED (October 2, 2025)

---

#### 2. Missing Error Handling - Network Status Listener

**Severity:** High
**File:** apps/web/lib/query/client.ts:174-189
**Impact:** Unhandled promise rejections during reconnection, poor user experience
**CLAUDE.md Violation:** Line 164 - "MUST handle all error cases explicitly"

**Code:**

```typescript
if (isOnline && queryClient) {
  queryClient.resumePausedMutations(); // Can throw
  queryClient.refetchQueries(); // Can throw
}
```

**Recommendation:**

```typescript
if (isOnline && queryClient) {
  try {
    await queryClient.resumePausedMutations();
    await queryClient.refetchQueries();
  } catch (error) {
    console.error('Failed to sync after reconnection:', error);
    appActions.addNotification({
      type: 'warning',
      title: 'Sync Issue',
      message: 'Some offline changes failed to sync. Will retry automatically.',
    });
  }
}
```

**Action:** Fix Now
**Status:** ✅ FIXED (October 2, 2025)

---

### MEDIUM PRIORITY FINDINGS (Fix before Sprint 2 close)

#### 3. Missing Offline Scenario Tests

**Severity:** Medium
**File:** apps/web/lib/query/**tests**/query-client-store-integration.test.ts
**Impact:** Integration tests don't simulate actual offline scenarios
**CLAUDE.md Reference:** Line 196 - "Test all features in offline mode"

**Current Coverage:**

- Offline queue management (covered)
- Network status updates (covered)
- Actual offline behavior (NOT covered)

**Recommendation:**
Add test suite:

```typescript
describe('Offline Scenario Tests', () => {
  it('should queue mutations when network offline', async () => {
    appActions.setNetworkStatus('offline');
    // Attempt mutation
    // Verify queued
  });

  it('should replay queue when network reconnects', async () => {
    // Pre-populate queue
    // Reconnect
    // Verify queue processed
  });
});
```

**Action:** Sprint Close
**Status:** Open

---

#### 4. IndexedDB Function Unused and Incomplete

**Severity:** Medium
**File:** apps/web/lib/store/app.store.ts:129-160
**Impact:** Dead code or incomplete iOS storage handling
**COMMON_PITFALLS.md Reference:** Line 289 - iOS IndexedDB transience warning

**Issue:**
`openIndexedDB()` function defined but never called. If planned for use, lacks:

- iOS storage reclamation handling
- Quota exceeded error handling
- Migration strategy for schema changes

**Recommendation:**

1. If unused, remove function (dead code)
2. If planned, add iOS-specific handling:

```typescript
request.onerror = (event) => {
  const error = request.error;
  if (error?.name === 'QuotaExceededError') {
    console.error('IndexedDB quota exceeded - migrating to SQLite');
    // Trigger SQLite migration (CRITICAL for iOS)
  }
  reject(error);
};
```

**Action:** Sprint Close
**Status:** Open

---

#### 5. Incomplete JSDoc Documentation

**Severity:** Medium
**File:** apps/web/lib/store/app.store.ts
**Impact:** Missing documentation for public exports
**CLAUDE.md Reference:** Line 198 - "Use JSDoc format for TypeScript/JavaScript"

**Missing JSDoc:**

- `useAppStore()` (line 345)
- `useAppActions()` (line 349)
- `OfflineAction` interface (line 5)
- `Project` interface (line 15)
- `User` interface (line 29)
- `AppState` interface (line 39)

**Recommendation:**

```typescript
/**
 * React hook to access application state snapshot.
 * Uses Valtio's useSnapshot for reactive updates.
 *
 * @returns Immutable snapshot of application state
 * @example
 * const state = useAppStore();
 * console.log(state.networkStatus); // 'online' | 'offline'
 */
export function useAppStore() {
  return useSnapshot(appStore);
}
```

**Action:** Sprint Close
**Status:** Open

---

#### 6. Test Mock Implementation Improper

**Severity:** Medium
**File:** apps/web/lib/query/**tests**/query-client-store-integration.test.ts:210-224
**Impact:** Fragile test, improper cleanup
**Testing Best Practice:** Use built-in spy functions

**Current Code:**

```typescript
appActions.triggerSync = async () => {
  syncTriggered = true;
  return originalTriggerSync(); // Mutation pattern, not ideal
};
```

**Recommendation:**

```typescript
import { vi } from 'vitest';

const triggerSyncSpy = vi.spyOn(appActions, 'triggerSync');
// ... test logic ...
expect(triggerSyncSpy).toHaveBeenCalled();
triggerSyncSpy.mockRestore();
```

**Action:** Sprint Close
**Status:** Open

---

### LOW PRIORITY FINDINGS (Defer to Sprint 3)

#### 7. Missing Context Comment for Version Lock

**Severity:** Low
**File:** apps/web/package.json:34-37
**Impact:** Minor - developers may not understand why versions locked
**Improvement:** Documentation clarity

**Recommendation:**

```json
// TanStack Query locked to 5.90.2 (ISSUE-047)
// See: apps/web/docs/TANSTACK_QUERY_VERSION_LOCK.md
"@tanstack/query-async-storage-persister": "5.90.2",
```

**Action:** Sprint 3
**Status:** Open

---

#### 8. Weather Data Timestamp Validation Missing

**Severity:** Low
**File:** apps/web/lib/store/app.store.ts:251-258
**Impact:** Potential stale data used for EPA compliance checks
**Enhancement:** Weather monitoring accuracy

**Recommendation:**
Add timestamp validation:

```typescript
updateWeatherData: (weatherData: AppState['weatherData']) => {
  if (weatherData?.lastRainfallTime) {
    const now = new Date();
    const dataAge = now.getTime() - weatherData.lastRainfallTime.getTime();
    const maxAgeMs = 60 * 60 * 1000; // 1 hour

    if (dataAge > maxAgeMs) {
      console.warn('Weather data stale, fetching fresh data');
    }
  }

  appStore.weatherData = weatherData;

  if (weatherData?.lastRainfall && weatherData.lastRainfall >= 0.25) {
    appActions.checkComplianceDeadlines();
  }
};
```

**Action:** Sprint 3
**Status:** Open

---

#### 9. Edge Case Test Coverage Gap

**Severity:** Low
**File:** apps/web/lib/query/**tests**/query-client-store-integration.test.ts
**Impact:** Missing tests for stress scenarios
**Enhancement:** Comprehensive test coverage

**Missing Tests:**

- Offline queue with 50+ items (performance)
- Concurrent mutations during sync
- Network flapping (rapid offline/online)
- Storage quota exceeded during cache write

**Recommendation:**

```typescript
describe('Edge Cases', () => {
  it('should handle large offline queue (50+ items)', () => {
    /* ... */
  });
  it('should handle network flapping', () => {
    /* ... */
  });
  it('should handle storage quota exceeded', () => {
    /* ... */
  });
});
```

**Action:** Sprint 3
**Status:** Open

---

## POSITIVE FINDINGS (ISSUE-047)

### Code Quality Strengths

**Zero Tolerance Compliance:** 10/10

- No emoji in any files
- No AI branding or generation references
- Professional code standards maintained throughout

**Integration Testing:** 9/10

- Comprehensive integration test suite (17 tests, 270+ lines)
- Tests verify hard dependencies between query client and store
- Critical offline persistence patterns validated
- Missing: Offline scenario tests, edge cases

**Documentation:** 8.5/10

- Excellent version lock rationale document (TANSTACK_QUERY_VERSION_LOCK.md)
- Clear JSDoc for critical hard dependencies in app.store.ts
- Upgrade process well-documented
- Missing: JSDoc for all public exports

**Version Management:** 10/10

- Proper exact version locking (no caret ranges)
- All 4 TanStack Query packages synchronized
- Prevents production version drift

**Offline-First Architecture:** 9/10

- Correct `networkMode: 'offlineFirst'` configuration
- Exponential backoff retry logic
- 30-day garbage collection time for EPA compliance
- Missing: Error handling in network listener

**Error Handling (Query Layer):** 8/10

- Proper network error vs client error distinction
- Offline queue integration for failed mutations
- Sync status updates on success/failure
- Missing: Try-catch in network status listener

**Construction Site Optimization:** 9/10

- 5-minute stale time for fresh data when online
- Retry logic optimized for unstable connectivity
- Background refetch on window focus and reconnect

---

## Pre-Sprint Close Checklist

**Before Sprint 2 Review (October 25, 2025):**

- [ ] Review all "Fix Before Sprint Close" items
- [ ] Address all Critical and High severity issues
- [ ] Create Sprint 3 tickets for deferred tech debt
- [ ] Update documentation for known limitations
- [ ] Run final quality gates on entire codebase
- [ ] Verify all evidence collected for fixed issues

**ISSUE-047 Specific:**

- [x] Fix H1: Remove `any` type in app.store.ts:244 ✅
- [x] Fix H2: Add error handling in client.ts:174-189 ✅
- [ ] Fix M1: Add offline scenario tests
- [ ] Fix M2: Evaluate openIndexedDB (remove or complete)
- [ ] Fix M3: Add JSDoc for all public exports
- [ ] Fix M4: Improve test mocking with Vitest spies

---

## Sprint 3 Tech Debt Backlog

_Items deferred from Sprint 2 that need to be addressed in Sprint 3:_

**Critical Tech Debt:**

- (None)

**High Priority Tech Debt:**

- (None)

**Medium Priority Tech Debt:**

- (None)

**Low Priority Tech Debt:**

- L1: Add package.json comment for version lock context
- L2: Weather data timestamp validation for EPA accuracy
- L3: Edge case test coverage (queue stress, network flapping)

---

## Notes for Code-Reviewer Agent

**When reviewing code, check for:**

1. **Code Quality:**
   - No emoji or AI branding
   - Proper error handling
   - Input validation
   - Code follows project patterns
   - No placeholder TODOs without tickets

2. **Testing:**
   - Tests written first (TDD)
   - Coverage >80% for new code
   - Edge cases covered
   - Offline scenarios tested
   - Multi-tenant isolation verified

3. **Multi-Tenancy:**
   - All queries filter by orgId
   - Prisma middleware enforced
   - PostgreSQL RLS policies applied
   - Cross-tenant access tests pass

4. **Offline-First:**
   - Works without connectivity
   - Proper sync queue handling
   - Conflict resolution implemented
   - iOS storage considerations (SQLite for critical data)

5. **Performance:**
   - API responses <200ms p95
   - Database queries optimized
   - N+1 query problems avoided
   - Proper indexing on queries

6. **Security:**
   - Input sanitization
   - Clerk JWT validation
   - No SQL injection vulnerabilities
   - Sensitive data handling

7. **Documentation:**
   - JSDoc comments on public APIs
   - README updated if needed
   - Complex logic explained
   - Timestamps include date + time

**Severity Guidelines:**

- **Critical:** Security vulnerability, data loss risk, breaks existing functionality
- **High:** Performance issue, poor error handling, missing tests
- **Medium:** Code duplication, minor pattern violations, optimization opportunities
- **Low:** Style issues, documentation improvements, refactoring suggestions

---

## Integration with Sprint Workflow

### Standard Issue Completion Flow:

1. **Develop:** Complete issue implementation
2. **Test:** Run quality gates (lint, type-check, test, build)
3. **Review:** Run `/review` command
4. **Update:** Code-reviewer adds findings to this document
5. **Address:** Developer fixes critical/high issues
6. **Close:** Mark issue complete with evidence

### Before Sprint Review:

1. Review this document
2. Fix all "Sprint Close" items
3. Create Sprint 3 tickets for deferred items
4. Update sprint completion summary

---

**This is a living document updated throughout Sprint 2.**

**Last Updated:** 2025-10-02 20:45:00 EDT (ISSUE-047 review added)
**Next Review:** After each issue completion
**Final Review:** October 24, 2025 (day before Sprint Review)
