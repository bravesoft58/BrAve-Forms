# ISSUE-033: Add Redis Caching to Weather Service

**Sprint:** Sprint 1 | **Phase:** Phase 4 - Weather API | **Priority:** P1
**Time:** 30 minutes | **Points:** 3 | **Status:** Not Started
**Created:** 2025-10-01 16:15:00 EDT
**Dependencies:** ISSUE-032 ✅

---

## What You'll Do

Cache precipitation data with 6-hour TTL to reduce NOAA API calls.

---

## Step-by-Step Instructions

### Prerequisites
- ISSUE-032 complete (all weather utils tested)
- Redis deployed in Kubernetes

### Steps

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

  // 3. Cache for 6 hours (21600 seconds)
  await this.redis.setex(cacheKey, 6 * 60 * 60, JSON.stringify(data));

  return data;
}
```

5. Save file

---

## Files to Modify

**Edit:**
- `apps/backend/src/modules/weather/weather.service.ts`

---

## Verification Checklist

- [ ] Redis imported and injected
- [ ] Cache check implemented before NOAA call
- [ ] Cache key uses lat/lon
- [ ] 6-hour TTL set (21600 seconds)
- [ ] Data serialized to JSON for cache
- [ ] Service compiles successfully

---

## Testing Steps

1. Run type check: `pnpm --filter backend type-check`
2. Check Redis is running: `kubectl get pods -n braveforms | grep redis`
3. Verify cache key format is consistent

---

## Evidence Requirements

**Location:** `evidence/ISSUE-033/code/`

**Required Screenshots:**
1. `redis-caching.png` - Weather service with caching implementation

---

## Troubleshooting

**Problem:** Redis import errors
- Check package installed: `@nestjs-modules/ioredis`
- Verify Redis module configured in weather.module.ts

**Problem:** Type errors on InjectRedis
- Import from: `@nestjs-modules/ioredis`
- Check decorator syntax: `@InjectRedis()`

**Problem:** Cache not working
- Check Redis pod running: `kubectl logs deployment/redis -n braveforms`
- Verify connection string in environment variables

---

## Success Criteria

- Redis client injected correctly
- Cache check before NOAA API call
- 6-hour TTL configured
- Cache key includes coordinates
- Data properly serialized/deserialized
- TypeScript compiles without errors
- Evidence collected

---

## Next Issue

**ISSUE-034:** Test Redis Cache Hit/Miss (30 minutes)

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P1
**Estimated Time:** 30 minutes
