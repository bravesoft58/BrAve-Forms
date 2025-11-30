# Sprint 6: Production Backend Integration

**Sprint:** Sprint 6 - Production-Ready Backend Wiring
**Goal:** Connect ALL frontend features to backend APIs for production deployment
**Estimated Hours:** 37 hours total
**Status:** IN PROGRESS
**Created:** 2025-11-30

---

## Executive Summary

Sprint 5 delivered excellent UI/UX (550+ tests, 43 issues). However, deep dive analysis revealed **7 major frontend-to-backend connectivity gaps**. Phase 0 of Sprint 5 connected core features (submissions, dashboard, QR portal, GPS, photos) but the following remain disconnected:

### Critical Gaps Found

| Category | Gap | Current State | Impact |
|----------|-----|---------------|--------|
| P0 | Form Builder Save | localStorage only | Cannot create templates |
| P0 | Form Builder Edit | Placeholder loader | Cannot edit templates |
| P1 | Projects List | Mock data | Shows fake projects |
| P1 | Photo Gallery API | REST `/api/photos` | Should be GraphQL |
| P1 | Photo Pairing | No mutation | Cannot create pairs |
| P1 | User Preferences | localStorage only | No multi-device sync |
| P2 | Help/Support | IndexedDB queue | No backend endpoint |

**Note:** Weather monitoring was verified as FULLY FUNCTIONAL with proper 0.25" threshold implementation and 22+ passing tests. No additional work needed.

---

## Issue Breakdown

### Phase 0: Critical Production Blockers (12h)

#### ISSUE-168: Form Builder Backend Integration (8h) - P0
**Problem:** Form Builder only saves to localStorage. Backend mutations exist but frontend never calls them.
**Solution:**
- Create GraphQL operations (`forms.mutations.ts`, `forms.queries.ts`)
- Create TanStack Query hooks (`useFormTemplates.ts`)
- Wire `createFormTemplate` mutation to save
- Add Clerk authentication to builder pages
- Convert `fields[]` to `schema` JSONB for backend

#### ISSUE-169: Form Builder Edit Page (4h) - P0
**Problem:** Edit page at `/builder/[id]` has placeholder template loader returning null.
**Solution:**
- Load template from backend via `formTemplate(id)` query
- Populate form-builder-store with loaded data
- Wire `updateFormTemplate` mutation on save
- Handle version conflicts

---

### Phase 1: MVP Required Features (22h)

#### ISSUE-170: Replace Mock Projects Data (4h) - P1
**Problem:** Projects page uses `getMockProjects()` from mock data file.
**Solution:**
- Use existing `projects` GraphQL query
- Create `useProjects()` TanStack Query hook
- Replace mock data imports in projects page
- Delete mock-data/projects.ts after verification

#### ISSUE-171: Photo Gallery GraphQL Migration (6h) - P1
**Problem:** Photo gallery uses REST `/api/photos` endpoint instead of GraphQL.
**Solution:**
- Create `getPhotos` GraphQL query (or use existing photos resolver)
- Create `usePhotos()` hook with filters
- Replace fetch() calls with GraphQL client
- Ensure multi-tenancy filtering

#### ISSUE-172: Photo Pairing Backend (4h) - P1
**Problem:** Before/after photo pairing queues to localStorage but has no backend mutation.
**Solution:**
- Create `createPhotoPair` mutation in backend if not exists
- Create frontend mutation hook
- Wire up pairing UI to backend
- Handle offline queue with sync

#### ISSUE-173: User Preferences Backend (8h) - P1
**Problem:** Settings pages use localStorage only via settings-store. No database persistence.
**Solution:**
- Create `UserPreferences` Prisma model
- Create GraphQL types and mutations
- Create `myPreferences` query
- Create `updateNotificationPreferences`, `updateAccountPreferences` mutations
- Update settings pages to sync with backend

**CRITICAL:** Timezone setting affects inspection deadlines (EPA compliance).

---

### Phase 2: Important Completeness (3h)

#### ISSUE-174: Help/Support Backend (3h) - P2
**Problem:** Support requests queue to IndexedDB but no backend endpoint exists.
**Solution:**
- Create `createSupportRequest` mutation
- Create SupportRequest Prisma model
- Wire frontend to mutation
- Process offline queue on reconnect

---

## Database Schema Additions

### UserPreferences Model (ISSUE-173)
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

### SupportRequest Model (ISSUE-174)
```prisma
model SupportRequest {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  orgId       String   @map("org_id")
  type        String   // bug, feature, help, feedback
  subject     String
  description String
  status      String   @default("OPEN")
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([orgId])
  @@index([status])
  @@map("support_requests")
}
```

---

## Implementation Order

1. **ISSUE-168** (8h) - Form Builder Backend - P0 BLOCKER
2. **ISSUE-169** (4h) - Form Builder Edit - P0 BLOCKER
3. **ISSUE-170** (4h) - Projects List Real API - P1
4. **ISSUE-171** (6h) - Photo Gallery GraphQL - P1
5. **ISSUE-172** (4h) - Photo Pairing Backend - P1
6. **ISSUE-173** (8h) - User Preferences Backend - P1 (timezone critical)
7. **ISSUE-174** (3h) - Help/Support Backend - P2

**Total: 37 hours** (~5 working days at 7h/day)

---

## Success Criteria

- [ ] Form Builder creates templates in database (not localStorage)
- [ ] Form Builder edits existing templates
- [ ] Projects list shows real projects from API
- [ ] Photo gallery uses GraphQL instead of REST
- [ ] Photo pairing persists to database
- [ ] User preferences sync to backend (notifications, timezone)
- [ ] Help requests submit to backend
- [ ] All mock data files deleted
- [ ] All TODO comments about API resolved
- [ ] >80% test coverage for new hooks
- [ ] Zero emoji, zero AI branding

---

## Critical Files to Read Before Implementation

### Backend (Existing API Surface)
- `apps/backend/src/modules/forms/forms.resolver.ts` - Existing mutations
- `apps/backend/src/modules/forms/forms.types.ts` - Input types
- `apps/backend/src/modules/photos/photos.resolver.ts` - Photo queries
- `apps/backend/src/modules/users/users.resolver.ts` - Current state

### Frontend (Files to Modify)
- `apps/web/app/dashboard/forms/builder/page.tsx` - TODO comment line 19
- `apps/web/app/dashboard/forms/builder/[id]/page.tsx` - Placeholder loader
- `apps/web/app/dashboard/projects/page.tsx` - Mock import
- `apps/web/lib/stores/form-builder-store.ts` - localStorage functions
- `apps/web/lib/stores/settings-store.ts` - localStorage only

### Patterns to Follow
- `apps/web/hooks/useFormSubmissions.ts` - TanStack Query pattern (ISSUE-162)
- `apps/web/lib/api/submissions.ts` - GraphQL helper pattern

---

## Risk Areas

1. **Type Mismatch:** Form Builder uses `fields[]`, backend expects `schema` JSONB
2. **Clerk Auth:** Builder pages missing authentication - will fail 401
3. **iOS Storage:** IndexedDB is transient - critical data must use SQLite
4. **Timezone Impact:** User timezone affects EPA inspection deadlines
5. **Offline Queue:** Must handle sync when coming back online

---

## Files to Delete After Sprint 6

Once all APIs connected and verified:
- `apps/web/lib/mock-data/projects.ts`
- `apps/web/lib/mock-data/form-templates.ts` (if redundant)
- Any remaining mock-data files

---

## Sprint Progress

| Issue | Title | Priority | Hours | Status |
|-------|-------|----------|-------|--------|
| ISSUE-168 | Form Builder Backend Integration | P0 | 8h | PENDING |
| ISSUE-169 | Form Builder Edit Page | P0 | 4h | PENDING |
| ISSUE-170 | Replace Mock Projects Data | P1 | 4h | PENDING |
| ISSUE-171 | Photo Gallery GraphQL Migration | P1 | 6h | PENDING |
| ISSUE-172 | Photo Pairing Backend | P1 | 4h | PENDING |
| ISSUE-173 | User Preferences Backend | P1 | 8h | PENDING |
| ISSUE-174 | Help/Support Backend | P2 | 3h | PENDING |

**Total: 7 issues, 37 hours**

---

**Sprint 6 Focus:** Wire everything to backend for true production deployment.
