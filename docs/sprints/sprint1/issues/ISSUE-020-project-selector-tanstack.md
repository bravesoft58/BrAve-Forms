# ISSUE-020: Convert ProjectSelector to TanStack Query

**Sprint:** Sprint 1 | **Phase:** Phase 3 - Apollo Removal | **Priority:** P1
**Time:** 20 minutes | **Points:** 2 | **Status:** Not Started
**Created:** 2025-10-01 15:20:00 EDT
**Dependencies:** ISSUE-019 ✅

---

## What You'll Do

Replace Apollo Client with TanStack Query in ProjectSelector component.

---

## Step-by-Step Instructions

### Prerequisites
- ISSUE-019 complete (Projects API helper exists)

### Steps

1. Open `apps/web/components/ProjectSelector.tsx`

2. Remove Apollo imports:
```typescript
// DELETE these lines
import { useQuery } from '@apollo/client';
import { PROJECTS_QUERY } from './queries';
```

3. Add TanStack imports:
```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchProjects } from '@/lib/api/projects';
```

4. Replace query (pass orgId from context):
```typescript
// BEFORE
const { data, loading } = useQuery(PROJECTS_QUERY, {
  variables: { orgId }
});

// AFTER
const { data: projects, isLoading } = useQuery({
  queryKey: ['projects', orgId],
  queryFn: () => fetchProjects(orgId),
  enabled: !!orgId, // Only run query if orgId exists
});
```

5. Update loading state: `loading` → `isLoading`

6. Save file

---

## Files to Modify

**Edit:**
- `apps/web/components/ProjectSelector.tsx`

---

## Verification Checklist

- [ ] Apollo imports removed
- [ ] TanStack imports added
- [ ] Query hook replaced with TanStack useQuery
- [ ] Query uses orgId from context
- [ ] Query has `enabled: !!orgId` guard
- [ ] Loading state updated to `isLoading`
- [ ] Component compiles successfully

---

## Testing Steps

1. Run type check: `pnpm --filter web type-check`
2. Start web app: `pnpm --filter web dev`
3. Navigate to project selector
4. Verify projects load for selected organization
5. Check network tab shows GraphQL request

---

## Evidence Requirements

**Location:** `evidence/ISSUE-020/code/`

**Required Screenshots:**
1. `project-selector-converted.png` - File showing TanStack Query implementation
2. `git-diff-apollo-removed.png` - Git diff showing Apollo removal

---

## Troubleshooting

**Problem:** TypeScript errors on queryKey
- TanStack Query v5 requires array format: `queryKey: ['projects', orgId]`
- Include dependencies in array for proper cache invalidation

**Problem:** Projects don't load
- Check `enabled: !!orgId` is present
- Verify orgId is passed from parent component
- Check GraphQL query matches backend schema

**Problem:** Infinite loading
- Verify `enabled` condition is correct
- Check network tab for failed requests
- Check backend logs for GraphQL errors

---

## Success Criteria

- Apollo completely removed from component
- TanStack Query implemented correctly
- Query only runs when orgId exists
- Projects load when organization selected
- Component compiles without errors
- Evidence collected

---

## Next Issue

**ISSUE-021:** Verify Web Build Succeeds (10 minutes)

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P1
**Estimated Time:** 20 minutes
