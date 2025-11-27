# ISSUE-126: Load Testing & Stress Testing

**Sprint:** Sprint 5 (Moved from Sprint 4) | **Phase:** 4 - Polish & Testing | **Priority:** P1
**Time:** 4 hours | **Complexity:** Small
**Created:** 2025-10-23
**Moved:** 2025-11-27 (Sprint 4 closed, issue carried over to Sprint 5)
**Dependencies:** ISSUE-149 (Sprint 5 completion report)
**Status:** MOVED TO SPRINT 5

---

## Sprint 4 Deferral Record

**Reason:** Q&D pilot deployment targets 5-25 users. Load testing for 100+ concurrent users is not required for initial pilot launch.

**Sprint 5 Assignment:**

- Added as P1 issue in Sprint 5 Phase 4 (Polish & Testing)
- Estimated 4 hours
- Scheduled after Sprint 5 completion report

**Risk Assessment:** LOW - Pilot user count is well within application capacity based on architecture review.

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
