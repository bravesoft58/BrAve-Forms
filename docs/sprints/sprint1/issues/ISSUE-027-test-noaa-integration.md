# ISSUE-027: Test NOAA Client with Real API Call

**Sprint:** Sprint 1 | **Phase:** Phase 4 - Weather API | **Priority:** P0
**Time:** 20 minutes | **Points:** 2 | **Status:** Not Started
**Created:** 2025-10-01 15:50:00 EDT
**Dependencies:** ISSUE-026 ✅

---

## What You'll Do

Create integration test with actual NOAA API to verify client works correctly.

---

## Step-by-Step Instructions

### Prerequisites
- ISSUE-026 complete (NOAA client with error handling)

### Steps

1. Create `apps/backend/src/modules/weather/clients/noaa.client.spec.ts`

2. Write integration test:
```typescript
import { NOAAClient } from './noaa.client';

describe('NOAAClient Integration', () => {
  const client = new NOAAClient();

  it('should fetch station for EPA HQ coordinates', async () => {
    const stationId = await client.getStationForCoordinates(38.8951, -77.0364);
    expect(stationId).toBeTruthy();
    expect(typeof stationId).toBe('string');
  }, 10000); // 10 second timeout for API call

  it('should fetch precipitation data', async () => {
    const stationId = await client.getStationForCoordinates(38.8951, -77.0364);
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    const data = await client.getPrecipitation(stationId, startDate, endDate);
    expect(Array.isArray(data)).toBe(true);
  }, 15000); // 15 second timeout for API calls

  it('should handle invalid coordinates with error', async () => {
    await expect(
      client.getStationForCoordinates(999, 999)
    ).rejects.toThrow('Failed to get NOAA station');
  }, 10000);
});
```

3. Run test: `pnpm --filter backend test noaa.client.spec.ts`

4. Wait for tests to complete (may take 30+ seconds for API calls)

5. Screenshot passing tests

---

## Files to Create

**New Files:**
- `apps/backend/src/modules/weather/clients/noaa.client.spec.ts`

---

## Verification Checklist

- [ ] Test file created next to noaa.client.ts
- [ ] Integration tests written (call real API)
- [ ] Tests use EPA HQ coordinates (38.8951, -77.0364)
- [ ] Tests have appropriate timeouts (10-15 seconds)
- [ ] Tests verify station ID is returned
- [ ] Tests verify precipitation data is array
- [ ] Error handling test included
- [ ] All tests pass with real API
- [ ] Evidence collected

---

## Testing Steps

1. Run tests: `pnpm --filter backend test noaa.client.spec.ts`
2. Wait for API calls to complete
3. Verify all 3 tests pass
4. Screenshot test results

---

## Evidence Requirements

**Location:** `evidence/ISSUE-027/test-results/`

**Required Screenshots:**
1. `noaa-integration-tests.png` - Terminal showing all tests passing

---

## Troubleshooting

**Problem:** Tests timeout
- Increase timeout: `it('test', async () => {...}, 20000)` (20 seconds)
- Check internet connection
- Check NOAA API is available: https://api.weather.gov/

**Problem:** 404 errors from NOAA API
- Verify coordinates are valid: 38.8951, -77.0364 (EPA HQ)
- Check NOAA API status: https://www.weather.gov/
- Try different coordinates if EPA HQ unavailable

**Problem:** Tests fail intermittently
- NOAA API has rate limits (reasonable use)
- Add retry logic if needed
- Space out API calls

**Problem:** TypeScript errors in test
- Check Jest types installed: `@types/jest`
- Verify test file uses `.spec.ts` extension
- Check tsconfig includes test files

---

## Success Criteria

- Integration test file created
- Tests call real NOAA API
- Tests verify station ID retrieval
- Tests verify precipitation data retrieval
- Error handling tested
- All tests pass
- Evidence collected

---

## Next Issue

**ISSUE-028:** Create Precipitation Accumulation Function (20 minutes)

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P0
**Estimated Time:** 20 minutes
