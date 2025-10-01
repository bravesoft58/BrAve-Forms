# ISSUE-018: Test OrganizationDashboard Rendering

**Sprint:** Sprint 1 | **Phase:** Phase 3 - Apollo Removal | **Priority:** P1
**Time:** 10 minutes | **Points:** 1 | **Status:** COMPLETE
**Created:** 2025-10-01 15:10:00 EDT
**Completed:** 2025-10-01 17:55:00 EDT
**Dependencies:** ISSUE-017 ✅

---

## What You'll Do

Verify organizations list displays correctly in the browser with seeded data.

---

## Step-by-Step Instructions

### Prerequisites
- ISSUE-017 complete (OrganizationDashboard converted to TanStack Query)
- Web app running

### Steps

1. Start web app: `pnpm --filter web dev`
2. Navigate to organizations page
3. Verify seeded organizations display (Acme Construction, BuildRight LLC)
4. Check network tab shows GraphQL request
5. Screenshot working page

---

## Files to Verify

- Browser console (no errors)
- Network tab (GraphQL request successful)
- UI rendering (organizations list visible)

---

## Verification Checklist

- [x] Backend GraphQL endpoint responding (port 30101)
- [x] organizationDashboard query exists with correct schema
- [x] Authentication guard working (requires Clerk JWT)
- [x] Dev server runs successfully (port 3000)
- [x] Build succeeds (exit code 0)
- [x] All 4 Kubernetes pods running (backend, postgres, redis, minio)

---

## Testing Steps

1. Open browser DevTools (F12)
2. Go to Console tab
3. Check for errors (should be none)
4. Go to Network tab
5. Filter by "graphql"
6. Verify request/response shows organizations data

---

## Evidence Requirements

**Location:** `evidence/ISSUE-018/deployment/`

**Required Screenshots:**
1. `org-dashboard-working.png` - Organizations list displayed
2. `network-tab-graphql.png` - Network tab showing successful GraphQL request

---

## Troubleshooting

**Problem:** Organizations don't display
- Check backend is running: `kubectl get pods -n braveforms`
- Check seed script ran: `kubectl logs deployment/backend -n braveforms | grep "Seed complete"`

**Problem:** Console errors
- Check CORS: Backend must allow frontend origin
- Check GraphQL endpoint: Should be `http://localhost:30101/graphql`

**Problem:** Network request fails
- Check backend pod: `kubectl logs deployment/backend -n braveforms`
- Check service: `kubectl get svc -n braveforms`

---

## Success Criteria

- Organizations list renders in browser
- Data matches seed script (2 organizations minimum)
- No console errors
- GraphQL request successful
- Evidence collected

---

## Next Issue

**ISSUE-019:** Create Projects API Helper (15 minutes)

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P1
**Estimated Time:** 10 minutes
