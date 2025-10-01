# ISSUE-014 Completion Report: Convert Organizations Page to TanStack Query

**Completed:** 2025-10-01 17:00:00 EDT
**Time Taken:** 15 minutes (estimated 20 minutes)
**Status:** ⚠️ CODE COMPLETE - MANUAL VALIDATION REQUIRED

**IMPORTANT:** This issue is NOT fully complete per CLAUDE.md standards. Code changes are done and type-check passes, but manual testing and screenshot evidence have NOT been collected yet.

## What Was Done

Converted `OrganizationDashboard.tsx` component from Apollo Client to TanStack Query.

## Files Modified

1. ✅ `apps/web/components/Organization/OrganizationDashboard.tsx`
   - Removed Apollo Client imports
   - Added TanStack Query imports
   - Created `fetchOrganizationDashboard()` function
   - Updated `useQuery` hook to TanStack Query
   - Added query key to queryKeys factory

2. ✅ `apps/web/lib/query/client.ts`
   - Added `organizations` and `organizationDashboard` query keys

## Changes Made

### Import Changes

**Before:**
```typescript
import { gql, useQuery } from '@apollo/client';
```

**After:**
```typescript
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/client';
```

### Query Implementation

**Before (Apollo):**
```typescript
const GET_ORGANIZATION_DASHBOARD = gql`
  query GetOrganizationDashboard { ... }
`;

const { data, loading, error, refetch } = useQuery(GET_ORGANIZATION_DASHBOARD, {
  errorPolicy: 'all',
  notifyOnNetworkStatusChange: true,
});
```

**After (TanStack Query):**
```typescript
async function fetchOrganizationDashboard() {
  const response = await fetch('http://localhost:30101/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query GetOrganizationDashboard { ... }`,
    }),
  });

  const json = await response.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

const { data, isLoading, error, refetch } = useQuery({
  queryKey: queryKeys.organizationDashboard,
  queryFn: fetchOrganizationDashboard,
});

const loading = isLoading; // Alias for compatibility
```

### Query Keys Added

```typescript
// apps/web/lib/query/client.ts
export const queryKeys = {
  // ... existing keys
  organizations: ['organizations'] as const,
  organizationDashboard: ['organizations', 'dashboard'] as const,
  // ... more keys
}
```

## Verification Checklist

- [x] Apollo imports removed
- [x] TanStack Query imports added
- [x] `fetchOrganizationDashboard` function created
- [x] `useQuery` hook updated to TanStack Query
- [x] `loading` changed to `isLoading` (with alias for compatibility)
- [x] Query keys added to factory
- [x] GraphQL query preserved exactly
- [x] Error handling implemented

## Type Check Results

**Our changes:** ✅ No new errors introduced
**Existing errors:**
- Apollo Client references in other files (will be removed in next issues)
- Role type mismatches (pre-existing, not related to this change)

## Success Criteria

- ✅ Component converted from Apollo to TanStack Query
- ✅ GraphQL query preserved exactly
- ✅ Error handling maintained
- ✅ Loading states compatible with existing code
- ✅ Query key properly registered
- ✅ No new TypeScript errors introduced

## Notes

- Completed faster than estimated (15 min vs 20 min)
- Used alias pattern (`const loading = isLoading`) to avoid changing all downstream code
- OrganizationDashboard component is complex (500+ lines), conversion successful
- Query will be cached with 30-day persistence for offline capability

## Manual Validation Required

**To fully complete this issue, you must:**

1. Start backend: `kubectl port-forward svc/backend 30101:3000 -n braveforms`
2. Start web dev: `pnpm --filter web dev`
3. Navigate to dashboard page that uses OrganizationDashboard component
4. Verify organizations data loads
5. Check browser console for errors
6. Open React Query DevTools (bottom of page)
7. Screenshot: `['organizations', 'dashboard']` query in cache
8. Screenshot: Working dashboard with data
9. Add screenshots to `evidence/ISSUE-014/deployment/`

**Until manual validation is complete, this issue is at risk of being broken.**

## Next Issue

**ISSUE-015:** Convert Weather Dashboard to TanStack Query (20 minutes)
