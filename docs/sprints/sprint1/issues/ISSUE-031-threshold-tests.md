# ISSUE-031: Write Unit Tests for Threshold Detection

**Sprint:** Sprint 1 | **Phase:** Phase 4 - Weather API | **Priority:** P0
**Time:** 30 minutes | **Points:** 3 | **Status:** Not Started
**Created:** 2025-10-01 16:05:00 EDT
**Dependencies:** ISSUE-030 ✅

---

## What You'll Do

Test EXACTLY 0.25" threshold per EPA CGP (TDD verification with red→green workflow).

---

## Step-by-Step Instructions

### Prerequisites
- ISSUE-028 complete (accumulation function)
- ISSUE-029 complete (threshold check function)

### Steps

1. Create `apps/backend/src/modules/weather/utils/precipitation.utils.spec.ts`

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

    it('should return 0 for empty array', () => {
      const total = calculate24HourAccumulation([]);
      expect(total).toBe(0);
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

    it('should return true for 1.0 inch', () => {
      expect(meetsEPAThreshold(1.0)).toBe(true);
    });
  });
});
```

3. Run tests: `pnpm --filter backend test precipitation.utils.spec.ts`

4. Screenshot passing tests

---

## Files to Create

**New Files:**
- `apps/backend/src/modules/weather/utils/precipitation.utils.spec.ts`

---

## Verification Checklist

- [ ] Test file created
- [ ] Tests verify EXACTLY 0.25" threshold
- [ ] Tests cover edge cases (0.24", 0.26")
- [ ] Tests verify accumulation within 24-hour window
- [ ] Tests handle empty array
- [ ] All tests pass
- [ ] Evidence collected (screenshot)

---

## Testing Steps

1. Run tests: `pnpm --filter backend test precipitation.utils.spec.ts`
2. Verify all tests pass
3. Check coverage: `pnpm --filter backend test:coverage -- precipitation.utils.spec.ts`

---

## Evidence Requirements

**Location:** `evidence/ISSUE-031/test-results/`

**Required Screenshots:**
1. `threshold-tests-passing.png` - Terminal showing all tests green

---

## Troubleshooting

**Problem:** Tests fail on threshold boundary
- Verify threshold function uses `>=` not `>`
- Check exact value is 0.25, not 0.24 or 0.26

**Problem:** Accumulation test fails
- Check date math (1 hour = 60 * 60 * 1000 ms)
- Verify 30-hour data point is excluded

**Problem:** Import errors
- Check import path matches file location
- Verify functions are exported from precipitation.utils.ts

---

## Success Criteria

- All tests pass
- Tests verify EXACTLY 0.25" threshold
- Tests cover boundary cases (0.24", 0.25", 0.26")
- Tests verify 24-hour window logic
- Coverage >80% for precipitation.utils.ts
- Evidence collected

---

## Next Issue

**ISSUE-032:** Write Unit Tests for Inspection Deadline (20 minutes)

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P0
**Estimated Time:** 30 minutes
