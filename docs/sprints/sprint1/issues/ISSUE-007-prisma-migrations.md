# ISSUE-007: Run Prisma Migrations in Kubernetes

**Sprint:** Sprint 1 | **Phase:** 1 - Kubernetes Deployment | **Priority:** P0
**Time:** 30 minutes | **Points:** 2 | **Status:** Not Started
**Created:** 2025-09-30 20:22:00 EDT

## What You'll Do

Port-forward to PostgreSQL and run Prisma migrations to create all database tables.

## Step-by-Step

```bash
# Terminal 1: Port forward
kubectl port-forward svc/postgres 5432:5432 -n braveforms

# Terminal 2: Run migrations
cd packages/database
pnpm prisma migrate deploy
psql postgresql://brave:brave_secure_pass@localhost:5432/brave_forms -c "\dt"
```

## Acceptance Criteria

- [ ] Migration `20250904212846_init` applied
- [ ] All 8 tables created (organizations, projects, inspections, etc.)
- [ ] No migration errors

## Evidence

`evidence/ISSUE-007/deployment/tables-created.png`

## Next Issue

ISSUE-008 (Create and Run Seed Script)
