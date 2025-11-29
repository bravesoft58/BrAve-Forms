# Profile, Settings & Sign Out Implementation Plan

**Created:** 2025-11-29
**Status:** PLANNING
**Sprint:** Sprint 5
**Estimated Hours:** 8-10 hours total

---

## Current State Analysis

### Issues Found

1. **Sign Out** - Empty onClick handler with TODO comment
2. **Profile Page** - Route `/settings/profile` doesn't exist
3. **Settings Page** - Placeholder only at `/dashboard/settings`
4. **User Data** - Hardcoded mock data in AppHeader, not connected to Clerk

### Existing Infrastructure

- `useAppAuth()` hook provides: userId, orgId, orgRole, firstName, lastName, email
- Clerk's `useUser()` and `useClerk()` hooks available
- `AuthHeader.tsx` component exists with proper Clerk UserButton (not being used)
- Backend `me` query exists returning user data

---

## Proposed Implementation

### 1. Sign Out Fix (30 minutes)

**What it should do:**

- Call Clerk's `signOut()` function
- Redirect to login page after sign out
- Clear any local state/cache

**Implementation:**

```typescript
// In AppHeader.tsx
import { useClerk } from '@clerk/nextjs';

const { signOut } = useClerk();

// onClick handler
onClick={() => signOut({ redirectUrl: '/sign-in' })}
```

---

### 2. Profile Page (`/settings/profile`)

**Purpose:** Display and edit user information

**Sections:**

#### A. User Information (Read/Edit)

- **Avatar** - Display Clerk profile image, option to update
- **Full Name** - First name, Last name (editable)
- **Email** - Display only (managed by Clerk)
- **Phone Number** - Optional, for field notifications

#### B. Organization Info (Read-only)

- **Organization Name** - From Clerk org
- **Your Role** - FIELD_USER, OFFICE_USER, ADMIN, etc.
- **Member Since** - Join date

#### C. Account Actions

- **Change Password** - Link to Clerk's password reset
- **Two-Factor Authentication** - Enable/disable via Clerk
- **Delete Account** - With confirmation modal

**Data Sources:**

- Clerk `useUser()` for personal info
- Clerk `useOrganization()` for org info
- Backend `me` query for role details

---

### 3. Settings Page (`/dashboard/settings`)

**Purpose:** App preferences and notifications

**Sections:**

#### A. Notifications

- **Email Notifications**
  - Weather alerts (rain triggers)
  - Inspection reminders
  - Form submission confirmations
  - Weekly compliance summaries
- **Push Notifications** (Mobile)
  - Real-time weather alerts
  - Inspection due reminders

#### B. Display Preferences

- **Theme** - Light / Dark / System (Mantine supports this)
- **Language** - English (future: Spanish for construction crews)
- **Date Format** - MM/DD/YYYY or DD/MM/YYYY
- **Units** - Imperial (inches) / Metric (mm) for rain measurements

#### C. Offline Settings

- **Auto-Sync Interval** - When connected: Every 5/15/30 min
- **Offline Data Retention** - 7/14/30 days
- **Photo Quality** - Original / Compressed (saves storage)

#### D. Privacy & Data

- **Activity Logging** - View your activity history
- **Export My Data** - Download all your submissions
- **Data Retention** - How long to keep completed inspections

---

### 4. Header Menu Updates

**Current Menu Items:**

- Profile -> `/settings/profile`
- Settings -> `/dashboard/settings`
- Sign Out -> Empty handler

**Proposed Updates:**

- Connect user data to Clerk (remove hardcoded mock)
- Fix Sign Out handler
- Add visual indicator if user has pending sync items
- Show organization name in menu

---

## File Structure

```
apps/web/
├── app/
│   ├── settings/
│   │   ├── profile/
│   │   │   └── page.tsx          # NEW: Profile page
│   │   └── page.tsx              # Redirect to profile or combined page
│   └── dashboard/
│       └── settings/
│           └── page.tsx          # UPDATED: Full settings page
├── components/
│   ├── Layout/
│   │   └── AppHeader.tsx         # UPDATED: Fix sign out, real user data
│   └── Settings/
│       ├── index.ts              # NEW: Barrel export
│       ├── ProfileForm.tsx       # NEW: Edit profile form
│       ├── NotificationSettings.tsx  # NEW: Notification preferences
│       ├── DisplaySettings.tsx   # NEW: Theme, language, units
│       ├── OfflineSettings.tsx   # NEW: Sync preferences
│       └── AccountActions.tsx    # NEW: Password, 2FA, delete
└── lib/
    └── stores/
        └── settings-store.ts     # NEW: Valtio store for settings
```

---

## Implementation Priority

### Phase 1: Quick Fixes (1-2 hours)

1. Fix Sign Out handler in AppHeader
2. Connect real Clerk user data to header
3. Create redirect from `/settings` to `/settings/profile`

### Phase 2: Profile Page (3-4 hours)

1. Create `/settings/profile/page.tsx`
2. Build ProfileForm component
3. Build AccountActions component
4. Connect to Clerk APIs

### Phase 3: Settings Page (4-5 hours)

1. Create settings-store.ts with Valtio
2. Build NotificationSettings component
3. Build DisplaySettings component
4. Build OfflineSettings component
5. Update `/dashboard/settings/page.tsx`

---

## Technical Considerations

### Multi-Tenant Isolation

- Settings stored per-user with orgId context
- Profile changes scoped to current user only
- Organization settings separate (admin only)

### Offline Support

- Settings cached in localStorage
- Profile changes queued when offline
- Sync settings apply to offline behavior

### Construction Field Context

- Large touch targets for glove use
- High contrast for outdoor visibility
- Simple toggles over complex forms
- Minimal required fields

---

## Testing Requirements

- Unit tests for settings store
- Component tests for each settings section
- Integration test for profile updates via Clerk
- E2E test for sign out flow

---

## Success Criteria

- [ ] Sign Out works and redirects to login
- [ ] Profile page displays real Clerk user data
- [ ] Profile form allows name/phone edits
- [ ] Settings page has notification preferences
- [ ] Settings page has display preferences
- [ ] Settings persisted in localStorage
- [ ] All components pass accessibility checks
- [ ] Works offline (reads cached settings)

---

## Related Issues

- ISSUE-136: Conflict Resolution UI (completed)
- New issues to be created for each phase
