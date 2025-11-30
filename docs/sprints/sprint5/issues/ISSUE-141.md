# ISSUE-141: User Profile Page (3h)

**Priority:** P0
**Phase:** Phase 3 - Settings & Profile
**Estimated Hours:** 3
**Actual Hours:** 1.5
**Dependencies:** Phase 2 complete, ISSUE-136.5 (Profile base implementation)
**Sprint:** Sprint 5
**Status:** COMPLETE

---

## Completion Summary

### What Was Implemented

This issue enhances the profile page created in ISSUE-136.5 with additional features:

1. **Avatar Upload** - FileButton with image validation (type, 10MB size limit)
2. **Profile Completion Percentage** - Progress bar showing profile completeness (0-100%)
3. **Delete Account Confirmation Modal** - Custom modal requiring "DELETE" text confirmation
4. **Unit Tests** - 18 tests for calculateProfileCompletion function

### Files Modified

**Modified:**

- `apps/web/app/settings/profile/page.tsx` - Added avatar upload, profile completion, delete modal (602 lines)

**Created:**

- `apps/web/app/settings/profile/__tests__/profile.test.ts` - 18 unit tests (172 lines)

### Profile Completion Criteria

Profile completion is calculated based on 5 factors (20% each):

- First name present
- Last name present
- Profile image uploaded (hasImage or non-default imageUrl)
- Email verified
- Phone number added

### Test Results

- 18 tests passing
- Tests cover: basic completion, edge cases, real-world scenarios

---

## Objective

Create a user profile page where field workers can view and edit their personal information, change password, and manage their account.

## Tasks

- [x] Create /settings/profile route in Next.js App Router (ISSUE-136.5)
- [x] Fetch user info from Clerk (ISSUE-136.5)
- [x] Display user info (name, email, avatar) (ISSUE-136.5)
- [x] Create edit profile form with React Hook Form + Zod (simplified useState approach)
- [x] Implement avatar upload functionality
- [x] Create change password form (redirects to Clerk Security Settings)
- [x] Add delete account button with confirmation modal
- [x] Calculate and display profile completion percentage
- [x] Add unit tests for profile update logic

## Technical Details

**Libraries/Dependencies:**

- Clerk (user authentication)
- Mantine UI components (FileButton, Modal, Progress)
- Tabler Icons

**Implementation Notes:**

- Used useState for form state (simpler than React Hook Form for this use case)
- Avatar upload validates file type and size (max 10MB)
- Delete account requires typing "DELETE" to confirm
- Profile completion updates in real-time as user fills in fields

## Acceptance Criteria

- [x] /settings/profile route displays user information
- [x] Edit profile form functional with validation
- [x] Avatar upload working
- [x] Change password redirects to Clerk password change
- [x] Delete account button with confirmation modal
- [x] Profile completion percentage accurate
- [x] Form validation errors display correctly
- [x] Success notification on profile update

## Testing Requirements

**Unit Tests:**

- [x] Test profile completion calculation (18 tests)
- [x] Test edge cases (null values, whitespace, default avatars)
- [x] Test real-world scenarios (new user, field worker, admin)

**Integration Tests:**

- Manual testing required for Clerk API integration

**Manual Testing:**

- [x] Update profile information
- [x] Upload new avatar
- [x] Change password
- [x] Test delete account flow
- [x] Verify profile completion updates

## Evidence Requirements

- [x] Test Results: 18 profile completion tests passing

## Success Criteria

User profile page is complete when:

- [x] All user information displayed
- [x] Edit functionality working
- [x] Avatar upload functional
- [x] Delete account with confirmation
- [x] All tests passing

---

**Created:** 2025-10-23
**Last Updated:** 2025-11-29
**Completed:** 2025-11-29

## Implementation Details

### calculateProfileCompletion Function

```typescript
export function calculateProfileCompletion(user: {
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  hasImage?: boolean;
  primaryEmailAddress?: { verification?: { status: string | null } | null } | null;
  phoneNumbers?: Array<{ phoneNumber?: string }> | null;
}): number {
  let score = 0;
  if (user.firstName && user.firstName.trim() !== '') score += 20;
  if (user.lastName && user.lastName.trim() !== '') score += 20;
  if (user.hasImage || (user.imageUrl && !user.imageUrl.includes('img.clerk.com/default')))
    score += 20;
  if (user.primaryEmailAddress?.verification?.status === 'verified') score += 20;
  if (user.phoneNumbers && user.phoneNumbers.length > 0 && user.phoneNumbers[0]?.phoneNumber)
    score += 20;
  return score;
}
```

### Key Features Added

1. **Profile Completion Progress** - Header shows percentage with colored progress bar
2. **Avatar Upload** - FileButton with image/\* accept, validates type and 10MB limit
3. **Delete Account Modal** - Requires "DELETE" confirmation text, shows consequences list

## Code Review Fixes (2025-11-29)

**HIGH Priority Fixes:**

1. **Dynamic Export** - Added `export const dynamic = 'force-dynamic'` for Next.js App Router compatibility
2. **Error Logging Context** - Added userId, orgId, and file metadata to all console.error calls
3. **Input Validation** - Added maxLength={50} and error display for firstName/lastName fields
4. **Zero-byte File Validation** - Added check for empty files in avatar upload

**MEDIUM Priority Fixes:**

1. **Glove-Friendly Touch Targets** - Increased Upload Photo button from size="xs" to size="md" with 44px minimum dimensions
2. **Memoization** - Added useMemo for profileCompletion calculation to prevent unnecessary recalculations

**Code Review Notes:**

- HIGH #4 (Offline Support) and HIGH #5 (OrgId Validation) deferred to existing offline infrastructure (IndexedDB caching handled by TanStack Query)
- TypeScript type-check passes
- All 18 unit tests pass
