# ISSUE-162: Replace Mock Data in Form Submissions (8h)

**Sprint:** Sprint 5 | **Phase:** 0 - Production-Ready Fixes | **Priority:** P0
**Time:** 8 hours | **Complexity:** High
**Created:** 2025-11-27
**Dependencies:** Sprint 4 complete (form rendering, GraphQL API)
**Status:** COMPLETE

## What You Did

Replaced all mock/placeholder data in form submission workflow with real GraphQL API calls via TanStack Query hooks. This ensures form submissions are stored in and retrieved from the real PostgreSQL database.

## Problem Solved

The form submission list and individual submission views were showing hardcoded mock data instead of real submissions from the backend. This blocked production readiness for the MVP.

## Implementation Summary

### Created New Files

1. **apps/web/lib/api/submissions.ts** - GraphQL API helpers
   - `createSubmission()` - Create form submission via GraphQL mutation
   - `findSubmissionById()` - Get single submission by ID
   - `findAllSubmissions()` - List submissions with filters
   - `cloneSubmission()` - Clone existing submission
   - `copyYesterdaysLog()` - Clone yesterday's log for daily workflows

2. **apps/web/hooks/useFormSubmissions.ts** - TanStack Query hooks
   - `useFormSubmissions()` - Fetch all submissions with filters
   - `useProjectSubmissions()` - Fetch submissions for a project
   - `useFormSubmission()` - Fetch single submission by ID
   - Helper functions: `filterSubmissionsByTemplate()`, `filterSubmissionsByStatus()`, `getSubmissionStatusColor()`
   - `TransformedSubmission` type with proper typing

3. **apps/web/hooks/**tests**/useFormSubmissions.test.tsx** - Unit tests
   - 15 tests covering all hooks and utility functions
   - Mock setup for Clerk auth and API calls
   - Tests for offline scenarios and fallback handling

### Modified Files

1. **apps/web/components/Forms/SubmittedFormsList.tsx**
   - Replaced mock data with `useProjectSubmissions()` hook
   - Added proper loading and error states
   - Integrated with `useFormTemplates()` for filter dropdown

2. **apps/web/hooks/useSubmitForm.ts**
   - Added IndexedDB constants for offline queue
   - Enhanced error logging with context
   - Added `MAX_RETRY_COUNT` constant

## Key Technical Decisions

### TanStack Query Configuration

```typescript
networkMode: 'offlineFirst'; // Critical for 30-day offline requirement
staleTime: 5 * 60 * 1000; // 5 minute cache
gcTime: 24 * 60 * 60 * 1000; // 24 hour garbage collection
```

### Status Enum Alignment

Used UPPERCASE enum values to match backend:

- `DRAFT`, `SUBMITTED`, `REVIEWED`, `APPROVED`, `REJECTED`

### Multi-Tenancy

All API calls automatically filtered by orgId from Clerk JWT - no additional code needed as backend enforces this.

## Evidence

**Location:** docs/sprints/sprint5/evidence/ISSUE-162/

- test-results/passing-tests.png - All 15 tests passing
- code-review/review-findings.md - Code review completed
- implementation/api-helpers.png - API helpers structure

## Verification Checklist

- [x] Form submissions fetched from real API
- [x] Loading states display correctly
- [x] Error states handled gracefully
- [x] Filters work with real data
- [x] Offline mode uses cached data
- [x] Tests passing (15 tests, >80% coverage)
- [x] Zero emoji, zero AI branding
- [x] Type-check passes
- [x] Lint passes

## Time Spent

**8 hours total:**

- API helpers: 2 hours
- TanStack Query hooks: 2 hours
- Component updates: 2 hours
- Tests: 2 hours

## Related Issues

- ISSUE-163: Fix Status Enum Mismatch (completed same session)
- ISSUE-164: Replace Mock Data in Dashboard (next)
