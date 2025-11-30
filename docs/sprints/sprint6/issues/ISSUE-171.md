# ISSUE-171: Photo Gallery GraphQL Migration (6h)

**Sprint:** Sprint 6 | **Phase:** 1 - MVP Required | **Priority:** P1
**Time:** 6 hours | **Complexity:** Medium-High
**Created:** 2025-11-30
**Dependencies:** None
**Status:** COMPLETE
**Completed:** 2025-11-30

---

## Problem

Photo gallery uses REST `/api/photos` endpoint instead of GraphQL. This creates:
1. Inconsistent API patterns (GraphQL everywhere else)
2. Potential multi-tenancy issues (REST may not filter by orgId)
3. No TanStack Query caching benefits
4. Different error handling patterns

---

## Evidence of Gap

- `apps/web/components/photos/photo-gallery-grid.tsx` - Uses fetch() to REST endpoint
- Backend has `photos` resolver in GraphQL
- Other features use GraphQL + TanStack Query pattern

---

## Solution

1. Create GraphQL API helpers for photos
2. Create `usePhotosByProject()` TanStack Query hook with infinite scroll
3. Replace fetch() calls with GraphQL client
4. Ensure multi-tenancy filtering via Clerk JWT

---

## Tasks

- [x] Review backend photos resolver for query structure
- [x] Create `apps/web/lib/api/photos.ts` (GraphQL helper)
- [x] Create `apps/web/hooks/usePhotos.ts` with filters
- [x] Update `apps/web/components/photos/photo-gallery-grid.tsx`
- [x] Add pagination support (infinite scroll)
- [x] Implement offline caching (offlineFirst networkMode)
- [x] Update tests for new hooks (18 tests passing)

---

## Files Created

- `apps/web/lib/api/photos.ts` - GraphQL API helpers
- `apps/web/hooks/usePhotos.ts` - TanStack Query hooks

---

## Files Modified

- `apps/web/components/photos/photo-gallery-grid.tsx` - Migrated to GraphQL
- `apps/web/components/photos/__tests__/photo-gallery-grid.test.tsx` - Updated mocks

---

## Acceptance Criteria

- [x] Photo gallery loads photos via GraphQL
- [x] Filters work correctly (project, date range, GPS, formType)
- [x] Pagination/infinite scroll works
- [x] Offline caching persists photos (30-day gcTime)
- [x] Multi-tenancy enforced (orgId in JWT)
- [x] Loading and error states handled
- [x] Tests passing (18/18 tests)

---

## Completion Summary

**Completed:** 2025-11-30

### Files Created:

1. **apps/web/lib/api/photos.ts** - Complete GraphQL API helpers
   - `getPhotosByProject()` - Paginated photos with filters
   - `getPhotosByInspection()` - Photos for inspection
   - `getPhoto()` - Single photo by ID
   - `uploadPhoto()` - Base64 photo upload
   - `deletePhoto()` - Delete photo
   - S3 URL generation from s3Key/thumbnailKey
   - Multi-tenancy via Clerk JWT authentication

2. **apps/web/hooks/usePhotos.ts** - TanStack Query hooks
   - `usePhotosByProject()` - Infinite scroll hook
   - `usePhotosByInspection()` - Single query for inspection
   - `usePhoto()` - Single photo hook
   - `useUploadPhoto()` - Upload mutation
   - `useDeletePhoto()` - Delete mutation
   - `photoKeys` factory for cache management
   - offlineFirst networkMode for 30-day offline capability
   - 30-day gcTime for EPA compliance data retention

### Files Modified:

3. **apps/web/components/photos/photo-gallery-grid.tsx**
   - Replaced REST fetch() with `usePhotosByProject` hook
   - Added `mapApiPhotoToGalleryPhoto()` for type mapping
   - Updated filter mapping for API compatibility
   - Maintained all existing features (pairing, lightbox, GPS badges)

4. **apps/web/components/photos/__tests__/photo-gallery-grid.test.tsx**
   - Updated mocks from global.fetch to mockUsePhotosByProject
   - Added helper functions: createLoadingHookResponse, createDataHookResponse, createErrorHookResponse
   - All 18 tests passing:
     - Rendering tests (5)
     - Responsive Grid tests (1)
     - Photo Card Content tests (3)
     - Photo Selection tests (2)
     - Infinite Scroll tests (2)
     - Filtering tests (1)
     - Pairing Mode - Multi-tenant Isolation tests (2)
     - Pairing Mode - Offline Queue tests (2)

### Key Implementation Details:

- GraphQL queries use `makeAuthenticatedRequest` with Clerk JWT
- Photos transformed from backend format (s3Key) to display format (url)
- S3 URLs generated from environment variables (NEXT_PUBLIC_S3_ENDPOINT, NEXT_PUBLIC_S3_BUCKET)
- Infinite scroll uses `useInfiniteQuery` with proper pagination
- Filter mapping: local filter format to API variables
- Type mapping: ApiPhoto to gallery Photo interface

### Type-Check: PASSING
### Tests: 18/18 PASSING

---

## Related Issues

- ISSUE-172: Photo Pairing Backend (related photo functionality)
- ISSUE-162: useFormSubmissions pattern (reference)
