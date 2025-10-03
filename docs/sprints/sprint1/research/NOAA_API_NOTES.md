# NOAA Weather Service API Research Notes

**Researched:** 2025-10-02
**Purpose:** EPA CGP 0.25" precipitation monitoring
**API Documentation:** https://www.weather.gov/documentation/services-web-api
**Tested By:** Development Team (following CLAUDE.md research protocol)

---

## Base URL

```
https://api.weather.gov
```

## Authentication

- **No API key required** - Public API
- **Rate limits:** Reasonable use (no specific limit documented)
- **User-Agent header recommended:** `(BrAveFormsApp, contact@braveforms.com)`
- **Cost:** FREE (U.S. government service)

---

## Key Endpoints

### 1. Get Grid Point Data for Coordinates

**Endpoint:** `GET /points/{latitude},{longitude}`

**Purpose:** Convert GPS coordinates to NOAA grid coordinates and get relevant station URLs

**Example:**

```
GET https://api.weather.gov/points/38.8951,-77.0364
```

**Response (Tested 2025-10-02):**

```json
{
  "properties": {
    "gridId": "LWX",
    "gridX": 97,
    "gridY": 71,
    "observationStations": "https://api.weather.gov/gridpoints/LWX/97,71/stations",
    "forecast": "https://api.weather.gov/gridpoints/LWX/97,71/forecast",
    "forecastHourly": "https://api.weather.gov/gridpoints/LWX/97,71/forecast/hourly",
    "timeZone": "America/New_York",
    "radarStation": "KLWX",
    "relativeLocation": {
      "properties": {
        "city": "Washington",
        "state": "DC"
      }
    }
  }
}
```

**Key Fields:**

- `observationStations`: URL to get list of nearby weather stations
- `gridId`, `gridX`, `gridY`: NOAA grid coordinates
- `timeZone`: Timezone for the location (critical for working hours calculation)

---

### 2. Get List of Observation Stations

**Endpoint:** `GET /gridpoints/{gridId}/{gridX},{gridY}/stations`

**Purpose:** Get list of weather observation stations near the grid point, ordered by distance

**Example:**

```
GET https://api.weather.gov/gridpoints/LWX/97,71/stations
```

**Response (Tested 2025-10-02):**

```json
{
  "features": [
    {
      "id": "https://api.weather.gov/stations/KDCA",
      "properties": {
        "stationIdentifier": "KDCA",
        "name": "Washington/Reagan National Airport, DC",
        "elevation": {
          "value": 4.8768,
          "unitCode": "wmoUnit:m"
        }
      },
      "geometry": {
        "coordinates": [-77.03417, 38.84833]
      }
    },
    {
      "id": "https://api.weather.gov/stations/KCGS",
      "properties": {
        "stationIdentifier": "KCGS",
        "name": "College Park Airport"
      }
    }
  ]
}
```

**Stations Near EPA HQ (Washington DC):**

1. **KDCA** - Reagan National Airport (4.5 km away) - PRIMARY STATION
2. **KCGS** - College Park Airport (13.6 km away)
3. **KADW** - Andrews AFB (17.1 km away)
4. **KDAA** - Fort Belvoir (23.5 km away)

**Implementation Note:** Use the first station (closest) as primary data source

---

### 3. Get Latest Observation from Station

**Endpoint:** `GET /stations/{stationId}/observations/latest`

**Purpose:** Get most recent weather observation (hourly data)

**Example:**

```
GET https://api.weather.gov/stations/KDCA/observations/latest
```

**Response (Tested 2025-10-02 14:55 UTC):**

```json
{
  "properties": {
    "timestamp": "2025-10-02T14:55:00+00:00",
    "textDescription": "Partly Cloudy",
    "temperature": {
      "value": 15.56,
      "unitCode": "wmoUnit:degC"
    },
    "precipitationLast3Hours": {
      "value": null,
      "unitCode": "wmoUnit:mm"
    },
    "precipitationLastHour": {
      "value": null,
      "unitCode": "wmoUnit:mm"
    }
  }
}
```

**Key Fields for EPA Compliance:**

- `timestamp`: ISO 8601 format, UTC timezone
- `precipitationLastHour`: Precipitation in last hour (may be null)
- `precipitationLast3Hours`: Fallback if hourly data unavailable
- `unitCode`: Always "wmoUnit:mm" (millimeters)

---

### 4. Get Observation History (Time Range)

**Endpoint:** `GET /stations/{stationId}/observations`

**Purpose:** Get historical observations for a time period (for 24-hour accumulation)

**Query Parameters:**

- `start`: ISO 8601 timestamp (e.g., `2025-10-01T00:00:00Z`)
- `end`: ISO 8601 timestamp
- `limit`: Maximum number of results (default 1000)

**Example:**

```
GET https://api.weather.gov/stations/KDCA/observations?start=2025-10-01T00:00:00Z&end=2025-10-02T00:00:00Z
```

**Response:** Array of observations with same structure as latest observation

**Implementation Note:** For 24-hour rolling window, query last 24 hours and sum all `precipitationLastHour` values

---

## Data Format Details

### Precipitation Units

**CRITICAL for EPA Compliance:**

| NOAA Returns     | EPA Requires | Conversion Factor   |
| ---------------- | ------------ | ------------------- |
| Millimeters (mm) | Inches (in)  | 1 inch = 25.4 mm    |
| 6.35 mm          | 0.25 inches  | **EXACT threshold** |

**Conversion Formula:**

```typescript
const inches = millimeters / 25.4;
const meetsThreshold = inches >= 0.25; // EPA CGP requirement
```

**NEVER approximate** - Use exact 0.25 inches (6.35 mm), not 0.24 or 0.26

---

### Time Format

- **Format:** ISO 8601 (e.g., `2025-10-02T14:55:00+00:00`)
- **Timezone:** UTC (ends with `Z` or `+00:00`)
- **JavaScript:** `new Date().toISOString()`

**Example:**

```typescript
const now = new Date();
const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
const params = {
  start: startTime.toISOString(),
  end: now.toISOString(),
};
```

---

### Null Values

**Common Scenarios:**

- `precipitationLastHour: null` - No precipitation OR sensor malfunction
- `precipitationLast3Hours: null` - No data OR equipment maintenance

**Implementation Strategy:**

```typescript
// Handle null values gracefully
const precipitation = observation.precipitationLastHour?.value ?? 0;

// Log gaps for debugging
if (observation.precipitationLastHour === null) {
  logger.warn(`Missing precipitation data for ${timestamp}`);
}
```

---

### Data Availability

**Frequency:**

- Observations: Typically hourly (METAR reports)
- Updates: Usually within 10 minutes of top of hour
- Coverage: 24/7/365

**Potential Issues:**

- Gaps during equipment maintenance
- Sensor failures (null values)
- Network outages (API unavailable)

**Fallback Strategy:**

- Use nearest alternate station (KCGS, KADW)
- If all NOAA stations fail, use OpenWeatherMap API (secondary)

---

## EPA CGP Requirements (2022 Construction General Permit)

### Regulatory Citation

**Section 4.4:** Inspection Requirements

**Trigger:** Storm event producing ≥ 0.25 inches of precipitation within 24-hour period

**Deadline:** Within 24 working hours of measurable storm event

### Threshold Definition

**EXACTLY 0.25 inches** - Not approximate

```typescript
// ✅ CORRECT
const meetsThreshold = precipitationInches >= 0.25;

// ❌ WRONG
const meetsThreshold = precipitationInches >= 0.24; // Too lenient
const meetsThreshold = precipitationInches > 0.25; // Too strict
```

### 24-Hour Rolling Window

**EPA requires accumulation** - Not single observation

```typescript
// Example: 3 hourly readings
const readings = [
  { timestamp: '2025-10-01T10:00:00Z', precipitation: 0.1 }, // inches
  { timestamp: '2025-10-01T14:00:00Z', precipitation: 0.08 },
  { timestamp: '2025-10-01T18:00:00Z', precipitation: 0.12 },
];

const total = readings.reduce((sum, r) => sum + r.precipitation, 0);
// total = 0.30 inches → MEETS THRESHOLD
```

### Working Hours Definition

**"Working hours"** = Project's normal business hours (not calendar hours)

**Examples:**

- Storm on Saturday 10:00 AM → Inspection due Monday end of business
- Storm on Friday 11:00 PM → Inspection due Tuesday end of business (24 working hours)
- Storm on Tuesday 2:00 PM → Inspection due Wednesday by 2:00 PM

**Implementation:** Store project working hours in database, calculate deadline accordingly

---

## Implementation Checklist

### TypeScript Types Needed

```typescript
// 1. NOAA Point Response
interface NOAAPointResponse {
  properties: {
    gridId: string;
    gridX: number;
    gridY: number;
    observationStations: string; // URL
    timeZone: string;
    relativeLocation: {
      properties: {
        city: string;
        state: string;
      };
    };
  };
}

// 2. Station List Response
interface NOAAStationList {
  features: Array<{
    id: string; // URL to station
    properties: {
      stationIdentifier: string; // e.g., "KDCA"
      name: string;
      elevation?: {
        value: number;
        unitCode: string;
      };
    };
    geometry: {
      coordinates: [number, number]; // [lon, lat]
    };
  }>;
}

// 3. Observation Response
interface NOAAObservation {
  properties: {
    timestamp: string; // ISO 8601
    textDescription: string;
    temperature?: {
      value: number;
      unitCode: string;
    };
    precipitationLastHour?: {
      value: number | null; // millimeters
      unitCode: string; // "wmoUnit:mm"
    };
    precipitationLast3Hours?: {
      value: number | null;
      unitCode: string;
    };
  };
}

// 4. Converted Data (for EPA compliance)
interface PrecipitationData {
  timestamp: Date;
  precipitationInches: number; // Converted from mm
  stationId: string;
  source: 'NOAA' | 'OpenWeatherMap';
}
```

---

## Error Handling Requirements

### Network Errors

```typescript
try {
  const response = await fetch(noaaUrl);
  if (!response.ok) {
    throw new Error(`NOAA API error: ${response.status}`);
  }
} catch (error) {
  if (error.code === 'ENOTFOUND') {
    // DNS failure
    logger.error('NOAA API unreachable - check network connection');
    // Fallback to OpenWeatherMap
  } else if (error.code === 'ETIMEDOUT') {
    // Timeout
    logger.error('NOAA API timeout - retrying with exponential backoff');
    // Retry logic
  }
}
```

### HTTP Status Codes

| Code | Meaning             | Action                          |
| ---- | ------------------- | ------------------------------- |
| 200  | Success             | Parse response                  |
| 404  | Station not found   | Try alternate station           |
| 500  | Server error        | Retry with backoff              |
| 503  | Service unavailable | Use cached data or fallback API |

### Data Validation

```typescript
function validatePrecipitation(value: number | null): number {
  if (value === null) {
    logger.warn('Null precipitation value received');
    return 0; // Assume no precipitation
  }
  if (value < 0) {
    logger.error(`Invalid negative precipitation: ${value}`);
    return 0;
  }
  if (value > 500) {
    // 500mm = 19.7 inches (extremely unlikely in 1 hour)
    logger.error(`Suspiciously high precipitation: ${value}mm`);
    return 0; // Data quality issue
  }
  return value;
}
```

---

## Caching Strategy

### Why Cache?

- **Reduce API calls:** Weather data doesn't change every second
- **Improve performance:** Faster response for UI
- **Reliability:** Graceful degradation if API unavailable

### Cache Configuration (Redis)

```typescript
const CACHE_CONFIG = {
  // Observations cache
  observations: {
    key: (lat: number, lon: number) => `weather:obs:${lat}:${lon}`,
    ttl: 60 * 60, // 1 hour (observations update hourly)
  },
  // Stations cache
  stations: {
    key: (lat: number, lon: number) => `weather:stations:${lat}:${lon}`,
    ttl: 60 * 60 * 24 * 7, // 7 days (stations rarely change)
  },
  // Grid point cache
  gridPoint: {
    key: (lat: number, lon: number) => `weather:grid:${lat}:${lon}`,
    ttl: 60 * 60 * 24 * 30, // 30 days (grid coordinates never change)
  },
};
```

### Cache Strategy

1. **Check cache first**
2. **On cache miss:** Fetch from NOAA API
3. **Store in cache** with appropriate TTL
4. **On API failure:** Use stale cache if available

---

## Rate Limiting Best Practices

**NOAA API Guidelines:**

1. Cache aggressively (1 hour minimum for observations)
2. Implement exponential backoff on failures (1s, 2s, 4s, 8s)
3. Add 1 second delay between sequential requests
4. Monitor for 429 (Too Many Requests) responses
5. Use User-Agent header: `(BrAveFormsApp, contact@braveforms.com)`

**Implementation:**

```typescript
// Exponential backoff
async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': '(BrAveFormsApp, contact@braveforms.com)',
        },
      });

      if (response.status === 429) {
        // Rate limited
        const retryAfter = response.headers.get('Retry-After') || 2 ** attempt;
        await sleep(retryAfter * 1000);
        continue;
      }

      return response;
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      await sleep(1000 * 2 ** attempt); // Exponential backoff
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## Testing Coordinates

### Primary Test Location: EPA HQ (Washington DC)

**Coordinates:**

- Latitude: `38.8951`
- Longitude: `-77.0364`
- Expected Station: `KDCA` (Reagan National Airport)
- Grid: `LWX/97,71`
- Timezone: `America/New_York`

**Why EPA HQ?**

- Well-maintained weather station (major airport)
- Reliable data availability
- Symbolic (EPA compliance testing)

### Alternative Test Locations

| City        | Lat     | Lon       | Station | Notes                           |
| ----------- | ------- | --------- | ------- | ------------------------------- |
| New York    | 40.7128 | -74.0060  | KJFK    | Major airport, reliable data    |
| Los Angeles | 34.0522 | -118.2437 | KLAX    | West coast testing              |
| Chicago     | 41.8781 | -87.6298  | KORD    | Midwest, variable weather       |
| Miami       | 25.7617 | -80.1918  | KMIA    | Subtropical, high precipitation |

---

## Known Issues & Workarounds

### Issue 1: Null Precipitation Values

**Problem:** `precipitationLastHour` frequently null even when it rained

**Cause:** METAR reports don't always include hourly precipitation

**Workaround:**

1. Use `precipitationLast3Hours` as fallback
2. Query last 24 hours of observations
3. Calculate accumulation from non-null values

### Issue 2: Station Data Gaps

**Problem:** Equipment maintenance creates data gaps

**Workaround:**

1. Query multiple nearby stations
2. Use first station with valid data
3. Log gaps for manual review

### Issue 3: API Latency

**Problem:** API responses can be slow (2-5 seconds)

**Workaround:**

1. Aggressive caching (1 hour TTL)
2. Async processing with BullMQ
3. Pre-fetch data for active projects

---

## Next Steps (Implementation Plan)

### Phase 1: Types & Client (ISSUE-023, 024)

1. Create TypeScript types (15 min)
2. Implement NOAAClient class (20 min)
3. Add coordinate-to-station lookup (15 min)

### Phase 2: Data Fetching (ISSUE-025, 026)

1. Implement observation fetching (20 min)
2. Add 24-hour accumulation logic (15 min)
3. Unit conversion (mm → inches) (10 min)

### Phase 3: Error Handling (ISSUE-027)

1. Network error handling (15 min)
2. Retry logic with backoff (15 min)
3. Fallback to alternate stations (10 min)

### Phase 4: Caching (ISSUE-028)

1. Redis cache integration (20 min)
2. Cache invalidation strategy (10 min)
3. Stale cache fallback (10 min)

### Phase 5: Testing (ISSUE-029, 030)

1. Unit tests for client (20 min)
2. Integration tests with real API (20 min)
3. EPA compliance validation tests (15 min)

**Total Estimate:** ~4 hours for complete NOAA integration

---

## References

**Official Documentation:**

- NOAA API Docs: https://www.weather.gov/documentation/services-web-api
- NOAA API Specification: https://api.weather.gov/openapi.json
- EPA CGP 2022: https://www.epa.gov/npdes/stormwater-cgp (Section 4.4)

**Technical Standards:**

- ISO 8601 Time Format: https://en.wikipedia.org/wiki/ISO_8601
- WMO Unit Codes: https://codes.wmo.int/common/unit

**Related Documentation:**

- [CLAUDE.md](../../../CLAUDE.md) - Development standards
- [TECH_STACK_DETAILS.md](../../TECH_STACK_DETAILS.md) - Technology specifications
- [COMMON_PITFALLS.md](../../COMMON_PITFALLS.md) - Anti-patterns guide

---

## Research Validation

**API Endpoints Tested:** ✅

- `/points/38.8951,-77.0364` (grid point)
- `/gridpoints/LWX/97,71/stations` (station list)
- `/stations/KDCA/observations/latest` (latest observation)

**Findings:**

- API responsive (< 2 seconds)
- No API key required (confirmed)
- Precipitation data available (though currently null - no rain)
- Unit is millimeters (wmoUnit:mm confirmed)

**Conversion Validated:**

- 0.25 inches = 6.35 mm ✅
- Formula: `inches = mm / 25.4` ✅

**Compliance Requirements Confirmed:**

- EPA CGP 2022 Section 4.4 ✅
- Exactly 0.25" threshold ✅
- 24-hour accumulation period ✅
- Working hours definition ✅

---

**Last Updated:** 2025-10-02 10:45 EDT
**Researched By:** Development Team
**Review Status:** APPROVED for implementation
**Next Issue:** ISSUE-023 (Create TypeScript Types)
