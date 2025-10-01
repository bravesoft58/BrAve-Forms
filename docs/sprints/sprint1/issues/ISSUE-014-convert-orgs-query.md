# ISSUE-014: Convert Organizations Page to TanStack Query

**Sprint:** Sprint 1 | **Phase:** 3 - Apollo Removal | **Priority:** P0
**Time:** 20 minutes | **Points:** 2 | **Status:** Not Started
**Created:** 2025-10-01 15:30:00 EDT
**Dependencies:** ISSUE-012 (TanStack Query setup) ✅ COMPLETE

---

## What You'll Do

Replace Apollo Client `useQuery` with TanStack Query `useQuery` in the organizations page.

---

## Step-by-Step Instructions

### Step 1: Read the Current Organizations Page (3 min)

1. Open `apps/web/app/(dashboard)/organizations/page.tsx`
2. Find the Apollo `useQuery` hook (look for `import { useQuery } from '@apollo/client'`)
3. Note the GraphQL query being used
4. Note the data transformation logic

### Step 2: Update Imports (2 min)

**Replace:**
```typescript
import { useQuery } from '@apollo/client';
import { GET_ORGANIZATIONS } from '@/graphql/queries';
```

**With:**
```typescript
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/client';
```

### Step 3: Create GraphQL Fetcher Function (5 min)

At the top of the file (after imports), add:

```typescript
async function fetchOrganizations() {
  const response = await fetch('http://localhost:30101/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        query GetOrganizations {
          organizations {
            id
            name
            slug
            createdAt
          }
        }
      `,
    }),
  });

  const json = await response.json();

  if (json.errors) {
    throw new Error(json.errors[0].message);
  }

  return json.data.organizations;
}
```

### Step 4: Update the useQuery Hook (5 min)

**Replace Apollo query:**
```typescript
const { data, loading, error } = useQuery(GET_ORGANIZATIONS);
```

**With TanStack Query:**
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: queryKeys.organizations,
  queryFn: fetchOrganizations,
});
```

### Step 5: Update Loading/Error States (3 min)

**Replace:**
- `loading` → `isLoading`
- Keep `error` as-is
- Keep `data` as-is

**Example:**
```typescript
if (isLoading) return <div>Loading organizations...</div>;
if (error) return <div>Error: {error.message}</div>;
```

### Step 6: Verify Data Structure (2 min)

Ensure the data mapping works:

```typescript
const organizations = data || [];

return (
  <div>
    {organizations.map((org) => (
      <div key={org.id}>
        <h3>{org.name}</h3>
        <p>{org.slug}</p>
      </div>
    ))}
  </div>
);
```

---

## Files to Modify

1. `apps/web/app/(dashboard)/organizations/page.tsx` - Main file to update

---

## Verification Checklist

- [ ] Apollo imports removed
- [ ] TanStack Query imports added
- [ ] `fetchOrganizations` function created
- [ ] `useQuery` hook updated to TanStack Query
- [ ] `loading` changed to `isLoading`
- [ ] Page still displays organizations list
- [ ] No console errors

---

## Testing Steps

1. Start backend: `kubectl port-forward svc/backend 30101:3000 -n braveforms`
2. Start web dev server: `pnpm --filter web dev`
3. Navigate to: http://localhost:3000/organizations
4. Verify organizations list loads
5. Check browser console for errors (should be none)
6. Open React Query DevTools (bottom of page)
7. Verify `['organizations']` query is cached

---

## Expected Output

**Before:**
- Apollo Client fetching organizations
- Apollo DevTools showing query

**After:**
- TanStack Query fetching organizations
- React Query DevTools showing `['organizations']` cache
- Same UI appearance

---

## Evidence Requirements

### Screenshot 1: Code Changes
- File: `evidence/ISSUE-014/deployment/organizations-page-code.png`
- Show: Updated imports and useQuery hook

### Screenshot 2: Working Page
- File: `evidence/ISSUE-014/deployment/organizations-page-working.png`
- Show: Organizations list loading successfully

### Screenshot 3: React Query DevTools
- File: `evidence/ISSUE-014/deployment/react-query-devtools.png`
- Show: `['organizations']` query in cache

---

## Troubleshooting

### Issue: "useQuery is not a function"
**Solution:** Check import - should be `import { useQuery } from '@tanstack/react-query'`

### Issue: "queryKeys is not defined"
**Solution:** Add import - `import { queryKeys } from '@/lib/query/client'`

### Issue: GraphQL errors in console
**Solution:**
1. Verify backend is running: `kubectl get pods -n braveforms`
2. Check port forward: `kubectl port-forward svc/backend 30101:3000 -n braveforms`

### Issue: "Cannot read property 'map' of undefined"
**Solution:** Add fallback - `const organizations = data || [];`

---

## Success Criteria

- ✅ Organizations page loads without errors
- ✅ Organizations list displays correctly
- ✅ React Query DevTools shows cached data
- ✅ No Apollo Client imports remain
- ✅ Loading and error states work correctly

---

## Next Issue

**ISSUE-015:** Convert Weather Dashboard to TanStack Query (20 minutes)

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P0 (Blocker for web build)
**Estimated Time:** 20 minutes
