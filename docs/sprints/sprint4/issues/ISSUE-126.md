# ISSUE-126: Load Testing & Stress Testing

**Sprint:** Sprint 4 | **Phase:** 3 - Testing & Polish | **Priority:** P1
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-23
**Dependencies:** ISSUE-125 (security audit complete)
**Status:** NOT STARTED

## What You'll Do

Test 100 concurrent users filling forms, 1000 form submissions per minute, database connection pool under load, photo upload concurrency (50 uploads), and QR portal under load (500 inspector accesses).

## Prerequisites

- [ ] ISSUE-125 complete
- [ ] Autocannon or k6 load testing tool installed

## Step-by-Step Instructions

### Step 1: Create Load Test Suite (1h)

Create: `apps/backend/src/__tests__/load/load-testing.spec.ts`

```typescript
import autocannon from 'autocannon';

describe('Load Testing', () => {
  it('should handle 100 concurrent form submissions', async () => {
    const result = await autocannon({
      url: 'http://localhost:3000/graphql',
      connections: 100,
      duration: 30,
      pipelining: 1,
      requests: [
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${validToken}`,
          },
          body: JSON.stringify({
            query: createSubmissionMutation,
            variables: { templateId, data: mockFormData },
          }),
        },
      ],
    });

    expect(result.requests.average).toBeGreaterThan(50);
    expect(result.latency.p95).toBeLessThan(200);
  });
});
```

### Step 2: Run Load Tests (45 min)

```bash
cd apps/backend
pnpm test:load
```

### Step 3: Document Results (15 min)

Create: `docs/sprints/sprint4/LOAD_TESTING_RESULTS.md`

**Required Metrics:**

- Requests per second: >50
- Latency P95: <200ms
- Error rate: <1%

## Files Created

- apps/backend/src/**tests**/load/load-testing.spec.ts
- docs/sprints/sprint4/LOAD_TESTING_RESULTS.md
- evidence/ISSUE-126/ (load test results)

## Success Criteria

- [ ] 100 concurrent users supported
- [ ] Latency P95 <200ms
- [ ] Error rate <1%
- [ ] Connection pool stable under load
- [ ] Load testing report complete

## Time Estimate: 2 hours

## Next Issue

**ISSUE-127:** Sprint 4 Completion Report (1h)
