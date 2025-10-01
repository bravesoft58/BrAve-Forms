# ISSUE-026: Add NOAA Client Error Handling

**Sprint:** Sprint 1 | **Phase:** Phase 4 - Weather API | **Priority:** P1
**Time:** 20 minutes | **Points:** 2 | **Status:** Not Started
**Created:** 2025-10-01 15:45:00 EDT
**Dependencies:** ISSUE-025 ✅

---

## What You'll Do

Add try-catch blocks and HTTP error handling to NOAA client methods.

---

## Step-by-Step Instructions

### Prerequisites
- ISSUE-025 complete (both NOAA methods implemented)

### Steps

1. Open `apps/backend/src/modules/weather/clients/noaa.client.ts`

2. Wrap `getStationForCoordinates` in try-catch:
```typescript
async getStationForCoordinates(lat: number, lon: number): Promise<string> {
  try {
    // 1. Get point metadata
    const pointUrl = `${this.baseUrl}/points/${lat},${lon}`;
    const pointResponse = await fetch(pointUrl);

    if (!pointResponse.ok) {
      throw new Error(`NOAA API returned ${pointResponse.status}: ${pointResponse.statusText}`);
    }

    const pointData: NOAAPointResponse = await pointResponse.json();

    // 2. Get nearest station
    const stationsUrl = pointData.properties.observationStations;
    const stationsResponse = await fetch(stationsUrl);

    if (!stationsResponse.ok) {
      throw new Error(`NOAA API returned ${stationsResponse.status}: ${stationsResponse.statusText}`);
    }

    const stationsData = await stationsResponse.json();

    // 3. Return first station ID
    return stationsData.features[0].id;
  } catch (error) {
    throw new Error(
      `Failed to get NOAA station for coordinates ${lat},${lon}: ${error.message}`
    );
  }
}
```

3. Wrap `getPrecipitation` in try-catch:
```typescript
async getPrecipitation(
  stationId: string,
  startDate: Date,
  endDate: Date
): Promise<PrecipitationData[]> {
  try {
    // 1. Fetch observations
    const url = `${this.baseUrl}/stations/${stationId}/observations`;
    const params = new URLSearchParams({
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    });

    const response = await fetch(`${url}?${params}`);

    if (!response.ok) {
      throw new Error(`NOAA API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // 2. Convert to PrecipitationData
    return data.features.map((obs: NOAAObservation) => ({
      timestamp: new Date(obs.properties.timestamp),
      amountInches: this.mmToInches(obs.properties.precipitationLastHour.value),
      stationId,
    }));
  } catch (error) {
    throw new Error(
      `Failed to get precipitation for station ${stationId}: ${error.message}`
    );
  }
}
```

4. Save file

---

## Files to Modify

**Edit:**
- `apps/backend/src/modules/weather/clients/noaa.client.ts`

---

## Verification Checklist

- [ ] Try-catch blocks added to both methods
- [ ] HTTP status checks implemented (`response.ok`)
- [ ] Error messages include context (coordinates, stationId)
- [ ] Error messages include original error details
- [ ] HTTP status included in error messages
- [ ] File compiles successfully

---

## Testing Steps

1. Run type check: `pnpm --filter backend type-check`
2. Verify error handling compiles
3. Check error messages are descriptive

---

## Evidence Requirements

**Location:** `evidence/ISSUE-026/code/`

**Required Screenshots:**
1. `error-handling.png` - Both methods with error handling
2. `git-diff-error-handling.png` - Git diff showing added error handling

---

## Troubleshooting

**Problem:** TypeScript error on error.message
- Use type assertion: `(error as Error).message`
- Or check: `error instanceof Error ? error.message : String(error)`

**Problem:** Response.ok not recognized
- Built-in to Fetch API
- Available in Node.js 18+
- Check TypeScript lib includes DOM types

---

## Success Criteria

- Both methods wrapped in try-catch
- HTTP status checks on all responses
- Error messages include contextual information
- Error messages include coordinates/stationId
- Error messages include HTTP status codes
- TypeScript compiles without errors
- Evidence collected

---

## Next Issue

**ISSUE-027:** Test NOAA Client with Real API Call (20 minutes)

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P1
**Estimated Time:** 20 minutes
