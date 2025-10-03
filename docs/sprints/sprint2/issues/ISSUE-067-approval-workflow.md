# ISSUE-067: Approval Workflow

**Sprint:** Sprint 2 | **Phase:** 3 - Form Submission Workflow | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-02
**Dependencies:** ISSUE-066 (CRUD working)

## What You'll Do

Add approveFormSubmission and rejectFormSubmission mutations, implement status transition logic (submitted → approved/rejected), add approval comments/notes.

## Step-by-Step Instructions

### Step 1: Add Approval Methods to Service (60 min)

Update `form-submissions.service.ts`:

```typescript
async approve(
  id: string,
  orgId: string,
  userId: string,
): Promise<FormSubmission> {
  const submission = await this.prisma.formSubmission.findFirst({
    where: { id, orgId },
  });

  if (!submission) {
    throw new NotFoundException('Form submission not found');
  }

  if (submission.status !== FormSubmissionStatus.SUBMITTED) {
    throw new BadRequestException('Only submitted forms can be approved');
  }

  return this.prisma.formSubmission.update({
    where: { id },
    data: {
      status: FormSubmissionStatus.APPROVED,
      approvedAt: new Date(),
      approvedBy: userId,
    },
  });
}

async reject(
  id: string,
  notes: string,
  orgId: string,
  userId: string,
): Promise<FormSubmission> {
  const submission = await this.prisma.formSubmission.findFirst({
    where: { id, orgId },
  });

  if (!submission) {
    throw new NotFoundException('Form submission not found');
  }

  if (submission.status !== FormSubmissionStatus.SUBMITTED) {
    throw new BadRequestException('Only submitted forms can be rejected');
  }

  return this.prisma.formSubmission.update({
    where: { id },
    data: {
      status: FormSubmissionStatus.REJECTED,
      rejectionNotes: notes,
      approvedAt: new Date(), // Track rejection time
      approvedBy: userId, // Track who rejected
    },
  });
}
```

### Step 2: Add Mutations to Resolver (30 min)

```typescript
@Mutation(() => FormSubmission)
async approveFormSubmission(
  @Args('id', { type: () => ID }) id: string,
  @CurrentUser() user: ClerkUser,
): Promise<FormSubmission> {
  return this.submissionsService.approve(id, user.orgId, user.userId);
}

@Mutation(() => FormSubmission)
async rejectFormSubmission(
  @Args('id', { type: () => ID }) id: string,
  @Args('notes') notes: string,
  @CurrentUser() user: ClerkUser,
): Promise<FormSubmission> {
  return this.submissionsService.reject(id, notes, user.orgId, user.userId);
}
```

### Step 3: Test Approval Flow (30 min)

```graphql
mutation ApproveSubmission {
  approveFormSubmission(id: "clXXXXXXXX") {
    id
    status
    approvedAt
    approvedBy
  }
}

mutation RejectSubmission {
  rejectFormSubmission(id: "clYYYYYYYY", notes: "Missing required photo") {
    id
    status
    rejectionNotes
  }
}
```

## Files to Modify

- `form-submissions.service.ts` (add approve/reject methods)
- `form-submissions.resolver.ts` (add mutations)

## Verification Checklist

- [x] approveFormSubmission mutation implemented
- [x] rejectFormSubmission mutation implemented
- [x] Status transition logic enforced
- [x] Rejection notes validation working
- [x] Type-check passing
- [x] Build successful

## Status: COMPLETE (2025-10-03)

**Evidence:** [COMPLETION-REPORT.md](../evidence/ISSUE-067/COMPLETION-REPORT.md)

**Time Spent:** 2 hours (matches estimate)

**Summary:** Added approve() and reject() methods to FormSubmissionsService with status validation and audit trail tracking. Created GraphQL mutations with ClerkAuthGuard authentication. All quality gates passing.

## Time Estimate: 2 hours

## Next Issue

**ISSUE-068:** Submission Workflow Tests (2h)
