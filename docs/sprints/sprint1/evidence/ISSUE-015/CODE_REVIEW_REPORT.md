# Code Review Report: ISSUE-015 WeatherAlert.tsx TanStack Query Migration

**Reviewer:** Frontend UX Developer Agent
**Date:** 2025-10-01
**File Reviewed:** apps/web/components/Weather/WeatherAlert.tsx
**Issue:** ISSUE-015 - Convert WeatherAlert from Apollo to TanStack Query v5

---

## Overall Assessment: NEEDS CHANGES (BLOCKED)

**Status:** BLOCKED - Critical GraphQL schema mismatch will cause runtime errors

**Severity:** HIGH - Will fail in production with data retrieval errors

---

## Critical Issues Found

### 1. GraphQL Schema Mismatch (BLOCKING)

**Lines 25-44 in WeatherAlert.tsx:**

The fetcher function queries for fields that **do not exist** in the backend GraphQL schema:

```typescript
// INCORRECT - These fields don't exist in backend WeatherEvent schema
query GetPendingInspections {
  pendingInspections {
    type              // DOES NOT EXIST
    dueDate           // DOES NOT EXIST
    rainEvent {       // DOES NOT EXIST
      id
      precipitationInches
      timestamp
    }
  }
}
```

**Backend Reality (apps/backend/src/modules/weather/weather.resolver.ts lines 44-70):**

```typescript
@ObjectType()
export class WeatherEvent {
  @Field(() => ID) id: string;
  @Field() projectId: string;
  @Field(() => Float) precipitationInches: number;
  @Field() eventDate: Date;
  @Field() inspectionDeadline: Date;
  @Field(() => Boolean) inspectionCompleted: boolean;
  @Field(() => WeatherSource) source: WeatherSource;
  @Field(() => Boolean) notificationsSent: boolean;
  @Field() createdAt: Date;
}
```

**Impact:** The query will fail at runtime with GraphQL field resolution errors.

**Root Cause:** The GraphQL query was written based on the old Apollo `GET_PENDING_INSPECTIONS` (line 38-52 in weather.queries.ts) which uses the CORRECT fields, but the new fetch-based query added INCORRECT fields.

---

### 2. Hardcoded API URL (HIGH PRIORITY)

**Line 21:** `const response = await fetch('http://localhost:30101/graphql', {...})`

**Issues:**
- Hardcoded localhost URL will fail in production
- No environment variable usage
- Not consistent with project patterns

**Expected Pattern:**
```typescript
const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:30101/graphql';
```

**Reference:** Other API helpers should use env vars (check apps/web/lib/api/ for patterns)

---

### 3. Missing Authentication Headers (CRITICAL FOR MULTI-TENANCY)

**Line 21-25:** The fetch request has NO authentication headers

**Security Risk:**
- No JWT token sent with request
- Backend ClerkAuthGuard will reject the request
- Multi-tenant orgId filtering won't work (data leak risk)

**Required Fix:**
```typescript
import { auth } from '@clerk/nextjs/server'; // For server components
// OR
import { useAuth } from '@clerk/nextjs'; // For client components (current)

async function fetchPendingInspections(token: string) {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // REQUIRED
    },
    body: JSON.stringify({...}),
  });
}

// In component:
const { getToken } = useAuth();
const { data, isPending, error, refetch } = useQuery({
  queryKey: queryKeys.complianceDeadlines,
  queryFn: async () => {
    const token = await getToken();
    return fetchPendingInspections(token);
  },
  // ...
});
```

---

## TanStack Query v5 Best Practices Review

### ✅ CORRECT Implementations:

1. **Query Configuration (Lines 64-69):**
   - ✅ Correct queryKey usage: `queryKeys.complianceDeadlines` (centralized in lib/query/client.ts line 222)
   - ✅ Proper refetchInterval: 60000ms (60 seconds) for EPA compliance monitoring
   - ✅ Retry strategy: `retry: 2` (reasonable for compliance-critical data)

2. **Error Handling (Lines 101-117):**
   - ✅ Graceful degradation with fallback to cached data: `if (error && !data)`
   - ✅ User-friendly error message: "Weather monitoring unavailable - Manual verification required"
   - ✅ Visual indicator with IconWifiOff for offline state

3. **Loading States (Lines 72, 95-99):**
   - ✅ Alias for compatibility: `const loading = isPending;`
   - ✅ Skeleton loader during initial load: `<Skeleton height={60} radius="md" />`

4. **Refetch Integration (Lines 82-84):**
   - ✅ Real-time alert integration: `refetch()` called when subscription receives data
   - ✅ Ensures data consistency between polling and WebSocket updates

### ⚠️ IMPROVEMENT AREAS:

1. **Retry Logic Enhancement:**
   ```typescript
   // Current:
   retry: 2,

   // Recommended for construction sites (unstable connectivity):
   retry: (failureCount, error) => {
     // Don't retry on schema errors (4xx)
     if (error?.response?.status >= 400 && error?.response?.status < 500) {
       return false;
     }
     // Retry up to 3 times for network errors
     return failureCount < 3;
   },
   retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
   ```

2. **Offline-First Configuration:**
   - The query doesn't explicitly set `networkMode: 'offlineFirst'` (though it inherits from global config)
   - Should verify global config in providers.tsx uses offline-first settings

---

## Hybrid Apollo/TanStack Approach Review

### ✅ APPROVED: Clean Separation Strategy

**Import Statements (Lines 6-7):**
```typescript
import { useQuery } from '@tanstack/react-query';      // TanStack for queries
import { useSubscription } from '@apollo/client';      // Apollo for subscriptions
```

✅ Minimal Apollo imports (only useSubscription)
✅ No Apollo query imports remain (GET_PENDING_INSPECTIONS correctly removed from imports)
✅ Comment documents temporary hybrid state: "Keep subscription for now"

**Subscription Usage (Lines 74-93):**
```typescript
const { data: alertData } = useSubscription(WEATHER_ALERTS_SUBSCRIPTION, {
  variables: { orgId },
  skip: !orgId,
  onData: ({ data: subscriptionData }) => {
    if (subscriptionData.data?.weatherAlerts) {
      setLatestAlert(subscriptionData.data.weatherAlerts);
      refetch(); // Refetch TanStack query
    }
  },
});
```

✅ Well-isolated subscription logic
✅ Proper integration with TanStack Query via `refetch()`
✅ Conditional skip when orgId unavailable

**Backend Reality Check:**

⚠️ **SUBSCRIPTION IS DISABLED** in backend (apps/backend/src/modules/weather/weather.resolver.ts lines 143-165):
```typescript
// TODO: Re-enable subscriptions after configuring proper PubSub implementation
// GraphQL subscriptions require Redis or another pub/sub mechanism for production
// For now, clients can poll pendingInspections query
```

**Impact:** The Apollo subscription won't work, but the component gracefully falls back to polling via TanStack Query's `refetchInterval: 60000`.

**Recommendation:** Document this known limitation in component comments.

---

## EPA Compliance Monitoring Integrity

### ✅ PRESERVED: Critical Compliance Logic

1. **0.25" Threshold Logic (Lines 103, 223, 269):**
   - ✅ Uses `weatherUtils.EPA_THRESHOLD: 0.25` (exact, not approximated)
   - ✅ Display formatting: `weatherUtils.formatPrecipitation(amount)` shows 3 decimal places
   - ✅ Priority calculation: `weatherUtils.getPriority(precipitationInches, hoursRemaining)`

2. **60-Second Monitoring (Line 67):**
   - ✅ `refetchInterval: 60000` maintains real-time compliance monitoring
   - ✅ Aligns with EPA CGP 24-hour inspection window requirement
   - ✅ Adequate frequency without excessive API load

3. **Compliance Messaging (Lines 269, 238):**
   - ✅ Accurate EPA messaging: "EPA CGP requires SWPPP inspection within 24 working hours of ≥0.25" precipitation"
   - ✅ Visual priority indicators: CRITICAL (red), URGENT (orange), ACTION_REQUIRED (yellow)

4. **Offline Awareness (Lines 196-199, 272-276):**
   - ✅ Warning when offline: "Working offline - Weather data may not be current"
   - ✅ Uses app state: `appState.networkStatus === 'offline'`

### ⚠️ RISK: Error Handling Could Break Compliance Alerts

**Current Logic (Lines 101-117):**
```typescript
if (error && !data) {
  return <Alert>Weather monitoring unavailable - Manual verification required</Alert>;
}
```

**Risk:** If API fails during critical compliance window, alert is replaced with generic error message. Inspectors might miss deadline.

**Recommendation:**
```typescript
if (error && !data) {
  // CRITICAL: Always show cached compliance data even during errors
  // Fallback to last known state from IndexedDB persistence
  return (
    <Alert variant="light" color="red" radius="md" icon={<IconAlertTriangle />}>
      <Group gap="xs">
        <IconWifiOff size={16} />
        <Text size="sm" fw={500}>
          Weather monitoring unavailable - Using last known data
        </Text>
        <Text size="xs" c="dimmed">
          Manual verification required for new events
        </Text>
      </Group>
    </Alert>
  );
}
```

---

## Type Safety & Error Handling Review

### ✅ CORRECT Type Usage:

1. **TypeScript Types (Lines 14-15):**
   - ✅ Imported from centralized location: `@/lib/graphql/weather.queries`
   - ✅ Type discrimination: `'message' in alertToShow` (line 159)
   - ✅ Proper type assertions: `alertToShow as WeatherAlertType` (line 160)

2. **Error States (Lines 48, 101-117):**
   - ✅ JSON error extraction: `if (json.errors) throw new Error(json.errors[0].message);`
   - ✅ Graceful rendering: Error alert with actionable message

### ❌ TYPE MISMATCH ISSUES:

**Line 120-122:** Component expects fields that don't exist
```typescript
const pendingInspections: WeatherEvent[] = data?.pendingInspections?.filter(
  (inspection: WeatherEvent) => !projectId || inspection.projectId === projectId
) || [];
```

**Problem:** The WeatherEvent type interface (weather.queries.ts line 78-88) defines fields like `notificationsSent` and `createdAt` that the component doesn't use, but the GraphQL query requests non-existent fields like `type`, `dueDate`, `rainEvent`.

**Fix Required:** Align GraphQL query with backend schema (see Critical Issue #1)

---

## Integration Points Validation

### ✅ CORRECT Integrations:

1. **Query Keys (Line 65):**
   - ✅ Uses `queryKeys.complianceDeadlines` from lib/query/client.ts line 222
   - ✅ Consistent with project's query key factory pattern
   - ✅ Enables proper cache invalidation

2. **Refetch Function (Line 64):**
   - ✅ Destructured from useQuery: `const { data, isPending, error, refetch } = useQuery({...})`
   - ✅ Used in subscription callback: `refetch()` (line 83)
   - ✅ Maintains real-time sync between polling and WebSocket

3. **Data Structure (Line 120):**
   - ⚠️ **ISSUE:** Component expects `WeatherEvent[]` but query requests non-existent fields
   - ✅ Filter logic correct: `!projectId || inspection.projectId === projectId`
   - ✅ Sort logic correct: `calculateHoursRemaining(a.inspectionDeadline) - calculateHoursRemaining(b.inspectionDeadline)`

### ❌ MISSING Integration:

**No offline persistence verification:**
- Query should explicitly check if cached data is available
- Should indicate data staleness to user (e.g., "Last updated: 2 minutes ago")

---

## Recommendations for Future Subscription Migration

### Short-Term (Current Hybrid Approach):

1. **Document Backend Limitation:**
   ```typescript
   // NOTE: Backend subscription is currently disabled (pending Redis PubSub setup)
   // This subscription will gracefully fail and component will rely on polling
   // See: apps/backend/src/modules/weather/weather.resolver.ts line 143
   ```

2. **Add Fallback Logic:**
   ```typescript
   const { data: alertData, error: subscriptionError } = useSubscription(...);

   useEffect(() => {
     if (subscriptionError) {
       console.warn('Real-time alerts unavailable, using 60-second polling');
       // Could show toast notification to user
     }
   }, [subscriptionError]);
   ```

### Long-Term Migration Path:

**Option A: TanStack Query + Server-Sent Events (SSE)**
- Replace GraphQL subscription with SSE endpoint
- TanStack Query supports SSE via custom queryFn
- Better browser compatibility than WebSockets

**Option B: TanStack Query + Polling Only**
- Remove Apollo entirely
- Increase polling frequency for critical projects (e.g., 30 seconds when compliance deadline < 6 hours)
- Simpler architecture, no WebSocket infrastructure needed

**Option C: Keep Hybrid for Real-Time Features**
- Use Apollo only for subscriptions (current approach)
- TanStack Query for all queries and mutations
- Clear separation of concerns

**Recommendation:** Option B (polling only) is best for construction sites:
- More reliable with intermittent connectivity
- No WebSocket connection management overhead
- Simpler offline-first implementation
- 60-second polling adequate for EPA 24-hour compliance window

---

## Production Deployment Risks

### BLOCKERS (Must Fix Before Deployment):

1. ❌ **GraphQL Schema Mismatch** - Will cause runtime errors (Critical Issue #1)
2. ❌ **Missing Authentication** - Backend will reject requests (Critical Issue #3)
3. ❌ **Hardcoded API URL** - Will fail in production environment (Critical Issue #2)

### HIGH PRIORITY (Should Fix):

1. ⚠️ **Backend Subscription Disabled** - Add error handling for subscription failures
2. ⚠️ **No Retry Strategy** - Add exponential backoff for construction site connectivity
3. ⚠️ **Error State Loses Compliance Data** - Show cached data during API failures

### MEDIUM PRIORITY (Post-MVP):

1. 📝 Document hybrid approach limitations
2. 📝 Add data staleness indicators
3. 📝 Consider migration to SSE for real-time features

---

## Required Changes Summary

### IMMEDIATE (Before Merge):

1. **Fix GraphQL Query (Lines 24-45):**
   ```typescript
   // CORRECT query matching backend schema
   query: `
     query GetPendingInspections {
       pendingInspections {
         id
         projectId
         precipitationInches
         eventDate
         inspectionDeadline
         inspectionCompleted
         source
         notificationsSent
         createdAt
       }
     }
   `,
   ```

2. **Add Authentication (Line 21-50):**
   ```typescript
   async function fetchPendingInspections(token: string) {
     const response = await fetch(GRAPHQL_ENDPOINT, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${token}`
       },
       // ... rest of fetch
     });
   }

   // In component:
   const { getToken } = useAuth();
   const { data, isPending, error, refetch } = useQuery({
     queryKey: queryKeys.complianceDeadlines,
     queryFn: async () => {
       const token = await getToken();
       if (!token) throw new Error('Not authenticated');
       return fetchPendingInspections(token);
     },
     // ...
   });
   ```

3. **Use Environment Variable (Line 21):**
   ```typescript
   const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:30101/graphql';
   ```

### RECOMMENDED (Before Production):

1. **Enhanced Retry Logic:**
   ```typescript
   retry: (failureCount, error) => {
     if (error?.response?.status >= 400 && error?.response?.status < 500) {
       return false;
     }
     return failureCount < 3;
   },
   retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
   ```

2. **Subscription Error Handling:**
   ```typescript
   const { data: alertData, error: subscriptionError } = useSubscription(
     WEATHER_ALERTS_SUBSCRIPTION,
     {
       variables: { orgId },
       skip: !orgId,
       onError: (error) => {
         console.warn('Real-time alerts unavailable:', error);
         // Component already has polling fallback
       },
       onData: ({ data: subscriptionData }) => {
         // ... existing logic
       },
     }
   );
   ```

3. **Document Backend Limitation:**
   ```typescript
   // Real-time weather alerts via GraphQL subscription
   // NOTE: Backend subscription currently disabled (pending Redis PubSub setup)
   // Component gracefully falls back to 60-second polling via TanStack Query
   // See: apps/backend/src/modules/weather/weather.resolver.ts line 143
   ```

---

## Final Verdict

**Assessment:** NEEDS CHANGES (BLOCKED)

**Blocker Severity:** HIGH - Cannot merge until Critical Issues #1, #2, #3 are resolved

**Hybrid Approach:** APPROVED with documentation updates

**EPA Compliance Integrity:** PRESERVED (pending Critical Issue #1 fix)

**Production Readiness:** NOT READY - 3 blocking issues, 2 high-priority issues

### Next Steps:

1. Fix GraphQL schema mismatch (remove non-existent fields)
2. Add authentication headers with Clerk JWT token
3. Replace hardcoded API URL with environment variable
4. Add retry logic with exponential backoff
5. Document subscription limitation
6. Re-test with corrected implementation
7. Verify in browser that pending inspections load correctly

**Estimated Fix Time:** 1-2 hours for blocking issues, 30 minutes for recommended improvements

---

**Reviewed By:** Frontend UX Developer Agent
**Review Date:** 2025-10-01
**Next Review:** After blocking issues resolved
