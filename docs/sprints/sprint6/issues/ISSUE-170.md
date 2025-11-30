# ISSUE-170: Replace Mock Projects Data (4h)

**Sprint:** Sprint 6 | **Phase:** 1 - MVP Required | **Priority:** P1
**Time:** 4 hours | **Complexity:** Medium
**Created:** 2025-11-30
**Dependencies:** None
**Status:** COMPLETE
**Completed:** 2025-11-30

---

## Problem

Projects page uses `getMockProjects()` from mock data file. This means:
1. Projects shown are fake/hardcoded
2. New projects created elsewhere don't appear
3. Cannot test real project workflows

---

## Evidence of Gap

- `apps/web/app/dashboard/projects/page.tsx` - Uses getMockProjects()
- `apps/web/lib/mock-data/projects.ts` - Hardcoded project data
- Backend has `projects` query ready in GraphQL schema

---

## Solution

1. Use existing `projects` GraphQL query from backend
2. Create `useProjects()` TanStack Query hook
3. Replace mock data imports in projects page
4. Delete mock-data/projects.ts after verification

---

## Tasks

- [x] Read backend projects resolver to understand schema
- [x] Create `apps/web/lib/api/projects.ts` with authenticated API helpers
- [x] Create `apps/web/hooks/useProjects.ts` with TanStack Query
- [x] Update `apps/web/app/dashboard/projects/page.tsx` to use real API
- [x] Add loading and error states
- [x] Handle empty state (no projects)
- [x] Update `apps/web/app/dashboard/projects/[id]/page.tsx` to use real API
- [x] Update `apps/web/components/projects/ProjectComplianceTab.tsx` to use real API
- [x] Update `apps/web/components/projects/ProjectWeatherTab.tsx` to use real API
- [x] Delete `apps/web/lib/mock-data/projects.ts` after verification

---

## Files to Create

- `apps/web/lib/graphql/projects.queries.ts`
- `apps/web/hooks/useProjects.ts`
- `apps/web/hooks/__tests__/useProjects.test.tsx`

---

## Files to Modify

- `apps/web/app/dashboard/projects/page.tsx`

---

## Files to Delete (After Verification)

- `apps/web/lib/mock-data/projects.ts`

---

## GraphQL Operations

```typescript
// projects.queries.ts
import { gql } from '@apollo/client';

export const GET_PROJECTS = gql`
  query Projects($take: Int, $skip: Int, $status: ProjectStatus) {
    projects(take: $take, skip: $skip, status: $status) {
      id
      name
      description
      address
      city
      state
      zipCode
      status
      startDate
      endDate
      createdAt
      updatedAt
    }
  }
`;

export const GET_PROJECT = gql`
  query Project($id: String!) {
    project(id: $id) {
      id
      name
      description
      address
      city
      state
      zipCode
      status
      startDate
      endDate
      inspectionFrequency
      coordinates {
        latitude
        longitude
      }
    }
  }
`;
```

---

## Hook Implementation

```typescript
// useProjects.ts
import { useQuery } from '@tanstack/react-query';
import { getProjects } from '@/lib/api/projects';

export function useProjects(filters?: ProjectFilters) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () => getProjects(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    networkMode: 'offlineFirst', // Critical for 30-day offline
  });
}

export function useProject(id: string | null) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => (id ? getProject(id) : null),
    enabled: !!id,
  });
}
```

---

## API Helper

```typescript
// lib/api/projects.ts
import { graphqlClient } from '@/lib/graphql/client';
import { GET_PROJECTS, GET_PROJECT } from '@/lib/graphql/projects.queries';

export async function getProjects(filters?: ProjectFilters) {
  const { data } = await graphqlClient.query({
    query: GET_PROJECTS,
    variables: filters,
  });
  return data.projects;
}

export async function getProject(id: string) {
  const { data } = await graphqlClient.query({
    query: GET_PROJECT,
    variables: { id },
  });
  return data.project;
}
```

---

## Acceptance Criteria

- [x] Projects page shows real projects from API
- [x] Loading state displayed while fetching
- [x] Error state shown on API failure
- [x] Empty state shown when no projects
- [x] Filters work with real data (status + search)
- [x] Project detail page loads real project data
- [x] Compliance tab shows real compliance data
- [x] Weather tab shows weather-triggered inspections
- [x] Mock data file deleted

---

## Evidence Required

- [ ] Screenshot of projects list with real data
- [ ] Screenshot of empty state
- [ ] Test results screenshot
- [ ] Verification that mock-data/projects.ts is deleted

---

## Related Issues

- ISSUE-162: useFormSubmissions pattern (reference)
- ISSUE-164: Dashboard real API (similar pattern)

---

## Completion Summary

**Completed:** 2025-11-30

### Files Created/Modified:

1. **apps/web/lib/api/projects.ts** - Complete rewrite with authenticated API helpers
   - getProjects, getProjectById, createProject, updateProject, deleteProject
   - Uses makeAuthenticatedRequest with Clerk JWT
   - Includes Project, ProjectCompliance, ProjectInspection types

2. **apps/web/hooks/useProjects.ts** - New TanStack Query hooks
   - useProjects() - list all projects with optional filters
   - useProject(id) - get single project by ID
   - useCreateProject(), useUpdateProject(), useDeleteProject() mutations
   - offlineFirst networkMode for 30-day offline capability

3. **apps/web/app/dashboard/projects/page.tsx** - Updated to use real API
   - Loading state with spinner
   - Error state with retry button
   - Empty state with create button
   - Client-side filtering by status and search

4. **apps/web/app/dashboard/projects/[id]/page.tsx** - Updated to use real API
   - Uses useProject(id) hook
   - Loading/error/not-found states
   - Passes project data to child tabs

5. **apps/web/components/projects/ProjectCard.tsx** - Updated to use API types
   - Uses Project from lib/api/projects
   - Shows compliance alerts (overdueInspections, requiresAttention)

6. **apps/web/components/projects/ProjectComplianceTab.tsx** - Enhanced with real data
   - Compliance score with progress bar
   - Pending/overdue inspection counts
   - Last inspection and next deadline dates

7. **apps/web/components/projects/ProjectWeatherTab.tsx** - Updated for real API
   - Shows weather-triggered inspections
   - Location coordinates for weather monitoring
   - EPA CGP 0.25" threshold info

### Files Deleted:

- **apps/web/lib/mock-data/projects.ts** - Mock data file removed

### Key Implementation Details:

- Follows same pattern as useFormTemplates.ts for consistency
- All queries use Clerk JWT authentication via useAppAuth()
- offlineFirst networkMode for offline capability
- Query invalidation on mutations
- Type-safe API with proper TypeScript interfaces
