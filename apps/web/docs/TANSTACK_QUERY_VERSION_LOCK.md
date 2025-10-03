# TanStack Query Version Lock Rationale

**Date:** October 2, 2025
**Issue:** ISSUE-047 Blocker 1
**Decision:** Lock TanStack Query to exact version 5.90.2

---

## Problem

**Discovered during Sprint 1 completion:**

- package.json specified `^5.90.0` (caret allows minor/patch updates)
- Actual installed version was 5.90.2
- Version 5.90.0 doesn't exist (npm skipped from 5.89.0 to 5.90.1)
- TanStack Query has 72 minor versions in v5 (5.14.2 → 5.90.2)
- Minor versions in TanStack Query v5 contain breaking changes

**Risk:**

- Caret versioning allows automatic updates to 5.91.x, 5.92.x, etc.
- TanStack Query doesn't follow strict semantic versioning
- Production deployments could pull different versions than development
- Offline persistence patterns could break with version drift

---

## Decision

**Lock all TanStack Query packages to exact version 5.90.2:**

```json
"@tanstack/query-async-storage-persister": "5.90.2",
"@tanstack/react-query": "5.90.2",
"@tanstack/react-query-devtools": "5.90.2",
"@tanstack/react-query-persist-client": "5.90.2"
```

**Rationale:**

1. **Predictability:** Same version in dev, staging, production
2. **Stability:** No surprise breaking changes from auto-updates
3. **Offline-First:** Persistence layer requires version consistency
4. **Testing:** Can validate exact behavior without version drift
5. **Compliance:** Critical for 30-day offline capability (EPA requirement)

---

## Version History

**Locked Version:** 5.90.2 (October 2, 2025)

**Previous State:**

- `^5.90.0` in package.json (incorrect - version doesn't exist)
- 5.90.2 actually installed
- async-storage-persister: `^5.90.2`

**Why 5.90.2:**

- Latest stable version at time of lock
- All 4 packages have matching 5.90.2 release
- Already validated in Sprint 1 implementation
- ProjectSelector, WeatherDashboard, OrganizationProvider all working

---

## Upgrade Process

**When to upgrade:**

- Security patches (evaluate each)
- Critical bug fixes (validate offline persistence)
- Major feature needs (after thorough testing)
- Quarterly review cycle (planned upgrades)

**How to upgrade safely:**

1. Create feature branch: `feature/tanstack-query-upgrade-vX.X.X`
2. Update all 4 packages to same version
3. Run full test suite: `pnpm test`
4. Test offline scenarios: `pnpm test:offline`
5. Manual testing: 30-day offline capability
6. Staging deployment validation
7. Code review with offline-sync-specialist agent
8. Update this document with new version and date
9. Create rollback plan

---

## Dependencies

**These packages MUST stay in sync:**

1. `@tanstack/react-query` (core)
2. `@tanstack/react-query-devtools` (dev tools)
3. `@tanstack/react-query-persist-client` (persistence)
4. `@tanstack/query-async-storage-persister` (storage adapter)

**Version mismatch risks:**

- Persistence layer breaks
- IndexedDB storage corruption
- Offline sync failures
- 30-day offline requirement violated

---

## Testing Verification

**After version lock (October 2, 2025):**

✅ **Type Check:** No TanStack Query type errors

```bash
pnpm --filter web type-check
# All TanStack Query types resolve correctly
```

✅ **Installation:** Exact versions installed

```bash
pnpm list @tanstack/react-query
# @tanstack/react-query 5.90.2 (EXACT, no caret)
```

✅ **Query Hooks:** All implementations working

- `apps/web/components/Projects/ProjectSelector.tsx` (line 68)
- `apps/web/components/Organization/OrganizationProvider.tsx`
- `apps/web/components/Weather/WeatherDashboard.tsx`

✅ **Persistence:** Offline capability maintained

- IndexedDB storage working
- Query cache persists across restarts
- 30-day offline requirement unaffected

---

## Related Issues

- **ISSUE-012:** TanStack Query setup and configuration
- **ISSUE-019:** InspectionList migration to TanStack Query
- **ISSUE-020:** ProjectSelector migration to TanStack Query
- **ISSUE-047:** Sprint 1 carryover blockers (version lock)
- **ISSUE-075:** Code issues tracker (track future version updates)

---

## Monitoring

**Watch for:**

- New TanStack Query v5 releases with security fixes
- Breaking changes in release notes
- Community reports of persistence issues
- Offline sync regression reports

**Review Schedule:**

- Monthly: Check for security patches
- Quarterly: Evaluate upgrade to latest stable
- Sprint Planning: Assess if upgrade needed for new features

---

**Locked By:** Development Team
**Approved By:** Technical Lead
**Next Review:** January 2026 (Quarterly)
