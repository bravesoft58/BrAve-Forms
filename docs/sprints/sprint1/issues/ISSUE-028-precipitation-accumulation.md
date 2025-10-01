# ISSUE-028: Create Precipitation Accumulation Function

**Sprint:** Sprint 1 | **Phase:** Phase 4 - Weather API | **Priority:** P0
**Time:** 20 minutes | **Points:** 2 | **Status:** Not Started
**Created:** 2025-10-01 15:55:00 EDT
**Dependencies:** ISSUE-027 ✅

---

## What You'll Do

Calculate 24-hour rolling window precipitation accumulation per EPA CGP requirements.

---

## Step-by-Step Instructions

### Prerequisites
- ISSUE-027 complete (NOAA client tested)

### Steps

1. Create `apps/backend/src/modules/weather/utils/` directory:
```bash
mkdir -p apps/backend/src/modules/weather/utils
```

2. Create `precipitation.utils.ts` file

3. Implement function:
```typescript
import { PrecipitationData } from '../types/noaa.types';

/**
 * Calculate 24-hour rolling window precipitation accumulation
 *
 * @param data - Array of precipitation readings
 * @param windowHours - Accumulation window (default 24 hours per EPA CGP)
 * @returns Total precipitation in inches within window
 */
export function calculate24HourAccumulation(
  data: PrecipitationData[],
  windowHours: number = 24
): number {
  // Sort by timestamp descending (newest first)
  const sorted = [...data].sort((a, b) =>
    b.timestamp.getTime() - a.timestamp.getTime()
  );

  if (sorted.length === 0) return 0;

  // Calculate window end time
  const latestTime = sorted[0].timestamp;
  const windowStart = new Date(latestTime.getTime() - windowHours * 60 * 60 * 1000);

  // Sum precipitation within window
  return sorted
    .filter(reading => reading.timestamp >= windowStart)
    .reduce((sum, reading) => sum + reading.amountInches, 0);
}
```

4. Export function

5. Save file

---

## Files to Create

**New Files:**
- `apps/backend/src/modules/weather/utils/precipitation.utils.ts`

---

## Verification Checklist

- [ ] Utils directory created
- [ ] Function created with EPA citation in JSDoc
- [ ] 24-hour window logic implemented
- [ ] Sorts data by timestamp (newest first)
- [ ] Filters data within window
- [ ] Sums precipitation in inches
- [ ] Returns number (total inches)
- [ ] Handles empty array (returns 0)
- [ ] Function exported
- [ ] File compiles successfully

---

## Testing Steps

1. Run type check: `pnpm --filter backend type-check`
2. Verify function signature is correct
3. Check logic handles edge cases

---

## Evidence Requirements

**Location:** `evidence/ISSUE-028/code/`

**Required Screenshots:**
1. `accumulation-function.png` - Full function implementation with JSDoc

---

## Troubleshooting

**Problem:** Type errors on PrecipitationData
- Check import: `import { PrecipitationData } from '../types/noaa.types';`
- Verify PrecipitationData interface exists

**Problem:** Date math errors
- Use `.getTime()` to convert Date to milliseconds
- 1 hour = 60 * 60 * 1000 milliseconds

**Problem:** Sort not working
- Use spread operator `[...data]` to avoid mutating input
- Compare timestamps: `b.timestamp.getTime() - a.timestamp.getTime()`

---

## Success Criteria

- Function calculates 24-hour rolling window
- Sorts data correctly (newest first)
- Filters data within window
- Sums precipitation accurately
- Handles empty arrays
- JSDoc includes EPA reference
- TypeScript compiles without errors
- Evidence collected

---

## Next Issue

**ISSUE-030:** Create Inspection Deadline Calculator (25 minutes)

Note: ISSUE-029 already exists (0.25" threshold check)

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P0
**Estimated Time:** 20 minutes
