# ISSUE-008: Create and Run Seed Script

**Sprint:** Sprint 1 | **Phase:** 1 - Kubernetes Deployment | **Priority:** P0
**Time:** 45 minutes | **Points:** 3 | **Status:** Not Started
**Created:** 2025-09-30 20:22:00 EDT

## What You'll Do

Create `seed.ts` file with test data and populate database.

## Step-by-Step

1. Create `apps/backend/prisma/seed.ts`
2. Add 2 organizations (ACME Construction, BuildCo LLC)
3. Add 4 projects (2 per org with GPS coordinates)
4. Run: `pnpm --filter backend seed`
5. Verify in Prisma Studio: `pnpm --filter database studio`

## Acceptance Criteria

- [ ] seed.ts file created
- [ ] 2 organizations seeded
- [ ] 4 projects seeded
- [ ] Data visible in Prisma Studio

## Evidence

`evidence/ISSUE-008/deployment/seeded-data.png`

## Next Issue

ISSUE-009 (Deploy Backend)
