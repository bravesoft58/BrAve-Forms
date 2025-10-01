# ISSUE-040: Configure TanStack Query Persistence

**Sprint:** Sprint 1 | **Phase:** Phase 5 - PWA & Offline | **Priority:** P0
**Time:** 20 minutes | **Points:** 2 | **Status:** Not Started
**Created:** 2025-10-01 16:50:00 EDT
**Dependencies:** ISSUE-039 ✅

---

## What You'll Do

Add IndexedDB persistence to TanStack Query for offline data access.

---

## Step-by-Step Instructions

### Prerequisites
- ISSUE-039 complete (manifest configured)
- TanStack Query setup exists (from ISSUE-012)

### Steps

1. Install persistence package:
```bash
pnpm --filter web add @tanstack/query-async-storage-persister
pnpm --filter web add idb-keyval
```

2. Create `apps/web/lib/query-client-persist.ts`:
```typescript
import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { get, set, del } from 'idb-keyval';

export function createPersistentQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 60 * 24 * 30, // 30 days (was cacheTime)
      },
    },
  });

  const asyncStoragePersister = createAsyncStoragePersister({
    storage: {
      getItem: async (key) => await get(key),
      setItem: async (key, value) => await set(key, value),
      removeItem: async (key) => await del(key),
    },
  });

  persistQueryClient({
    queryClient,
    persister: asyncStoragePersister,
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  });

  return queryClient;
}
```

3. Update `apps/web/app/providers.tsx` to use persistent client:
```typescript
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { createPersistentQueryClient } from '@/lib/query-client-persist';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createPersistentQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

4. Save all files

---

## Files to Create/Modify

**Create:**
- `apps/web/lib/query-client-persist.ts`

**Modify:**
- `apps/web/app/providers.tsx`
- `apps/web/package.json` (dependencies)

---

## Verification Checklist

- [ ] Persistence packages installed
- [ ] Persistent query client created
- [ ] IndexedDB storage configured (via idb-keyval)
- [ ] 30-day cache time configured
- [ ] Providers updated to use persistent client
- [ ] Build succeeds
- [ ] TypeScript compiles without errors

---

## Testing Steps

1. Build app: `pnpm --filter web build`
2. Start app: `pnpm --filter web dev`
3. Open DevTools → Application → IndexedDB
4. Verify TanStack Query database created
5. Make a query (e.g., load organizations)
6. Refresh page and verify data loads from cache

---

## Evidence Requirements

**Location:** `evidence/ISSUE-040/code/`

**Required Screenshots:**
1. `query-client-persist.png` - Persistent client configuration
2. `indexeddb-cache.png` - DevTools showing cached queries in IndexedDB

---

## Troubleshooting

**Problem:** TypeScript errors on gcTime
- TanStack Query v5 renamed `cacheTime` to `gcTime`
- Use: `gcTime: 1000 * 60 * 60 * 24 * 30`

**Problem:** IndexedDB not working
- Check browser supports IndexedDB (all modern browsers)
- Verify idb-keyval installed correctly
- Check for quota errors (browser storage limits)

**Problem:** Build errors
- Verify 'use client' directive in providers.tsx
- Check async/await syntax in storage functions

---

## Success Criteria

- Persistence packages installed
- Persistent query client configured
- 30-day cache time set
- IndexedDB storage working
- Queries persist across page refreshes
- Build succeeds
- Evidence collected

---

## Next Issue

**ISSUE-041:** Test Offline Mode with Lighthouse (25 minutes)

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P0
**Estimated Time:** 20 minutes
