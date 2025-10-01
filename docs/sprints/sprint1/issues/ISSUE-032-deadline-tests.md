# ISSUE-032: Write Unit Tests for Inspection Deadline

**Sprint:** Sprint 1 | **Phase:** Phase 4 - Weather API | **Priority:** P0
**Time:** 20 minutes | **Points:** 2 | **Status:** Not Started
**Created:** 2025-10-01 16:10:00 EDT
**Dependencies:** ISSUE-031 ✅

---

## What You'll Do

Test weekend/working hours logic for inspection deadline calculator.

---

## Step-by-Step Instructions

### Prerequisites
- ISSUE-030 complete (deadline calculator function)

### Steps

1. Create `apps/backend/src/modules/weather/utils/inspection.utils.spec.ts`

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

  it('should respect working hours 8am-5pm', () => {
    // Storm ends Friday 4pm
    const stormEnd = new Date('2025-10-03T16:00:00'); // Friday 4pm
    const deadline = calculateInspectionDeadline(stormEnd);

    // Should not count non-working hours (5pm-8am, weekends)
    expect(deadline.getDay()).toBeGreaterThan(0); // Not Sunday
    expect(deadline.getDay()).toBeLessThan(6); // Not Saturday
  });
});
```

3. Run tests: `pnpm --filter backend test inspection.utils.spec.ts`

4. Screenshot passing tests

---

## Files to Create

**New Files:**
- `apps/backend/src/modules/weather/utils/inspection.utils.spec.ts`

---

## Verification Checklist

- [ ] Test file created
- [ ] Tests verify working hours logic
- [ ] Tests verify weekend handling
- [ ] Tests verify 24-hour calculation
- [ ] All tests pass
- [ ] Evidence collected

---

## Testing Steps

1. Run tests: `pnpm --filter backend test inspection.utils.spec.ts`
2. Verify all tests pass
3. Check edge cases (Friday PM, Monday AM)

---

## Evidence Requirements

**Location:** `evidence/ISSUE-032/test-results/`

**Required Screenshots:**
1. `deadline-tests-passing.png` - Terminal showing all tests green

---

## Troubleshooting

**Problem:** Date math incorrect
- Use specific dates for reproducible tests
- Day 0 = Sunday, Day 1 = Monday, Day 6 = Saturday

**Problem:** Working hours test fails
- Verify function counts only 8am-5pm hours
- Check weekend days are skipped (Saturday=6, Sunday=0)

**Problem:** Tests timeout
- Date calculations should be fast (<1ms)
- Check for infinite loops in deadline calculator

---

## Success Criteria

- All tests pass
- Tests verify 24 working hours
- Tests verify weekend skipping
- Tests verify working hours (8am-5pm M-F)
- Coverage >80% for inspection.utils.ts
- Evidence collected

---

## Next Issue

**ISSUE-033:** Add Redis Caching to Weather Service (30 minutes)

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P0
**Estimated Time:** 20 minutes
