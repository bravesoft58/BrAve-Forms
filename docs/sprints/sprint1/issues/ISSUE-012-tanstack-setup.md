# ISSUE-012: Create TanStack Query Setup

**Sprint:** Sprint 1 | **Phase:** 3 - Apollo Removal | **Priority:** P0
**Time:** 1 hour | **Points:** 3 | **Status:** Not Started
**Created:** 2025-09-30 20:22:00 EDT

## What You'll Do

Set up TanStack Query with offline persistence for PWA.

## Step-by-Step

1. Create `apps/web/lib/query-client.ts`
2. Configure: `networkMode: 'offlineFirst'`, `gcTime: 30 days`
3. Update `apps/web/app/layout.tsx` with PersistQueryClientProvider
4. Add DevTools for development

## Acceptance Criteria

- [ ] query-client.ts created with offline config
- [ ] layout.tsx updated with provider
- [ ] DevTools visible in dev mode

## Evidence

`evidence/ISSUE-012/deployment/tanstack-setup-code.png`
