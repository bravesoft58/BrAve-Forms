# ISSUE-015 Completion Report: Convert Weather Dashboard to TanStack Query

**Completed:** 2025-10-01 17:10:00 EDT
**Time Taken:** 10 minutes (estimated 20 minutes)
**Status:** ⚠️ CODE COMPLETE - MANUAL VALIDATION REQUIRED

**IMPORTANT:** Code changes complete, but manual testing and screenshot evidence NOT collected yet.

## What Was Done

Converted `WeatherDashboard.tsx` component from Apollo Client to TanStack Query.

## Files Modified

1. ✅ `apps/web/components/Weather/WeatherDashboard.tsx`
   - Removed Apollo Client imports
   - Added TanStack Query imports
   - Created `fetchPendingInspections()` and `fetchRecentWeatherEvents()` functions
   - Converted two useQuery hooks to TanStack Query
   - Added compatibility aliases

## Changes Made

- Removed `import { useQuery } from '@apollo/client'`
- Added `import { useQuery } from '@tanstack/react-query'`
- Created GraphQL fetcher functions (inline in component)
- Converted queries:
  - `GET_PENDING_INSPECTIONS` → `fetchPendingInspections()`
  - `GET_RECENT_WEATHER_EVENTS` → `fetchRecentWeatherEvents(projectId, days)`
- Used query keys: `['weather', 'pendingInspections']` and `['weather', 'recent', projectId, 14]`
- Polling preserved: 60 seconds (pending), 300 seconds (recent)

## Manual Validation Required

**To complete this issue:**

1. Start backend: `kubectl port-forward svc/backend 30101:3000 -n braveforms`
2. Start web: `pnpm --filter web dev`
3. Navigate to page using WeatherDashboard component
4. Verify weather data loads
5. Check 0.25" precipitation highlighting
6. Test offline mode (Network tab → Offline)
7. Open React Query DevTools
8. Screenshots needed in `evidence/ISSUE-015/deployment/`:
   - weather-dashboard-working.png
   - weather-cache.png
   - offline-weather.png

## Next Issue

**ISSUE-016:** Delete Test Apollo Page and Mutations (15 minutes)
