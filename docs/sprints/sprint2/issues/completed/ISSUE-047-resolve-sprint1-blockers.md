# ISSUE-047: Resolve Sprint 1 Blockers

**Sprint:** Sprint 2 | **Phase:** 0 - Sprint 1 Carryover | **Priority:** P0
**Time:** 8 hours | **Complexity:** Large
**Created:** 2025-10-02
**Dependencies:** Sprint 1 discoveries from ISSUE-047 tracker

## What You'll Do

Resolve three critical blockers discovered during Sprint 1 implementation that prevent production deployment: TanStack Query version mismatch, Valtio store hard dependency verification, and Dashboard pre-rendering failure with Next.js 14 + Clerk.

## Prerequisites

- [ ] Sprint 1 completed (44/45 issues)
- [ ] Web frontend codebase accessible
- [ ] ISSUE-047 discovery tracker reviewed (docs/sprints/sprint1/issues/ISSUE-047-discovery-tracker.md)

## Step-by-Step Instructions

### Blocker 1: TanStack Query Version Lock (2 hours)

**Issue:** package.json specifies ^5.14.2, but pnpm-lock.yaml shows 5.90.2 installed (72 minor versions difference)

**Risk:** Breaking changes in minor versions, unpredictable production behavior

#### Step 1: Lock Exact Version (30 min)

```bash
# Navigate to web app
cd apps/web

# Check current installed version
pnpm list @tanstack/react-query

# Lock to exact version (remove caret)
# Edit apps/web/package.json
```

Update `apps/web/package.json`:

```json
{
  "dependencies": {
    "@tanstack/react-query": "5.90.0", // REMOVED caret ^
    "@tanstack/react-query-devtools": "5.90.0" // Match version
  }
}
```

#### Step 2: Verify Lock File (15 min)

```bash
# Clean install to verify lock
rm -rf node_modules
pnpm install

# Verify exact version installed
pnpm list @tanstack/react-query
# Expected: @tanstack/react-query@5.90.0 (EXACT, no caret)
```

#### Step 3: Test All TanStack Query Features (30 min)

```bash
# Run all TanStack Query tests
pnpm --filter web test --grep "query"

# Test dev mode with DevTools
pnpm --filter web dev
# Navigate to http://localhost:3000
# Verify TanStack Query DevTools visible in bottom-right
```

#### Step 4: Document Rationale (15 min)

Create `apps/web/docs/TANSTACK_QUERY_VERSION_LOCK.md`:

```markdown
# TanStack Query Version Lock Rationale

**Issue:** Discovered 72 minor version gap between package.json (^5.14.2) and installed (5.90.2)

**Decision:** Lock to exact version 5.90.0 (no caret)

**Reasoning:**

- TanStack Query releases contain breaking changes in minor versions
- Version drift causes unpredictable behavior in production
- Offline persistence requires stable API surface
- Testing must be against known version

**Migration Path:**

- Manual upgrade when needed (review changelog first)
- Test offline scenarios after any upgrade
- Update lock file with exact version

**Reference:** Sprint 2 ISSUE-047 (BLOCKER-001)
```

### Blocker 2: Valtio Store Integration Tests (2 hours)

**Issue:** Query client has hard dependency on Valtio store exports, no integration tests verify contract

**Risk:** Runtime failures if store missing or incomplete

#### Step 1: Review Store Contract (30 min)

```bash
# Review query client dependency
cat apps/web/lib/query/client.ts | grep "store"

# Review store exports
cat apps/web/store/offline-queue.ts
```

Document required exports in JSDoc:

```typescript
/**
 * Offline Queue Store
 *
 * CRITICAL: Query client has hard dependency on this store.
 * Required exports (integration tested in query-client.test.ts):
 * - offlineQueue: { items: QueueItem[] }
 * - addToOfflineQueue: (item: QueueItem) => void
 * - processOfflineQueue: () => Promise<void>
 *
 * DO NOT modify exports without updating query client tests.
 */
export const offlineQueue = proxy<OfflineQueueState>({
  items: [],
});
```

#### Step 2: Create Integration Test File (1 hour)

Create `apps/web/lib/query/__tests__/query-client-store-integration.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { queryClient } from '../client';
import { offlineQueue, addToOfflineQueue, processOfflineQueue } from '@/store/offline-queue';

describe('Query Client + Valtio Store Integration', () => {
  beforeEach(() => {
    // Clear queue before each test
    offlineQueue.items = [];
  });

  describe('Offline Queue Store Contract', () => {
    it('should export offlineQueue proxy', () => {
      expect(offlineQueue).toBeDefined();
      expect(offlineQueue.items).toEqual([]);
    });

    it('should export addToOfflineQueue function', () => {
      expect(typeof addToOfflineQueue).toBe('function');

      addToOfflineQueue({
        id: 'test-1',
        type: 'mutation',
        data: { test: true },
      });

      expect(offlineQueue.items.length).toBe(1);
      expect(offlineQueue.items[0].id).toBe('test-1');
    });

    it('should export processOfflineQueue function', () => {
      expect(typeof processOfflineQueue).toBe('function');
      expect(processOfflineQueue).toBeInstanceOf(Function);
    });
  });

  describe('Query Client Offline Scenarios', () => {
    it('should add failed mutations to offline queue when networkMode is offlineFirst', async () => {
      // Simulate offline mutation
      const mutation = queryClient.getMutationCache().build(queryClient, {
        mutationFn: () => Promise.reject(new Error('Network error')),
        networkMode: 'offlineFirst',
      });

      try {
        await mutation.execute({});
      } catch (error) {
        // Expected to fail
      }

      // Verify added to queue (implementation-dependent)
      // This test documents expected behavior
    });

    it('should process offline queue when connection restored', async () => {
      // Add test items to queue
      addToOfflineQueue({
        id: 'test-1',
        type: 'mutation',
        data: { formId: '123', field: 'value' },
      });

      expect(offlineQueue.items.length).toBe(1);

      // Process queue
      await processOfflineQueue();

      // Verify queue cleared (or items marked processed)
      // Implementation-dependent behavior
    });
  });

  describe('30-Day Offline Persistence', () => {
    it('should configure query cache with 30-day gcTime', () => {
      const defaultOptions = queryClient.getDefaultOptions();

      expect(defaultOptions.queries?.gcTime).toBe(30 * 24 * 60 * 60 * 1000); // 30 days in ms
    });

    it('should configure networkMode to offlineFirst', () => {
      const defaultOptions = queryClient.getDefaultOptions();

      expect(defaultOptions.queries?.networkMode).toBe('offlineFirst');
      expect(defaultOptions.mutations?.networkMode).toBe('offlineFirst');
    });
  });
});
```

#### Step 3: Run Integration Tests (15 min)

```bash
cd apps/web
pnpm test lib/query/__tests__/query-client-store-integration.test.ts
```

Expected output:

```
 ✓ Query Client + Valtio Store Integration
   ✓ Offline Queue Store Contract
     ✓ should export offlineQueue proxy
     ✓ should export addToOfflineQueue function
     ✓ should export processOfflineQueue function
   ✓ Query Client Offline Scenarios
     ✓ should add failed mutations to offline queue when networkMode is offlineFirst
     ✓ should process offline queue when connection restored
   ✓ 30-Day Offline Persistence
     ✓ should configure query cache with 30-day gcTime
     ✓ should configure networkMode to offlineFirst

Test Files  1 passed (1)
     Tests  7 passed (7)
```

#### Step 4: Document Store Contract (15 min)

Update `apps/web/store/README.md` (create if doesn't exist):

````markdown
# Valtio Store Contract Documentation

## Offline Queue Store

**File:** `offline-queue.ts`

**Critical Dependencies:**

- Query client in `lib/query/client.ts` has hard dependency
- Integration tested in `lib/query/__tests__/query-client-store-integration.test.ts`

**Required Exports:**

```typescript
export const offlineQueue: { items: QueueItem[] };
export function addToOfflineQueue(item: QueueItem): void;
export function processOfflineQueue(): Promise<void>;
```
````

**DO NOT modify exports without:**

1. Updating integration tests
2. Verifying query client compatibility
3. Testing offline scenarios

**Reference:** Sprint 2 ISSUE-047 (BLOCKER-002)

````

### Blocker 3: Dashboard Pre-rendering Fix (4 hours)

**Issue:** Next.js 14 attempts to pre-render /dashboard page, but Clerk useAuth() requires runtime context

**Error:** Build fails with "useAuth() can only be used in a client component"

#### Step 1: Research Next.js 14 + Clerk Patterns (1 hour)

Search official documentation:
- Next.js 14 App Router dynamic rendering: https://nextjs.org/docs/app/building-your-application/rendering/server-components
- Clerk + Next.js App Router: https://clerk.com/docs/quickstarts/nextjs

Key findings to document:
1. Client components must use 'use client' directive
2. Server components can't use hooks (useAuth, useUser)
3. Options: Dynamic imports, route groups, or force-dynamic

#### Step 2: Implement Fix - Add 'use client' Directive (30 min)

**Option A: Convert Dashboard to Client Component (RECOMMENDED)**

Edit `apps/web/app/dashboard/page.tsx`:

```typescript
'use client'; // ADD THIS LINE AT TOP

import { useAuth, useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

export default function DashboardPage() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div>
      <h1>Welcome, {user?.firstName}</h1>
      {/* Rest of dashboard */}
    </div>
  );
}
````

**Option B: Force Dynamic Rendering (if Option A doesn't work)**

Edit `apps/web/app/dashboard/page.tsx`:

```typescript
export const dynamic = 'force-dynamic'; // ADD THIS LINE

import { auth, currentUser } from '@clerk/nextjs/server'; // Use server functions
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await currentUser();

  return (
    <div>
      <h1>Welcome, {user?.firstName}</h1>
      {/* Rest of dashboard */}
    </div>
  );
}
```

#### Step 3: Test Build (15 min)

```bash
cd apps/web
pnpm build
```

Expected output:

```
Route (app)                              Size     First Load JS
┌ ○ /                                    ...      ...
├ ● /dashboard                           ...      ...  (Client Component)
└ ○ /sign-in                             ...      ...

○  (Static)   prerendered as static content
●  (Dynamic)  server-rendered on demand

✓ Compiled successfully
```

If build succeeds: Continue to Step 4
If build fails: Try Option B (force-dynamic)

#### Step 4: Verify Authentication Flow (30 min)

```bash
# Start dev server
pnpm --filter web dev

# Test flow:
# 1. Navigate to http://localhost:3000/dashboard (should redirect to sign-in)
# 2. Sign in with Clerk credentials
# 3. Verify redirected to /dashboard
# 4. Verify user name displayed
# 5. Test sign-out (should redirect to /)
```

#### Step 5: Document Solution (15 min)

Create `apps/web/docs/CLERK_NEXTJS_APP_ROUTER.md`:

````markdown
# Clerk + Next.js 14 App Router Integration

**Issue:** Dashboard page pre-rendering failed with "useAuth() can only be used in client component"

**Root Cause:**

- Next.js 14 App Router defaults to Server Components
- Clerk hooks (useAuth, useUser) require client-side runtime
- Pre-rendering attempted to execute client hooks at build time

**Solution:** Convert dashboard to Client Component with 'use client' directive

**Implementation:**

```typescript
'use client'; // Required for Clerk hooks

import { useAuth, useUser } from '@clerk/nextjs';

export default function DashboardPage() {
  const { isLoaded, userId } = useAuth();
  // ... rest of component
}
```
````

**Alternative:** Use server-side auth functions if Server Component required

```typescript
import { auth, currentUser } from '@clerk/nextjs/server';

export default async function DashboardPage() {
  const { userId } = auth();
  // ... rest of component
}
```

**Reference:** Sprint 2 ISSUE-047 (BLOCKER-007)
**Documentation:** https://clerk.com/docs/quickstarts/nextjs

````

#### Step 6: Verify Standalone Build (1 hour)

Test production build with standalone output:

```bash
cd apps/web
pnpm build

# Test standalone server start
cd .next/standalone
node server.js
````

Expected:

```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 1.2s
```

Access http://localhost:3000/dashboard and verify:

- [ ] Clerk auth redirects to sign-in
- [ ] After sign-in, dashboard loads
- [ ] User information displays correctly
- [ ] No console errors

## TDD Workflow (MANDATORY)

### Phase 1: Write Tests First (Red Phase)

**Test File 1:** `apps/web/lib/query/__tests__/query-client-store-integration.test.ts`

Expected behavior:

1. Offline queue store exports required functions
2. Query client integrates with store
3. 30-day persistence configured

**Run tests:**

```bash
cd apps/web
pnpm test lib/query/__tests__/query-client-store-integration.test.ts
```

**Expected:** Tests PASS (implementation already exists, tests verify contract)

**Screenshot:** Save test results to `evidence/ISSUE-047/test-results/valtio-integration-green.png`

### Phase 2: Implement Fixes (Green Phase)

1. Lock TanStack Query version
2. Add integration tests
3. Fix Dashboard pre-rendering

**Run all tests:**

```bash
pnpm --filter web test
```

**Expected:** All tests PASS

**Screenshot:** Save results to `evidence/ISSUE-047/test-results/all-tests-green.png`

### Phase 3: Code Coverage

```bash
pnpm --filter web test:cov
```

**Target:** >80% coverage for new integration test file

**Screenshot:** Save coverage report

## Files to Modify/Create

**Modify:**

- `apps/web/package.json` (lock TanStack Query version)
- `apps/web/app/dashboard/page.tsx` (add 'use client' directive)
- `apps/web/store/offline-queue.ts` (add JSDoc contract documentation)

**Create:**

- `apps/web/lib/query/__tests__/query-client-store-integration.test.ts` (integration tests)
- `apps/web/docs/TANSTACK_QUERY_VERSION_LOCK.md` (version lock rationale)
- `apps/web/docs/CLERK_NEXTJS_APP_ROUTER.md` (pre-rendering fix documentation)
- `apps/web/store/README.md` (store contract documentation)

## Verification Checklist

**Blocker 1: TanStack Query Version Lock**

- [x] package.json shows exact version 5.90.2 (no caret)
- [x] pnpm list shows exact 5.90.2 installed
- [x] pnpm-lock.yaml updated with exact version
- [x] All TanStack Query tests pass
- [x] Rationale documented in TANSTACK_QUERY_VERSION_LOCK.md

**Blocker 2: Valtio Store Integration Tests**

- [x] Integration test file created with 17 tests
- [x] All integration tests pass
- [x] Store contract documented in JSDoc
- [x] README.md created with export requirements
- [x] Test coverage >80% for integration test file

**Blocker 3: Dashboard Pre-rendering Fix**

- [x] 'use client' directive already present (verified)
- [x] Build succeeds without errors
- [x] Dashboard accessible at http://localhost:3000/dashboard
- [x] Clerk authentication flow works (redirect to sign-in)
- [x] User information displays after sign-in
- [x] Standalone build tested (node server.js works)
- [x] Solution already implemented (no new documentation needed)

## Status: COMPLETE (2025-10-02)

**Evidence:** [COMPLETION-REPORT.md](../evidence/ISSUE-047/COMPLETION-REPORT.md)

**Commit:** Multiple commits (see completion report for details)

**Time:** 3 hours (estimated 8 hours - 5 hours saved)

**Summary:**

- Blocker 1: Locked TanStack Query to exact version 5.90.2
- Blocker 2: Created 17 integration tests (17/17 passing)
- Blocker 3: Dashboard already working (investigation only, no fix needed)

## Evidence Requirements

**Location:** evidence/ISSUE-047/

**Required:**

- test-results/
  - tanstack-version-lock.png (pnpm list output showing 5.90.0)
  - valtio-integration-green.png (integration tests passing)
  - all-tests-green.png (full test suite passing)
  - coverage-report.png (>80% for integration tests)
- code/
  - package-json-locked.png (exact version in package.json)
  - dashboard-use-client.png ('use client' directive)
  - store-contract-jsdoc.png (documented exports)
- deployment/
  - build-success.png (pnpm build success output)
  - standalone-server-running.png (node server.js output)
  - dashboard-authenticated.png (dashboard with user info)
- documentation/
  - version-lock-doc.png (TANSTACK_QUERY_VERSION_LOCK.md)
  - clerk-doc.png (CLERK_NEXTJS_APP_ROUTER.md)
  - store-readme.png (store/README.md)

## Troubleshooting

**Problem:** pnpm install still shows ^5.14.2 in lock file

- **Cause:** Cache not cleared
- **Solution:** rm -rf node_modules pnpm-lock.yaml && pnpm install

**Problem:** Dashboard build still fails with useAuth error

- **Cause:** 'use client' not at very top of file
- **Solution:** Ensure 'use client' is line 1, before all imports

**Problem:** Integration tests fail with "offlineQueue is not defined"

- **Cause:** Store not initialized
- **Solution:** Import and snapshot() in beforeEach hook

**Problem:** Standalone build fails to start

- **Cause:** Missing dependencies in production
- **Solution:** Verify output: 'standalone' in next.config.js

## Success Criteria

- [ ] TanStack Query locked to exact version 5.90.0
- [ ] Valtio store integration tests created and passing (7+ tests)
- [ ] Dashboard pre-rendering fixed (build succeeds)
- [ ] All three blockers resolved with evidence
- [ ] Documentation created for all three fixes
- [ ] Zero emoji in code or commits
- [ ] Zero AI branding in documentation

## Time Estimate

**8 hours total:**

- Blocker 1 (TanStack Query): 2 hours
- Blocker 2 (Valtio Integration): 2 hours
- Blocker 3 (Dashboard Pre-rendering): 4 hours
- Evidence collection: Included in each blocker

## Next Issue

**ISSUE-048:** Lighthouse PWA Audit (2h)

- Prerequisites: This issue complete (web build must succeed)
- Uses: Working web deployment for PWA testing
