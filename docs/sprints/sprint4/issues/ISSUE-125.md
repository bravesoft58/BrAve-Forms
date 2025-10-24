# ISSUE-125: Security Audit & Penetration Testing

**Sprint:** Sprint 4 | **Phase:** 3 - Testing & Polish | **Priority:** P0
**Time:** 3 hours | **Complexity:** Medium
**Created:** 2025-10-23
**Dependencies:** ISSUE-124 (performance optimized)
**Status:** NOT STARTED

## What You'll Do

Test authentication bypass attempts, SQL injection (GraphQL query injection), XSS attacks, CSRF protection, rate limiting, file upload security, and multi-tenant data isolation.

## Prerequisites

- [ ] ISSUE-124 complete
- [ ] Security testing tools available (OWASP ZAP, Burp Suite, or manual)

## Step-by-Step Instructions

### Step 1: Create Security Test Suite (2h)

Create: `apps/backend/src/__tests__/security/penetration.spec.ts`

```typescript
describe('Security Penetration Tests', () => {
  describe('Authentication Bypass', () => {
    it('should reject expired QR tokens', async () => {
      const expiredToken = generateExpiredToken();
      const response = await request(app)
        .get('/inspector/submissions')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(response.status).toBe(401);
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should sanitize GraphQL inputs', async () => {
      const maliciousInput = "'; DROP TABLE form_submissions; --";
      const response = await request(app)
        .post('/graphql')
        .send({
          query: createSubmissionMutation,
          variables: { data: { field1: maliciousInput } },
        });
      expect(response.status).toBe(200);
      const count = await prisma.formSubmission.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('XSS Prevention', () => {
    it('should escape HTML in form field values', async () => {
      const xssInput = '<script>alert("XSS")</script>';
      await createSubmission({ field1: xssInput });
      const submission = await findSubmission(id);
      expect(submission.data.field1).toBe(xssInput);
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('should prevent cross-org data access', async () => {
      const org1Template = await createTemplate({ orgId: 'org1' });
      const org2User = { userId: 'user2', orgId: 'org2' };
      const response = await request(app)
        .post('/graphql')
        .send({
          query: getTemplateQuery,
          variables: { id: org1Template.id },
        })
        .set('Authorization', `Bearer ${generateTokenFor(org2User)}`);
      expect(response.body.data.formTemplate).toBeNull();
    });
  });
});
```

### Step 2: Run Security Tests (45 min)

```bash
cd apps/backend
pnpm test:security
```

### Step 3: Document Findings (15 min)

Create: `docs/sprints/sprint4/SECURITY_AUDIT.md`

## Files Created

- apps/backend/src/**tests**/security/penetration.spec.ts
- docs/sprints/sprint4/SECURITY_AUDIT.md
- evidence/ISSUE-125/ (test results)

## Success Criteria

- [ ] Authentication bypass tests passing
- [ ] SQL injection tests passing
- [ ] XSS prevention tests passing
- [ ] Multi-tenant isolation tests passing
- [ ] Security audit report complete

## Time Estimate: 3 hours

## Next Issue

**ISSUE-126:** Load Testing & Stress Testing (2h)
