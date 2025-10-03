# ISSUE-068: Submission Workflow Tests

**Sprint:** Sprint 2 | **Phase:** 3 - Form Submission Workflow | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-02
**Dependencies:** ISSUE-067 (workflow complete)

## What You'll Do

Test state machine transitions, required field validation, approval workflow, and multi-tenant isolation.

## Step-by-Step Instructions

### Step 1: Create Workflow Test Suite (90 min)

Create `apps/backend/src/modules/submissions/__tests__/submission-workflow.spec.ts`:

```typescript
describe('Form Submission Workflow', () => {
  describe('State Machine', () => {
    it('should allow draft → in_progress transition', () => {});
    it('should allow draft → submitted transition', () => {});
    it('should prevent submitted → draft transition', () => {});
    it('should allow submitted → approved transition', () => {});
    it('should allow submitted → rejected transition', () => {});
    it('should allow rejected → draft transition', () => {});
    it('should prevent approved → any transition (final state)', () => {});
  });

  describe('Required Field Validation', () => {
    it('should prevent submission with missing required fields', () => {});
    it('should allow draft with missing required fields', () => {});
    it('should validate field types (number, date, etc.)', () => {});
  });

  describe('Approval Workflow', () => {
    it('should approve submitted forms', () => {});
    it('should reject submitted forms with notes', () => {});
    it('should prevent approval of non-submitted forms', () => {});
    it('should track approver and timestamp', () => {});
  });

  describe('Multi-Tenant Isolation', () => {
    it('should filter submissions by orgId', () => {});
    it('should prevent cross-org submission access', () => {});
  });
});
```

### Step 2: Run Tests (15 min)

### Step 3: Verify Coverage (15 min)

## Time Estimate: 2 hours

## Next Issue

**ISSUE-069:** Template Storage System (2h)
