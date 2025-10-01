# ISSUE-016: Create NOAA API Client

**Sprint:** Sprint 1 | **Phase:** 4 - Weather API | **Priority:** P1
**Time:** 2 hours | **Points:** 5 | **Status:** Not Started
**Created:** 2025-09-30 20:22:00 EDT

## What You'll Do

Create NOAA Weather API client with actual HTTP calls.

## Step-by-Step

1. Create `apps/backend/src/modules/weather/clients/noaa.client.ts`
2. Implement `getStationForCoordinates(lat, lng)`
3. Implement `getPrecipitation(stationId, startDate, endDate)`
4. Test with EPA HQ coordinates: 38.8951, -77.0364
5. Add retry logic (3 attempts, exponential backoff)

## Acceptance Criteria

- [ ] NOAAClient class created
- [ ] Actual API calls working
- [ ] Real precipitation data retrieved
- [ ] Retry logic implemented

## Evidence

`evidence/ISSUE-016/deployment/noaa-api-response.json`
