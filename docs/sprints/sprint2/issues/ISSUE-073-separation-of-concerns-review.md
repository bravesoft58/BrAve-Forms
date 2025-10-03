# ISSUE-073: Separation of Concerns Review

**Sprint:** Sprint 2 | **Phase:** 5 - Architecture Review | **Priority:** P0
**Time:** 3 hours | **Complexity:** Medium
**Created:** 2025-10-02
**Dependencies:** All backend work complete

## What You'll Do

Review backend business logic (ensure no UI concerns), review web frontend (ensure API-only, no direct DB access), document service boundaries, create architecture diagram update.

## Step-by-Step Instructions

### Step 1: Backend Code Review (90 min)

Review all backend modules for violations:

**Checklist:**

- [ ] No frontend dependencies (React, Next.js)
- [ ] No direct DOM manipulation
- [ ] Business logic separated from resolvers
- [ ] Services handle all business logic
- [ ] Resolvers only handle GraphQL mapping
- [ ] No UI-specific error messages

Create `docs/architecture/BACKEND_REVIEW.md`:

```markdown
# Backend Separation of Concerns Review

## Module Structure

- **Resolvers**: GraphQL schema mapping only
- **Services**: Business logic
- **Validation**: Zod schemas
- **Guards**: Authentication/authorization

## Violations Found

None (or list violations with fixes)

## Recommendations

- Keep resolvers thin (5-10 lines max)
- All business logic in services
- Reusable validation schemas
```

### Step 2: Frontend Code Review (90 min)

Review web frontend for violations:

**Checklist:**

- [ ] No direct Prisma imports
- [ ] No database queries
- [ ] All data via GraphQL API
- [ ] No backend business logic duplicated
- [ ] State management separated

Create `docs/architecture/FRONTEND_REVIEW.md`.

### Step 3: Create Architecture Diagram (30 min)

Create `docs/architecture/ARCHITECTURE_DIAGRAM.md`:

```markdown
# BrAve Forms Architecture

## System Boundaries
```

┌─────────────────────────────────────┐
│ Frontend (Next.js) │
│ - React Components │
│ - Valtio State │
│ - TanStack Query │
└──────────────┬──────────────────────┘
│ GraphQL
│
┌──────────────▼──────────────────────┐
│ Backend (NestJS + GraphQL) │
│ - Resolvers (thin mapping) │
│ - Services (business logic) │
│ - Validation (Zod schemas) │
└──────────────┬──────────────────────┘
│ Prisma ORM
│
┌──────────────▼──────────────────────┐
│ Database (PostgreSQL 15) │
│ - Multi-tenant (RLS) │
│ - JSONB (dynamic forms) │
└─────────────────────────────────────┘

```

## Service Boundaries

- Frontend: UI rendering, user interaction
- Backend: Business logic, validation, authorization
- Database: Data persistence, RLS enforcement

## Communication

- Frontend ↔ Backend: GraphQL (HTTP/WebSocket)
- Backend ↔ Database: Prisma (connection pooling)
```

## Files to Create

- `docs/architecture/BACKEND_REVIEW.md`
- `docs/architecture/FRONTEND_REVIEW.md`
- `docs/architecture/ARCHITECTURE_DIAGRAM.md`

## Verification Checklist

- [ ] Backend review complete
- [ ] Frontend review complete
- [ ] Service boundaries documented
- [ ] Architecture diagram created

## Time Estimate: 3 hours

## Next Issue

**ISSUE-074:** Resource Limits and Health Checks (2h)
