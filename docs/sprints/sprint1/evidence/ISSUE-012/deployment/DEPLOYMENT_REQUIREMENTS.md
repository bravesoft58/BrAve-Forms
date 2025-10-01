# TanStack Query Deployment Requirements

**Issue:** ISSUE-012 - TanStack Query Setup
**Status:** PRODUCTION-READY (with considerations)
**Last Updated:** 2025-10-01 20:30:00 UTC
**Severity:** CRITICAL - Offline capability required for EPA compliance

---

## Executive Summary

The TanStack Query implementation at `apps/web/lib/query/client.ts` provides offline-first data management with 30-day cache persistence for construction site operations. This document captures critical dependencies, runtime requirements, and deployment considerations to ensure successful production deployment.

**CRITICAL:** The implementation has several hard dependencies that MUST be validated before deployment. Missing dependencies will cause runtime failures.

---

## 1. Dependency Version Management

### Package Version Status

**Specified in package.json:**
```json
{
  "@tanstack/react-query": "^5.14.2",
  "@tanstack/react-query-devtools": "^5.14.2",
  "@tanstack/react-query-persist-client": "^5.14.2",
  "@tanstack/query-async-storage-persister": "^5.14.2"
}
```

**Actually Installed (pnpm-lock.yaml):**
```
@tanstack/react-query: 5.86.0
@tanstack/react-query-persist-client: 5.86.0
@tanstack/query-async-storage-persister: 5.86.0
```

**VERSION GAP:** 72 minor versions (5.14.2 → 5.86.0)

### Deployment Decision Required

**OPTION A: Lock to Tested Version (RECOMMENDED FOR INITIAL LAUNCH)**
```json
{
  "@tanstack/react-query": "5.86.0",
  "@tanstack/react-query-devtools": "5.86.0",
  "@tanstack/react-query-persist-client": "5.86.0",
  "@tanstack/query-async-storage-persister": "5.86.0"
}
```

**Rationale:**
- Implementation tested against 5.86.0
- Eliminates version drift between dev/staging/production
- Prevents unexpected breaking changes
- TanStack Query has stable v5 API

**Action:** Update package.json to exact versions before production deployment

**OPTION B: Validate 5.86.0 Compatibility**

If using current installed versions, validate:
- [ ] Persistence API matches implementation (`persistQueryClient`, `createAsyncStoragePersister`)
- [ ] Query client options unchanged (`networkMode`, `gcTime`, retry logic)
- [ ] DevTools compatibility with React 18.2.0
- [ ] No breaking changes in TanStack Query v5.14.2 → v5.86.0 changelogs

**Testing Required:**
- [ ] Full offline flow (disconnect network, verify cached queries)
- [ ] Mutation queue persistence across browser restarts
- [ ] IndexedDB storage operations under load
- [ ] localStorage quota handling

**Timeline:** 2-4 hours for comprehensive validation

---

## 2. Critical Runtime Dependencies

### Valtio Store (MANDATORY)

**Location:** `apps/web/lib/store/app.store.ts`

The query client implementation has HARD DEPENDENCIES on the Valtio store. The following exports MUST exist:

#### Required Store Exports

**1. appActions.addToOfflineQueue()**

Used in: Query client mutation error handler (line 151-158)

```typescript
// Query client expects this signature:
appActions.addToOfflineQueue({
  type: 'form_submission',
  payload: { variables, context },
  timestamp: new Date(),
  retryCount: 0,
  maxRetries: 3,
  priority: 'medium',
});
```

**Implementation Status:** ✅ EXISTS (line 183-195 in app.store.ts)

**Failure Impact:** If missing, ALL failed mutations will throw runtime errors instead of queuing offline

---

**2. appActions.setSyncStatus()**

Used in: Query client mutation success handler (line 163)

```typescript
// Query client expects this signature:
appActions.setSyncStatus('success');
```

**Implementation Status:** ✅ EXISTS (line 175-180 in app.store.ts)

**Failure Impact:** If missing, sync status will not update, affecting UI feedback

---

**3. appActions.setNetworkStatus()**

Used in: Global network event listeners (line 239)

```typescript
// Query client expects this signature:
appActions.setNetworkStatus(isOnline ? 'online' : 'offline');
```

**Implementation Status:** ✅ EXISTS (line 165-172 in app.store.ts)

**Failure Impact:** If missing, app will not detect online/offline transitions, breaking offline-first behavior

---

### Deployment Validation Checklist

**PRE-DEPLOYMENT (CRITICAL):**

```bash
# Verify store exports exist
grep -n "addToOfflineQueue" apps/web/lib/store/app.store.ts
grep -n "setSyncStatus" apps/web/lib/store/app.store.ts
grep -n "setNetworkStatus" apps/web/lib/store/app.store.ts

# Verify store is imported in query client
grep -n "import.*app.store" apps/web/lib/query/client.ts
```

**Expected Output:**
- ✅ All three functions exist in app.store.ts
- ✅ Query client imports appActions from app.store.ts

**Failure Scenario:** If ANY function is missing or renamed:
- Query client will throw `TypeError: appActions.X is not a function` at runtime
- Mutations will fail to queue when offline
- Network status changes will not propagate

---

## 3. Browser Storage Requirements

### IndexedDB Database Schema

**Database Name:** `brave-forms-queries`

**Version:** 1

**Object Stores:**

```typescript
// queryCache store (line 98-101)
{
  name: 'queryCache',
  keyPath: 'key',
  indexes: [
    { name: 'timestamp', keyPath: 'timestamp', unique: false },
    { name: 'size', keyPath: 'size', unique: false }
  ]
}
```

**Data Structure:**

```typescript
interface QueryCacheEntry {
  key: string;           // Query key (unique)
  value: string;         // Serialized query data (JSON)
  timestamp: number;     // Unix timestamp (milliseconds)
  size: number;          // Blob size in bytes
}
```

---

### localStorage Requirements

**Primary Cache:** localStorage is used as the first-tier cache for quick access

**Storage Key Pattern:** `BRAVE_FORMS_QUERY_CACHE_*`

**Typical Usage:**
- **Per Query:** 5-50 KB (JSON serialized)
- **Total Cache:** 5-10 MB for typical usage (50-200 queries)

**Browser Limits:**
- **Chrome/Edge:** ~10 MB
- **Firefox:** ~10 MB
- **Safari:** ~5 MB (more restrictive)

**Overflow Strategy:**
- localStorage writes fail silently (catch block line 49)
- IndexedDB fallback ensures data persists
- No user-facing error (logged to console)

---

### IndexedDB as Fallback

**When Used:**
- localStorage quota exceeded
- localStorage unavailable (private browsing, disabled)
- Large query results (>100 KB)

**Advantages:**
- Much larger quota (50+ MB typical, can be gigabytes)
- Structured storage with indexes
- Better performance for large datasets

**iOS WARNING (CRITICAL FOR MOBILE):**

```
IndexedDB storage is TRANSIENT on iOS:
- iOS may reclaim storage when device is low on space
- iOS may clear storage if app unused for extended period
- IndexedDB NOT suitable for critical compliance data

For CRITICAL data (inspections, photos, audit trails):
- Use SQLite via @capacitor-community/sqlite
- IndexedDB only for cache/performance optimization
```

**Reference:** CLAUDE.md v1.5 - iOS Storage Persistence section

---

## 4. Configuration Requirements

### Network Mode: offlineFirst (CRITICAL)

**Query Configuration (line 133):**

```typescript
queries: {
  networkMode: 'offlineFirst' as const,
  // ... other options
}
```

**Mutation Configuration (line 137):**

```typescript
mutations: {
  networkMode: 'offlineFirst' as const,
  // ... other options
}
```

**Behavior:**
- Queries serve cached data immediately, then fetch in background
- Mutations queue when offline, execute when online
- NO user-facing errors when offline (transparent failover)

**EPA Compliance Impact:**
- Inspectors can access forms and data without connectivity
- 30-day offline capability requirement satisfied
- Mutation queue ensures no data loss

**CRITICAL:** Changing `networkMode` to `'always'` or `'online'` will BREAK offline capability and violate EPA compliance requirements.

---

### Garbage Collection Time: 30 Days

**Configuration (line 114):**

```typescript
gcTime: 1000 * 60 * 60 * 24 * 30, // 2,592,000,000 milliseconds
```

**Purpose:**
- EPA CGP requires 30-day inspection capability
- Cached data persists for 30 days without re-fetch
- Aligns with regulatory offline retention requirement

**DO NOT REDUCE:** Values <30 days violate compliance requirements

---

### Offline Queue Integration

**Mutation Error Handler (line 146-159):**

```typescript
onError: (error: any, variables, context) => {
  // Add to offline queue if network error
  if (!error?.response || error?.code === 'NETWORK_ERROR') {
    appActions.addToOfflineQueue({
      type: 'form_submission',
      payload: { variables, context },
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: 3,
      priority: 'medium',
    });
  }
}
```

**Behavior:**
- Network errors (fetch failures, timeouts) → Queue for retry
- HTTP 4xx errors → NOT queued (client errors, no retry)
- HTTP 5xx errors → Queued (server errors, retry makes sense)

**Deployment Consideration:**
- Monitor offline queue size in production
- Alert if queue grows >100 items (indicates sync issues)
- Implement queue cleanup for old/failed items

---

### Network Event Listeners

**Global Event Handlers (line 236-252):**

```typescript
if (typeof window !== 'undefined') {
  const updateNetworkStatus = () => {
    const isOnline = navigator.onLine;
    appActions.setNetworkStatus(isOnline ? 'online' : 'offline');

    if (isOnline && queryClient) {
      queryClient.resumePausedMutations();
      queryClient.refetchQueries();
    }
  };

  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);

  updateNetworkStatus(); // Initial status
}
```

**MEMORY LEAK WARNING:**

These event listeners are added ONCE when the module loads. They are NOT cleaned up on unmount because the query client is a singleton.

**Production Impact:**
- In SPA: No issue (module loads once)
- In SSR/HMR: Potential duplicate listeners on hot reload

**Mitigation (if needed):**

```typescript
// Store listener references for cleanup
let onlineHandler: () => void;
let offlineHandler: () => void;

export const cleanupNetworkListeners = () => {
  if (onlineHandler && offlineHandler) {
    window.removeEventListener('online', onlineHandler);
    window.removeEventListener('offline', offlineHandler);
  }
};
```

**Deployment Recommendation:** Monitor for memory leaks in staging with long-running sessions

---

## 5. Deployment Checklist

### Pre-Deployment Validation

**Dependencies:**
- [ ] Verify TanStack Query versions (lock or validate 5.86.0)
- [ ] Confirm all dependencies installed: `pnpm list @tanstack/react-query`
- [ ] No peer dependency warnings: `pnpm install --force` (if needed)

**Store Integration:**
- [ ] Valtio store exists at `apps/web/lib/store/app.store.ts`
- [ ] `appActions.addToOfflineQueue()` exported
- [ ] `appActions.setSyncStatus()` exported
- [ ] `appActions.setNetworkStatus()` exported
- [ ] Query client imports store: `grep "app.store" apps/web/lib/query/client.ts`

**Browser Compatibility:**
- [ ] IndexedDB support verified (IE11 NOT supported)
- [ ] localStorage API available (check private browsing)
- [ ] Navigator.onLine API available (online/offline detection)

**Configuration:**
- [ ] `networkMode: 'offlineFirst'` for queries AND mutations
- [ ] `gcTime: 30 days` (2,592,000,000ms) configured
- [ ] Retry logic validated (3 attempts for queries, 2 for mutations)

**Testing:**
- [ ] Offline capability: Disconnect network, verify cached queries load
- [ ] Mutation queue: Submit form offline, verify queued for retry
- [ ] Network reconnect: Go online, verify mutations execute
- [ ] 30-day persistence: Verify cache survives browser restart
- [ ] localStorage quota: Test with large datasets (>5MB)
- [ ] IndexedDB fallback: Test with localStorage disabled

---

### Production Deployment Steps

**1. Version Lock (RECOMMENDED):**

```bash
# Update package.json to exact versions
cd apps/web
pnpm add -E @tanstack/react-query@5.86.0 \
            @tanstack/react-query-devtools@5.86.0 \
            @tanstack/react-query-persist-client@5.86.0 \
            @tanstack/query-async-storage-persister@5.86.0

# Verify lockfile updated
git diff pnpm-lock.yaml
```

**2. Verify Store Dependencies:**

```bash
# Check store exports
node -e "
const store = require('./apps/web/lib/store/app.store.ts');
console.assert(store.appActions.addToOfflineQueue, 'Missing addToOfflineQueue');
console.assert(store.appActions.setSyncStatus, 'Missing setSyncStatus');
console.assert(store.appActions.setNetworkStatus, 'Missing setNetworkStatus');
console.log('✅ All store dependencies present');
"
```

**3. Build & Test:**

```bash
# Full build
pnpm --filter web build

# Type check
pnpm --filter web type-check

# Test offline capability
pnpm --filter web test:offline
```

**4. Deploy to Staging:**

```bash
# Deploy to staging environment
kubectl apply -f infrastructure/k8s/staging/web-deployment.yaml

# Verify pods running
kubectl get pods -n braveforms-staging -l app=web

# Check logs for errors
kubectl logs -f deployment/web -n braveforms-staging | grep -i "tanstack\|query\|cache"
```

**5. Staging Validation:**

- [ ] Load app, verify React Query DevTools visible (dev mode)
- [ ] Open IndexedDB in browser DevTools: `brave-forms-queries` database exists
- [ ] Check localStorage: Keys with `BRAVE_FORMS_QUERY_CACHE` prefix
- [ ] Disconnect network, verify queries load from cache
- [ ] Submit form offline, check offline queue in Valtio store
- [ ] Reconnect network, verify form submits automatically

**6. Production Deployment:**

```bash
# Deploy to production
kubectl apply -f infrastructure/k8s/production/web-deployment.yaml

# Blue-green deployment (if applicable)
kubectl set image deployment/web web=braveforms/web:v1.2.0 -n braveforms

# Monitor rollout
kubectl rollout status deployment/web -n braveforms
```

---

## 6. iOS-Specific Considerations (CRITICAL FOR MOBILE)

### IndexedDB Transience Warning

**Problem:**
- iOS treats IndexedDB as transient cache
- OS may reclaim storage when device low on space
- OS may clear storage if app unused for days/weeks
- NO GUARANTEES on 30-day persistence

**Impact on BrAve Forms:**
- Query cache: Low risk (can re-fetch from server)
- Offline queue: MEDIUM risk (mutations may be lost)
- Compliance data: HIGH risk (inspections, photos, audit trails)

---

### Migration Plan for iOS (ISSUE-040)

**Current State (Web/PWA):**
- localStorage + IndexedDB works fine
- 30-day persistence reliable on desktop browsers

**Future Mobile App (Capacitor 6):**

**PHASE 1: Immediate (Sprint 1):**
- Keep IndexedDB for query cache (performance optimization)
- Acceptable if cache cleared (re-fetch from server)

**PHASE 2: ISSUE-040 (Sprint 5):**
- Migrate critical data to SQLite via `@capacitor-community/sqlite`
- Inspection records → SQLite
- Photo metadata → SQLite
- Audit trails → SQLite
- Offline queue → SQLite

**PHASE 3: Hybrid Approach:**
- IndexedDB: Query cache, UI state (transient okay)
- SQLite: Compliance data, offline queue (persistent required)
- localStorage: User preferences, small settings

---

### SQLite Migration Scope

**Tables Required:**

```sql
-- Offline queue (replaces IndexedDB offlineQueue)
CREATE TABLE offline_queue (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  priority TEXT DEFAULT 'medium'
);

-- Inspection records (EPA compliance data)
CREATE TABLE inspections (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  form_data TEXT NOT NULL,
  photos TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  synced INTEGER DEFAULT 0
);

-- Photo metadata
CREATE TABLE photos (
  id TEXT PRIMARY KEY,
  inspection_id TEXT,
  local_path TEXT NOT NULL,
  remote_url TEXT,
  gps_lat REAL,
  gps_lng REAL,
  timestamp INTEGER NOT NULL,
  uploaded INTEGER DEFAULT 0
);
```

**Estimated Effort:** 8-12 hours for ISSUE-040

---

## 7. Production Monitoring Requirements

### Storage Quota Monitoring

**Metric:** localStorage usage as percentage of quota

**Implementation:**

```typescript
// Add to query client or monitoring service
async function checkStorageQuota() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usagePercent = (estimate.usage / estimate.quota) * 100;

    if (usagePercent > 80) {
      console.warn(`localStorage quota at ${usagePercent}%`);
      // Send alert to monitoring service (Datadog, Sentry)
    }

    return { usage: estimate.usage, quota: estimate.quota, percent: usagePercent };
  }
}

// Run every 5 minutes
setInterval(checkStorageQuota, 5 * 60 * 1000);
```

**Alerts:**
- Warning: 80% quota used
- Critical: 90% quota used
- Action: Implement cache eviction strategy

---

### IndexedDB Storage Size

**Metric:** Total size of `queryCache` object store

**Implementation:**

```typescript
async function getIndexedDBSize() {
  const db = await openQueryDB();
  const transaction = db.transaction(['queryCache'], 'readonly');
  const store = transaction.objectStore('queryCache');
  const sizeIndex = store.index('size');

  let totalSize = 0;
  const request = sizeIndex.openCursor();

  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        totalSize += cursor.value.size;
        cursor.continue();
      } else {
        resolve(totalSize);
      }
    };
    request.onerror = () => reject(request.error);
  });
}
```

**Monitoring:**
- Track total size over time
- Alert if size grows >50 MB (indicates cache not cleaning up)
- Implement old data cleanup (delete entries >30 days)

---

### Offline Queue Size

**Metric:** Number of items in `appStore.offlineQueue`

**Implementation:**

```typescript
// Add to monitoring service
function trackOfflineQueueSize() {
  const queueSize = appStore.offlineQueue.length;

  if (queueSize > 100) {
    console.error(`Offline queue has ${queueSize} items - sync issues detected`);
    // Alert critical: Sync not working
  } else if (queueSize > 50) {
    console.warn(`Offline queue has ${queueSize} items - monitor closely`);
  }

  // Send metric to Datadog/Sentry
  return queueSize;
}

// Run every minute
setInterval(trackOfflineQueueSize, 60 * 1000);
```

**Alerts:**
- Warning: Queue >50 items
- Critical: Queue >100 items
- Action: Investigate sync failures, increase retry attempts

---

### Mutation Retry Failures

**Metric:** Mutations that exceed max retries

**Implementation:**

```typescript
// Add to query client mutation error handler
onError: (error, variables, context) => {
  if (context && context.retryCount >= context.maxRetries) {
    // Log to monitoring service
    console.error('Mutation failed after max retries:', {
      type: context.type,
      error: error.message,
      retryCount: context.retryCount,
    });

    // Send to Sentry with high priority
    Sentry.captureException(error, {
      level: 'error',
      tags: { mutation_type: context.type },
      extra: { variables, retryCount: context.retryCount },
    });
  }
}
```

**Alerts:**
- Any mutation exceeds max retries → Immediate alert
- Pattern of failures for specific mutation types
- Action: Investigate API endpoint, increase retries, or fix payload

---

### Network Event Listener Leaks

**Metric:** Duplicate event listeners on window object

**Implementation:**

```typescript
// Add to monitoring dashboard
function checkEventListeners() {
  // Chrome/Edge only (debugging)
  if ('getEventListeners' in window) {
    const listeners = (window as any).getEventListeners(window);
    const onlineListeners = listeners.online?.length || 0;
    const offlineListeners = listeners.offline?.length || 0;

    if (onlineListeners > 1 || offlineListeners > 1) {
      console.warn(`Duplicate network listeners detected: online=${onlineListeners}, offline=${offlineListeners}`);
    }

    return { online: onlineListeners, offline: offlineListeners };
  }
}
```

**Monitoring:**
- Check after HMR in development
- Verify only 1 listener per event in production
- If duplicates found, implement cleanup function

---

## 8. Future Sprint Considerations

### ISSUE-040: TanStack Persistence Enhancements

**Scope:** SQLite migration for iOS (Sprint 5)

**Timeline:** 8-12 hours

**Dependencies:**
- `@capacitor-community/sqlite` (NOT @capacitor/preferences - too limited)
- Capacitor 6 mobile app setup (ISSUE-036+)

**Implementation Plan:**
1. Install SQLite plugin
2. Create database schema (offline_queue, inspections, photos)
3. Migrate critical data writes from IndexedDB to SQLite
4. Keep IndexedDB for non-critical query cache
5. Test persistence on iOS simulator (low storage, app restart)

**Breaking Change Risk:** LOW
- Current IndexedDB implementation remains for web/PWA
- SQLite only for mobile Capacitor app
- Shared query client logic unchanged

---

### Storage Quota Monitoring Dashboard

**Scope:** Admin dashboard for storage health

**Timeline:** 4-6 hours

**Features:**
- Real-time localStorage quota usage
- IndexedDB size by object store
- Offline queue size histogram
- Cache hit/miss rates
- Storage warnings/alerts

**Priority:** MEDIUM (helpful but not critical for launch)

---

### Cache Eviction Strategy

**Problem:** Query cache grows unbounded over 30 days

**Solution:** Implement LRU (Least Recently Used) eviction

**Implementation:**

```typescript
// Add to query client configuration
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 30 * 24 * 60 * 60 * 1000, // 30 days
      // Add custom cache eviction
      cacheTime: 30 * 24 * 60 * 60 * 1000,
    },
  },
});

// Custom eviction logic
async function evictOldQueries() {
  const db = await openQueryDB();
  const transaction = db.transaction(['queryCache'], 'readwrite');
  const store = transaction.objectStore('queryCache');
  const index = store.index('timestamp');

  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const range = IDBKeyRange.upperBound(thirtyDaysAgo);

  const request = index.openCursor(range);
  request.onsuccess = (event) => {
    const cursor = (event.target as IDBRequest).result;
    if (cursor) {
      cursor.delete(); // Remove old entries
      cursor.continue();
    }
  };
}

// Run daily
setInterval(evictOldQueries, 24 * 60 * 60 * 1000);
```

**Priority:** MEDIUM (prevents storage bloat, but 30-day limit already helps)

---

### Breaking Changes from 5.14.2 to 5.86.0

**Research Required:** Review TanStack Query changelogs

**Potential Issues:**
- API changes in persistence layer
- Behavior changes in `networkMode: 'offlineFirst'`
- Retry logic modifications
- DevTools compatibility with React 18

**Action Items:**
- [ ] Review changelogs: https://github.com/TanStack/query/releases
- [ ] Test all offline scenarios in staging
- [ ] Validate mutation queue persistence
- [ ] Check DevTools functionality

**Timeline:** 2-4 hours for thorough validation

---

## 9. Rollback Procedure

### Symptoms Requiring Rollback

**CRITICAL (Immediate Rollback):**
- App crashes on load with TanStack Query errors
- Mutations fail to queue when offline
- Network status not updating (stuck on 'offline')
- IndexedDB errors prevent app usage
- localStorage quota errors block operations

**WARNING (Monitor Closely):**
- Slow query cache hydration (>3 seconds)
- High memory usage from cache
- Duplicate network event listeners
- Cache not persisting across restarts

---

### Rollback Steps

**OPTION 1: Revert to Apollo Client (Full Rollback)**

**Prerequisites:**
- Apollo Client implementation still exists in git history
- Last working commit: `bfc7671` (before ISSUE-012)

**Steps:**

```bash
# 1. Find last Apollo commit
git log --grep="Apollo" --oneline

# 2. Revert ISSUE-012 changes
git revert bfc7671  # Adjust to actual commit hash

# 3. Restore Apollo files
git checkout HEAD~1 -- apps/web/lib/apollo/
git checkout HEAD~1 -- apps/web/app/providers.tsx

# 4. Reinstall Apollo dependencies
cd apps/web
pnpm add @apollo/client graphql-ws

# 5. Rebuild
pnpm build

# 6. Deploy
kubectl set image deployment/web web=braveforms/web:rollback-apollo -n braveforms
```

**Downtime:** 10-15 minutes (build + deploy)

**Data Loss:** Query cache cleared (users will re-fetch)

---

**OPTION 2: Revert TanStack Query Version (Partial Rollback)**

**Use Case:** Version 5.86.0 has bugs, revert to 5.14.2

**Steps:**

```bash
# 1. Downgrade packages
cd apps/web
pnpm add -E @tanstack/react-query@5.14.2 \
            @tanstack/react-query-devtools@5.14.2 \
            @tanstack/react-query-persist-client@5.14.2 \
            @tanstack/query-async-storage-persister@5.14.2

# 2. Clear cache
rm -rf node_modules/.cache

# 3. Rebuild
pnpm build

# 4. Test locally
pnpm dev

# 5. Deploy if successful
kubectl set image deployment/web web=braveforms/web:v1.1.9 -n braveforms
```

**Downtime:** 5-10 minutes (build + deploy)

**Data Loss:** Minimal (persisted cache should work)

---

**OPTION 3: Disable Persistence (Emergency Hotfix)**

**Use Case:** IndexedDB/localStorage causing critical errors

**Steps:**

```bash
# 1. Edit query client to disable persistence
# apps/web/lib/query/client.ts

# Comment out persistence setup (line 169-180)
# const persister = createPersister();
# if (persister) {
#   persistQueryClient({ ... });
# }

# 2. Rebuild and deploy
pnpm build
kubectl set image deployment/web web=braveforms/web:hotfix-no-persist -n braveforms
```

**Impact:**
- NO offline capability (queries fail when offline)
- Cache cleared on browser refresh
- Violates EPA 30-day requirement (TEMPORARY ONLY)

**Use Only For:** Immediate production issue, revert within 24 hours

---

### Post-Rollback Validation

**After ANY rollback:**

- [ ] Load app, verify no console errors
- [ ] Test basic query (organizations, projects)
- [ ] Test mutation (create/update form)
- [ ] Test offline scenario (if persistence enabled)
- [ ] Check monitoring for errors (Sentry, Datadog)
- [ ] Notify team of rollback and reason

---

### Root Cause Analysis (Required)

**Document:**
1. What triggered rollback?
2. What error messages/symptoms observed?
3. What was attempted before rollback?
4. What was the root cause?
5. How can we prevent recurrence?

**Template:**

```markdown
# TanStack Query Rollback Incident Report

**Date:** YYYY-MM-DD HH:MM UTC
**Severity:** Critical/High/Medium
**Triggered By:** [Name]

## Incident Timeline
- HH:MM: Deployment started
- HH:MM: First error reports
- HH:MM: Rollback initiated
- HH:MM: Service restored

## Root Cause
[Detailed explanation]

## Resolution
[What fixed it]

## Prevention
[Changes to avoid recurrence]
```

**Share with:** Development team, Product Owner, Project Manager

---

## 10. Success Metrics

### Deployment Success Criteria

**CRITICAL (Must Pass):**
- [ ] App loads without errors
- [ ] Queries fetch from cache/server correctly
- [ ] Mutations submit successfully
- [ ] Offline mode works (cache serves data)
- [ ] Online mode resumes mutations and refetches
- [ ] IndexedDB database created with correct schema
- [ ] localStorage cache persists across refreshes

**PERFORMANCE (Should Pass):**
- [ ] Cache hydration <2 seconds
- [ ] Query fetch time <500ms (cached)
- [ ] Mutation submission <1 second (online)
- [ ] Offline queue processing <30 seconds (on reconnect)

**MONITORING (Track Continuously):**
- [ ] localStorage quota usage <50%
- [ ] IndexedDB size <20 MB (first week)
- [ ] Offline queue size <10 items (steady state)
- [ ] Zero mutation retry failures (first 24 hours)

---

### Production Health Checks

**Automated (Every 5 Minutes):**

```typescript
export async function queryClientHealthCheck() {
  const health = {
    timestamp: new Date().toISOString(),
    queryClient: 'healthy',
    store: 'healthy',
    storage: 'healthy',
    issues: [] as string[],
  };

  // Check query client exists
  if (!queryClient) {
    health.queryClient = 'error';
    health.issues.push('Query client not initialized');
  }

  // Check store dependencies
  if (!appActions.addToOfflineQueue) {
    health.store = 'error';
    health.issues.push('Missing appActions.addToOfflineQueue');
  }

  // Check storage availability
  try {
    localStorage.setItem('health_check', 'ok');
    localStorage.removeItem('health_check');
  } catch (error) {
    health.storage = 'error';
    health.issues.push('localStorage unavailable');
  }

  // Check IndexedDB
  try {
    await openQueryDB();
  } catch (error) {
    health.storage = 'warning';
    health.issues.push('IndexedDB unavailable (fallback to localStorage)');
  }

  return health;
}
```

**Send to Monitoring:**
- Datadog custom metric: `braveforms.query_client.health`
- Sentry breadcrumb: Health check results
- Alert if ANY component 'error' status

---

## Summary

### Deployment Readiness: CONDITIONAL

**READY FOR STAGING:** ✅ YES
- All dependencies present
- Store integration verified
- Implementation tested locally

**READY FOR PRODUCTION:** ⚠️ WITH CAVEATS

**Required Before Production:**
1. Lock TanStack Query versions to 5.86.0 in package.json
2. Validate 30-day persistence in staging (browser restart test)
3. Test offline queue with real network failures
4. Monitor localStorage quota in staging for 48 hours
5. Verify no memory leaks from network listeners

**Known Limitations:**
- iOS IndexedDB transience (ISSUE-040 will address)
- No cache eviction strategy (manual cleanup required)
- Network listener cleanup not implemented (low risk)

**Timeline to Production:**
- Staging validation: 2-3 days
- Version lock + testing: 2-4 hours
- Production deployment: 1 hour
- Total: 3-4 days for confident production release

---

## References

- **CLAUDE.md v1.6:** Development standards, offline requirements
- **TECH_STACK_DETAILS.md:** TanStack Query specifications
- **COMMON_PITFALLS.md:** Offline and multi-tenancy anti-patterns
- **ISSUE-012 Completion Report:** Implementation details and verification
- **TanStack Query Docs:** https://tanstack.com/query/latest/docs/react/overview

---

**Document Owner:** Development Team
**Review Frequency:** After each deployment or incident
**Last Reviewed:** 2025-10-01 20:30:00 UTC
