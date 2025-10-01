# ISSUE-022: Research NOAA API Documentation

**Sprint:** Sprint 1 | **Phase:** 4 - Weather API | **Priority:** P1
**Time:** 20 minutes | **Points:** 1 | **Status:** Not Started
**Created:** 2025-10-01 12:00:00 EDT

## What You'll Do

Research NOAA Weather Service API and document endpoints, data formats, and usage requirements for EPA compliance integration.

## Single Objective

Create comprehensive documentation of NOAA API for team reference.

## Files to Create

- `docs/sprints/sprint1/research/NOAA_API_NOTES.md` (NEW)

## Step-by-Step Instructions

### Step 1: Create Research Directory (2 min)
```bash
mkdir -p docs/sprints/sprint1/research
```

### Step 2: Visit NOAA API Documentation (5 min)
1. Open browser
2. Navigate to: https://www.weather.gov/documentation/services-web-api
3. Read "Getting Started" section
4. Browse available endpoints

### Step 3: Test API Endpoint (5 min)
1. Open browser
2. Test endpoint: https://api.weather.gov/points/38.8951,-77.0364
   - This is EPA HQ coordinates (Washington DC)
3. Observe JSON response format
4. Note the `observationStations` URL in response

### Step 4: Create Documentation File (8 min)
Create `docs/sprints/sprint1/research/NOAA_API_NOTES.md` with this content:

```markdown
# NOAA Weather Service API Research Notes

**Researched:** 2025-10-01
**Purpose:** EPA CGP 0.25" precipitation monitoring
**API Documentation:** https://www.weather.gov/documentation/services-web-api

## Base URL
```
https://api.weather.gov
```

## Authentication
- No API key required
- Rate limits: Reasonable use (no specific limit documented)
- User-Agent header recommended: `(BrAveFormsApp, contact@braveforms.com)`

## Key Endpoints

### 1. Get Observation Station for Coordinates
**Endpoint:** `GET /points/{latitude},{longitude}`

**Example:**
```
GET https://api.weather.gov/points/38.8951,-77.0364
```

**Response:**
```json
{
  "properties": {
    "observationStations": "https://api.weather.gov/gridpoints/LWX/97,71/stations"
  }
}
```

### 2. Get List of Stations
**Endpoint:** `GET /gridpoints/{office}/{gridX},{gridY}/stations`

**Response:**
```json
{
  "features": [
    {
      "id": "https://api.weather.gov/stations/KDCA",
      "properties": {
        "stationIdentifier": "KDCA",
        "name": "Washington Reagan National Airport"
      }
    }
  ]
}
```

### 3. Get Observations for Station
**Endpoint:** `GET /stations/{stationId}/observations`

**Query Parameters:**
- `start`: ISO 8601 timestamp (e.g., `2025-10-01T00:00:00Z`)
- `end`: ISO 8601 timestamp

**Example:**
```
GET https://api.weather.gov/stations/KDCA/observations?start=2025-10-01T00:00:00Z&end=2025-10-02T00:00:00Z
```

**Response:**
```json
{
  "features": [
    {
      "properties": {
        "timestamp": "2025-10-01T14:00:00+00:00",
        "precipitationLastHour": {
          "value": 6.35,
          "unitCode": "wmoUnit:mm"
        }
      }
    }
  ]
}
```

## Data Format Notes

### Precipitation Units
- NOAA returns precipitation in **millimeters (mm)**
- EPA CGP threshold is **0.25 inches**
- Conversion: `1 inch = 25.4 mm`
- Therefore: `0.25 inches = 6.35 mm`

### Time Format
- All timestamps in ISO 8601 format
- Timezone: UTC (ends with `Z` or `+00:00`)
- JavaScript: `new Date().toISOString()`

### Data Availability
- Observations typically hourly
- May have gaps during equipment maintenance
- Null values possible for `precipitationLastHour`

## EPA CGP Requirements

### Threshold
- **EXACTLY 0.25 inches** within 24-hour period (EPA CGP 2022 Section 4.4)
- Multiple readings may need accumulation
- Must track rolling 24-hour window

### Inspection Deadline
- Within 24 working hours of storm event
- "Working hours" = project's normal business hours
- Weekend storms → inspection due Monday

## Implementation Notes

### TypeScript Types Needed
1. `NOAAPointResponse` - coordinates to station URL
2. `NOAAStationList` - list of nearby stations
3. `NOAAObservation` - precipitation reading
4. `PrecipitationData` - converted to inches with timestamp

### Error Handling
- Network failures (timeout, no connection)
- HTTP errors (404 station not found, 503 service unavailable)
- Null precipitation values
- Invalid coordinates

### Caching Strategy
- Cache observations for 6 hours (weather doesn't change frequently)
- Redis TTL: `6 * 60 * 60` seconds
- Cache key format: `precipitation:{lat}:{lon}`

## Testing Coordinates

**EPA HQ (Washington DC):**
- Latitude: 38.8951
- Longitude: -77.0364
- Expected Station: KDCA (Reagan National Airport)

**Alternative Test Locations:**
- New York City: 40.7128, -74.0060 (Station: KJFK)
- Los Angeles: 34.0522, -118.2437 (Station: KLAX)
- Chicago: 41.8781, -87.6298 (Station: KORD)

## Rate Limiting Best Practices
1. Cache aggressively (6 hours minimum)
2. Implement exponential backoff on failures
3. Add 1 second delay between sequential requests
4. Monitor 429 (Too Many Requests) responses

## Next Steps
1. Create TypeScript types (ISSUE-023)
2. Implement client class (ISSUE-024, 025)
3. Add error handling (ISSUE-026)
4. Write integration tests (ISSUE-027)
```

### Step 5: Save and Verify (2 min)
1. Save file
2. Verify file exists: `ls docs/sprints/sprint1/research/`
3. Read through once to ensure accuracy

## Verification Checklist

- [ ] Research directory created
- [ ] NOAA documentation website visited
- [ ] API endpoint tested in browser
- [ ] Documentation file created with all sections
- [ ] Base URL documented
- [ ] All 3 key endpoints documented
- [ ] Data format notes included
- [ ] Unit conversion formula present (1 inch = 25.4mm)
- [ ] EPA CGP requirements cited
- [ ] Test coordinates included

## Evidence Required

Create folder: `docs/sprints/sprint1/evidence/ISSUE-022/research/`

Collect:
1. Screenshot of NOAA API website
2. Screenshot of browser testing API endpoint (show JSON response)
3. Screenshot of created documentation file in VS Code

Save as:
- `evidence/ISSUE-022/research/noaa-website.png`
- `evidence/ISSUE-022/research/api-test-response.png`
- `evidence/ISSUE-022/research/documentation-file.png`

## Success Criteria

- [ ] NOAA API base URL documented
- [ ] 3 key endpoints with examples
- [ ] Unit conversion formula correct (25.4)
- [ ] EPA CGP requirements cited
- [ ] Test coordinates provided
- [ ] Evidence collected (3 screenshots)

## Time Estimate

**20 minutes total:**
- Create directory: 2 min
- Browse NOAA docs: 5 min
- Test API in browser: 5 min
- Write documentation: 8 min
- Collect evidence: 2 min

## Next Issue

ISSUE-023: Create NOAA Client TypeScript Types (15 min)
- Prerequisites: This research documentation complete
- Uses: Endpoint structures documented here

## Notes for Junior Developers

**Why this matters:**
- NOAA API has NO official SDK or npm package
- This documentation is your reference for implementation
- Copy the examples EXACTLY when writing code
- The 0.25" = 6.35mm conversion is CRITICAL for EPA compliance

**Common Questions:**

Q: Do I need an API key?
A: No, NOAA API is public and free

Q: What if the API is down?
A: Document it in evidence, ask tech lead (fallback to OpenWeatherMap)

Q: Can I skip the unit conversion?
A: NO - EPA requires inches, NOAA returns millimeters

Q: How accurate do I need to be?
A: EXACTLY 0.25 inches, not 0.24 or 0.26 (regulatory requirement)

## Common Mistakes to Avoid

- Don't skip testing the API endpoint yourself
- Don't forget the unit conversion formula
- Don't approximate the EPA threshold (must be exact 0.25")
- Don't skip collecting evidence
- Don't move to next issue without completing this research

## References

- NOAA API Docs: https://www.weather.gov/documentation/services-web-api
- EPA CGP 2022: https://www.epa.gov/npdes/stormwater-cgp (Section 4.4)
- ISO 8601 Time Format: https://en.wikipedia.org/wiki/ISO_8601
