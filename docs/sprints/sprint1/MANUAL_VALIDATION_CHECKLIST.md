# Sprint 1 - Master Manual Validation Checklist

**Created:** 2025-10-01 17:20:00 EDT
**Purpose:** Track all issues requiring manual validation
**Status:** 7 issues CODE COMPLETE, awaiting validation

---

## ⚠️ CRITICAL: Evidence-Based Completion Standards

Per CLAUDE.md, code is NOT complete without:
- ✅ Manual testing in dev environment
- ✅ Screenshots of working features
- ✅ Actual proof from running systems
- ❌ NO fake validation
- ❌ NO mock data
- ❌ NO untested claims

---

## Issues Requiring Manual Validation

### ISSUE-013: Create Weather API Helper ✅
**Status:** LOW RISK - Simple function, type-checks pass
**Validation:**
- [ ] Import function in component
- [ ] Call from React component
- [ ] Verify no runtime errors
**Evidence:** Not critical (helper function)

---

### ISSUE-014: Convert Organizations Dashboard ⚠️ HIGH PRIORITY
**Status:** CODE COMPLETE - NOT TESTED
**Risk Level:** HIGH (Complex component, 500+ lines)

**Pre-requisites:**
```bash
# Terminal 1: Backend port-forward
kubectl port-forward svc/backend 30101:3000 -n braveforms

# Terminal 2: Web dev server
cd apps/web
pnpm dev
```

**Validation Steps:**
1. [ ] Navigate to dashboard page using OrganizationDashboard
2. [ ] Verify organizations data loads
3. [ ] Check browser console (should be NO TanStack Query errors)
4. [ ] Open React Query DevTools (bottom-left icon)
5. [ ] Verify `['organizations', 'dashboard']` query in cache
6. [ ] Check query status (should be "success")
7. [ ] Test refetch button (should update data)
8. [ ] Check loading states work correctly

**Screenshots Required:**
- [ ] `evidence/ISSUE-014/deployment/dashboard-loaded.png` - Dashboard with data
- [ ] `evidence/ISSUE-014/deployment/react-query-devtools.png` - DevTools showing cache
- [ ] `evidence/ISSUE-014/deployment/console-clean.png` - No errors in console

**Success Criteria:**
- Organizations data displays
- No console errors
- React Query cache visible
- Loading/error states work

---

### ISSUE-015: Convert Weather Dashboard ⚠️ HIGH PRIORITY
**Status:** CODE COMPLETE - NOT TESTED
**Risk Level:** HIGH (Two queries, EPA compliance data)

**Pre-requisites:**
```bash
# Same as ISSUE-014 (backend + web dev server)
```

**Validation Steps:**
1. [ ] Navigate to page using WeatherDashboard component
2. [ ] Verify pending inspections load
3. [ ] Verify recent weather events load
4. [ ] Check 0.25" precipitation events are highlighted
5. [ ] Open React Query DevTools
6. [ ] Verify two queries cached:
   - `['weather', 'pendingInspections']`
   - `['weather', 'recent', <projectId>, 14]`
7. [ ] Test auto-refresh (60 seconds for pending, 300 seconds for recent)

**Screenshots Required:**
- [ ] `evidence/ISSUE-015/deployment/weather-dashboard-working.png` - Weather data visible
- [ ] `evidence/ISSUE-015/deployment/weather-cache.png` - Both queries in DevTools
- [ ] `evidence/ISSUE-015/deployment/025-threshold-highlight.png` - 0.25" events highlighted

**Offline Test (Critical for EPA Compliance):**
1. [ ] Load weather dashboard
2. [ ] Open DevTools → Network tab
3. [ ] Set to "Offline"
4. [ ] Refresh page
5. [ ] Verify weather data still displays (from cache)
6. [ ] Screenshot: `evidence/ISSUE-015/deployment/offline-weather.png`

**Success Criteria:**
- Weather data displays
- 0.25" events highlighted
- Offline mode works
- Both queries cached
- Auto-refresh works

---

### ISSUE-016: Delete Test Apollo Page ✅
**Status:** COMPLETE (Nothing existed)
**Validation:** None required

---

### ISSUE-017: Remove Apollo Dependencies ✅
**Status:** COMPLETE (Already removed)
**Validation:** None required

---

### ISSUE-018: Test Organization Dashboard
**Status:** NOT STARTED
**Purpose:** Manual validation of ISSUE-014
**Action:** Follow ISSUE-014 validation steps above

---

### ISSUE-019: Create Projects API Helper
**Status:** NOT STARTED
**Required:** Create `apps/web/lib/api/projects.ts`
**Similar to:** ISSUE-013 (weather helper)

---

### ISSUE-020: Convert Project Selector
**Status:** NOT STARTED
**Required:** Convert `components/Projects/ProjectSelector.tsx`
**Similar to:** ISSUE-014, ISSUE-015 (component conversions)
**Risk Level:** HIGH (Complex component with forms)

---

### ISSUE-021: Verify Web Build ⚠️ CRITICAL
**Status:** NOT STARTED - FINAL VALIDATION
**Purpose:** Confirm NO Apollo errors remain

**Validation Steps:**
```bash
cd apps/web
pnpm type-check  # Should have NO Apollo errors
pnpm build       # Should complete successfully
```

**Expected Result:**
- NO errors referencing `@apollo/client`
- NO errors in converted components
- Build completes in < 2 minutes
- Output: `.next` folder with static build

**Screenshot Required:**
- [ ] `evidence/ISSUE-021/deployment/build-success.png` - Successful build output

**Success Criteria:**
- `pnpm type-check` passes
- `pnpm build` succeeds
- NO Apollo Client references in errors
- Web app starts without errors

---

## Master Validation Workflow

**Step 1: Start Infrastructure**
```bash
# Verify Kubernetes running
kubectl get pods -n braveforms

# Should see 4 pods Running:
# - backend
# - postgres
# - redis
# - minio

# Port forward backend
kubectl port-forward svc/backend 30101:3000 -n braveforms
```

**Step 2: Start Web Dev Server**
```bash
cd apps/web
pnpm dev
# Should start on http://localhost:3000
```

**Step 3: Validate Each Issue**
Follow checklists above for ISSUE-014, ISSUE-015

**Step 4: Collect Evidence**
- Take screenshots as specified
- Save to correct evidence folders
- Update completion reports with "VALIDATED" status

**Step 5: Final Build Check**
```bash
cd apps/web
pnpm type-check
pnpm build
```

---

## Validation Status Summary

| Issue | Status | Priority | Manual Test Required |
|-------|--------|----------|---------------------|
| ISSUE-013 | CODE COMPLETE | LOW | Optional |
| ISSUE-014 | CODE COMPLETE | HIGH | ✅ REQUIRED |
| ISSUE-015 | CODE COMPLETE | HIGH | ✅ REQUIRED |
| ISSUE-016 | COMPLETE | - | ❌ N/A |
| ISSUE-017 | COMPLETE | - | ❌ N/A |
| ISSUE-018 | NOT STARTED | MEDIUM | ✅ REQUIRED |
| ISSUE-019 | NOT STARTED | MEDIUM | After code |
| ISSUE-020 | NOT STARTED | HIGH | ✅ REQUIRED |
| ISSUE-021 | NOT STARTED | CRITICAL | ✅ REQUIRED |

---

## Quick Start Validation

**Minimum validation to unblock continued development:**

1. Start backend + web dev server (see Step 1-2 above)
2. Test ISSUE-014: Navigate to dashboard, verify organizations load
3. Test ISSUE-015: Navigate to weather, verify data loads
4. Check console: Should be no red errors
5. If both work → Continue coding ISSUE-019, ISSUE-020
6. Run ISSUE-021 build check at end

**Time Estimate:** 20-30 minutes for full validation

---

## Troubleshooting Common Issues

### "Cannot read property 'map' of undefined"
**Cause:** Data not loading from GraphQL
**Fix:** Check backend port-forward, verify GraphQL endpoint responding

### "useQuery is not a function"
**Cause:** Wrong import
**Fix:** `import { useQuery } from '@tanstack/react-query'` (not Apollo)

### "queryKeys.organizations is undefined"
**Cause:** Query keys not added to factory
**Fix:** Check `apps/web/lib/query/client.ts` has the key

### Build fails with Apollo errors
**Cause:** Apollo files not fully removed
**Fix:** Complete ISSUE-019 through ISSUE-021

---

**Last Updated:** 2025-10-01 17:20:00 EDT
**Next Review:** After ISSUE-014 and ISSUE-015 manual validation
