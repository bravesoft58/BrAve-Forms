# ISSUE-041: Test Offline Mode with Lighthouse - DEFERRED

**Status:** DEFERRED TO SPRINT 2
**Reason:** Requires proper frontend container setup
**Created:** 2025-10-02

---

## Why Deferred

**Technical Blocker:** Production build uses `output: 'standalone'` mode which requires proper Docker/Kubernetes deployment for testing.

**Current State:**

- PWA configuration COMPLETE (service worker, manifest, persistence)
- Production build succeeds
- Service worker files generated (sw.js, workbox-\*.js)
- TanStack Query persistence with IndexedDB configured

**What's Missing:**

- Properly running production Next.js server
- `next start` doesn't work with standalone output
- Standalone server file (.next/standalone/server.js) not generated
- Need Docker container or Kubernetes deployment

**Decision:** Skip Lighthouse testing in Sprint 1, defer to Sprint 2 when proper frontend infrastructure is deployed.

---

## What Was Completed (ISSUE-040)

All PWA infrastructure is ready:

### Service Worker Configuration

- Configured in next.config.js with 5 caching strategies
- NetworkFirst for APIs (10s timeout)
- CacheFirst for static assets
- StaleWhileRevalidate for JS/CSS

### PWA Manifest

- Complete manifest.json with all required fields
- Icon files (192x192, 512x512) created
- Linked in layout.tsx metadata

### TanStack Query Persistence

- IndexedDB storage via idb-keyval
- 30-day retention (gcTime)
- 5-minute staleTime
- Offline-first network mode
- Simplified implementation (60% code reduction)

---

## Testing Plan for Sprint 2

When frontend container is ready:

1. Deploy web app to Kubernetes
2. Access via proper domain/port
3. Run Lighthouse PWA audit
4. Verify score greater than 80
5. Test offline mode functionality
6. Verify IndexedDB persistence
7. Screenshot evidence

---

## Related Discovery Issue

**DISCOVERY-004** added to ISSUE-047:

- Tracks PWA testing blocker
- Assigned to Sprint 2
- Priority: HIGH
- Action: Set up frontend container infrastructure

---

## Next Steps

Moving to **ISSUE-042: Write Tests for Weather Service** which doesn't require frontend infrastructure.

---

**Deferred By:** AI Development Agent
**Date:** 2025-10-02
**Assigned Sprint:** Sprint 2 (Frontend Infrastructure)
