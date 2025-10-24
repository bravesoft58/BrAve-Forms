# ISSUE-091: Hard-Code Default Organization ID

**Sprint:** Sprint 3 | **Phase:** 3 - Single-Tenant Simplification | **Priority:** P0
**Time:** 2 hours | **Complexity:** Medium
**Created:** 2025-10-23
**Dependencies:** ISSUE-090 (UI removal complete)

## What You'll Do

Hard-code DEFAULT_ORG_ID = 'org_qd_default' in backend constants, update all GraphQL resolvers to use default org, update frontend API helpers, and seed default organization in database.

## Prerequisites

- [ ] ISSUE-090 complete (org UI removed)
- [ ] Backend accessible at http://localhost:30101/graphql
- [ ] PostgreSQL accessible via port-forward
- [ ] Prisma CLI available

## Step-by-Step Instructions

### Step 1: Create Default Organization Constant (15 min)

Create `apps/backend/src/common/constants.ts`:

```typescript
/**
 * Default Organization for Single-Tenant Deployment
 * Q&D Construction (First Customer)
 *
 * Sprint 3: Single-tenant simplification
 * Sprint 5-6: Will migrate to full multi-tenancy
 */
export const DEFAULT_ORG_ID = 'org_qd_default';
export const DEFAULT_ORG_NAME = 'Q&D Construction';
export const DEFAULT_ORG_SLUG = 'qd-construction';

/**
 * Single-Tenant Mode Flag
 * Set to false in Sprint 5-6 for multi-tenant migration
 */
export const IS_SINGLE_TENANT = true;
```

### Step 2: Update ClerkAuthGuard to Use Default Org (30 min)

Edit `apps/backend/src/common/guards/clerk-auth.guard.ts`:

```typescript
import { DEFAULT_ORG_ID, IS_SINGLE_TENANT } from '../constants';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlContext = GqlExecutionContext.create(context);
    const { req } = gqlContext.getContext();

    // Extract JWT from Authorization header
    const token = this.extractToken(req);
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    // Verify JWT with Clerk
    const payload = await this.verifyClerkToken(token);

    // Single-tenant mode: Use default org
    if (IS_SINGLE_TENANT) {
      req.user = {
        userId: payload.sub,
        orgId: DEFAULT_ORG_ID, // Hard-coded
        role: payload.role || 'MEMBER',
        email: payload.email,
      };
      return true;
    }

    // Multi-tenant mode (Sprint 5-6)
    // Extract orgId from JWT claims (o.id)
    const orgId = payload['o.id'];
    if (!orgId) {
      throw new UnauthorizedException('No organization in token');
    }

    req.user = {
      userId: payload.sub,
      orgId: orgId,
      role: payload['o.rol'] || 'MEMBER',
      email: payload.email,
    };

    return true;
  }
}
```

### Step 3: Update All Resolvers to Use Default Org (30 min)

Search for all resolvers using orgId:

```bash
cd apps/backend/src
grep -r "orgId" --include="*.resolver.ts"
```

**Update pattern for all resolvers:**

```typescript
// Before (Sprint 2)
@Query(() => [FormTemplate])
async formTemplates(@CurrentUser() user: CurrentUser) {
  return this.formsService.findByOrgId(user.orgId);
}

// After (Sprint 3 - same, but user.orgId now hard-coded to DEFAULT_ORG_ID)
// No code change needed - ClerkAuthGuard injects DEFAULT_ORG_ID
```

**Verify resolvers using @CurrentUser() decorator:**

- apps/backend/src/modules/forms/forms.resolver.ts
- apps/backend/src/modules/photos/photos.resolver.ts
- apps/backend/src/modules/submissions/submissions.resolver.ts
- apps/backend/src/modules/projects/projects.resolver.ts (if exists)

### Step 4: Update Frontend API Helpers (20 min)

Edit `apps/web/lib/api-client.ts` (or equivalent):

```typescript
/**
 * API Client Configuration for Single-Tenant Mode
 */
import { DEFAULT_ORG_ID } from '@brave-forms/types';

export const getApiHeaders = () => {
  return {
    Authorization: `Bearer ${getClerkToken()}`,
    'Content-Type': 'application/json',
    // No org header needed - backend uses DEFAULT_ORG_ID
  };
};

// Remove any org context hooks
// export const useOrganization = () => ... // DELETE THIS
```

### Step 5: Seed Default Organization in Database (25 min)

Create `apps/backend/src/seeds/default-org.seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { DEFAULT_ORG_ID, DEFAULT_ORG_NAME, DEFAULT_ORG_SLUG } from '../common/constants';

const prisma = new PrismaClient();

async function seedDefaultOrganization() {
  console.log('Seeding default organization for Q&D Construction...');

  // Check if organization exists
  const existing = await prisma.organization.findUnique({
    where: { id: DEFAULT_ORG_ID },
  });

  if (existing) {
    console.log('Default organization already exists:', existing.name);
    return;
  }

  // Create default organization
  const org = await prisma.organization.create({
    data: {
      id: DEFAULT_ORG_ID,
      name: DEFAULT_ORG_NAME,
      slug: DEFAULT_ORG_SLUG,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('Created default organization:', org.name);
}

seedDefaultOrganization()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run seed script:

```bash
cd apps/backend
ts-node src/seeds/default-org.seed.ts
```

Expected output:

```
Seeding default organization for Q&D Construction...
Created default organization: Q&D Construction
```

## TDD Workflow (MANDATORY)

### Phase 1: Write Tests First (Red Phase)

Create `apps/backend/src/common/guards/__tests__/clerk-auth.guard.spec.ts`:

```typescript
import { ClerkAuthGuard } from '../clerk-auth.guard';
import { DEFAULT_ORG_ID } from '../../constants';

describe('ClerkAuthGuard (Single-Tenant)', () => {
  let guard: ClerkAuthGuard;

  beforeEach(() => {
    guard = new ClerkAuthGuard();
  });

  it('should inject DEFAULT_ORG_ID for all users', async () => {
    const mockContext = createMockContext({
      token: 'valid-jwt-token',
    });

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(true);
    expect(mockContext.getContext().req.user.orgId).toBe(DEFAULT_ORG_ID);
  });

  it('should extract userId from JWT', async () => {
    const mockContext = createMockContext({
      token: 'valid-jwt-token',
      userId: 'user_123',
    });

    await guard.canActivate(mockContext);

    expect(mockContext.getContext().req.user.userId).toBe('user_123');
  });

  it('should throw UnauthorizedException if no token', async () => {
    const mockContext = createMockContext({ token: null });

    await expect(guard.canActivate(mockContext)).rejects.toThrow('No token provided');
  });
});
```

Run tests (should FAIL - red phase):

```bash
pnpm --filter backend test clerk-auth.guard.spec.ts
```

Expected: Tests fail (guard not updated yet)

**Screenshot:** Save failing test output to `evidence/ISSUE-077/test-results/red-phase.png`

### Phase 2: Implement Code (Green Phase)

Implement changes from Steps 1-5 above.

Run tests again:

```bash
pnpm --filter backend test clerk-auth.guard.spec.ts
```

Expected: All tests pass

**Screenshot:** Save passing test output to `evidence/ISSUE-077/test-results/green-phase.png`

## Files to Create/Modify

**Create:**

- apps/backend/src/common/constants.ts
- apps/backend/src/seeds/default-org.seed.ts
- apps/backend/src/common/guards/**tests**/clerk-auth.guard.spec.ts

**Modify:**

- apps/backend/src/common/guards/clerk-auth.guard.ts
- apps/web/lib/api-client.ts (remove org context)
- packages/types/src/index.ts (export DEFAULT_ORG_ID constant)

## Verification Checklist

- [ ] DEFAULT_ORG_ID constant created
- [ ] ClerkAuthGuard injects DEFAULT_ORG_ID
- [ ] All resolvers use @CurrentUser() (no changes needed)
- [ ] Frontend API client updated (no org header)
- [ ] Default organization seeded in database
- [ ] Tests pass (3/3 passing)
- [ ] Build succeeds
- [ ] Zero emoji
- [ ] Zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-077/

**Required:**

- test-results/
  - red-phase.png (failing tests)
  - green-phase.png (passing tests)
- code/
  - constants-file.png (constants.ts code)
  - clerk-auth-guard-diff.png (git diff)
- deployment/
  - org-seeded.png (database query showing org_qd_default)
  - graphql-test.png (query with DEFAULT_ORG_ID)

## Troubleshooting

**Problem:** Tests fail with "Cannot find module '@brave-forms/types'"

- **Cause:** Path alias not configured
- **Solution:** Add to jest.config.js: `moduleNameMapper: { '@brave-forms/types': '<rootDir>/../../packages/types/src' }`

**Problem:** Database seed fails with unique constraint

- **Cause:** Organization already exists
- **Solution:** Expected behavior - seed is idempotent

**Problem:** GraphQL queries return empty results

- **Cause:** Data belongs to different orgId
- **Solution:** Update existing data: `UPDATE form_templates SET org_id = 'org_qd_default';`

## Success Criteria

- [ ] DEFAULT_ORG_ID constant exists and exported
- [ ] ClerkAuthGuard injects 'org_qd_default' for all users
- [ ] Default organization exists in database
- [ ] All GraphQL queries filtered to org_qd_default
- [ ] Frontend API client doesn't send org header
- [ ] Tests pass (3/3 passing)
- [ ] Build succeeds

## Time Estimate

**2 hours total:**

- Create constants file: 15 min
- Update ClerkAuthGuard: 30 min
- Verify resolvers: 30 min
- Update frontend API: 20 min
- Seed organization: 25 min

## Next Issue

**ISSUE-092:** Simplify Clerk Authentication (1h)

- Prerequisites: This issue complete (DEFAULT_ORG_ID in use)
- Uses: Hard-coded orgId to disable Organizations feature
