# ISSUE-030: Create Inspection Deadline Calculator

**Sprint:** Sprint 1 | **Phase:** Phase 4 - Weather API | **Priority:** P0
**Time:** 25 minutes | **Points:** 2 | **Status:** Not Started
**Created:** 2025-10-01 16:00:00 EDT
**Dependencies:** ISSUE-029 ✅

---

## What You'll Do

Calculate 24-hour working hours deadline per EPA CGP "during normal working hours" requirement.

---

## Step-by-Step Instructions

### Prerequisites
- ISSUE-029 complete (0.25" threshold check function exists)

### Steps

1. Create `apps/backend/src/modules/weather/utils/inspection.utils.ts`

2. Implement function:
```typescript
/**
 * Calculate inspection deadline per EPA CGP working hours requirement
 *
 * EPA CGP 2022 Section 4.4: Inspections due within 24 hours of storm event
 * "during normal working hours" - if storm occurs on weekend, inspection
 * due on next business day.
 *
 * @param stormEndTime - When storm event ended
 * @param workingHours - Business hours config (default 8am-5pm M-F)
 * @returns Inspection deadline timestamp
 */
export function calculateInspectionDeadline(
  stormEndTime: Date,
  workingHours = { start: 8, end: 17, daysOfWeek: [1, 2, 3, 4, 5] } // M-F, 8am-5pm
): Date {
  const deadline = new Date(stormEndTime);
  let hoursAdded = 0;

  // Add 24 working hours
  while (hoursAdded < 24) {
    deadline.setHours(deadline.getHours() + 1);

    const dayOfWeek = deadline.getDay();
    const hour = deadline.getHours();

    // Check if current time is during working hours
    const isWorkingDay = workingHours.daysOfWeek.includes(dayOfWeek);
    const isWorkingHour = hour >= workingHours.start && hour < workingHours.end;

    if (isWorkingDay && isWorkingHour) {
      hoursAdded++;
    }
  }

  return deadline;
}
```

3. Export function

4. Save file

---

## Files to Create

**New Files:**
- `apps/backend/src/modules/weather/utils/inspection.utils.ts`

---

## Verification Checklist

- [ ] Function created with EPA citation
- [ ] Handles weekend storms (skips to Monday)
- [ ] Working hours logic implemented (8am-5pm M-F)
- [ ] 24-hour working hours calculation correct
- [ ] Returns Date object
- [ ] Function exported
- [ ] EPA CGP Section 4.4 cited in JSDoc
- [ ] File compiles successfully

---

## Testing Steps

1. Run type check: `pnpm --filter backend type-check`
2. Verify function logic handles weekends
3. Check working hours calculation

---

## Evidence Requirements

**Location:** `evidence/ISSUE-030/code/`

**Required Screenshots:**
1. `deadline-calculator.png` - Full function with JSDoc and EPA citation

---

## Troubleshooting

**Problem:** Weekend logic not working
- Day 0 = Sunday, Day 6 = Saturday
- Working days: [1, 2, 3, 4, 5] = Monday-Friday
- Check `daysOfWeek.includes(dayOfWeek)`

**Problem:** Hours accumulation incorrect
- Only increment `hoursAdded` when BOTH conditions true:
  - `isWorkingDay` AND `isWorkingHour`
- Continue loop until `hoursAdded < 24`

**Problem:** Date mutation issues
- Create new Date object: `const deadline = new Date(stormEndTime)`
- Mutate deadline safely with `.setHours()`

---

## Success Criteria

- Function calculates 24 working hours
- Skips weekends correctly
- Respects working hours (8am-5pm)
- Returns accurate deadline
- EPA CGP Section 4.4 cited
- TypeScript compiles without errors
- Evidence collected

---

## Next Issue

**ISSUE-031:** Write Unit Tests for Threshold Detection (30 minutes)

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P0
**Estimated Time:** 25 minutes
