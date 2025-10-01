# ISSUE-046: Run Full Coverage Report

**Sprint:** Sprint 1 | **Phase:** Phase 6 - Test Coverage | **Priority:** P0
**Time:** 15 minutes | **Points:** 1 | **Status:** Not Started
**Created:** 2025-10-01 17:20:00 EDT
**Dependencies:** ISSUE-045 ✅

---

## What You'll Do

Generate and verify 40% overall coverage target met for Sprint 1.

---

## Step-by-Step Instructions

### Prerequisites
- All previous test issues complete (ISSUE-039 through ISSUE-045)

### Steps

1. Run full coverage report:
```bash
pnpm --filter backend test:coverage
```

2. Wait for tests to complete (2-3 minutes)

3. Open coverage report:
```bash
# Windows
start apps/backend/coverage/lcov-report/index.html

# Mac/Linux
open apps/backend/coverage/lcov-report/index.html
```

4. Verify overall coverage metrics:
   - **Target:** Greater than or equal to 40% overall
   - **Weather module:** Greater than or equal to 80% coverage
   - **Organizations module:** Greater than or equal to 80% coverage
   - **Projects module:** Greater than or equal to 80% coverage

5. Screenshot coverage summary page

6. If less than 40% overall:
   - Identify uncovered files in report
   - Add basic tests for critical files
   - Re-run coverage: `pnpm --filter backend test:coverage`

---

## Files to Verify

**Coverage Report Location:**
- `apps/backend/coverage/lcov-report/index.html`

**Check Coverage For:**
- Overall project coverage (>=40%)
- Weather module (>=80%)
- Organizations module (>=80%)
- Projects module (>=80%)

---

## Verification Checklist

- [ ] Coverage report generated successfully
- [ ] Overall coverage greater than or equal to 40%
- [ ] Weather module coverage greater than or equal to 80%
- [ ] Organizations module coverage greater than or equal to 80%
- [ ] Projects module coverage greater than or equal to 80%
- [ ] Evidence collected (screenshots)

---

## Testing Steps

1. Run coverage:
```bash
pnpm --filter backend test:coverage
```

2. Check summary in terminal output

3. Open HTML report for detailed view

4. Navigate through modules to verify coverage

---

## Evidence Requirements

**Location:** `evidence/ISSUE-046/test-results/`

**Required Screenshots:**
1. `coverage-40-percent.png` - Overall coverage summary showing >=40%
2. `weather-module-coverage.png` - Weather module showing >=80%
3. `organizations-coverage.png` - Organizations module showing >=80%
4. `projects-coverage.png` - Projects module showing >=80%

---

## Troubleshooting

**Problem:** Coverage less than 40%
- Identify files with 0% coverage
- Add basic tests for critical paths
- Focus on new Sprint 1 modules first
- Legacy code can have lower coverage temporarily

**Problem:** Weather module less than 80%
- Check all files have spec.ts tests
- Verify integration tests counted
- Add missing test cases

**Problem:** Coverage report not generated
- Check Jest configuration in package.json
- Verify `--coverage` flag is working
- Check for test failures (fix tests first)

**Problem:** HTML report doesn't open
- Check file exists: `ls apps/backend/coverage/lcov-report/index.html`
- Open manually in browser
- Try different browser if rendering issues

---

## Success Criteria

- Coverage report generated successfully
- Overall coverage greater than or equal to 40%
- New modules (Weather, Orgs, Projects) greater than or equal to 80%
- All evidence screenshots collected
- Sprint 1 test coverage goal achieved

---

## Next Steps

**Sprint 1 Complete!** All 46 atomic issues finished.

**Summary:**
- Kubernetes deployment running
- Web builds successfully (Apollo removed)
- NOAA API integration working
- 0.25" threshold detection implemented (EPA CGP compliant)
- Test coverage 40%+ achieved
- PWA configured with offline support

**Next Sprint:** Continue with remaining features per MASTER_SPRINT_ROADMAP_V2

---

**Created By:** Project Manager Agent
**Assigned To:** Junior Developer
**Priority:** P0
**Estimated Time:** 15 minutes
