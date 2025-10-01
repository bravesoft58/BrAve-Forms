# ISSUE-015 Required Fixes - WeatherAlert.tsx

**Status:** BLOCKED - 3 Critical Issues Must Be Resolved
**File:** apps/web/components/Weather/WeatherAlert.tsx
**Estimated Fix Time:** 1-2 hours

---

## Critical Issue #1: GraphQL Schema Mismatch

**Current (INCORRECT) - Lines 24-45:**
```typescript
query: `
  query GetPendingInspections {
    pendingInspections {
      id
      projectId
      type              // ❌ DOES NOT EXIST
      dueDate           // ❌ DOES NOT EXIST
      inspectionDeadline
      eventDate
      precipitationInches
      source
      rainEvent {       // ❌ DOES NOT EXIST
        id
        precipitationInches
        timestamp
      }
    }
  }
`,
```

**Required Fix:**
```typescript
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

**Backend Schema Reference:** apps/backend/src/modules/weather/weather.resolver.ts lines 44-70

---

## Critical Issue #2: Missing Authentication

**Current (INCORRECT) - Lines 19-50:**
```typescript
async function fetchPendingInspections() {
  const response = await fetch('http://localhost:30101/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }, // ❌ NO AUTH
    body: JSON.stringify({...}),
  });
  // ...
}
```

**Required Fix:**
```typescript
async function fetchPendingInspections(token: string) {
  const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:30101/graphql';

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ✅ ADD AUTH HEADER
    },
    body: JSON.stringify({
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
    }),
  });

  const json = await response.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}
```

**Required Component Update - Lines 64-69:**
```typescript
const { getToken } = useAuth(); // Already imported

const { data, isPending, error, refetch } = useQuery({
  queryKey: queryKeys.complianceDeadlines,
  queryFn: async () => {
    const token = await getToken();
    if (!token) throw new Error('Not authenticated');
    return fetchPendingInspections(token);
  },
  refetchInterval: 60000,
  retry: 2,
});
```

---

## Critical Issue #3: Hardcoded API URL

**Current (INCORRECT) - Line 21:**
```typescript
const response = await fetch('http://localhost:30101/graphql', {...}) // ❌ HARDCODED
```

**Required Fix:**
```typescript
// Add to .env.local:
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:30101/graphql

// In component:
const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:30101/graphql';

async function fetchPendingInspections(token: string) {
  const response = await fetch(GRAPHQL_ENDPOINT, {...}) // ✅ USE ENV VAR
}
```

---

## Complete Fixed Implementation

**Replace lines 19-50 with:**

```typescript
// GraphQL fetcher for pending inspections
const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:30101/graphql';

async function fetchPendingInspections(token: string) {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
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
    }),
  });

  const json = await response.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}
```

**Replace lines 64-69 with:**

```typescript
// Get pending inspections for the organization
const { getToken } = useAuth();

const { data, isPending, error, refetch } = useQuery({
  queryKey: queryKeys.complianceDeadlines,
  queryFn: async () => {
    const token = await getToken();
    if (!token) throw new Error('Not authenticated');
    return fetchPendingInspections(token);
  },
  refetchInterval: 60000, // Refresh every minute for compliance monitoring
  retry: (failureCount, error: any) => {
    // Don't retry authentication errors
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      return false;
    }
    // Retry network errors up to 3 times
    return failureCount < 3;
  },
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});
```

---

## Recommended Improvements (Non-Blocking)

### 1. Document Backend Subscription Limitation

**Add comment before line 74:**

```typescript
// Real-time weather alerts via GraphQL subscription
// NOTE: Backend subscription currently disabled (pending Redis PubSub setup)
// Component gracefully falls back to 60-second polling via TanStack Query
// See: apps/backend/src/modules/weather/weather.resolver.ts line 143
const { data: alertData, error: subscriptionError } = useSubscription(WEATHER_ALERTS_SUBSCRIPTION, {
  variables: { orgId },
  skip: !orgId,
  onError: (error) => {
    console.warn('Real-time alerts unavailable, using polling fallback:', error);
  },
  onData: ({ data: subscriptionData }) => {
    if (subscriptionData.data?.weatherAlerts) {
      setLatestAlert(subscriptionData.data.weatherAlerts);
      refetch();
    }
  },
});
```

### 2. Add Environment Variable to .env.local

```bash
# GraphQL API Endpoint
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:30101/graphql
```

### 3. Enhanced Error Handling

**Replace lines 101-117 with:**

```typescript
if (error && !data) {
  return (
    <Alert
      variant="light"
      color="red"
      radius="md"
      icon={<IconAlertTriangle size={20} />}
    >
      <Group gap="xs">
        <IconWifiOff size={16} />
        <Text size="sm" fw={500}>
          Weather monitoring unavailable - Using last known data
        </Text>
      </Group>
      <Text size="xs" c="dimmed" mt="xs">
        Manual verification required for new events
      </Text>
    </Alert>
  );
}
```

---

## Testing Checklist

After applying fixes, verify:

- [ ] TypeScript compiles without errors: `pnpm type-check`
- [ ] GraphQL query matches backend schema
- [ ] Authentication header included in request
- [ ] Environment variable loaded correctly
- [ ] Component renders without runtime errors
- [ ] Pending inspections load successfully
- [ ] Error states display properly
- [ ] Offline mode works (shows cached data)
- [ ] Refetch works when subscription receives data
- [ ] 60-second polling continues when subscription fails

---

## Files to Update

1. **apps/web/components/Weather/WeatherAlert.tsx** (primary changes)
2. **apps/web/.env.local** (add NEXT_PUBLIC_GRAPHQL_URL)

---

## Verification Commands

```bash
# 1. Type check
cd e:\BrAve Forms\apps\web
pnpm type-check

# 2. Build check
pnpm build

# 3. Run dev server
pnpm dev

# 4. Test in browser
# Navigate to http://localhost:3001
# Check console for GraphQL errors
# Verify pending inspections display
```

---

**Priority:** HIGH - Must fix before merging ISSUE-015
**Estimated Time:** 1-2 hours (including testing)
**Next Step:** Apply fixes and re-test
