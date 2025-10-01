# ISSUE-017: Implement 0.25" Threshold Detection

**Sprint:** Sprint 1 | **Phase:** 4 - Weather API | **Priority:** P0 (CRITICAL - EPA)
**Time:** 2 hours | **Points:** 5 | **Status:** Not Started
**Created:** 2025-09-30 20:22:00 EDT

## What You'll Do

Implement EXACT 0.25" rain threshold detection (EPA CGP 2022 Section 4.4).

## Step-by-Step

1. Create 24-hour rolling window accumulation
2. Detect EXACTLY 0.25" (not 0.24" or 0.26")
3. Calculate inspection deadline (24hr working hours)
4. Add EPA citation in code comments
5. Write tests for exact threshold

## Acceptance Criteria

- [ ] 24-hour accumulation working
- [ ] EXACTLY 0.25" threshold (tested)
- [ ] Inspection deadline calculated
- [ ] EPA CGP Section 4.4 cited in code

## Evidence

`evidence/ISSUE-017/compliance/025-threshold-proof.png`
