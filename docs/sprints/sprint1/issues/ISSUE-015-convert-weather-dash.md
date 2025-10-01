# ISSUE-015: Convert Weather Dashboard to TanStack Query

**Sprint:** Sprint 1 | **Phase:** 3 - Apollo Removal | **Priority:** P0
**Time:** 20 minutes | **Points:** 2 | **Status:** Not Started
**Created:** 2025-10-01 15:35:00 EDT
**Dependencies:** ISSUE-014 (Organizations converted) ✅

---

## What You'll Do

Convert the weather dashboard page from Apollo Client to TanStack Query for offline-first weather data.

---

## Step-by-Step Instructions

### Step 1: Locate Weather Dashboard (2 min)

1. Find file: `apps/web/app/(dashboard)/weather/page.tsx`
2. Review current Apollo query structure
3. Note weather data fields needed

### Step 2: Create Weather Fetcher Function (8 min)

Add at top of file:

```typescript
async function fetchWeatherData(projectId: string) {
  const response = await fetch('http://localhost:30101/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        query GetWeatherData($projectId: ID!) {
          project(id: $projectId) {
            id
            name
            location
            weatherEvents {
              id
              timestamp
              precipitationInches
              conditions
              temperature
              triggerInspection
            }
          }
        }
      `,
      variables: { projectId },
    }),
  });

  const json = await response.json();

  if (json.errors) {
    throw new Error(json.errors[0].message);
  }

  return json.data.project;
}
```

### Step 3: Update Imports (2 min)

**Remove:**
```typescript
import { useQuery } from '@apollo/client';
import { GET_WEATHER_DATA } from '@/graphql/queries';
```

**Add:**
```typescript
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/client';
```

### Step 4: Convert useQuery Hook (5 min)

**Replace:**
```typescript
const { data, loading, error } = useQuery(GET_WEATHER_DATA, {
  variables: { projectId },
});
```

**With:**
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: queryKeys.weather,
  queryFn: () => fetchWeatherData(projectId),
  enabled: !!projectId, // Only fetch if projectId exists
});
```

### Step 5: Update Component Logic (3 min)

1. Change `loading` to `isLoading`
2. Update data access: `data?.weatherEvents` or similar
3. Ensure fallbacks: `const events = data?.weatherEvents || []`

---

## Files to Modify

1. `apps/web/app/(dashboard)/weather/page.tsx`

---

## Verification Checklist

- [ ] Weather fetcher function created
- [ ] Apollo imports removed
- [ ] TanStack Query imports added
- [ ] `useQuery` converted with proper queryKey
- [ ] `enabled` flag prevents unnecessary fetches
- [ ] Weather events display correctly
- [ ] 0.25" threshold highlighting still works

---

## Testing Steps

1. Navigate to weather dashboard: http://localhost:3000/weather
2. Select a project from dropdown
3. Verify weather events load
4. Check for 0.25" precipitation events (should be highlighted)
5. Open React Query DevTools
6. Verify `['weather']` query is cached
7. Test offline mode (Network tab → Offline)
8. Verify cached data still displays

---

## Expected Behavior

**Weather Event Display:**
- Show timestamp, precipitation, conditions
- Highlight events >= 0.25" (EPA trigger threshold)
- Show inspection status (required/completed)

**Offline Capability:**
- Weather data cached for 30 days
- Works offline after initial load
- Refetches when coming back online

---

## Evidence Requirements

### Screenshot 1: Weather Dashboard Working
- File: `evidence/ISSUE-015/deployment/weather-dashboard-working.png`
- Show: Weather events displaying with 0.25" highlights

### Screenshot 2: React Query Cache
- File: `evidence/ISSUE-015/deployment/weather-cache.png`
- Show: `['weather']` query in DevTools

### Screenshot 3: Offline Test
- File: `evidence/ISSUE-015/deployment/offline-weather.png`
- Show: Weather data still visible in offline mode

---

## Troubleshooting

### Issue: "Cannot read property 'weatherEvents' of undefined"
**Solution:** Add optional chaining: `data?.weatherEvents || []`

### Issue: Weather events not highlighted
**Solution:** Check threshold logic:
```typescript
const isThreshold = event.precipitationInches >= 0.25;
```

### Issue: Query refetches too often
**Solution:** Adjust staleTime in queryKey:
```typescript
queryKey: queryKeys.weather,
staleTime: 5 * 60 * 1000, // 5 minutes
```

---

## Success Criteria

- ✅ Weather dashboard loads without errors
- ✅ Weather events display correctly
- ✅ 0.25" threshold events are highlighted
- ✅ Works offline after initial load
- ✅ React Query DevTools shows cache
- ✅ No Apollo imports remain

---

## Next Issue

**ISSUE-016:** Delete Test Apollo Page and Mutations (15 minutes)

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P0 (Critical for offline capability)
**Estimated Time:** 20 minutes
