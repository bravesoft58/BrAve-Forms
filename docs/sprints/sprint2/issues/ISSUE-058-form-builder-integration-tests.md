# ISSUE-058: Form Builder Integration Tests

**Sprint:** Sprint 2 | **Phase:** 1 - Forms Engine Backend | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-02
**Dependencies:** ISSUE-054 (CRUD complete)

## What You'll Do

Write GraphQL resolver tests with mocked Clerk auth, test multi-tenant isolation (cross-org access fails), and test CRUD operations end-to-end.

## Step-by-Step Instructions

### Step 1: Create Integration Test Suite (60 min)

Create `apps/backend/src/modules/forms/__tests__/form-templates-integration.spec.ts`:

```typescript
describe('Form Templates Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('Multi-Tenant Isolation', () => {
    it('should prevent cross-org template access', async () => {
      // Create template for org_1
      // Attempt to access from org_2
      // Should return null or 404
    });

    it('should filter templates by orgId in list queries', async () => {});
  });

  describe('End-to-End CRUD', () => {
    it('should create, retrieve, update, and delete template', async () => {});
    it('should increment version on field changes', async () => {});
    it('should create version snapshots', async () => {});
  });
});
```

### Step 2: Test GraphQL Queries with Supertest (45 min)

Use supertest to send GraphQL queries to running app and verify responses.

### Step 3: Verify Multi-Tenant Isolation (15 min)

Explicit tests that cross-tenant access attempts fail.

## Files to Create

- `form-templates-integration.spec.ts`

## Verification Checklist

- [ ] Integration tests passing (10+ tests)
- [ ] Multi-tenant isolation verified
- [ ] E2E CRUD workflow tested

## Time Estimate: 2 hours

## Next Issue

**ISSUE-059:** Photo Upload GraphQL Resolver (2h)
