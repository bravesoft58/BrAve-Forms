# ISSUE-012: Create TanStack Query Setup - COMPLETION REPORT

**Completed:** 2025-10-01 20:00:00 UTC
**Duration:** 1 hour
**Status:** COMPLETE

## Summary

Successfully set up TanStack Query v5 with offline-first configuration and localStorage persistence for 30-day offline capability.

## Files Created

### 1. apps/web/lib/query-client.ts

**Key Configuration:**
- `networkMode: 'offlineFirst'` - Queries work without connectivity
- `gcTime: 30 days` (2592000000ms) - Cache persists for EPA compliance requirement
- `staleTime: 5 minutes` - Balance between freshness and offline capability
- Retry logic for flaky construction site connectivity
- Exponential backoff for retries

**Persister Setup:**
- Uses `createAsyncStoragePersister` from `@tanstack/query-async-storage-persister`
- localStorage backend for web (with SSR safety checks)
- Key: `BRAVE_FORMS_QUERY_CACHE`
- Throttle time: 1000ms to avoid excessive writes

**NOTE:** Includes warning about iOS IndexedDB reclamation - critical compliance data should use SQLite via Capacitor.

## Files Modified

### 2. apps/web/app/providers.tsx

**Changes:**
- Replaced `QueryClientProvider` with `PersistQueryClientProvider`
- Import from new `@/lib/query-client` instead of old location
- Added persister configuration
- Removed Apollo imports
- Commented out store functions that depend on non-existent store (to be implemented later)

**Before:**
```typescript
<QueryClientProvider client={queryClient}>
```

**After:**
```typescript
<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{ persister }}
>
```

## Verification

### Type Check Results
- ✅ No errors in query-client.ts
- ✅ No errors in providers.tsx related to TanStack Query
- ✅ All TanStack Query types resolve correctly

### Configuration Validated
- ✅ Offline-first network mode enabled
- ✅ 30-day cache persistence configured
- ✅ Persister properly configured
- ✅ DevTools already in layout.tsx (development only)

## Acceptance Criteria Status

- [x] query-client.ts created with offline config
- [x] layout.tsx updated with provider (via providers.tsx)
- [x] DevTools visible in dev mode (already configured in layout.tsx)

## Key Features

### Offline-First Configuration

**Query Defaults:**
- Network mode: offlineFirst
- Garbage collection time: 30 days
- Stale time: 5 minutes
- Retry: 3 attempts with exponential backoff
- Refetch on: window focus, mount, reconnect

**Mutation Defaults:**
- Network mode: offlineFirst
- Retry: 2 attempts

### Persistence Strategy

**localStorage Backend:**
```typescript
storage: {
  getItem: async (key) => localStorage.getItem(key) + JSON.parse
  setItem: async (key, value) => localStorage.setItem(key, JSON.stringify(value))
  removeItem: async (key) => localStorage.removeItem(key)
}
```

**SSR Safety:**
- All storage operations check `typeof window !== 'undefined'`
- Prevents errors during server-side rendering

## Next Steps

- ISSUE-012 COMPLETE
- Ready for ISSUE-013 (Weather API helper functions)

## Dependencies Already Installed

```json
"@tanstack/query-async-storage-persister": "^5.14.2",
"@tanstack/react-query": "^5.14.2",
"@tanstack/react-query-devtools": "^5.14.2",
"@tanstack/react-query-persist-client": "^5.14.2"
```

All required TanStack Query packages were already present in package.json.

## Technical Notes

### Retry Strategy

Exponential backoff with cap:
```typescript
retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
```

- Attempt 1: 2s delay
- Attempt 2: 4s delay
- Attempt 3: 8s delay
- Max: 30s cap

### Construction Site Optimization

- Multiple retries for flaky connectivity
- Offline-first mode prevents network errors from blocking UI
- 30-day persistence meets EPA inspection requirements
- Refetch on reconnect ensures data freshness when online
