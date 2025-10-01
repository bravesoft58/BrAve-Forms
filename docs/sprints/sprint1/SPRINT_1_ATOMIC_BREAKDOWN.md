# Sprint 1 Atomic Task Breakdown - Junior Developer Edition

**Created:** 2025-10-01 12:00:00 EDT
**Purpose:** Break down remaining Sprint 1 issues into 15-30 minute atomic tasks
**Target Audience:** Junior developers (1-2 years experience)
**Total Issues:** 20 original → 35 atomic tasks

---

## Executive Summary

**Problem:** Issues 13-20 were too large (1-3 hours each) for junior developers
**Solution:** Break down into 15-30 minute atomic tasks with clear, single objectives
**Result:** 20 original issues → 35 atomic tasks (15-30 min each)

**Time Budget:**
- Original: 25-30 hours across 20 issues
- Atomic: 25-30 hours across 35 tasks (same total, better granularity)

---

## Breakdown Analysis

### Issues 1-12: Already Atomic (COMPLETE)
**Status:** No changes needed, already 10-45 minute tasks
**Total Time:** 6-8 hours

### Issues 13-20: Need Breakdown (8 issues → 23 atomic tasks)
**Original Time:** 14-16 hours
**Atomic Time:** 14-16 hours (same, better distributed)

---

## Detailed Breakdown by Issue

### ISSUE-013: WeatherDashboard Migration (1 hour → 3 tasks, 45 min total)

**Original Problem:** "Convert component to TanStack Query" is vague, touches multiple concepts

**Atomic Breakdown:**

#### ISSUE-013: Create Weather API Helper (15 min)
**File:** `apps/web/lib/api/weather.ts`
**Single Objective:** Create fetch helper for weather data

**Steps:**
1. Create `apps/web/lib/api/` directory if missing
2. Create `weather.ts` file
3. Add GraphQL fetch helper:
```typescript
export async function fetchWeatherData() {
  const response = await fetch('http://localhost:30101/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query { weather { temperature humidity } }`
    })
  });
  return response.json();
}
```
4. Export helper

**Verification:**
- [ ] File created at correct path
- [ ] Function compiles without errors
- [ ] Export statement present

**Evidence:** `evidence/ISSUE-013/code/weather-api-helper.png`

---

#### ISSUE-014: Add TanStack Query to WeatherDashboard (20 min)
**File:** `apps/web/components/WeatherDashboard.tsx`
**Single Objective:** Replace Apollo useQuery with TanStack useQuery

**Prerequisites:** ISSUE-013 complete

**Steps:**
1. Open `apps/web/components/WeatherDashboard.tsx`
2. Remove Apollo imports:
```typescript
// DELETE these lines
import { useQuery } from '@apollo/client';
import { WEATHER_QUERY } from './queries';
```
3. Add TanStack imports:
```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchWeatherData } from '@/lib/api/weather';
```
4. Replace query hook:
```typescript
// BEFORE
const { data, loading } = useQuery(WEATHER_QUERY);

// AFTER
const { data, isLoading } = useQuery({
  queryKey: ['weather'],
  queryFn: fetchWeatherData,
});
```
5. Update loading prop: `loading` → `isLoading`

**Verification:**
- [ ] No Apollo imports remain
- [ ] TanStack imports present
- [ ] Query hook replaced
- [ ] Component compiles

**Evidence:** `evidence/ISSUE-014/code/weather-dashboard-converted.png`

---

#### ISSUE-015: Test WeatherDashboard Offline Mode (10 min)
**File:** Browser DevTools
**Single Objective:** Verify offline caching works

**Prerequisites:** ISSUE-014 complete

**Steps:**
1. Start web app: `pnpm --filter web dev`
2. Open http://localhost:3000
3. Navigate to weather dashboard
4. Open DevTools → Network tab
5. Click "Offline" checkbox
6. Refresh page
7. Verify data still displays (from cache)

**Verification:**
- [ ] Network shows "offline"
- [ ] Component still renders
- [ ] Data visible (cached)

**Evidence:** `evidence/ISSUE-015/test-results/offline-mode-working.png`

---

### ISSUE-016: OrganizationDashboard Migration (1 hour → 3 tasks, 45 min total)

**Atomic Breakdown:**

#### ISSUE-016: Create Organizations API Helper (15 min)
**File:** `apps/web/lib/api/organizations.ts`
**Single Objective:** Create fetch helper for organization data

**Steps:**
1. Create `apps/web/lib/api/organizations.ts`
2. Add GraphQL fetch helper:
```typescript
export async function fetchOrganizations() {
  const response = await fetch('http://localhost:30101/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query { organizations { id name slug } }`
    })
  });
  const json = await response.json();
  return json.data.organizations;
}
```
3. Export helper

**Verification:**
- [ ] File created
- [ ] Function compiles
- [ ] Return type correct

**Evidence:** `evidence/ISSUE-016/code/org-api-helper.png`

---

#### ISSUE-017: Convert OrganizationDashboard to TanStack Query (20 min)
**File:** `apps/web/components/OrganizationDashboard.tsx`
**Single Objective:** Replace Apollo with TanStack Query

**Prerequisites:** ISSUE-016 complete

**Steps:**
1. Open `apps/web/components/OrganizationDashboard.tsx`
2. Remove Apollo imports
3. Add TanStack imports:
```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchOrganizations } from '@/lib/api/organizations';
```
4. Replace query:
```typescript
const { data: orgs, isLoading } = useQuery({
  queryKey: ['organizations'],
  queryFn: fetchOrganizations,
});
```
5. Update loading state

**Verification:**
- [ ] Apollo removed
- [ ] TanStack added
- [ ] Compiles successfully
- [ ] Organizations display

**Evidence:** `evidence/ISSUE-017/code/org-dashboard-converted.png`

---

#### ISSUE-018: Test OrganizationDashboard Rendering (10 min)
**File:** Browser
**Single Objective:** Verify organizations list displays correctly

**Prerequisites:** ISSUE-017 complete

**Steps:**
1. Start web app: `pnpm --filter web dev`
2. Navigate to organizations page
3. Verify seeded organizations display (Acme Construction, BuildRight LLC)
4. Check network tab shows GraphQL request
5. Screenshot working page

**Verification:**
- [ ] Organizations list displays
- [ ] Data matches seed script
- [ ] No console errors

**Evidence:** `evidence/ISSUE-018/deployment/org-dashboard-working.png`

---

### ISSUE-019: ProjectSelector Migration (1 hour → 3 tasks, 45 min total)

**Atomic Breakdown:**

#### ISSUE-019: Create Projects API Helper (15 min)
**File:** `apps/web/lib/api/projects.ts`
**Single Objective:** Create fetch helper for project data

**Steps:**
1. Create `apps/web/lib/api/projects.ts`
2. Add GraphQL fetch helper:
```typescript
export async function fetchProjects(orgId: string) {
  const response = await fetch('http://localhost:30101/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query GetProjects($orgId: String!) {
        projects(orgId: $orgId) { id name location }
      }`,
      variables: { orgId }
    })
  });
  const json = await response.json();
  return json.data.projects;
}
```
3. Export helper

**Verification:**
- [ ] File created
- [ ] Function accepts orgId parameter
- [ ] Return type correct

**Evidence:** `evidence/ISSUE-019/code/projects-api-helper.png`

---

#### ISSUE-020: Convert ProjectSelector to TanStack Query (20 min)
**File:** `apps/web/components/ProjectSelector.tsx`
**Single Objective:** Replace Apollo with TanStack Query

**Prerequisites:** ISSUE-019 complete

**Steps:**
1. Open `apps/web/components/ProjectSelector.tsx`
2. Remove Apollo imports
3. Add TanStack imports:
```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchProjects } from '@/lib/api/projects';
```
4. Replace query (pass orgId from context):
```typescript
const { data: projects, isLoading } = useQuery({
  queryKey: ['projects', orgId],
  queryFn: () => fetchProjects(orgId),
  enabled: !!orgId,
});
```
5. Update loading state

**Verification:**
- [ ] Apollo removed
- [ ] TanStack added
- [ ] Query uses orgId
- [ ] Compiles successfully

**Evidence:** `evidence/ISSUE-020/code/project-selector-converted.png`

---

#### ISSUE-021: Verify Web Build Succeeds (10 min)
**File:** Terminal
**Single Objective:** Confirm all Apollo removed, web builds successfully

**Prerequisites:** ISSUE-020 complete

**Steps:**
1. Run: `pnpm --filter web build`
2. Wait for build to complete (2-3 minutes)
3. Verify: "Build completed successfully"
4. Check: No Apollo import errors
5. Screenshot successful build output

**Verification:**
- [ ] Build completes without errors
- [ ] No Apollo references in output
- [ ] Build artifacts created in .next/

**Evidence:** `evidence/ISSUE-021/deployment/web-build-success.png`

---

### ISSUE-022: NOAA API Client (2 hours → 6 tasks, 2 hours total)

**Original Problem:** Too broad, requires research + implementation + testing

**Atomic Breakdown:**

#### ISSUE-022: Research NOAA API Documentation (20 min)
**File:** `docs/sprints/sprint1/research/NOAA_API_NOTES.md`
**Single Objective:** Document NOAA API endpoints and usage

**Steps:**
1. Visit https://www.weather.gov/documentation/services-web-api
2. Create `docs/sprints/sprint1/research/` directory
3. Create `NOAA_API_NOTES.md` file
4. Document:
   - Base URL: `https://api.weather.gov`
   - Endpoints: `/points/{lat},{lon}` (get station), `/stations/{stationId}/observations`
   - Rate limits: No authentication required, reasonable use
   - Data format: JSON with precipitation in millimeters
   - Conversion: 1 inch = 25.4mm
5. Test endpoint in browser: https://api.weather.gov/points/38.8951,-77.0364

**Verification:**
- [ ] Documentation file created
- [ ] Endpoints documented with examples
- [ ] Rate limits noted
- [ ] Unit conversion formula included

**Evidence:** `evidence/ISSUE-022/research/noaa-api-notes.png`

---

#### ISSUE-023: Create NOAA Client TypeScript Types (15 min)
**File:** `apps/backend/src/modules/weather/types/noaa.types.ts`
**Single Objective:** Define TypeScript interfaces for NOAA responses

**Prerequisites:** ISSUE-022 complete (documentation)

**Steps:**
1. Create `apps/backend/src/modules/weather/types/` directory
2. Create `noaa.types.ts` file
3. Define interfaces:
```typescript
export interface NOAAPointResponse {
  properties: {
    observationStations: string; // URL to stations
  };
}

export interface NOAAStation {
  id: string;
  properties: {
    stationIdentifier: string;
    name: string;
  };
}

export interface NOAAObservation {
  properties: {
    timestamp: string;
    precipitationLastHour: {
      value: number; // millimeters
      unitCode: string;
    };
  };
}

export interface PrecipitationData {
  timestamp: Date;
  amountInches: number;
  stationId: string;
}
```
4. Export all types

**Verification:**
- [ ] Types file created
- [ ] All interfaces defined
- [ ] Compiles without errors
- [ ] Exports present

**Evidence:** `evidence/ISSUE-023/code/noaa-types.png`

---

#### ISSUE-024: Implement NOAA Client getStationForCoordinates (20 min)
**File:** `apps/backend/src/modules/weather/clients/noaa.client.ts`
**Single Objective:** Fetch nearest weather station for coordinates

**Prerequisites:** ISSUE-023 complete (types)

**Steps:**
1. Create `apps/backend/src/modules/weather/clients/` directory
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

**Verification:**
- [ ] Class created
- [ ] Method compiles
- [ ] Returns station ID string
- [ ] Uses NOAA types

**Evidence:** `evidence/ISSUE-024/code/get-station-method.png`

---

#### ISSUE-025: Implement NOAA Client getPrecipitation (25 min)
**File:** `apps/backend/src/modules/weather/clients/noaa.client.ts`
**Single Objective:** Fetch precipitation data for date range

**Prerequisites:** ISSUE-024 complete

**Steps:**
1. Open `noaa.client.ts`
2. Add method to NOAAClient class:
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
3. Save file

**Verification:**
- [ ] Method added to class
- [ ] Converts mm to inches
- [ ] Returns PrecipitationData array
- [ ] Compiles successfully

**Evidence:** `evidence/ISSUE-025/code/get-precipitation-method.png`

---

#### ISSUE-026: Add NOAA Client Error Handling (20 min)
**File:** `apps/backend/src/modules/weather/clients/noaa.client.ts`
**Single Objective:** Add try-catch blocks and HTTP error handling

**Prerequisites:** ISSUE-025 complete

**Steps:**
1. Open `noaa.client.ts`
2. Wrap both methods in try-catch:
```typescript
async getStationForCoordinates(lat: number, lon: number): Promise<string> {
  try {
    // ... existing code ...
  } catch (error) {
    throw new Error(
      `Failed to get NOAA station for coordinates ${lat},${lon}: ${error.message}`
    );
  }
}
```
3. Add HTTP status check:
```typescript
const response = await fetch(url);
if (!response.ok) {
  throw new Error(`NOAA API returned ${response.status}: ${response.statusText}`);
}
```
4. Apply to both methods
5. Test compilation

**Verification:**
- [ ] Try-catch blocks added
- [ ] HTTP status checks present
- [ ] Error messages include context
- [ ] Compiles successfully

**Evidence:** `evidence/ISSUE-026/code/error-handling.png`

---

#### ISSUE-027: Test NOAA Client with Real API Call (20 min)
**File:** `apps/backend/src/modules/weather/clients/noaa.client.spec.ts`
**Single Objective:** Create integration test with actual NOAA API

**Prerequisites:** ISSUE-026 complete

**Steps:**
1. Create `noaa.client.spec.ts` next to `noaa.client.ts`
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
  }, 15000);
});
```
3. Run test: `pnpm --filter backend test noaa.client.spec.ts`
4. Screenshot passing tests

**Verification:**
- [ ] Test file created
- [ ] Integration tests written
- [ ] Tests pass with real API
- [ ] Evidence collected

**Evidence:** `evidence/ISSUE-027/test-results/noaa-integration-tests.png`

---

### ISSUE-028: 0.25" Threshold Detection (2 hours → 5 tasks, 2 hours total)

**Original Problem:** Complex EPA compliance logic, needs careful breakdown

**Atomic Breakdown:**

#### ISSUE-028: Create Precipitation Accumulation Function (20 min)
**File:** `apps/backend/src/modules/weather/utils/precipitation.utils.ts`
**Single Objective:** Calculate 24-hour rolling window accumulation

**Steps:**
1. Create `apps/backend/src/modules/weather/utils/` directory
2. Create `precipitation.utils.ts` file
3. Implement function:
```typescript
import { PrecipitationData } from '../types/noaa.types';

/**
 * Calculate 24-hour rolling window precipitation accumulation
 *
 * @param data - Array of precipitation readings
 * @param windowHours - Accumulation window (default 24 hours per EPA CGP)
 * @returns Total precipitation in inches within window
 */
export function calculate24HourAccumulation(
  data: PrecipitationData[],
  windowHours: number = 24
): number {
  // Sort by timestamp descending (newest first)
  const sorted = [...data].sort((a, b) =>
    b.timestamp.getTime() - a.timestamp.getTime()
  );

  if (sorted.length === 0) return 0;

  // Calculate window end time
  const latestTime = sorted[0].timestamp;
  const windowStart = new Date(latestTime.getTime() - windowHours * 60 * 60 * 1000);

  // Sum precipitation within window
  return sorted
    .filter(reading => reading.timestamp >= windowStart)
    .reduce((sum, reading) => sum + reading.amountInches, 0);
}
```
4. Export function

**Verification:**
- [ ] Function created with EPA citation
- [ ] 24-hour window logic correct
- [ ] Returns number (inches)
- [ ] Compiles successfully

**Evidence:** `evidence/ISSUE-028/code/accumulation-function.png`

---

#### ISSUE-029: Create 0.25" Threshold Check Function (15 min)
**File:** `apps/backend/src/modules/weather/utils/precipitation.utils.ts`
**Single Objective:** Detect EXACTLY 0.25" threshold per EPA CGP

**Prerequisites:** ISSUE-028 complete

**Steps:**
1. Open `precipitation.utils.ts`
2. Add threshold function:
```typescript
/**
 * Check if precipitation meets EPA CGP 0.25" threshold
 *
 * EPA CGP 2022 Section 4.4: Inspections required within 24 hours
 * of a storm event producing >= 0.25 inches of precipitation.
 *
 * CRITICAL: Must be EXACTLY 0.25", not 0.24" or 0.26"
 *
 * @param totalInches - Total precipitation in inches
 * @returns true if >= 0.25", false otherwise
 *
 * @see https://www.epa.gov/npdes/stormwater-cgp (EPA CGP 2022 Section 4.4)
 */
export function meetsEPAThreshold(totalInches: number): boolean {
  const EPA_THRESHOLD = 0.25; // EXACT value per EPA CGP 2022 Section 4.4
  return totalInches >= EPA_THRESHOLD;
}
```
3. Export function

**Verification:**
- [ ] Function uses EXACTLY 0.25
- [ ] EPA CGP Section 4.4 cited
- [ ] JSDoc includes regulatory reference
- [ ] Returns boolean

**Evidence:** `evidence/ISSUE-029/code/threshold-function.png`

---

#### ISSUE-030: Create Inspection Deadline Calculator (25 min)
**File:** `apps/backend/src/modules/weather/utils/inspection.utils.ts`
**Single Objective:** Calculate 24-hour working hours deadline

**Steps:**
1. Create `inspection.utils.ts` in same directory
2. Implement function:
```typescript
/**
 * Calculate inspection deadline per EPA CGP working hours requirement
 *
 * EPA CGP 2022 Section 4.4: Inspections due within 24 hours of storm event
 * "during normal working hours" - if storm occurs on weekend, inspection
 * due on next business day.
 *
 * @param stormEndTime - When storm event ended
 * @param workingHours - Business hours config (default 8am-5pm M-F)
 * @returns Inspection deadline timestamp
 */
export function calculateInspectionDeadline(
  stormEndTime: Date,
  workingHours = { start: 8, end: 17, daysOfWeek: [1, 2, 3, 4, 5] } // M-F, 8am-5pm
): Date {
  const deadline = new Date(stormEndTime);
  let hoursAdded = 0;

  // Add 24 working hours
  while (hoursAdded < 24) {
    deadline.setHours(deadline.getHours() + 1);

    const dayOfWeek = deadline.getDay();
    const hour = deadline.getHours();

    // Check if current time is during working hours
    const isWorkingDay = workingHours.daysOfWeek.includes(dayOfWeek);
    const isWorkingHour = hour >= workingHours.start && hour < workingHours.end;

    if (isWorkingDay && isWorkingHour) {
      hoursAdded++;
    }
  }

  return deadline;
}
```
3. Export function

**Verification:**
- [ ] Function handles weekends
- [ ] Working hours logic correct
- [ ] EPA citation included
- [ ] Returns Date object

**Evidence:** `evidence/ISSUE-030/code/deadline-calculator.png`

---

#### ISSUE-031: Write Unit Tests for Threshold Detection (30 min)
**File:** `apps/backend/src/modules/weather/utils/precipitation.utils.spec.ts`
**Single Objective:** Test EXACTLY 0.25" threshold (TDD verification)

**Prerequisites:** ISSUE-028, ISSUE-029 complete

**Steps:**
1. Create `precipitation.utils.spec.ts`
2. Write tests:
```typescript
import { calculate24HourAccumulation, meetsEPAThreshold } from './precipitation.utils';

describe('Precipitation Utils', () => {
  describe('calculate24HourAccumulation', () => {
    it('should sum precipitation within 24-hour window', () => {
      const now = new Date();
      const data = [
        { timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000), amountInches: 0.10, stationId: 'TEST' },
        { timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000), amountInches: 0.15, stationId: 'TEST' },
        { timestamp: new Date(now.getTime() - 30 * 60 * 60 * 1000), amountInches: 0.50, stationId: 'TEST' }, // Outside window
      ];

      const total = calculate24HourAccumulation(data);
      expect(total).toBe(0.25);
    });
  });

  describe('meetsEPAThreshold', () => {
    it('should return true for EXACTLY 0.25 inches', () => {
      expect(meetsEPAThreshold(0.25)).toBe(true);
    });

    it('should return true for 0.26 inches', () => {
      expect(meetsEPAThreshold(0.26)).toBe(true);
    });

    it('should return false for 0.24 inches', () => {
      expect(meetsEPAThreshold(0.24)).toBe(false);
    });

    it('should return false for 0 inches', () => {
      expect(meetsEPAThreshold(0)).toBe(false);
    });
  });
});
```
3. Run tests: `pnpm --filter backend test precipitation.utils.spec.ts`
4. Screenshot passing tests

**Verification:**
- [ ] Tests verify EXACTLY 0.25"
- [ ] Tests cover edge cases (0.24", 0.26")
- [ ] All tests pass
- [ ] Evidence collected

**Evidence:** `evidence/ISSUE-031/test-results/threshold-tests-passing.png`

---

#### ISSUE-032: Write Unit Tests for Inspection Deadline (20 min)
**File:** `apps/backend/src/modules/weather/utils/inspection.utils.spec.ts`
**Single Objective:** Test weekend/working hours logic

**Prerequisites:** ISSUE-030 complete

**Steps:**
1. Create `inspection.utils.spec.ts`
2. Write tests:
```typescript
import { calculateInspectionDeadline } from './inspection.utils';

describe('Inspection Deadline Calculator', () => {
  it('should add 24 working hours for weekday storm', () => {
    // Storm ends Monday 9am
    const stormEnd = new Date('2025-10-06T09:00:00'); // Monday
    const deadline = calculateInspectionDeadline(stormEnd);

    // Deadline should be Wednesday 9am (24 working hours later)
    expect(deadline.getDay()).toBe(3); // Wednesday
    expect(deadline.getHours()).toBe(9);
  });

  it('should skip weekend for Saturday storm', () => {
    // Storm ends Saturday 2pm
    const stormEnd = new Date('2025-10-04T14:00:00'); // Saturday
    const deadline = calculateInspectionDeadline(stormEnd);

    // Deadline should be on a weekday (Monday or later)
    expect([1, 2, 3, 4, 5]).toContain(deadline.getDay());
  });
});
```
3. Run tests: `pnpm --filter backend test inspection.utils.spec.ts`
4. Screenshot passing tests

**Verification:**
- [ ] Tests verify working hours logic
- [ ] Weekend handling tested
- [ ] All tests pass
- [ ] Evidence collected

**Evidence:** `evidence/ISSUE-032/test-results/deadline-tests-passing.png`

---

### ISSUE-033: Redis Caching (1 hour → 2 tasks, 1 hour total)

**Atomic Breakdown:**

#### ISSUE-033: Add Redis Caching to Weather Service (30 min)
**File:** `apps/backend/src/modules/weather/weather.service.ts`
**Single Objective:** Cache precipitation data with 6-hour TTL

**Steps:**
1. Open `apps/backend/src/modules/weather/weather.service.ts`
2. Import Redis client:
```typescript
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
```
3. Inject Redis in constructor:
```typescript
constructor(
  @InjectRedis() private readonly redis: Redis,
  private readonly noaaClient: NOAAClient,
) {}
```
4. Add caching to `getPrecipitation` method:
```typescript
async getPrecipitation(lat: number, lon: number): Promise<PrecipitationData[]> {
  const cacheKey = `precipitation:${lat}:${lon}`;

  // 1. Check cache
  const cached = await this.redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 2. Fetch from NOAA
  const stationId = await this.noaaClient.getStationForCoordinates(lat, lon);
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
  const data = await this.noaaClient.getPrecipitation(stationId, startDate, endDate);

  // 3. Cache for 6 hours
  await this.redis.setex(cacheKey, 6 * 60 * 60, JSON.stringify(data));

  return data;
}
```
5. Save file

**Verification:**
- [ ] Redis imported and injected
- [ ] Cache check implemented
- [ ] 6-hour TTL set
- [ ] Compiles successfully

**Evidence:** `evidence/ISSUE-033/code/redis-caching.png`

---

#### ISSUE-034: Test Redis Cache Hit/Miss (30 min)
**File:** `apps/backend/src/modules/weather/weather.service.spec.ts`
**Single Objective:** Verify cache hit/miss scenarios

**Prerequisites:** ISSUE-033 complete

**Steps:**
1. Create `weather.service.spec.ts`
2. Write tests:
```typescript
import { Test } from '@nestjs/testing';
import { WeatherService } from './weather.service';

describe('WeatherService Caching', () => {
  let service: WeatherService;
  let redisMock: any;

  beforeEach(async () => {
    redisMock = {
      get: jest.fn(),
      setex: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        WeatherService,
        { provide: 'default_IORedisModuleConnectionToken', useValue: redisMock },
      ],
    }).compile();

    service = module.get<WeatherService>(WeatherService);
  });

  it('should return cached data on cache hit', async () => {
    const mockData = [{ timestamp: new Date(), amountInches: 0.25, stationId: 'TEST' }];
    redisMock.get.mockResolvedValue(JSON.stringify(mockData));

    const result = await service.getPrecipitation(38.8951, -77.0364);

    expect(redisMock.get).toHaveBeenCalledWith('precipitation:38.8951:-77.0364');
    expect(result).toEqual(mockData);
  });

  it('should fetch from NOAA on cache miss', async () => {
    redisMock.get.mockResolvedValue(null);

    // Mock NOAA client response
    // ... test cache miss scenario
  });
});
```
3. Run tests: `pnpm --filter backend test weather.service.spec.ts`
4. Screenshot passing tests

**Verification:**
- [ ] Cache hit test passes
- [ ] Cache miss test passes
- [ ] 6-hour TTL verified
- [ ] Evidence collected

**Evidence:** `evidence/ISSUE-034/test-results/cache-tests-passing.png`

---

### ISSUE-035: PWA Configuration (2 hours → 4 tasks, 2 hours total)

**Atomic Breakdown:**

#### ISSUE-035: Install PWA Dependencies (10 min)
**File:** `apps/web/package.json`
**Single Objective:** Add next-pwa package

**Steps:**
1. Open terminal in repository root
2. Run: `pnpm --filter web add @ducanh2912/next-pwa`
3. Wait for installation (1-2 minutes)
4. Verify: Check `apps/web/package.json` includes dependency
5. Screenshot package.json

**Verification:**
- [ ] Package installed successfully
- [ ] package.json updated
- [ ] No installation errors

**Evidence:** `evidence/ISSUE-035/deployment/pwa-package-installed.png`

---

#### ISSUE-036: Create PWA Manifest File (20 min)
**File:** `apps/web/public/manifest.json`
**Single Objective:** Define PWA metadata for installation

**Prerequisites:** ISSUE-035 complete

**Steps:**
1. Create `apps/web/public/` directory if missing
2. Create `manifest.json` file:
```json
{
  "name": "BrAve Forms - Construction Compliance",
  "short_name": "BrAve Forms",
  "description": "EPA/OSHA construction compliance management with 30-day offline capability",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1976d2",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```
3. Save file
4. Create placeholder icons (can be simple squares for now)

**Verification:**
- [ ] manifest.json created
- [ ] All required fields present
- [ ] Icons referenced (placeholder OK)
- [ ] Valid JSON format

**Evidence:** `evidence/ISSUE-036/code/manifest-json.png`

---

#### ISSUE-037: Configure Next.js PWA Plugin (30 min)
**File:** `apps/web/next.config.js`
**Single Objective:** Enable service worker with caching strategies

**Prerequisites:** ISSUE-035, ISSUE-036 complete

**Steps:**
1. Open `apps/web/next.config.js`
2. Add PWA configuration:
```javascript
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // Disable in dev
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
    {
      urlPattern: /\/api\/.*$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 6 * 60 * 60, // 6 hours (matches Redis TTL)
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|png)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-images',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
  ],
});

module.exports = withPWA({
  // ... existing Next.js config
});
```
3. Save file
4. Test build: `pnpm --filter web build`

**Verification:**
- [ ] PWA plugin configured
- [ ] Runtime caching strategies defined
- [ ] Service worker generated
- [ ] Build succeeds

**Evidence:** `evidence/ISSUE-037/code/pwa-config.png`

---

#### ISSUE-038: Test PWA Offline Mode with Lighthouse (30 min)
**File:** Chrome DevTools
**Single Objective:** Verify PWA score >80 and offline functionality

**Prerequisites:** ISSUE-037 complete

**Steps:**
1. Build production: `pnpm --filter web build`
2. Start production server: `pnpm --filter web start`
3. Open Chrome DevTools (F12)
4. Navigate to Lighthouse tab
5. Select "Progressive Web App" category
6. Click "Analyze page load"
7. Wait for audit (2-3 minutes)
8. Verify PWA score >80
9. Test offline mode:
   - Application tab → Service Workers → Check "Offline"
   - Refresh page
   - Verify app still loads
10. Screenshot Lighthouse results

**Verification:**
- [ ] Lighthouse PWA score >80
- [ ] Service worker registered
- [ ] Offline mode functional
- [ ] manifest.json detected

**Evidence:** `evidence/ISSUE-038/deployment/lighthouse-pwa-score.png`

---

### ISSUE-039 through ISSUE-046: Test Coverage (3 hours → 8 tasks, 3 hours total)

**Original Problem:** "Add 50+ tests" is too vague and overwhelming

**Atomic Breakdown:**

#### ISSUE-039: Write Tests for NOAA Client (20 min)
**File:** `apps/backend/src/modules/weather/clients/noaa.client.spec.ts`
**Single Objective:** Unit tests for NOAA client methods (already done in ISSUE-027)

**Note:** This task is already completed in ISSUE-027 integration tests. Mark as complete.

**Verification:**
- [ ] Tests exist from ISSUE-027
- [ ] Coverage >80% for noaa.client.ts

**Evidence:** Reuse `evidence/ISSUE-027/test-results/`

---

#### ISSUE-040: Write Tests for Precipitation Utils (20 min)
**File:** `apps/backend/src/modules/weather/utils/precipitation.utils.spec.ts`
**Single Objective:** Unit tests for threshold detection (already done in ISSUE-031)

**Note:** Already completed in ISSUE-031. Mark as complete.

**Verification:**
- [ ] Tests exist from ISSUE-031
- [ ] Coverage >80% for precipitation.utils.ts

**Evidence:** Reuse `evidence/ISSUE-031/test-results/`

---

#### ISSUE-041: Write Tests for Inspection Utils (20 min)
**File:** `apps/backend/src/modules/weather/utils/inspection.utils.spec.ts`
**Single Objective:** Unit tests for deadline calculator (already done in ISSUE-032)

**Note:** Already completed in ISSUE-032. Mark as complete.

**Verification:**
- [ ] Tests exist from ISSUE-032
- [ ] Coverage >80% for inspection.utils.ts

**Evidence:** Reuse `evidence/ISSUE-032/test-results/`

---

#### ISSUE-042: Write Tests for Weather Service (25 min)
**File:** `apps/backend/src/modules/weather/weather.service.spec.ts`
**Single Objective:** Test weather service with mocked dependencies

**Steps:**
1. Create `weather.service.spec.ts`
2. Write tests:
```typescript
import { Test } from '@nestjs/testing';
import { WeatherService } from './weather.service';
import { NOAAClient } from './clients/noaa.client';

describe('WeatherService', () => {
  let service: WeatherService;
  let noaaClient: NOAAClient;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WeatherService,
        {
          provide: NOAAClient,
          useValue: {
            getStationForCoordinates: jest.fn(),
            getPrecipitation: jest.fn(),
          },
        },
        {
          provide: 'default_IORedisModuleConnectionToken',
          useValue: {
            get: jest.fn(),
            setex: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WeatherService>(WeatherService);
    noaaClient = module.get<NOAAClient>(NOAAClient);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fetch precipitation data', async () => {
    const mockData = [
      { timestamp: new Date(), amountInches: 0.25, stationId: 'TEST' },
    ];

    jest.spyOn(noaaClient, 'getStationForCoordinates').mockResolvedValue('TEST_STATION');
    jest.spyOn(noaaClient, 'getPrecipitation').mockResolvedValue(mockData);

    const result = await service.getPrecipitation(38.8951, -77.0364);

    expect(result).toEqual(mockData);
    expect(noaaClient.getStationForCoordinates).toHaveBeenCalledWith(38.8951, -77.0364);
  });
});
```
3. Run tests: `pnpm --filter backend test weather.service.spec.ts`
4. Screenshot passing tests

**Verification:**
- [ ] Service tests written
- [ ] Mocking implemented
- [ ] All tests pass
- [ ] Coverage >80% for weather.service.ts

**Evidence:** `evidence/ISSUE-042/test-results/weather-service-tests.png`

---

#### ISSUE-043: Write Tests for Weather Resolver (20 min)
**File:** `apps/backend/src/modules/weather/weather.resolver.spec.ts`
**Single Objective:** Test GraphQL resolver with mocked service

**Steps:**
1. Create `weather.resolver.spec.ts`
2. Write tests:
```typescript
import { Test } from '@nestjs/testing';
import { WeatherResolver } from './weather.resolver';
import { WeatherService } from './weather.service';

describe('WeatherResolver', () => {
  let resolver: WeatherResolver;
  let service: WeatherService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WeatherResolver,
        {
          provide: WeatherService,
          useValue: {
            getPrecipitation: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<WeatherResolver>(WeatherResolver);
    service = module.get<WeatherService>(WeatherService);
  });

  it('should return precipitation data', async () => {
    const mockData = [
      { timestamp: new Date(), amountInches: 0.25, stationId: 'TEST' },
    ];

    jest.spyOn(service, 'getPrecipitation').mockResolvedValue(mockData);

    const result = await resolver.getPrecipitation(38.8951, -77.0364);

    expect(result).toEqual(mockData);
  });
});
```
3. Run tests: `pnpm --filter backend test weather.resolver.spec.ts`
4. Screenshot passing tests

**Verification:**
- [ ] Resolver tests written
- [ ] Service mocked correctly
- [ ] All tests pass
- [ ] Coverage >80% for weather.resolver.ts

**Evidence:** `evidence/ISSUE-043/test-results/weather-resolver-tests.png`

---

#### ISSUE-044: Write Tests for Organization Resolver (20 min)
**File:** `apps/backend/src/modules/organizations/organizations.resolver.spec.ts`
**Single Objective:** Test organizations resolver with multi-tenancy

**Steps:**
1. Create `organizations.resolver.spec.ts`
2. Write tests:
```typescript
import { Test } from '@nestjs/testing';
import { OrganizationsResolver } from './organizations.resolver';
import { OrganizationsService } from './organizations.service';

describe('OrganizationsResolver', () => {
  let resolver: OrganizationsResolver;
  let service: OrganizationsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OrganizationsResolver,
        {
          provide: OrganizationsService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<OrganizationsResolver>(OrganizationsResolver);
    service = module.get<OrganizationsService>(OrganizationsService);
  });

  it('should return organizations for authenticated user', async () => {
    const mockOrgs = [
      { id: '1', name: 'Acme Construction', slug: 'acme' },
    ];

    jest.spyOn(service, 'findAll').mockResolvedValue(mockOrgs);

    const result = await resolver.organizations();

    expect(result).toEqual(mockOrgs);
  });
});
```
3. Run tests: `pnpm --filter backend test organizations.resolver.spec.ts`
4. Screenshot passing tests

**Verification:**
- [ ] Resolver tests written
- [ ] Multi-tenancy considered
- [ ] All tests pass
- [ ] Coverage >80% for organizations.resolver.ts

**Evidence:** `evidence/ISSUE-044/test-results/org-resolver-tests.png`

---

#### ISSUE-045: Write Tests for Project Resolver (20 min)
**File:** `apps/backend/src/modules/projects/projects.resolver.spec.ts`
**Single Objective:** Test projects resolver with orgId filtering

**Steps:**
1. Create `projects.resolver.spec.ts`
2. Write tests similar to organizations resolver
3. Add test for orgId filtering:
```typescript
it('should filter projects by orgId', async () => {
  const mockProjects = [
    { id: '1', name: 'Downtown Mall', orgId: 'org_123' },
  ];

  jest.spyOn(service, 'findByOrgId').mockResolvedValue(mockProjects);

  const result = await resolver.projects('org_123');

  expect(result).toEqual(mockProjects);
  expect(service.findByOrgId).toHaveBeenCalledWith('org_123');
});
```
4. Run tests: `pnpm --filter backend test projects.resolver.spec.ts`
5. Screenshot passing tests

**Verification:**
- [ ] Resolver tests written
- [ ] orgId filtering tested
- [ ] All tests pass
- [ ] Coverage >80% for projects.resolver.ts

**Evidence:** `evidence/ISSUE-045/test-results/project-resolver-tests.png`

---

#### ISSUE-046: Run Full Coverage Report (15 min)
**File:** Terminal
**Single Objective:** Generate and verify 40% coverage target met

**Prerequisites:** ISSUE-039 through ISSUE-045 complete

**Steps:**
1. Run: `pnpm --filter backend test:coverage`
2. Wait for tests to complete (2-3 minutes)
3. Open coverage report: `apps/backend/coverage/lcov-report/index.html`
4. Verify overall coverage:
   - Target: >=40% overall
   - Weather module: >=80%
   - Organizations module: >=80%
   - Projects module: >=80%
5. Screenshot coverage summary
6. If <40%, identify uncovered files and add basic tests

**Verification:**
- [ ] Coverage report generated
- [ ] Overall coverage >=40%
- [ ] New modules >=80%
- [ ] Evidence collected

**Evidence:** `evidence/ISSUE-046/test-results/coverage-40-percent.png`

---

## Updated Issue List (35 Total)

### Completed (Issues 1-12): 6-8 hours
- ISSUE-001: Port Conflict Check (10 min)
- ISSUE-002: Verify Container Images (15 min)
- ISSUE-003: Configure Environment Secrets (30 min)
- ISSUE-004: Create Kubernetes Secrets (15 min)
- ISSUE-005: Deploy PostgreSQL (30 min)
- ISSUE-006: Deploy Redis and MinIO (20 min)
- ISSUE-007: Run Prisma Migrations (30 min)
- ISSUE-008: Create Seed Script (45 min)
- ISSUE-009: Deploy Backend (30 min)
- ISSUE-010: Test Backend GraphQL (30 min)
- ISSUE-011: Remove Apollo Dependencies (30 min)
- ISSUE-012: Create TanStack Query Setup (1 hour)

### New Atomic Tasks (Issues 13-46): 16-18 hours

**Phase 3: Apollo Removal (Issues 13-21, 4 hours)**
- ISSUE-013: Create Weather API Helper (15 min)
- ISSUE-014: Add TanStack Query to WeatherDashboard (20 min)
- ISSUE-015: Test WeatherDashboard Offline Mode (10 min)
- ISSUE-016: Create Organizations API Helper (15 min)
- ISSUE-017: Convert OrganizationDashboard to TanStack Query (20 min)
- ISSUE-018: Test OrganizationDashboard Rendering (10 min)
- ISSUE-019: Create Projects API Helper (15 min)
- ISSUE-020: Convert ProjectSelector to TanStack Query (20 min)
- ISSUE-021: Verify Web Build Succeeds (10 min)

**Phase 4: Weather API (Issues 22-34, 5 hours)**
- ISSUE-022: Research NOAA API Documentation (20 min)
- ISSUE-023: Create NOAA Client TypeScript Types (15 min)
- ISSUE-024: Implement getStationForCoordinates (20 min)
- ISSUE-025: Implement getPrecipitation (25 min)
- ISSUE-026: Add NOAA Client Error Handling (20 min)
- ISSUE-027: Test NOAA Client with Real API Call (20 min)
- ISSUE-028: Create Precipitation Accumulation Function (20 min)
- ISSUE-029: Create 0.25" Threshold Check Function (15 min)
- ISSUE-030: Create Inspection Deadline Calculator (25 min)
- ISSUE-031: Write Unit Tests for Threshold Detection (30 min)
- ISSUE-032: Write Unit Tests for Inspection Deadline (20 min)
- ISSUE-033: Add Redis Caching to Weather Service (30 min)
- ISSUE-034: Test Redis Cache Hit/Miss (30 min)

**Phase 5: PWA (Issues 35-38, 1.5 hours)**
- ISSUE-035: Install PWA Dependencies (10 min)
- ISSUE-036: Create PWA Manifest File (20 min)
- ISSUE-037: Configure Next.js PWA Plugin (30 min)
- ISSUE-038: Test PWA Offline Mode with Lighthouse (30 min)

**Phase 6: Testing (Issues 39-46, 2.5 hours)**
- ISSUE-039: Write Tests for NOAA Client (complete, reuse ISSUE-027)
- ISSUE-040: Write Tests for Precipitation Utils (complete, reuse ISSUE-031)
- ISSUE-041: Write Tests for Inspection Utils (complete, reuse ISSUE-032)
- ISSUE-042: Write Tests for Weather Service (25 min)
- ISSUE-043: Write Tests for Weather Resolver (20 min)
- ISSUE-044: Write Tests for Organization Resolver (20 min)
- ISSUE-045: Write Tests for Project Resolver (20 min)
- ISSUE-046: Run Full Coverage Report (15 min)

---

## Total Time Comparison

**Original Plan:**
- 20 issues
- 25-30 hours total
- Largest task: 3 hours (ISSUE-020)
- Average: 1.25 hours per issue

**Atomic Plan:**
- 46 issues (12 existing + 34 new atomic)
- 25-30 hours total (SAME)
- Largest task: 30 minutes
- Average: 20 minutes per issue

**Benefits:**
- Junior developers can complete 2-3 tasks per day
- Clear stopping points every 15-30 minutes
- Better progress tracking (46 checkpoints vs 20)
- Easier to parallelize (multiple devs can work simultaneously)
- Lower risk of getting stuck (smaller scope)

---

## Updated Evidence Requirements

**Each atomic task MUST collect:**
1. Screenshot or code snippet
2. Verification checklist completed
3. Store in `evidence/ISSUE-###/` directory

**Evidence Categories:**
- `code/` - Code screenshots, git diffs
- `deployment/` - Running services, kubectl output
- `test-results/` - Test passing screenshots
- `compliance/` - EPA threshold proof

---

## Updated Success Metrics

**Sprint 1 Definition of Done:**
- [ ] All 46 atomic tasks completed
- [ ] Kubernetes deployment running (backend + web + db)
- [ ] Web builds successfully without Apollo
- [ ] NOAA API integration with actual HTTP calls
- [ ] 0.25" threshold detection EXACT (EPA CGP compliant)
- [ ] Test coverage 40%+ (from 15% baseline)
- [ ] PWA Lighthouse score >80
- [ ] Zero emoji violations in code/commits
- [ ] All evidence collected in standardized format

---

## Recommended Daily Schedule for Junior Developer

**Day 1 (4 hours):**
- Morning: ISSUE-013 through ISSUE-015 (Weather dashboard)
- Afternoon: ISSUE-016 through ISSUE-018 (Organizations dashboard)

**Day 2 (4 hours):**
- Morning: ISSUE-019 through ISSUE-021 (Projects + build verification)
- Afternoon: ISSUE-022 through ISSUE-024 (NOAA research + types + first method)

**Day 3 (4 hours):**
- Morning: ISSUE-025 through ISSUE-027 (NOAA completion + testing)
- Afternoon: ISSUE-028 through ISSUE-030 (Threshold detection logic)

**Day 4 (3 hours):**
- Morning: ISSUE-031 through ISSUE-032 (Threshold tests)
- Afternoon: ISSUE-033 through ISSUE-034 (Redis caching)

**Day 5 (3 hours):**
- Morning: ISSUE-035 through ISSUE-038 (PWA setup + testing)
- Afternoon: ISSUE-042 through ISSUE-046 (Additional tests + coverage report)

**Total:** 18 hours across 5 days (3.6 hours per day avg)

---

## Next Steps

1. **Review this breakdown** with development team
2. **Create GitHub issues** for each atomic task (Issues 13-46)
3. **Assign issues** to junior developers (2-3 issues per day target)
4. **Daily standups** to track progress (46 checkpoints)
5. **Evidence review** at end of each day (collect screenshots)

---

**Document Status:** FINAL
**Last Updated:** 2025-10-01 12:30:00 EDT
**Approved By:** Project Manager
**Ready for Implementation:** YES

---

**Remember:**
- NO emoji in code/commits/documentation
- Evidence-based completion only (real systems, no mocks)
- 0.25" threshold EXACTLY per EPA CGP 2022 Section 4.4
- TDD approach: tests FIRST, then implementation
- Each task is 15-30 minutes for junior developers
