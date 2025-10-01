# ISSUE-042: Write Tests for Weather Service

**Sprint:** Sprint 1 | **Phase:** Phase 6 - Test Coverage | **Priority:** P1
**Time:** 25 minutes | **Points:** 2 | **Status:** Not Started
**Created:** 2025-10-01 17:00:00 EDT
**Dependencies:** ISSUE-041 ✅

---

## What You'll Do

Test weather service with mocked NOAA client and Redis dependencies.

---

## Step-by-Step Instructions

### Prerequisites
- ISSUE-041 complete (PWA tested)
- Weather service implemented (ISSUE-033)

### Steps

1. Create `apps/backend/src/modules/weather/weather.service.spec.ts`

2. Write tests:
```typescript
import { Test } from '@nestjs/testing';
import { WeatherService } from './weather.service';
import { NOAAClient } from './clients/noaa.client';

describe('WeatherService', () => {
  let service: WeatherService;
  let noaaClient: NOAAClient;
  let redisMock: any;

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
    redisMock = module.get('default_IORedisModuleConnectionToken');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fetch precipitation data from NOAA', async () => {
    const mockData = [
      { timestamp: new Date(), amountInches: 0.25, stationId: 'TEST' },
    ];

    redisMock.get.mockResolvedValue(null); // Cache miss
    jest.spyOn(noaaClient, 'getStationForCoordinates').mockResolvedValue('TEST_STATION');
    jest.spyOn(noaaClient, 'getPrecipitation').mockResolvedValue(mockData);

    const result = await service.getPrecipitation(38.8951, -77.0364);

    expect(result).toEqual(mockData);
    expect(noaaClient.getStationForCoordinates).toHaveBeenCalledWith(38.8951, -77.0364);
    expect(redisMock.setex).toHaveBeenCalled();
  });

  it('should return cached data when available', async () => {
    const mockData = [
      { timestamp: new Date().toISOString(), amountInches: 0.25, stationId: 'TEST' },
    ];

    redisMock.get.mockResolvedValue(JSON.stringify(mockData));

    const result = await service.getPrecipitation(38.8951, -77.0364);

    expect(noaaClient.getStationForCoordinates).not.toHaveBeenCalled();
    expect(result).toEqual(mockData);
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
- [ ] Service tests written
- [ ] Mocking implemented (NOAA client, Redis)
- [ ] Cache hit scenario tested
- [ ] Cache miss scenario tested
- [ ] All tests pass
- [ ] Coverage greater than 80% for weather.service.ts

---

## Testing Steps

1. Run tests: `pnpm --filter backend test weather.service.spec.ts`
2. Check coverage: `pnpm --filter backend test:coverage -- weather.service`

---

## Evidence Requirements

**Location:** `evidence/ISSUE-042/test-results/`

**Required Screenshots:**
1. `weather-service-tests.png` - Terminal showing all tests passing

---

## Troubleshooting

**Problem:** Mock provider token errors
- Use exact token: `'default_IORedisModuleConnectionToken'`
- Check NestJS IoRedis documentation

**Problem:** Tests fail on cache deserialization
- Dates serialize to ISO strings in JSON
- Parse timestamps back to Date objects in test

**Problem:** Mock not called as expected
- Verify mock setup in beforeEach
- Check spy syntax: `jest.spyOn(obj, 'method')`

---

## Success Criteria

- Service tests written
- Both cache scenarios tested (hit/miss)
- Mocking configured correctly
- All tests pass
- Coverage greater than 80%
- Evidence collected

---

## Next Issue

**ISSUE-043:** Write Tests for Weather Resolver (20 minutes)

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P1
**Estimated Time:** 25 minutes
