# ISSUE-043: Write Tests for Weather Resolver

**Sprint:** Sprint 1 | **Phase:** Phase 6 - Test Coverage | **Priority:** P1
**Time:** 20 minutes | **Points:** 2 | **Status:** Not Started
**Created:** 2025-10-01 17:05:00 EDT
**Dependencies:** ISSUE-042 ✅

---

## What You'll Do

Test GraphQL resolver with mocked weather service.

---

## Step-by-Step Instructions

### Prerequisites
- ISSUE-042 complete (weather service tests)

### Steps

1. Create `apps/backend/src/modules/weather/weather.resolver.spec.ts`

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

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('should return precipitation data via GraphQL query', async () => {
    const mockData = [
      { timestamp: new Date(), amountInches: 0.25, stationId: 'TEST' },
    ];

    jest.spyOn(service, 'getPrecipitation').mockResolvedValue(mockData);

    const result = await resolver.getPrecipitation(38.8951, -77.0364);

    expect(result).toEqual(mockData);
    expect(service.getPrecipitation).toHaveBeenCalledWith(38.8951, -77.0364);
  });

  it('should handle service errors', async () => {
    jest.spyOn(service, 'getPrecipitation').mockRejectedValue(
      new Error('NOAA API unavailable')
    );

    await expect(
      resolver.getPrecipitation(38.8951, -77.0364)
    ).rejects.toThrow('NOAA API unavailable');
  });
});
```

3. Run tests: `pnpm --filter backend test weather.resolver.spec.ts`

4. Screenshot passing tests

---

## Files to Create

**New Files:**
- `apps/backend/src/modules/weather/weather.resolver.spec.ts`

---

## Verification Checklist

- [ ] Test file created
- [ ] Resolver tests written
- [ ] Service mocked correctly
- [ ] Success scenario tested
- [ ] Error handling tested
- [ ] All tests pass
- [ ] Coverage greater than 80% for weather.resolver.ts

---

## Testing Steps

1. Run tests: `pnpm --filter backend test weather.resolver.spec.ts`
2. Check coverage: `pnpm --filter backend test:coverage -- weather.resolver`

---

## Evidence Requirements

**Location:** `evidence/ISSUE-043/test-results/`

**Required Screenshots:**
1. `weather-resolver-tests.png` - Terminal showing all tests passing

---

## Troubleshooting

**Problem:** Resolver not found errors
- Check WeatherResolver is imported correctly
- Verify resolver file exists
- Check module configuration

**Problem:** Mock not returning data
- Verify jest.spyOn syntax: `jest.spyOn(service, 'getPrecipitation')`
- Check mockResolvedValue returns promise
- Verify await in test

**Problem:** Error test fails
- Use mockRejectedValue for errors
- Check expect().rejects.toThrow() syntax

---

## Success Criteria

- Resolver tests written
- Service properly mocked
- Success and error scenarios tested
- All tests pass
- Coverage greater than 80%
- Evidence collected

---

## Next Issue

**ISSUE-044:** Write Tests for Organizations Resolver (20 minutes)

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P1
**Estimated Time:** 20 minutes
