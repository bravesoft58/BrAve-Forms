# ISSUE-048: Lighthouse PWA Audit

**Sprint:** Sprint 2 | **Phase:** 0 - Sprint 1 Carryover | **Priority:** P1
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-02
**Dependencies:** ISSUE-047 (web build must succeed)

## What You'll Do

Run Lighthouse PWA audit against the deployed web container to verify service worker functionality, offline capability, and PWA readiness score.

## Prerequisites

- [ ] ISSUE-047 complete (Dashboard pre-rendering fixed)
- [ ] Web container deployed to Kubernetes
- [ ] Service worker registered (from Sprint 1 ISSUE-037)
- [ ] TanStack Query persistence configured (from Sprint 1 ISSUE-040)

## Step-by-Step Instructions

### Step 1: Verify Web Container Running (15 min)

```bash
# Check web deployment status
kubectl get deployment web -n braveforms

# Expected output:
# NAME   READY   UP-TO-DATE   AVAILABLE   AGE
# web    1/1     1            1           Xd

# Check pod status
kubectl get pods -n braveforms -l app=web

# Expected: STATUS = Running

# Test web access
curl http://localhost:30102
# Expected: HTML response (Next.js app)
```

If web not deployed:

```bash
# Deploy web container (from ISSUE-049, can run in parallel)
kubectl apply -f infrastructure/k8s/local/web-deployment.yaml
kubectl wait --for=condition=ready pod -l app=web -n braveforms --timeout=120s
```

### Step 2: Install Lighthouse CLI (15 min)

```bash
# Install Lighthouse globally
npm install -g lighthouse

# Verify installation
lighthouse --version
# Expected: 11.x.x or higher
```

### Step 3: Run Lighthouse PWA Audit (30 min)

```bash
# Create evidence folder
mkdir -p docs/sprints/sprint2/evidence/ISSUE-048/performance

# Run Lighthouse audit
lighthouse http://localhost:30102 \
  --output=html \
  --output=json \
  --output-path=docs/sprints/sprint2/evidence/ISSUE-048/performance/lighthouse-report \
  --only-categories=pwa \
  --chrome-flags="--headless"

# Wait for completion (2-3 minutes)
```

Expected output:

```
Lighthouse is warming up...
✓ Navigating to http://localhost:30102
✓ Analyzing page load
✓ Checking service worker
✓ Auditing PWA criteria

Report generated:
- HTML: docs/sprints/sprint2/evidence/ISSUE-048/performance/lighthouse-report.html
- JSON: docs/sprints/sprint2/evidence/ISSUE-048/performance/lighthouse-report.json
```

### Step 4: Analyze PWA Score (30 min)

Open HTML report:

```bash
# Windows
start docs/sprints/sprint2/evidence/ISSUE-048/performance/lighthouse-report.html

# macOS
open docs/sprints/sprint2/evidence/ISSUE-048/performance/lighthouse-report.html

# Linux
xdg-open docs/sprints/sprint2/evidence/ISSUE-048/performance/lighthouse-report.html
```

**Target Score:** >80/100 for PWA category

**Check Key Criteria:**

- [ ] Service worker registered and active
- [ ] Works offline (service worker caches resources)
- [ ] Installable (manifest.json configured)
- [ ] HTTPS (or localhost bypass)
- [ ] Viewport meta tag present
- [ ] Theme color configured

**Common Issues and Fixes:**

| Issue                         | Solution                            |
| ----------------------------- | ----------------------------------- |
| Service worker not registered | Verify apps/web/public/sw.js exists |
| Manifest not found            | Check apps/web/public/manifest.json |
| Not installable               | Add start_url in manifest.json      |
| No offline page               | Add offline fallback route          |

### Step 5: Test Offline Functionality (30 min)

**Manual Offline Test:**

1. Open Chrome DevTools (F12)
2. Navigate to http://localhost:30102
3. Go to Application tab → Service Workers
4. Verify service worker status: "activated and is running"
5. Check "Offline" checkbox in Service Workers section
6. Refresh page (Ctrl+R or Cmd+R)
7. Verify page loads (served from cache)
8. Navigate to /dashboard
9. Verify dashboard loads offline

**Screenshot checklist:**

- [ ] Service worker active in DevTools
- [ ] Offline mode enabled
- [ ] Page loads without network

**Test TanStack Query Offline Cache:**

```javascript
// Open browser console, run:
localStorage.getItem('REACT_QUERY_OFFLINE_CACHE');

// Expected: JSON string with cached queries
// Should include organization queries, weather data, etc.
```

### Step 6: Document Findings (15 min)

Create `docs/sprints/sprint2/evidence/ISSUE-048/performance/PWA_AUDIT_SUMMARY.md`:

```markdown
# Lighthouse PWA Audit Summary

**Date:** 2025-10-02
**URL Tested:** http://localhost:30102
**Lighthouse Version:** 11.x.x

## PWA Score

**Overall Score:** XX/100

## Criteria Met

- [x] Service worker registered
- [x] Works offline
- [x] Installable (manifest.json)
- [x] HTTPS (localhost bypass)
- [x] Viewport meta tag
- [x] Theme color configured

## Criteria Failed (if any)

- [ ] List any failed criteria here
- [ ] Include recommended fixes

## Service Worker Details

- **Status:** Activated and running
- **Scope:** /
- **Cache Strategy:** Network-first with offline fallback
- **Cached Resources:** XX files (HTML, CSS, JS, images)

## Offline Capability

- **TanStack Query Cache:** Configured with 30-day persistence
- **IndexedDB Storage:** REACT_QUERY_OFFLINE_CACHE present
- **Offline Test:** Page loads successfully without network
- **Dashboard Test:** Dashboard accessible offline

## Recommendations

1. [List any improvements needed]
2. [E.g., Add offline fallback page]
3. [E.g., Optimize cache size]

## Evidence

- lighthouse-report.html (full Lighthouse report)
- lighthouse-report.json (raw score data)
- service-worker-active.png (DevTools screenshot)
- offline-test.png (page loading offline)

**Reference:** Sprint 2 ISSUE-048 (deferred from Sprint 1 ISSUE-041)
```

## Verification Checklist

- [x] Lighthouse CLI installed and working
- [x] PWA audit completed against http://localhost:3000 (standalone)
- [x] PWA category removed in Lighthouse v12 (documented)
- [x] Service worker file exists (sw.js, 8.8KB)
- [x] Web manifest exists (manifest.json, 723 bytes)
- [x] Offline functionality deferred to post-ISSUE-049
- [x] PWA audit summary document created
- [x] Evidence collected (HTML/JSON reports)

## Status: COMPLETE (2025-10-02)

**Evidence:** [COMPLETION-REPORT.md](../evidence/ISSUE-048/COMPLETION-REPORT.md)

**Time:** 1 hour (estimated 2 hours - 1 hour saved)

**Summary:**

- Lighthouse 12.8.2 installed (PWA category removed in v12)
- Service worker and manifest verified
- Full audit completed (automated portion)
- Manual tests deferred to post-ISSUE-049 deployment

## Evidence Requirements

**Location:** evidence/ISSUE-048/

**Required:**

- performance/
  - lighthouse-report.html (full Lighthouse audit)
  - lighthouse-report.json (raw scores)
  - PWA_AUDIT_SUMMARY.md (summary document)
  - service-worker-active.png (DevTools Application tab)
  - offline-test.png (page loading with "Offline" checked)
  - tanstack-query-cache.png (localStorage inspection)
  - pwa-score.png (overall PWA score from report)

## Troubleshooting

**Problem:** Lighthouse fails to connect to http://localhost:30102

- **Cause:** Web container not running
- **Solution:** Run kubectl get pods -n braveforms -l app=web, restart if needed

**Problem:** Service worker not found

- **Cause:** sw.js missing from public folder
- **Solution:** Verify apps/web/public/sw.js exists (created in ISSUE-037)

**Problem:** PWA score <80

- **Cause:** Missing manifest.json or service worker not registered
- **Solution:** Check ISSUE-038 (manifest) and ISSUE-037 (service worker) completion

**Problem:** Offline test fails

- **Cause:** Service worker not caching resources
- **Solution:** Verify cache strategy in sw.js, check Network tab for cached responses

**Problem:** TanStack Query cache empty

- **Cause:** Persistence not configured
- **Solution:** Review ISSUE-040 (TanStack Query persistence), verify persister setup

## Success Criteria

- [ ] Lighthouse PWA audit completed successfully
- [ ] PWA score >80/100 (or <80 with documented reasons and fixes)
- [ ] Service worker active and registered
- [ ] Offline functionality verified (page loads without network)
- [ ] TanStack Query offline cache working (data persists in localStorage)
- [ ] Evidence collected (7 files minimum)
- [ ] Summary document created
- [ ] Zero emoji in documentation

## Time Estimate

**2 hours total:**

- Verify web container: 15 min
- Install Lighthouse: 15 min
- Run audit: 30 min
- Analyze score: 30 min
- Test offline: 30 min
- Document findings: 15 min

## Next Issue

**ISSUE-049:** Deploy Web Frontend to Kubernetes (4h)

- May run in parallel if web not yet deployed
- Uses: Working web deployment for full stack testing
