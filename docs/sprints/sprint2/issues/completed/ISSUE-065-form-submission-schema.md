# ISSUE-065: Form Submission Schema Design

**STATUS:** COMPLETE
**Completed:** 2025-10-03
**Evidence:** [COMPLETION-REPORT.md](../../evidence/ISSUE-065/COMPLETION-REPORT.md)

**Sprint:** Sprint 2 | **Phase:** 3 - Form Submission Workflow | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-02
**Dependencies:** ISSUE-051 (form_templates exists)

## What You'll Do

Create form_submissions table with JSONB data column, add status ENUM (draft, in_progress, submitted, approved, rejected), add audit trail columns, and run migration.

## Step-by-Step Instructions

### Step 1: Expand Form Submissions Schema (45 min)

Already defined in ISSUE-051, verify schema exists:

```prisma
model FormSubmission {
  id             String       @id @default(uuid())
  orgId          String       @map("org_id")
  templateId     String       @map("template_id")
  template       FormTemplate @relation(fields: [templateId], references: [id])

  data           Json         // Field ID → field value
  status         String       // "draft", "in_progress", "submitted", "approved", "rejected"

  submittedAt    DateTime?    @map("submitted_at")
  submittedBy    String?      @map("submitted_by")
  approvedAt     DateTime?    @map("approved_at")
  approvedBy     String?      @map("approved_by")
  rejectionNotes String?      @map("rejection_notes")

  createdAt      DateTime     @default(now()) @map("created_at")
  updatedAt      DateTime     @updatedAt @map("updated_at")

  @@index([orgId])
  @@index([templateId])
  @@index([status])
  @@map("form_submissions")
}
```

### Step 2: Create Status ENUM Type (30 min)

Create `packages/types/src/form-submission.ts`:

```typescript
export enum FormSubmissionStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export const VALID_STATUS_TRANSITIONS = {
  [FormSubmissionStatus.DRAFT]: [FormSubmissionStatus.IN_PROGRESS, FormSubmissionStatus.SUBMITTED],
  [FormSubmissionStatus.IN_PROGRESS]: [FormSubmissionStatus.SUBMITTED, FormSubmissionStatus.DRAFT],
  [FormSubmissionStatus.SUBMITTED]: [FormSubmissionStatus.APPROVED, FormSubmissionStatus.REJECTED],
  [FormSubmissionStatus.APPROVED]: [],
  [FormSubmissionStatus.REJECTED]: [FormSubmissionStatus.DRAFT],
};
```

### Step 3: Verify Migration (30 min)

Form submissions table already created in ISSUE-051, verify exists:

```bash
kubectl port-forward svc/postgres 5432:5432 -n braveforms

cd packages/database
pnpm studio
```

Check form_submissions table exists with all columns.

### Step 4: Document State Machine (15 min)

Create `apps/backend/src/modules/submissions/docs/STATE_MACHINE.md`:

```markdown
# Form Submission State Machine

## States

- **draft**: Initial state, editable
- **in_progress**: Being filled out
- **submitted**: Submitted for approval
- **approved**: Approved by reviewer
- **rejected**: Rejected, can return to draft

## Valid Transitions

- draft → in_progress
- draft → submitted
- in_progress → submitted
- in_progress → draft
- submitted → approved
- submitted → rejected
- rejected → draft

## Forbidden Transitions

- approved → (any state) - final state
```

## Files to Modify/Create

- Verify `schema.prisma` (already has form_submissions)
- Create `form-submission.ts` types
- Create `STATE_MACHINE.md` documentation

## Verification Checklist

- [ ] form_submissions table verified in Prisma Studio
- [ ] Status ENUM type created
- [ ] State machine documented
- [ ] Valid transitions defined

## Time Estimate: 2 hours

## Next Issue

**ISSUE-066:** Submission CRUD Resolvers (4h)

## Status: COMPLETE (2025-10-03)

**Evidence:** [COMPLETION-REPORT.md](../evidence/ISSUE-065/COMPLETION-REPORT.md)

**Time:** ~2 hours

**Commit:** d9e9e1b

**Summary:**

- IN_PROGRESS status added to FormStatus enum (6 states total)
- Comprehensive STATE_MACHINE.md created (244 lines)
- TypeScript types with validation helpers (form-submission.ts, 61 lines)
- Valid transitions documented with business rules
- Workflow examples: standard, fast-track, rejection/resubmission
- EPA/OSHA compliance: 3-year retention, immutability
- Offline considerations with IndexedDB queue
- Testing requirements specified for ISSUE-066/068
