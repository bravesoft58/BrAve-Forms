---
allowed-tools: Read, Grep, WebSearch
argument-hint: <feature-name>
description: Validate compliance feature against EPA CGP requirements
---

Deep validation of compliance feature: $ARGUMENTS

1. Search codebase for rain threshold values
   - Verify EXACT 0.25 inch (not 0.24, 0.249, 0.26)
   - Check for proper decimal handling
2. Verify 24-hour inspection window logic
   - Accounts for "normal working hours" definition
   - Weekend storm = Monday inspection
   - Multiple storm accumulation within 24 hours
3. Check sensitive water 7-day + 24-hour logic
4. Verify audit trail immutability
   - No UPDATE after submission
   - All changes create new records
5. Validate multi-tenant isolation in compliance queries
6. Check regulatory citations in comments/docs

Cross-reference implementation with 2022 EPA Construction General Permit Section 4.4.

Report ANY inaccuracies immediately - compliance errors = $25,000-$50,000 daily fines.