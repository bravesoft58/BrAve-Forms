# ISSUE-024: Implement NOAA Client getStationForCoordinates

**Sprint:** Sprint 1 | **Phase:** Phase 4 - Weather API | **Priority:** P1
**Time:** 20 minutes | **Points:** 2 | **Status:** Not Started
**Created:** 2025-10-01 15:35:00 EDT
**Dependencies:** ISSUE-023 ✅

---

## What You'll Do

Fetch nearest weather station ID for given latitude/longitude coordinates.

---

## Step-by-Step Instructions

### Prerequisites
- ISSUE-023 complete (NOAA types defined)

### Steps

1. Create `apps/backend/src/modules/weather/clients/` directory:
```bash
mkdir -p apps/backend/src/modules/weather/clients
```

2. Create `noaa.client.ts` file

3. Implement class:
```typescript
import { NOAAPointResponse } from '../types/noaa.types';

export class NOAAClient {
  private baseUrl = 'https://api.weather.gov';

  async getStationForCoordinates(lat: number, lon: number): Promise<string> {
    // 1. Get point metadata
    const pointUrl = `${this.baseUrl}/points/${lat},${lon}`;
    const pointResponse = await fetch(pointUrl);
    const pointData: NOAAPointResponse = await pointResponse.json();

    // 2. Get nearest station
    const stationsUrl = pointData.properties.observationStations;
    const stationsResponse = await fetch(stationsUrl);
    const stationsData = await stationsResponse.json();

    // 3. Return first station ID
    return stationsData.features[0].id;
  }
}
```

4. Export class

5. Save file

---

## Files to Create

**New Files:**
- `apps/backend/src/modules/weather/clients/noaa.client.ts`

---

## Verification Checklist

- [ ] Clients directory created
- [ ] Class created with baseUrl property
- [ ] Method `getStationForCoordinates` implemented
- [ ] Method accepts lat/lon parameters
- [ ] Method returns station ID string
- [ ] Uses NOAAPointResponse type
- [ ] Class exported
- [ ] File compiles without errors

---

## Testing Steps

1. Run type check: `pnpm --filter backend type-check`
2. Verify no errors
3. Check imports resolve correctly
4. Check file structure:
```bash
ls apps/backend/src/modules/weather/clients/noaa.client.ts
```

---

## Evidence Requirements

**Location:** `evidence/ISSUE-024/code/`

**Required Screenshots:**
1. `get-station-method.png` - Full method implementation with syntax highlighting

---

## Troubleshooting

**Problem:** Type import errors
- Check import path: `import { NOAAPointResponse } from '../types/noaa.types';`
- Verify types file exists
- Check TypeScript path resolution

**Problem:** Fetch API not recognized
- Node.js 18+ has built-in fetch
- No additional imports needed
- Check `tsconfig.json` target is ES2022+

**Problem:** Method signature errors
- Return type should be `Promise<string>`
- Parameters: `lat: number, lon: number`
- Method should be async

---

## Success Criteria

- Class created with method implementation
- Method fetches NOAA point data
- Method fetches station list
- Method returns station ID
- Uses typed responses
- TypeScript compiles without errors
- Evidence collected

---

## Next Issue

**ISSUE-025:** Implement NOAA Client getPrecipitation (25 minutes)

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P1
**Estimated Time:** 20 minutes
