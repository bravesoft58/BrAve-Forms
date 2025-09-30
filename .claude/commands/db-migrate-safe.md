---
allowed-tools: Bash(pnpm:*), Read
description: Create and validate database migration safely
---

Create and validate database migration:

1. Generate Prisma migration: pnpm db:generate
2. Locate and read the generated SQL migration file
3. Review migration SQL for:
   - RLS policy updates (if tenant-scoped table changes)
   - No data loss (check DROP statements)
   - Backwards compatibility (additive changes preferred)
   - Index impact on performance (large tables)
   - No breaking changes to existing queries
4. Verify Prisma schema matches migration
5. Present migration plan to Developer

DO NOT run migration (pnpm db:migrate) without Developer approval.

Provide rollback plan:
- How to reverse migration
- Data recovery strategy if needed
- Impact on running application