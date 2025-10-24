# ISSUE-092: Simplify Clerk Authentication

**Sprint:** Sprint 3 | **Phase:** 3 - Single-Tenant Simplification | **Priority:** P0
**Time:** 1 hour | **Complexity:** Small
**Created:** 2025-10-23
**Dependencies:** ISSUE-091 (DEFAULT_ORG_ID in use)

## What You'll Do

Disable Clerk Organizations feature in dashboard settings, remove organization-related JWT claims validation, and simplify authentication to userId-only for single-tenant Q&D Construction deployment.

## Prerequisites

- [ ] ISSUE-091 complete (DEFAULT_ORG_ID hard-coded in backend)
- [ ] Clerk Dashboard access (https://dashboard.clerk.com/)
- [ ] Backend accessible at http://localhost:30101/graphql
- [ ] Code editor open to apps/backend/src/common/guards

## Step-by-Step Instructions

### Step 1: Disable Organizations in Clerk Dashboard (15 min)

Login to Clerk Dashboard:

1. Navigate to https://dashboard.clerk.com/
2. Select BrAve Forms application
3. Go to Settings > Organizations
4. Toggle Organizations feature OFF
5. Save changes

**Expected result:** Organizations feature disabled, no org claims in JWT

**Screenshot:** Save Clerk settings page to `evidence/ISSUE-078/deployment/clerk-orgs-disabled.png`

### Step 2: Update ClerkAuthGuard to Remove Org Validation (20 min)

Edit `apps/backend/src/common/guards/clerk-auth.guard.ts`:

**Before:**

```typescript
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
const orgId = payload['o.id'];
if (!orgId) {
  throw new UnauthorizedException('No organization in token');
}
```

**After:**

```typescript
// Single-tenant mode: Always use DEFAULT_ORG_ID
req.user = {
  userId: payload.sub,
  orgId: DEFAULT_ORG_ID, // Hard-coded for Q&D Construction
  role: payload.role || 'MEMBER',
  email: payload.email,
};

// Note: Organizations disabled in Clerk Dashboard
// Multi-tenant migration planned for Sprint 5-6
return true;
```

Remove multi-tenant code path entirely (will re-add in Sprint 5-6).

### Step 3: Verify JWT Claims (10 min)

Test JWT decoding to confirm no org claims:

```bash
# Get JWT token from frontend
# Open browser dev tools > Application > Local Storage
# Copy Clerk JWT token

# Decode JWT (use https://jwt.io or Node.js)
node -e "console.log(JSON.parse(Buffer.from('PASTE_JWT_PAYLOAD_HERE', 'base64').toString()))"
```

**Expected claims:**

```json
{
  "sub": "user_123456",
  "email": "foreman@qdconstruction.com",
  "role": "MEMBER"
}
```

**NOT expected:**

```json
{
  "o.id": "org_qd_default", // Should NOT exist (orgs disabled)
  "o.rol": "ADMIN"
}
```

### Step 4: Update Guard Tests (10 min)

Edit `apps/backend/src/common/guards/__tests__/clerk-auth.guard.spec.ts`:

Remove multi-tenant test cases:

```typescript
describe('ClerkAuthGuard (Single-Tenant)', () => {
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

  // REMOVE THIS TEST (multi-tenant)
  // it('should throw if no organization in token', async () => { ... });
});
```

Run tests:

```bash
pnpm --filter backend test clerk-auth.guard.spec.ts
```

Expected: 3/3 tests passing (multi-tenant test removed)

**Screenshot:** Save test output to `evidence/ISSUE-078/test-results/green-phase.png`

### Step 5: Test Authentication End-to-End (5 min)

```bash
# Restart backend to apply changes
kubectl rollout restart deployment/backend -n braveforms

# Wait for restart
kubectl rollout status deployment/backend -n braveforms

# Test GraphQL query with authentication
curl -X POST http://localhost:30101/graphql \
  -H "Authorization: Bearer YOUR_CLERK_JWT" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ formTemplates { id title orgId } }"}'
```

**Expected response:**

```json
{
  "data": {
    "formTemplates": [
      {
        "id": "template_1",
        "title": "Daily Safety Inspection",
        "orgId": "org_qd_default"
      }
    ]
  }
}
```

All results have `orgId: "org_qd_default"` (hard-coded).

## TDD Workflow (Not Fully Applicable)

This is primarily a configuration change (Clerk Dashboard), but includes test updates.

### Manual Testing:

1. Disable Organizations in Clerk Dashboard
2. Update ClerkAuthGuard code
3. Run unit tests (3/3 passing)
4. Test GraphQL query with real JWT
5. Verify all results filtered to org_qd_default

**Evidence:** Screenshot test results and GraphQL response

## Files to Modify

**Modify:**

- apps/backend/src/common/guards/clerk-auth.guard.ts (remove multi-tenant code)
- apps/backend/src/common/guards/**tests**/clerk-auth.guard.spec.ts (remove multi-tenant test)

**Clerk Dashboard:**

- Settings > Organizations > Disable Organizations

## Verification Checklist

- [ ] Organizations disabled in Clerk Dashboard
- [ ] ClerkAuthGuard simplified (no org claims validation)
- [ ] Multi-tenant code path removed
- [ ] Tests pass (3/3 passing)
- [ ] JWT decoding shows no org claims (o.id, o.rol)
- [ ] GraphQL queries return org_qd_default data
- [ ] Build succeeds
- [ ] Zero emoji in modified files
- [ ] Zero AI branding in commits

## Evidence Requirements

**Location:** evidence/ISSUE-078/

**Required:**

- deployment/
  - clerk-orgs-disabled.png (Clerk Dashboard screenshot)
  - jwt-decoded.png (JWT claims without org)
  - graphql-response.png (query results with org_qd_default)
- test-results/
  - green-phase.png (3/3 tests passing)
- code/
  - clerk-auth-guard-diff.png (git diff showing simplification)

## Troubleshooting

**Problem:** JWT still contains org claims (o.id, o.rol)

- **Cause:** Clerk settings not saved or cached
- **Solution:** Clear browser cache, logout/login to Clerk, generate new JWT

**Problem:** Tests fail with "Cannot read property 'o.id'"

- **Cause:** Old multi-tenant test still checking org claims
- **Solution:** Remove multi-tenant test case, keep only single-tenant tests

**Problem:** GraphQL queries return empty results

- **Cause:** Data belongs to different orgId
- **Solution:** Update data: `UPDATE form_templates SET org_id = 'org_qd_default';`

## Success Criteria

- [ ] Organizations feature disabled in Clerk Dashboard
- [ ] ClerkAuthGuard does not validate org claims
- [ ] All users assigned DEFAULT_ORG_ID automatically
- [ ] JWT contains only userId, email, role (no org claims)
- [ ] Tests pass (3/3 passing)
- [ ] GraphQL queries filtered to org_qd_default
- [ ] Build succeeds

## Time Estimate

**1 hour total:**

- Disable Organizations in Clerk: 15 min
- Update ClerkAuthGuard: 20 min
- Verify JWT claims: 10 min
- Update guard tests: 10 min
- Test end-to-end: 5 min

## Next Issue

**ISSUE-093:** Build FormRenderer Component (4h)

- Prerequisites: Phase 0 complete (single-tenant ready)
- Starts: Phase 1 - Dynamic Form Renderer
- Uses: Simplified authentication for form access
