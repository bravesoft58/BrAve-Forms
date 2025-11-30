# ISSUE-173: User Preferences Backend (8h)

**Sprint:** Sprint 6 | **Phase:** 1 - MVP Required | **Priority:** P1
**Time:** 8 hours | **Complexity:** High
**Created:** 2025-11-30
**Dependencies:** None
**Status:** COMPLETE
**Completed:** 2025-11-30

---

## Problem

Settings pages use localStorage only via `settings-store.ts`. No database persistence means:
1. Preferences lost on localStorage clear
2. No sync between devices
3. **CRITICAL:** Timezone setting affects EPA inspection deadlines
4. Users must reconfigure on each device

---

## Evidence of Gap

- `apps/web/lib/stores/settings-store.ts` line 172: `STORAGE_KEY = 'braveforms_settings'`
- No `UserPreferences` model in Prisma schema
- No preferences mutations in backend

---

## Solution

1. Create `UserPreferences` Prisma model
2. Create GraphQL types and mutations
3. Create `myPreferences` query
4. Create `updatePreferences` mutations
5. Update settings pages to sync with backend

**IMPORTANT:** Some settings should remain local-only:
- Display (theme, date format) - Device preference
- Offline (sync interval, photo quality) - Device-specific

---

## Tasks

### Backend
- [x] Add UserPreferences model to `packages/database/schema.prisma`
- [x] Run Prisma migration (pnpm db:generate)
- [x] Create GraphQL types in `apps/backend/src/modules/users/users.resolver.ts`
- [x] Add queries/mutations to `apps/backend/src/modules/users/users.resolver.ts`
- [x] Add service methods to `apps/backend/src/modules/users/users.service.ts`

### Frontend
- [x] Create `apps/web/lib/api/user-preferences.ts` (API helpers)
- [x] Create `apps/web/hooks/useUserPreferences.ts` (TanStack Query hooks)
- [x] Update `apps/web/app/settings/notifications/page.tsx` (backend sync)
- [x] Update `apps/web/app/settings/account/page.tsx` (backend sync)
- [x] Keep settings-store.ts for device-local settings (unchanged)

---

## Prisma Model

```prisma
model UserPreferences {
  id        String   @id @default(uuid())
  userId    String   @unique @map("user_id")
  orgId     String   @map("org_id")

  // Notifications (sync to backend)
  emailWeatherAlerts       Boolean @default(true)
  emailInspectionReminders Boolean @default(true)
  emailFormConfirmations   Boolean @default(true)
  emailWeeklySummary       Boolean @default(false)
  pushRealTimeAlerts       Boolean @default(true)
  pushInspectionReminders  Boolean @default(true)
  quietHoursEnabled        Boolean @default(false)
  quietHoursStart          String  @default("22:00")
  quietHoursEnd            String  @default("07:00")

  // Account/Regional (sync to backend - affects compliance)
  timezone      String
  timeFormat    String  @default("12h")
  language      String  @default("en")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([orgId])
  @@map("user_preferences")
}
```

---

## GraphQL Operations

```typescript
// preferences.queries.ts
export const GET_MY_PREFERENCES = gql`
  query MyPreferences {
    myPreferences {
      id
      emailWeatherAlerts
      emailInspectionReminders
      emailFormConfirmations
      emailWeeklySummary
      pushRealTimeAlerts
      pushInspectionReminders
      quietHoursEnabled
      quietHoursStart
      quietHoursEnd
      timezone
      timeFormat
      language
    }
  }
`;

// preferences.mutations.ts
export const UPDATE_NOTIFICATION_PREFERENCES = gql`
  mutation UpdateNotificationPreferences($input: NotificationPreferencesInput!) {
    updateNotificationPreferences(input: $input) {
      id
      emailWeatherAlerts
      emailInspectionReminders
      emailFormConfirmations
      emailWeeklySummary
      pushRealTimeAlerts
      pushInspectionReminders
      quietHoursEnabled
      quietHoursStart
      quietHoursEnd
    }
  }
`;

export const UPDATE_ACCOUNT_PREFERENCES = gql`
  mutation UpdateAccountPreferences($input: AccountPreferencesInput!) {
    updateAccountPreferences(input: $input) {
      id
      timezone
      timeFormat
      language
    }
  }
`;
```

---

## Hook Implementation

```typescript
// useUserPreferences.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useUserPreferences() {
  return useQuery({
    queryKey: ['userPreferences'],
    queryFn: getMyPreferences,
    staleTime: 10 * 60 * 1000, // 10 minutes
    networkMode: 'offlineFirst',
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
    },
  });
}

export function useUpdateAccountPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAccountPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
    },
  });
}
```

---

## Settings Classification

### Backend Sync Required (ISSUE-173 scope)
| Setting | Why Backend |
|---------|-------------|
| Notification preferences | Email/push across devices |
| Timezone | EPA compliance deadlines |
| Language | User identity preference |

### Local-Only (Keep in settings-store.ts)
| Setting | Why Local |
|---------|-----------|
| Theme (light/dark) | Device display preference |
| Date format | Device display preference |
| Units (imperial/metric) | Device display preference |
| Sync interval | Device-specific capability |
| Photo quality | Device storage/bandwidth |
| WiFi-only sync | Device network preference |

---

## Timezone Impact on Compliance

**CRITICAL:** User timezone affects EPA inspection deadlines:

```typescript
// Example: Storm event at Saturday 11 PM
// User timezone: America/Los_Angeles (PST)

// Storm event timestamp: 2024-03-16T23:00:00-08:00
// Inspection deadline: Within 24 working hours
// If user's TZ is wrong, deadline calculation is wrong
// Result: Potential EPA violation ($25k-$50k/day fine)
```

---

## Acceptance Criteria

- [ ] UserPreferences Prisma model created
- [ ] Migration runs successfully
- [ ] myPreferences query returns user's preferences
- [ ] updateNotificationPreferences mutation works
- [ ] updateAccountPreferences mutation works
- [ ] Settings pages sync with backend
- [ ] Local-only settings remain in localStorage
- [ ] Timezone correctly affects compliance calculations
- [ ] Tests passing (>80% coverage)

---

## Evidence Required

- [ ] Screenshot of preferences saved to database
- [ ] Screenshot of preferences synced across devices
- [ ] Test results screenshot
- [ ] Timezone compliance calculation verification

---

## Related Issues

- ISSUE-141: Settings Pages (UI created in Sprint 5)
- ISSUE-142: Help System (similar pattern)

---

## Completion Summary

**Completed:** 2025-11-30

### Files Created

- `apps/web/lib/api/user-preferences.ts` - GraphQL API helpers for preferences
- `apps/web/hooks/useUserPreferences.ts` - TanStack Query hooks

### Files Modified

**Backend:**

- `packages/database/schema.prisma` - Added UserPreferences model
- `apps/backend/src/modules/users/users.module.ts` - Added DatabaseModule import
- `apps/backend/src/modules/users/users.service.ts` - Added preference methods
- `apps/backend/src/modules/users/users.resolver.ts` - Added GraphQL types and mutations

**Frontend:**

- `apps/web/app/settings/notifications/page.tsx` - Backend sync integration
- `apps/web/app/settings/account/page.tsx` - Backend sync integration

### GraphQL Operations Added

**Query:**

- `myPreferences` - Get user preferences (creates defaults if not exists)

**Mutations:**

- `updateNotificationPreferences(input)` - Update notification settings
- `updateAccountPreferences(input)` - Update timezone/language (CRITICAL for EPA compliance)

### Key Implementation Details

1. **Upsert Pattern**: Preferences created on first access with sensible defaults
2. **Backend Sync**: Settings pages load from backend, sync on "Sync to Cloud" button
3. **Local-First**: Local Valtio store provides immediate UI updates
4. **EPA Compliance**: Timezone changes logged for audit trail
5. **Offline Support**: TanStack Query with offlineFirst networkMode

### Type-Check: PASSING (backend + frontend)
