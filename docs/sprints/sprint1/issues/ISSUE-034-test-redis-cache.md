# ISSUE-034: Test Redis Cache Hit/Miss

**Sprint:** Sprint 1 | **Phase:** Phase 4 - Weather API | **Priority:** P1
**Time:** 30 minutes | **Points:** 3 | **Status:** Not Started
**Created:** 2025-10-01 16:20:00 EDT
**Dependencies:** ISSUE-033 ✅

---

## What You'll Do

Verify cache hit/miss scenarios work correctly with mocked Redis.

---

## Step-by-Step Instructions

### Prerequisites
- ISSUE-033 complete (Redis caching implemented)

### Steps

1. Create `apps/backend/src/modules/weather/weather.service.spec.ts`

2. Write tests:
```typescript
import { Test } from '@nestjs/testing';
import { WeatherService } from './weather.service';
import { NOAAClient } from './clients/noaa.client';

describe('WeatherService Caching', () => {
  let service: WeatherService;
  let redisMock: any;
  let noaaClientMock: any;

  beforeEach(async () => {
    redisMock = {
      get: jest.fn(),
      setex: jest.fn(),
    };

    noaaClientMock = {
      getStationForCoordinates: jest.fn(),
      getPrecipitation: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        WeatherService,
        { provide: 'default_IORedisModuleConnectionToken', useValue: redisMock },
        { provide: NOAAClient, useValue: noaaClientMock },
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
    expect(noaaClientMock.getStationForCoordinates).not.toHaveBeenCalled();
  });

  it('should fetch from NOAA on cache miss', async () => {
    const mockData = [{ timestamp: new Date(), amountInches: 0.25, stationId: 'TEST' }];
    redisMock.get.mockResolvedValue(null);
    noaaClientMock.getStationForCoordinates.mockResolvedValue('TEST_STATION');
    noaaClientMock.getPrecipitation.mockResolvedValue(mockData);

    const result = await service.getPrecipitation(38.8951, -77.0364);

    expect(redisMock.get).toHaveBeenCalledWith('precipitation:38.8951:-77.0364');
    expect(noaaClientMock.getStationForCoordinates).toHaveBeenCalledWith(38.8951, -77.0364);
    expect(redisMock.setex).toHaveBeenCalledWith(
      'precipitation:38.8951:-77.0364',
      21600, // 6 hours in seconds
      JSON.stringify(mockData)
    );
  });
});
```

3. Run tests: `pnpm --filter backend test weather.service.spec.ts`

4. Screenshot passing tests

---

## Files to Create

**New Files:**
- `apps/backend/src/modules/weather/weather.service.spec.ts`

---

## Verification Checklist

- [ ] Test file created
- [ ] Cache hit test verifies cached data returned
- [ ] Cache hit test verifies NOAA not called
- [ ] Cache miss test verifies NOAA called
- [ ] Cache miss test verifies data cached
- [ ] 6-hour TTL verified (21600 seconds)
- [ ] All tests pass
- [ ] Evidence collected

---

## Testing Steps

1. Run tests: `pnpm --filter backend test weather.service.spec.ts`
2. Verify both scenarios pass
3. Check mocks are called correctly

---

## Evidence Requirements

**Location:** `evidence/ISSUE-034/test-results/`

**Required Screenshots:**
1. `cache-tests-passing.png` - Terminal showing all tests green

---

## Troubleshooting

**Problem:** Mock provider token incorrect
- Use exact token: `'default_IORedisModuleConnectionToken'`
- Check NestJS IoRedis documentation for correct token

**Problem:** JSON parse errors in test
- Mock returns JSON string: `JSON.stringify(mockData)`
- Service should parse: `JSON.parse(cached)`

**Problem:** Tests fail on Date serialization
- Dates serialize to ISO strings in JSON
- Consider using date strings in mock data

---

## Success Criteria

- Cache hit test passes
- Cache miss test passes
- TTL verified (6 hours = 21600 seconds)
- NOAA client not called on cache hit
- NOAA client called on cache miss
- Coverage >80% for weather.service.ts
- Evidence collected

---

## Next Issue

**ISSUE-035:** Deploy Weather Service to Kubernetes (20 minutes)

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P1
**Estimated Time:** 30 minutes
