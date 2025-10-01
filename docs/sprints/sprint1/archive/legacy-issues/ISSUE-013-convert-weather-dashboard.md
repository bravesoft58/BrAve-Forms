# ISSUE-013: Convert WeatherDashboard to TanStack Query

**Sprint:** Sprint 1 | **Phase:** 3 - Apollo Removal | **Priority:** P0
**Time:** 1 hour | **Points:** 3 | **Status:** Not Started
**Created:** 2025-09-30 20:22:00 EDT

## What You'll Do

Convert WeatherDashboard component from Apollo to TanStack Query.

## Step-by-Step

1. Create `apps/web/lib/api/weather.ts` (fetch helper)
2. Replace Apollo useQuery with TanStack useQuery
3. Test component renders with backend data
4. Verify offline mode works (disable network, check cache)

## Acceptance Criteria

- [ ] Component converted
- [ ] API helper created
- [ ] Data fetches correctly
- [ ] Offline cache works

## Evidence

`evidence/ISSUE-013/deployment/weather-dashboard-working.png`
