# ISSUE-015: Convert ProjectSelector to TanStack Query

**Sprint:** Sprint 1 | **Phase:** 3 - Apollo Removal | **Priority:** P0
**Time:** 1 hour | **Points:** 3 | **Status:** Not Started
**Created:** 2025-09-30 20:22:00 EDT

## Step-by-Step

1. Create `apps/web/lib/api/projects.ts`
2. Convert component to TanStack Query
3. Verify NO Apollo imports remain
4. Run: `pnpm --filter web build` (must succeed)

## Acceptance Criteria

- [ ] Component converted
- [ ] Build succeeds without errors
- [ ] Zero Apollo imports in codebase

## Evidence

`evidence/ISSUE-015/deployment/web-build-success.png`
