---
allowed-tools: Bash(pnpm:*), Read, Grep
description: Validate EPA CGP 0.25 inch rule and compliance features
---

Run compliance tests and validate regulatory accuracy:

1. Execute: pnpm test:compliance
2. Search codebase for rain threshold values - verify EXACT 0.25 (not 0.24 or 0.26)
3. Verify 24-hour inspection window logic accounts for working hours
4. Check multi-tenant data isolation in compliance queries
5. Validate audit trail immutability for inspection records

Report any compliance violations immediately with regulatory citations. All compliance features must reference 2022 EPA Construction General Permit Section 4.4.