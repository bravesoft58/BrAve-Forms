# ISSUE-136.5: Profile, Settings & Sign Out Implementation

**Priority:** P1
**Phase:** Phase 2 - Offline Experience UI
**Estimated Hours:** 8-10
**Actual Hours:** 4
**Dependencies:** ISSUE-136 (Conflict Resolution UI)
**Sprint:** Sprint 5
**Status:** COMPLETE

## Completion Summary

### What Was Fixed

1. **Sign Out** - Now properly calls Clerk signOut() and redirects to /sign-in
2. **Profile Page** - Full profile page at /settings/profile with user info, org info, and account actions
3. **Settings Pages** - Complete settings system with notifications, display, and offline preferences
4. **User Data** - Header now displays real Clerk user data (name, email)
5. **Settings Store** - Valtio-based settings store with localStorage persistence

### Files Created/Modified

**Modified:**

- `apps/web/components/Layout/AppHeader.tsx` - Sign out handler, real Clerk user data

**Created:**

- `apps/web/app/settings/layout.tsx` - Settings navigation layout (110 lines)
- `apps/web/app/settings/page.tsx` - Redirect to profile (25 lines)
- `apps/web/app/settings/profile/page.tsx` - Profile page (280 lines)
- `apps/web/app/settings/notifications/page.tsx` - Notification preferences (165 lines)
- `apps/web/app/settings/display/page.tsx` - Display preferences (135 lines)
- `apps/web/app/settings/offline/page.tsx` - Offline/sync settings (210 lines)
- `apps/web/lib/stores/settings-store.ts` - Valtio settings store (320 lines)
- `apps/web/lib/stores/__tests__/settings-store.test.ts` - 31 tests (290 lines)

### Test Results

- 31 settings store tests passing
- Tests cover: notifications, display, offline settings, import/export, EPA compliance

---

## Objective

Fix broken Profile, Settings, and Sign Out functionality in the application header.

## Problem Statement

1. **Sign Out** - Empty onClick handler with TODO comment
2. **Profile Page** - Route `/settings/profile` doesn't exist
3. **Settings Page** - Placeholder only at `/dashboard/settings` with no functionality
4. **User Data** - Hardcoded mock data in AppHeader, not connected to Clerk

## Tasks

### Phase 1: Quick Fixes (1-2 hours)

- [x] Fix Sign Out handler in `AppHeader.tsx`
- [x] Import `useClerk` from `@clerk/nextjs`
- [x] Call `signOut()` on click and redirect to `/sign-in`
- [x] Connect real Clerk user data to header via `useAppAuth()`
- [x] Remove hardcoded mock user data
- [x] Create redirect from `/settings` to `/settings/profile`

### Phase 2: Profile Page (3-4 hours)

- [x] Create `/settings/profile/page.tsx`
- [x] Display user info (avatar, name, email)
- [x] Display org info (org ID, role, member since, last sign in)
- [x] Account actions (security settings via Clerk, delete account)
- [x] Connect to Clerk APIs for profile updates

### Phase 3: Settings Pages (4-5 hours)

- [x] Create `settings-store.ts` with Valtio for preferences
- [x] Create settings layout with navigation sidebar
- [x] Build Notification settings page
  - Email: Weather alerts, inspection reminders, form confirmations, weekly summary
  - Push: Real-time alerts, inspection reminders
- [x] Build Display settings page
  - Theme: Light/Dark/System
  - Date Format: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
  - Units: Imperial (inches) / Metric (mm)
- [x] Build Offline settings page
  - Auto-sync interval (5/15/30/60 min)
  - Data retention period (7/14/30 days)
  - Photo quality (Original/High/Medium/Low)
  - Sync on WiFi only toggle

## Technical Details

### Files Modified

**AppHeader.tsx Changes:**

- Added `useClerk` import for signOut
- Added `useAppAuth` for real user data
- Added `useRouter` for navigation after sign out
- Removed hardcoded user prop with mock data
- Added `handleSignOut` async function with error handling
- Updated Menu to display real userName and userEmail

### Settings Store Features

```typescript
// Notification Settings
emailWeatherAlerts: boolean;
emailInspectionReminders: boolean;
emailFormConfirmations: boolean;
emailWeeklySummary: boolean;
pushRealTimeAlerts: boolean;
pushInspectionReminders: boolean;

// Display Settings
theme: 'light' | 'dark' | 'system';
dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
units: 'imperial' | 'metric';

// Offline Settings
autoSyncInterval: 5 | 15 | 30 | 60;
dataRetention: 7 | 14 | 30;
photoQuality: 'original' | 'high' | 'medium' | 'low';
syncOnWifiOnly: boolean;
```

### Dependencies

- `@clerk/nextjs` - Authentication and user management
- `valtio` - State management for settings
- `@mantine/core` - UI components
- `@tabler/icons-react` - Icons

## Acceptance Criteria

### Phase 1 (Quick Fixes)

- [x] Sign Out button calls Clerk signOut and redirects to login
- [x] Header displays real user name from Clerk
- [x] Header displays real email from Clerk
- [x] Settings link navigates to functional page

### Phase 2 (Profile Page)

- [x] Profile page shows user avatar, name, email
- [x] Profile page shows organization info (ID, role, member since)
- [x] User can update their name via Clerk API
- [x] Security settings accessible via Clerk UserProfile
- [x] Delete account option available

### Phase 3 (Settings Page)

- [x] Notification preferences save to localStorage
- [x] Display preferences (theme, date format, units) configurable
- [x] Offline settings (sync interval, retention, photo quality) configurable
- [x] Settings persist across sessions via localStorage
- [x] Reset to defaults available for each section

## Testing Requirements

**Unit Tests (31 tests):**

- [x] Notification settings CRUD operations
- [x] Display settings CRUD operations
- [x] Offline settings CRUD operations
- [x] Settings persistence to localStorage
- [x] Import/export settings JSON
- [x] EPA compliance settings (30-day retention, weather alerts)
- [x] Construction field worker settings (high photo quality, wifi sync)

## Evidence Requirements

- [x] Type check passes (pnpm type-check)
- [x] Test Results: 31 tests passing
- [ ] Screenshot: Sign out working (redirect to login)
- [ ] Screenshot: Header showing real Clerk user data
- [ ] Screenshot: Profile page with user info
- [ ] Screenshot: Settings pages with preferences

---

**Created:** 2025-11-29
**Last Updated:** 2025-11-29
**Completed:** 2025-11-29

## Git Commits

1. `7229529` - feat(settings): implement profile and settings pages (ISSUE-136.5)
