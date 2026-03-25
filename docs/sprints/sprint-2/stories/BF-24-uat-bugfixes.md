# BF-24: UAT Bug Fixes — User Management & Auth

**Type:** Bug Fix
**Priority:** High
**Points:** 2
**Status:** COMPLETE
**Sprint:** 2 (added mid-sprint from user testing)
**Reported by:** Andy (UAT)

## Issues Found

### 1. Resend Invite Missing
**Symptom:** No way to resend an invitation email from the Users tab.
**Root Cause:** Feature not implemented — only initial invite existed.
**Fix:** Added `resendInvite` server action calling `inviteUserByEmail()` for existing users. Added RotateCw icon button in the users table actions column.
**Files:** `src/app/dashboard/users/actions.ts`, `src/app/dashboard/users/users-client.tsx`

### 2. Change Role Button Not Working
**Symptom:** Clicking the shield icon to toggle admin/user role appeared to do nothing.
**Root Cause:** `updateRole` used `createClient()` (regular Supabase client subject to RLS). RLS policies on the `profiles` table only allow users to update their own profile, so admin attempts to update another user's role were silently rejected.
**Fix:** Switched to `createServiceClient()` which bypasses RLS — same pattern used by `inviteUser` and `deleteUser`.
**Files:** `src/app/dashboard/users/actions.ts`

### 3. Forgot Password Missing
**Symptom:** No "Forgot Password" option on the login page.
**Root Cause:** Feature not implemented.
**Fix:** Full password reset flow:
- Added "Forgot password?" link on login form → `/forgot-password`
- `/forgot-password` page: email form calling `supabase.auth.resetPasswordForEmail()`
- `/reset-password` page: new password + confirm form calling `supabase.auth.updateUser()`
- Updated `/auth/confirm` route to redirect `recovery` type tokens to `/reset-password` instead of `/dashboard`
- Anti-enumeration: success message shown regardless of whether email exists
**Files:** `src/app/login/login-form.tsx`, `src/app/forgot-password/*`, `src/app/reset-password/*`, `src/app/auth/confirm/route.ts`

## Acceptance Criteria
- [x] Resend invite button visible in users table for non-self users
- [x] Resend sends new invitation email via Supabase admin API
- [x] Role toggle updates profile via service client (bypasses RLS)
- [x] "Forgot password?" link visible on login page
- [x] Reset email sent with link to `/reset-password`
- [x] Password reset form validates match + minimum length
- [x] Auth confirm route routes recovery tokens to reset page
- [x] Build passes clean
