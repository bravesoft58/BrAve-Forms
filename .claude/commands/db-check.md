---
allowed-tools: Bash(pnpm:*), Read, Grep
description: Verify Prisma schema follows multi-tenancy and RLS patterns
---

Validate database schema for multi-tenancy and security:

1. Read Prisma schema file(s)
2. Check all tenant-scoped tables have orgId field
3. Search for PostgreSQL RLS policy files/migrations
4. Verify indexes exist on orgId for performance
5. Check JSONB fields for dynamic form data
6. Verify NO cascade deletes that could break tenant isolation
7. Check TimescaleDB usage for time-series data (weather, logs)
8. Verify audit trail tables have proper immutability (no UPDATE)

Report violations with:
- Table name and issue
- Security impact (tenant isolation, data leakage)
- Recommended fix with example

Multi-tenancy violations are CRITICAL - every table must enforce tenant isolation.