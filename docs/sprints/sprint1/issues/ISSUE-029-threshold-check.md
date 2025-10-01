# ISSUE-029: Create 0.25" Threshold Check Function

**Sprint:** Sprint 1 | **Phase:** 4 - Weather API | **Priority:** P0 (CRITICAL - EPA)
**Time:** 15 minutes | **Points:** 1 | **Status:** Not Started
**Created:** 2025-10-01 12:00:00 EDT

## What You'll Do

Create function that checks if precipitation meets EPA CGP 0.25" threshold EXACTLY.

## Single Objective

Add ONE function to precipitation utils that returns boolean for EPA threshold.

## CRITICAL COMPLIANCE REQUIREMENT

**EPA CGP 2022 Section 4.4:**
- Inspections required within 24 hours of storm event producing **>= 0.25 inches**
- Threshold must be **EXACTLY 0.25"**, not 0.24" or 0.26"
- Penalty for non-compliance: **$25,000-$50,000 per day**

**This function determines legal compliance. Zero tolerance for errors.**

## Files to Modify

- `apps/backend/src/modules/weather/utils/precipitation.utils.ts` (MODIFY)

## Prerequisites

- ISSUE-028 complete (accumulation function exists)
- File `precipitation.utils.ts` already created

## Step-by-Step Instructions

### Step 1: Open Existing File (1 min)
```bash
code apps/backend/src/modules/weather/utils/precipitation.utils.ts
```

### Step 2: Add Threshold Function (10 min)

Add this function BELOW the `calculate24HourAccumulation` function:

```typescript
/**
 * Check if precipitation meets EPA CGP 0.25" threshold
 *
 * EPA Construction General Permit (CGP) 2022 Section 4.4 requires stormwater
 * inspections within 24 hours of a storm event producing 0.25 inches or more
 * of precipitation.
 *
 * CRITICAL: This threshold must be EXACTLY 0.25 inches, not 0.24" or 0.26".
 * Approximation can result in regulatory violations and fines of $25,000-$50,000
 * per day per violation.
 *
 * @param totalInches - Total precipitation in inches (from calculate24HourAccumulation)
 * @returns true if precipitation >= 0.25 inches (triggers inspection requirement)
 *
 * @see https://www.epa.gov/npdes/stormwater-cgp (EPA CGP 2022 Section 4.4)
 * @see EPA CGP 2022 Section 4.4: "Inspections must be conducted...within 24 hours
 *      following the end of any storm event that produces 0.25 inches or more of
 *      precipitation"
 *
 * @example
 * const precipitation = 0.25; // inches
 * const requiresInspection = meetsEPAThreshold(precipitation);
 * console.log(requiresInspection); // true
 *
 * @example
 * const precipitation = 0.24; // inches
 * const requiresInspection = meetsEPAThreshold(precipitation);
 * console.log(requiresInspection); // false (below threshold)
 */
export function meetsEPAThreshold(totalInches: number): boolean {
  // EPA CGP 2022 Section 4.4: EXACTLY 0.25 inches
  // DO NOT change this value without EPA regulatory approval
  const EPA_CGP_THRESHOLD_INCHES = 0.25;

  return totalInches >= EPA_CGP_THRESHOLD_INCHES;
}
```

### Step 3: Verify Export (1 min)

Ensure function is exported (already done in code above with `export` keyword).

### Step 4: Test Compilation (2 min)

```bash
cd apps/backend
pnpm type-check
```

Expected output:
```
No TypeScript errors found
```

### Step 5: Manual Test (Optional, 1 min)

Add temporary test at bottom of file:
```typescript
// Manual verification (DELETE after testing)
console.log('Test 0.25":', meetsEPAThreshold(0.25)); // Should be true
console.log('Test 0.24":', meetsEPAThreshold(0.24)); // Should be false
console.log('Test 0.26":', meetsEPAThreshold(0.26)); // Should be true
console.log('Test 0.00":', meetsEPAThreshold(0.00)); // Should be false
```

Run:
```bash
npx tsx apps/backend/src/modules/weather/utils/precipitation.utils.ts
```

Verify output:
```
Test 0.25": true
Test 0.24": false
Test 0.26": true
Test 0.00": false
```

**DELETE the test code after verification.**

## Verification Checklist

- [ ] Function added to `precipitation.utils.ts`
- [ ] Function name: `meetsEPAThreshold`
- [ ] Parameter: `totalInches: number`
- [ ] Return type: `boolean`
- [ ] Threshold value: EXACTLY `0.25` (not 0.24 or 0.26)
- [ ] EPA CGP Section 4.4 cited in JSDoc
- [ ] EPA website link included
- [ ] Examples included in JSDoc
- [ ] Regulatory penalty mentioned in comments
- [ ] Function exported
- [ ] TypeScript compiles without errors
- [ ] Manual tests pass (0.25 = true, 0.24 = false)

## Evidence Required

Create folder: `docs/sprints/sprint1/evidence/ISSUE-029/code/`

Collect:
1. Screenshot of function code in VS Code
2. Screenshot showing EPA citation in comments
3. Screenshot of TypeScript compilation success
4. Screenshot of manual test output (if run)

Save as:
- `evidence/ISSUE-029/code/threshold-function.png`
- `evidence/ISSUE-029/code/epa-citation.png`
- `evidence/ISSUE-029/code/compilation-success.png`
- `evidence/ISSUE-029/code/manual-test-output.png` (optional)

## Success Criteria

- [ ] Function uses EXACTLY 0.25 (not approximate)
- [ ] EPA CGP Section 4.4 cited with URL
- [ ] JSDoc includes regulatory context
- [ ] Compiles without errors
- [ ] Evidence collected (3-4 screenshots)

## Time Estimate

**15 minutes total:**
- Open file: 1 min
- Write function: 10 min
- Verify compilation: 2 min
- Collect evidence: 2 min

## Next Issue

ISSUE-030: Create Inspection Deadline Calculator (25 min)
- Prerequisites: This threshold function complete
- Uses: This function to determine if inspection needed

## Notes for Junior Developers

**Why this is CRITICAL:**

This function determines whether a construction company needs to conduct an EPA-required inspection. Getting this wrong means:
- Missed inspections = EPA violations
- Fines: $25,000-$50,000 PER DAY
- Legal liability for construction companies
- Loss of customer trust

**Why EXACTLY 0.25":**

EPA regulations say ">= 0.25 inches", not "approximately 0.25 inches". Using 0.24" or 0.26" could:
- Cause false negatives (miss required inspections)
- Cause false positives (unnecessary inspections)
- Result in regulatory violations

**Common Questions:**

Q: Can I round to 0.25?
A: NO - the value must be EXACTLY 0.25, no rounding

Q: What if precipitation is 0.249999?
A: This is LESS THAN 0.25, so inspection NOT required (returns false)

Q: What about 0.250001?
A: This is GREATER THAN 0.25, so inspection IS required (returns true)

Q: Should I use floating point comparison helpers?
A: NO - simple `>=` operator is correct for EPA compliance

**Test Values:**
- 0.24 inches → false (below threshold)
- 0.25 inches → true (AT threshold, inspection required)
- 0.26 inches → true (above threshold, inspection required)
- 0.00 inches → false (no precipitation)

## Common Mistakes to Avoid

**CRITICAL MISTAKES (Zero Tolerance):**
- Using 0.24 or 0.26 instead of 0.25
- Rounding precipitation values
- Approximating the threshold
- Forgetting EPA citation
- Not testing with EXACT 0.25 value

**Documentation Mistakes:**
- Incomplete JSDoc
- Missing EPA CGP section reference
- No regulatory penalty mention
- Vague description

**Testing Mistakes:**
- Not testing edge case (exactly 0.25)
- Only testing whole numbers
- Skipping manual verification
- Not deleting test code

## Regulatory References

**Primary Source:**
- EPA CGP 2022 Section 4.4
- URL: https://www.epa.gov/npdes/stormwater-cgp
- Full text: "Inspections must be conducted...within 24 hours following the end of any storm event that produces 0.25 inches or more of precipitation"

**Legal Context:**
- Clean Water Act violations
- EPA enforcement actions
- Daily penalties accumulate
- Strict liability (no intent required)

**Construction Industry Impact:**
- Average storm inspection cost: $200-500
- Average EPA fine: $25,000-$50,000 per day
- Risk mitigation: Automated monitoring (this system)

## Code Quality Requirements

**Required in JSDoc:**
- [ ] Function purpose
- [ ] Parameter description with units
- [ ] Return value description
- [ ] EPA CGP 2022 Section 4.4 citation
- [ ] EPA website URL
- [ ] Regulatory penalty mention
- [ ] 2 examples (one true, one false)

**Required in Implementation:**
- [ ] Constant for threshold value (not magic number)
- [ ] Comment explaining EPA requirement
- [ ] Warning against changing value
- [ ] Exact comparison (>=)

**Prohibited:**
- Approximation
- Rounding
- Magic numbers
- Vague comments
- Missing regulatory citations

## Next Steps After Completion

1. Mark issue complete in tracking system
2. Collect all evidence (3-4 screenshots)
3. Move to ISSUE-030 (Inspection Deadline Calculator)
4. Remember: Unit tests coming in ISSUE-031 (this function will be tested there)

## Definition of Done

- [ ] Function implemented with EXACT 0.25" threshold
- [ ] EPA CGP 2022 Section 4.4 cited in code
- [ ] JSDoc complete with examples
- [ ] TypeScript compilation passes
- [ ] Manual test verification complete
- [ ] Test code deleted from file
- [ ] Evidence collected (screenshots)
- [ ] Zero emoji in code
- [ ] Zero AI branding in comments
