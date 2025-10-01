# ISSUE-025: Implement NOAA Client getPrecipitation

**Sprint:** Sprint 1 | **Phase:** Phase 4 - Weather API | **Priority:** P1
**Time:** 25 minutes | **Points:** 2 | **Status:** Not Started
**Created:** 2025-10-01 15:40:00 EDT
**Dependencies:** ISSUE-024 ✅

---

## What You'll Do

Fetch precipitation data for date range and convert from millimeters to inches.

---

## Step-by-Step Instructions

### Prerequisites
- ISSUE-024 complete (getStationForCoordinates method exists)

### Steps

1. Open `apps/backend/src/modules/weather/clients/noaa.client.ts`

2. Add import for additional types:
```typescript
import { NOAAPointResponse, NOAAObservation, PrecipitationData } from '../types/noaa.types';
```

3. Add method to NOAAClient class:
```typescript
async getPrecipitation(
  stationId: string,
  startDate: Date,
  endDate: Date
): Promise<PrecipitationData[]> {
  // 1. Fetch observations
  const url = `${this.baseUrl}/stations/${stationId}/observations`;
  const params = new URLSearchParams({
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  });

  const response = await fetch(`${url}?${params}`);
  const data = await response.json();

  // 2. Convert to PrecipitationData
  return data.features.map((obs: NOAAObservation) => ({
    timestamp: new Date(obs.properties.timestamp),
    amountInches: this.mmToInches(obs.properties.precipitationLastHour.value),
    stationId,
  }));
}

private mmToInches(mm: number): number {
  return mm / 25.4; // 1 inch = 25.4mm
}
```

4. Save file

---

## Files to Modify

**Edit:**
- `apps/backend/src/modules/weather/clients/noaa.client.ts`

---

## Verification Checklist

- [ ] Method `getPrecipitation` added to class
- [ ] Method accepts stationId, startDate, endDate parameters
- [ ] Method fetches observations from NOAA API
- [ ] Method converts mm to inches
- [ ] Helper method `mmToInches` implemented
- [ ] Returns `PrecipitationData[]` array
- [ ] Uses NOAAObservation type for mapping
- [ ] File compiles successfully

---

## Testing Steps

1. Run type check: `pnpm --filter backend type-check`
2. Verify method signature matches types
3. Check conversion formula is correct (25.4mm = 1 inch)

---

## Evidence Requirements

**Location:** `evidence/ISSUE-025/code/`

**Required Screenshots:**
1. `get-precipitation-method.png` - Full method implementation
2. `mm-to-inches-helper.png` - Conversion helper method

---

## Troubleshooting

**Problem:** Type errors on NOAAObservation
- Check import includes NOAAObservation type
- Verify type structure matches NOAA API response
- Check properties.precipitationLastHour.value exists

**Problem:** Date conversion errors
- Use `new Date(obs.properties.timestamp)` for parsing
- Use `.toISOString()` for API parameters

**Problem:** URLSearchParams not recognized
- Built-in to Node.js 18+
- No imports needed
- Check TypeScript lib includes DOM types

---

## Success Criteria

- Method implemented with correct signature
- Fetches observations from NOAA API
- Converts millimeters to inches (25.4mm = 1 inch)
- Returns array of PrecipitationData objects
- TypeScript compiles without errors
- Evidence collected

---

## Next Issue

**ISSUE-026:** Add NOAA Client Error Handling (20 minutes)

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P1
**Estimated Time:** 25 minutes
