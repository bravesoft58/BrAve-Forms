# ISSUE-175: Project Creation Bug - Spinner Never Completes

**Sprint:** Sprint 7 | **Phase:** 0 - Critical Blockers | **Priority:** P0
**Time:** 4 hours | **Complexity:** Medium
**Created:** 2025-12-15
**Completed:** 2025-12-15
**Dependencies:** None
**Status:** COMPLETE

---

## Problem

From Andy's QA Review (December 10, 2025):

> "After filling out the form and clicking 'Create Project,' the button shows a spinning animation but the project is never created or listed. The only available action is to cancel."

This is a critical blocker - users cannot create projects, which means they cannot use the entire application.

---

## Root Cause (ACTUAL)

**Primary Issue:** NestJS ValidationPipe with `forbidNonWhitelisted: true` rejected all project creation requests.

The `CreateProjectInput` class had GraphQL `@Field()` decorators but NO class-validator decorators. When ValidationPipe processes input with `forbidNonWhitelisted: true`, properties without class-validator decorators are treated as "non-whitelisted" and the request is rejected with 400 Bad Request.

**Secondary Issue:** Role case mismatch - Clerk JWT returned lowercase roles (`owner`, `admin`) but `ROLE_HIERARCHY` used uppercase (`OWNER`, `ADMIN`), causing permission checks to fail.

**Execution Flow:**

1. Auth guard passed (ClerkAuthGuard)
2. RolesGuard passed (ROLE_ACCESS_GRANTED logged)
3. ValidationPipe FAILED (no log, silent 400 Bad Request)
4. Resolver never executed

---

## Solution Applied

### Backend Fixes

**1. Added class-validator decorators to CreateProjectInput:**

```typescript
// apps/backend/src/modules/projects/projects.resolver.ts
import { IsString, IsNumber, IsOptional, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class CreateProjectInput {
  @Field()
  @IsString()
  name: string;

  @Field()
  @IsString()
  address: string;

  @Field()
  @IsNumber()
  latitude: number;

  @Field()
  @IsNumber()
  longitude: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  permitNumber?: string;

  @Field()
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Field({ nullable: true })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endDate?: Date;

  @Field()
  @IsNumber()
  @Min(0)
  disturbedAcres: number;
}
```

**2. Fixed role case normalization in clerk.strategy.ts:**

```typescript
// Normalize role to uppercase to match ROLE_HIERARCHY
const normalizedRole = rawRole.toUpperCase();
```

### Frontend Fixes

- Added latitude, longitude, disturbedAcres fields to project form
- Added proper error notifications on mutation failure
- Added success notification on project creation
- Fixed date format for GraphQL (ISO string)

---

## Tasks

### Backend

- [x] Add detailed logging to createProject resolver
- [x] Verify CreateProjectInput DTO has all required fields
- [x] Check database constraints on projects table
- [x] Verify orgId is properly injected from user context
- [x] Add proper error responses with helpful messages
- [x] Add class-validator decorators to whitelist input properties
- [x] Fix role case mismatch (lowercase JWT vs uppercase ROLE_HIERARCHY)

### Frontend

- [x] Add try-catch error handling to form submission
- [x] Display error messages to user (not just spinner)
- [x] Add console logging for debugging
- [x] Verify mutation returns expected response shape
- [x] Add missing form fields (latitude, longitude, disturbedAcres)

### Testing

- [x] Manual test: successful project creation (Golden Valley Park)
- [x] Verify project appears in database with correct org_id

---

## Acceptance Criteria

- [x] Project creation completes successfully (no infinite spinner)
- [x] New project appears in projects list
- [x] Error messages displayed when creation fails
- [x] Loading state managed properly (shown during request only)

---

## Evidence

### Commit

- **Hash:** `de8fe7a`
- **Message:** `fix(projects): resolve project creation bug with infinite spinner`
- **Files Changed:** 13 files, +447/-282 lines

### Database Verification

```sql
SELECT id, name, org_id, status, created_at FROM projects
WHERE id = 'fe6c405e-ec4a-4c44-9a07-84ac88832533';

                  id                  |        name        |                org_id                | status |       created_at
--------------------------------------+--------------------+--------------------------------------+--------+-------------------------
 fe6c405e-ec4a-4c44-9a07-84ac88832533 | Golden Valley Park | 1d1e2121-cfd7-4784-bd5a-d86439c9b793 | ACTIVE | 2025-12-15 15:35:38.824
```

### Organization Assignment

```sql
SELECT id, clerk_org_id, name, plan FROM organizations
WHERE id = '1d1e2121-cfd7-4784-bd5a-d86439c9b793';

                  id                  |  clerk_org_id  |       name        |     plan
--------------------------------------+----------------+-------------------+--------------
 1d1e2121-cfd7-4784-bd5a-d86439c9b793 | org_qd_default | ACME Construction | PROFESSIONAL
```

---

## Related Issues

- ISSUE-194: Project User Assignment (depends on projects working) - NOW UNBLOCKED
- ISSUE-195: Project Form Assignment (depends on projects working) - NOW UNBLOCKED
- ISSUE-196: Project-Centric Workflow (depends on projects working) - NOW UNBLOCKED
