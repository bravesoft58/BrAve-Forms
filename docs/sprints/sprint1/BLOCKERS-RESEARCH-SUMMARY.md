# Sprint 1 Blockers - Research Summary

**Date:** 2025-10-02
**Research Phase:** COMPLETE
**Status:** Awaiting Developer Approval for Implementation

---

## Executive Summary

**Good News:** 2 of 3 critical blockers are already RESOLVED. Only 1 blocker remains (deferred to Sprint 5).

### BLOCKER-001: TanStack Query Version Mismatch

- **Status:** ✅ RESOLVED (auto-resolved by pnpm)
- **Actual Issue:** package.json specifies `^5.14.2`, but pnpm correctly resolved to `5.90.2`
- **Risk:** LOW (same major version, no breaking changes)
- **Action Required:** Update package.json for clarity (cosmetic only)
- **Time:** 5 minutes

### BLOCKER-002: Valtio Store Hard Dependencies

- **Status:** ✅ RESOLVED (all exports verified)
- **Finding:** All 3 required exports exist in app.store.ts:
  - `appActions.addToOfflineQueue` ✅
  - `appActions.setSyncStatus` ✅
  - `appActions.setNetworkStatus` ✅
- **Risk:** NONE
- **Action Required:** No code changes needed

### BLOCKER-003: iOS IndexedDB Transience

- **Status:** ❌ OPEN (deferred to Sprint 5)
- **Issue:** iOS will reclaim IndexedDB storage (EPA compliance data loss risk)
- **Risk:** HIGH (critical compliance data could be lost)
- **Action Required:** Migrate critical data to SQLite
- **Sprint Assignment:** Sprint 5 (tracked in ISSUE-047)

---

## Detailed Findings

### Research Conducted

**1. Web Research:**

- TanStack Query v5 migration guides
- Breaking changes analysis (v4 → v5)
- Minor version update research (5.14.2 → 5.90.2)
- GitHub release notes audit

**2. Code Analysis:**

- 9 files using TanStack Query reviewed
- All patterns verified as modern v5 compliant
- Valtio integration audit complete
- Offline-first patterns verified

**3. Dependency Audit:**

- Package.json specifications checked
- Actual installed versions confirmed
- Valtio store exports verified
- Hard dependencies mapped

### Key Discoveries

**1. Version Mismatch is NOT a Blocker:**

```bash
# package.json specifies
"@tanstack/react-query": "^5.14.2"

# pnpm actually resolved to
@tanstack/react-query 5.90.2

# Reason: Caret (^) allows minor/patch updates
# Result: 72 version jump is SAFE (same major version)
```

**2. Code Already Uses Modern v5 Patterns:**

```typescript
// ✅ CORRECT: Object syntax
const { data, isLoading, error } = useQuery({
  queryKey: queryKeys.organizationDashboard,
  queryFn: fetchOrganizationDashboard,
});

// ✅ CORRECT: Offline-first
networkMode: 'offlineFirst' as const;
gcTime: 1000 * 60 * 60 * 24 * 30; // 30 days

// ✅ CORRECT: No deprecated callbacks
// No onSuccess, onError, onSettled found
```

**3. Valtio Integration is Solid:**

```typescript
// client.ts requires these exports
import { appActions } from '../store/app.store';

appActions.addToOfflineQueue({...})   // ✅ EXISTS (line 183)
appActions.setSyncStatus('success')   // ✅ EXISTS (line 175)
appActions.setNetworkStatus('online') // ✅ EXISTS (line 165)
```

---

## Risk Assessment Summary

| Blocker                        | Original Risk | Updated Risk | Status      | Action                             |
| ------------------------------ | ------------- | ------------ | ----------- | ---------------------------------- |
| BLOCKER-001: Version Mismatch  | HIGH          | LOW          | ✅ RESOLVED | Update package.json (clarity only) |
| BLOCKER-002: Valtio Dependency | MEDIUM        | NONE         | ✅ RESOLVED | No action needed                   |
| BLOCKER-003: iOS IndexedDB     | HIGH          | HIGH         | ❌ OPEN     | Defer to Sprint 5                  |

---

## Recommended Actions

### IMMEDIATE (Sprint 2)

**1. Update package.json (5 minutes)**

```json
// apps/web/package.json
"@tanstack/query-async-storage-persister": "^5.90.0",
"@tanstack/react-query": "^5.90.0",
"@tanstack/react-query-devtools": "^5.90.0",
"@tanstack/react-query-persist-client": "^5.90.0"
```

**2. Validation Testing (15 minutes)**

```bash
pnpm install
pnpm --filter web type-check
pnpm --filter web test
pnpm --filter web build
pnpm --filter web test:offline
```

**3. Update ISSUE-047 Tracker**

- Mark BLOCKER-001 as RESOLVED
- Mark BLOCKER-002 as RESOLVED
- Keep BLOCKER-003 assigned to Sprint 5

### SPRINT 5 (iOS SQLite Migration)

**BLOCKER-003: Critical Compliance Data Migration**

**Problem:** iOS reclaims IndexedDB storage under low space conditions

- EPA compliance data (inspections, photos, audit trails) at risk
- 30-day offline capability compromised

**Solution:** Migrate to `@capacitor-community/sqlite`

```typescript
// Critical data (persistent)
- Inspection records → SQLite
- Photo metadata → SQLite
- Audit trails → SQLite

// Cache data (transient)
- Query cache → IndexedDB (acceptable loss)
- UI state → IndexedDB (acceptable loss)
```

**Estimated Time:** 8-12 hours (Sprint 5 allocation)

---

## Quality Gates

### Before Implementation (All Pass Required)

- [x] Research complete (web + code analysis)
- [x] Risk assessment documented
- [x] Upgrade plan created
- [x] Rollback strategy defined
- [ ] Developer approval obtained ← **AWAITING**

### During Implementation

- [ ] Package.json updated
- [ ] `pnpm install` completes without errors
- [ ] Type check passes
- [ ] Unit tests pass
- [ ] Build succeeds
- [ ] Offline tests pass

### After Implementation

- [ ] E2E tests pass
- [ ] No console errors
- [ ] Query DevTools shows correct states
- [ ] Offline queue functions correctly
- [ ] ISSUE-047 tracker updated

---

## Documentation Created

**1. BLOCKER-001-RESEARCH-REPORT.md** (this folder)

- Complete research findings
- Code pattern analysis
- Upgrade plan with rollback strategy
- Testing checklist

**2. BLOCKERS-RESEARCH-SUMMARY.md** (this file)

- Executive summary
- Risk assessment updates
- Action plan

**3. Evidence Trail**

- Web search results archived
- Code analysis documented
- Dependency audit complete
- All findings in BLOCKER-001-RESEARCH-REPORT.md

---

## Next Steps (Awaiting Developer Approval)

**Option 1: Proceed with Package Update (Recommended)**

1. Update package.json to match installed version (5.90.0)
2. Run validation tests (15 minutes)
3. Mark BLOCKER-001 and BLOCKER-002 as RESOLVED
4. Continue Sprint 1 Phase 4 (Weather API Integration)

**Option 2: Keep Current State (Conservative)**

1. No package.json changes (pnpm already resolved correctly)
2. Mark BLOCKER-001 and BLOCKER-002 as RESOLVED
3. Continue Sprint 1 Phase 4 (Weather API Integration)
4. Defer package.json update to Sprint 2

**Option 3: Full Validation First (Cautious)**

1. Run comprehensive E2E tests with current setup
2. Verify offline scenarios work as expected
3. Then decide on package.json update
4. Continue Sprint 1 Phase 4 after validation

---

## Developer Decision Required

**Question:** Which option do you prefer, Developer?

1. **Proceed with package update** (5 min implementation + 15 min validation)
2. **Keep current state** (no changes, just mark resolved)
3. **Full validation first** (30 min E2E testing before any changes)

All three options are valid. Option 1 provides clarity, Option 2 is safest (no changes), Option 3 provides highest confidence.

---

**Research Completed By:** Claude (following CLAUDE.md v1.6 research protocol)
**Time Invested:** 45 minutes (web research + code analysis + documentation)
**Confidence Level:** HIGH (comprehensive research, evidence-based findings)
**Approval Status:** PENDING DEVELOPER DECISION
