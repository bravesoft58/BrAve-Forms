# ISSUE-041: Test Offline Mode with Lighthouse

**Sprint:** Sprint 1 | **Phase:** Phase 5 - PWA & Offline | **Priority:** P0
**Time:** 25 minutes | **Points:** 2 | **Status:** Not Started
**Created:** 2025-10-01 16:55:00 EDT
**Dependencies:** ISSUE-040 ✅

---

## What You'll Do

Verify PWA score greater than 80 and offline functionality works correctly.

---

## Step-by-Step Instructions

### Prerequisites
- ISSUE-040 complete (TanStack Query persistence configured)

### Steps

1. Build production app:
```bash
pnpm --filter web build
```

2. Start production server:
```bash
pnpm --filter web start
```

3. Open Chrome browser to `http://localhost:3000`

4. Open Chrome DevTools (F12)

5. Navigate to Lighthouse tab

6. Configure audit:
   - Select "Progressive Web App" category
   - Select "Navigation" mode
   - Click "Analyze page load"

7. Wait for audit (2-3 minutes)

8. Verify PWA score greater than 80

9. Test offline mode:
   - Application tab → Service Workers
   - Check "Offline" checkbox
   - Refresh page
   - Verify app still loads

10. Test cached queries:
    - Load organizations page (online)
    - Go offline
    - Navigate away and back
    - Verify data still displays

11. Screenshot Lighthouse results and offline test

---

## Files to Verify

**Check these:**
- Service worker registered
- Manifest detected
- Icons present
- Offline mode functional

---

## Verification Checklist

- [ ] Production build succeeds
- [ ] Lighthouse PWA score greater than 80
- [ ] Service worker registered
- [ ] manifest.json detected
- [ ] Offline mode functional (page loads)
- [ ] Cached data accessible offline
- [ ] Evidence collected

---

## Testing Steps

1. Check service worker:
```
DevTools → Application → Service Workers → Check status
```

2. Check manifest:
```
DevTools → Application → Manifest → Verify all fields
```

3. Check cache:
```
DevTools → Application → Cache Storage → Verify cached files
```

4. Check IndexedDB:
```
DevTools → Application → IndexedDB → Verify query cache
```

---

## Evidence Requirements

**Location:** `evidence/ISSUE-041/deployment/`

**Required Screenshots:**
1. `lighthouse-pwa-score.png` - Lighthouse report showing PWA score greater than 80
2. `offline-mode-working.png` - App loading in offline mode
3. `service-worker-registered.png` - DevTools showing active service worker
4. `indexeddb-queries.png` - Cached queries in IndexedDB

---

## Troubleshooting

**Problem:** PWA score less than 80
- Check manifest completeness
- Verify service worker registered
- Check icons exist and correct sizes
- Verify HTTPS or localhost (required for PWA)

**Problem:** Offline mode doesn't work
- Check service worker status (should be "activated")
- Verify caching strategies in next.config.js
- Check for service worker errors in console

**Problem:** Cached queries not accessible offline
- Verify TanStack Query persistence configured
- Check IndexedDB has data
- Verify gcTime is set (30 days)

**Problem:** Lighthouse timeout
- Close other tabs
- Clear browser cache
- Restart browser
- Try incognito mode

---

## Success Criteria

- Lighthouse PWA score greater than 80
- Service worker registered and active
- Manifest detected with all required fields
- Offline mode functional
- Cached queries accessible offline
- All evidence collected

---

## Next Issue

**ISSUE-042:** Write Tests for Weather Service (25 minutes)

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P0
**Estimated Time:** 25 minutes
