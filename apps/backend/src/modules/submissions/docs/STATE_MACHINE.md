# Form Submission State Machine

**Version:** 1.0
**Last Updated:** 2025-10-03
**Purpose:** Document valid state transitions for form submissions in BrAve Forms

---

## States

### DRAFT
- **Description:** Initial state when form submission is created
- **Editable:** Yes
- **User Actions:** Continue editing, submit directly
- **Visibility:** Only creator can see

### IN_PROGRESS
- **Description:** User is actively filling out the form
- **Editable:** Yes
- **User Actions:** Continue editing, save as draft, submit
- **Visibility:** Only creator can see

### SUBMITTED
- **Description:** Form has been submitted for review
- **Editable:** No
- **User Actions:** Wait for review
- **Visibility:** Creator and reviewers

### REVIEWED
- **Description:** Form has been reviewed but decision not yet made
- **Editable:** No (reviewer can add notes)
- **User Actions:** Approve or reject
- **Visibility:** Creator and reviewers

### APPROVED
- **Description:** Form has been approved
- **Editable:** No
- **User Actions:** None (final state)
- **Visibility:** All org members (compliance record)

### REJECTED
- **Description:** Form has been rejected with notes
- **Editable:** No (until reset to draft)
- **User Actions:** Return to draft with rejection notes
- **Visibility:** Creator and reviewers

---

## Valid Transitions

### From DRAFT
- ✅ `DRAFT → IN_PROGRESS` - User starts filling out form
- ✅ `DRAFT → SUBMITTED` - User submits directly without in-progress state

### From IN_PROGRESS
- ✅ `IN_PROGRESS → SUBMITTED` - User completes and submits form
- ✅ `IN_PROGRESS → DRAFT` - User saves as draft

### From SUBMITTED
- ✅ `SUBMITTED → REVIEWED` - Reviewer begins review process
- ✅ `SUBMITTED → APPROVED` - Fast-track approval without formal review
- ✅ `SUBMITTED → REJECTED` - Fast-track rejection without formal review

### From REVIEWED
- ✅ `REVIEWED → APPROVED` - Reviewer approves after review
- ✅ `REVIEWED → REJECTED` - Reviewer rejects after review

### From REJECTED
- ✅ `REJECTED → DRAFT` - User can modify and resubmit

### From APPROVED
- ❌ No transitions allowed (final state)

---

## Forbidden Transitions

The following transitions are explicitly forbidden and will result in validation errors:

- `APPROVED → *` (any state) - Approved is a final state
- `DRAFT → REVIEWED` - Must go through submission first
- `DRAFT → APPROVED` - Must go through submission process
- `DRAFT → REJECTED` - Cannot reject what hasn't been submitted
- `IN_PROGRESS → REVIEWED` - Must be submitted first
- `IN_PROGRESS → APPROVED` - Must be submitted first
- `IN_PROGRESS → REJECTED` - Must be submitted first
- `SUBMITTED → DRAFT` - Cannot revert once submitted (use rejection workflow)
- `SUBMITTED → IN_PROGRESS` - Cannot revert once submitted
- `REVIEWED → DRAFT` - Cannot revert once reviewed (use rejection workflow)
- `REVIEWED → IN_PROGRESS` - Cannot revert once reviewed
- `REVIEWED → SUBMITTED` - Cannot move backwards
- `APPROVED → DRAFT` - Final state, no transitions
- `APPROVED → IN_PROGRESS` - Final state, no transitions
- `APPROVED → SUBMITTED` - Final state, no transitions
- `APPROVED → REVIEWED` - Final state, no transitions
- `APPROVED → REJECTED` - Final state, no transitions
- `REJECTED → IN_PROGRESS` - Must reset to draft first
- `REJECTED → SUBMITTED` - Must reset to draft first
- `REJECTED → REVIEWED` - Must reset to draft first
- `REJECTED → APPROVED` - Must go through submission workflow

---

## State Transition Rules

### Business Rules

1. **Audit Trail Required**
   - All status changes MUST record: timestamp, userId, previous status, new status

2. **Rejection Notes Required**
   - Transitions to REJECTED MUST include rejection_notes
   - Minimum 10 characters for rejection notes

3. **Approval Authority**
   - Only users with ADMIN or OWNER role can approve submissions
   - Cannot approve own submissions (conflict of interest)

4. **Submission Immutability**
   - Once SUBMITTED, form data cannot be edited
   - Rejection returns to DRAFT with original data preserved in audit trail

5. **Final State Protection**
   - APPROVED submissions cannot be modified or deleted
   - Permanent compliance record

### Technical Implementation

```typescript
import {
  FormSubmissionStatus,
  isValidStatusTransition,
  canTransitionToStatus,
} from '@brave-forms/types';

function validateStatusTransition(
  currentStatus: FormSubmissionStatus,
  newStatus: FormSubmissionStatus,
  userId: string,
  userRole: string
): { valid: boolean; error?: string } {
  const transition = canTransitionToStatus(currentStatus, newStatus);

  if (!transition.allowed) {
    return { valid: false, error: transition.reason };
  }

  if (
    newStatus === FormSubmissionStatus.APPROVED &&
    !['ADMIN', 'OWNER'].includes(userRole)
  ) {
    return { valid: false, error: 'Insufficient permissions to approve' };
  }

  return { valid: true };
}
```

---

## Workflow Examples

### Standard Approval Workflow

```
DRAFT → IN_PROGRESS → SUBMITTED → REVIEWED → APPROVED
```

### Fast-Track Approval

```
DRAFT → SUBMITTED → APPROVED
```

### Rejection and Resubmission

```
DRAFT → IN_PROGRESS → SUBMITTED → REVIEWED → REJECTED → DRAFT → SUBMITTED → APPROVED
```

### Save Draft Workflow

```
DRAFT → IN_PROGRESS → DRAFT → IN_PROGRESS → SUBMITTED
```

---

## Offline Considerations

When operating offline, state transitions are queued and synced when connectivity is restored:

1. **Queue Mechanism:** All status changes stored in IndexedDB queue
2. **Conflict Resolution:** Last-write-wins with server timestamp
3. **Validation:** Server re-validates all transitions on sync
4. **Rollback:** Invalid offline transitions rolled back with user notification

---

## Compliance Requirements

### EPA/OSHA Documentation

- All APPROVED submissions become part of permanent compliance record
- Audit trail required for regulatory inspections
- Minimum retention: 3 years from project completion
- Deletion prohibited once APPROVED

### Multi-Tenant Isolation

- All submissions scoped by orgId
- Cross-tenant status checks prohibited
- Audit trail includes orgId for tenant verification

---

## Testing Requirements

### Unit Tests

- All valid transitions must pass
- All forbidden transitions must fail with specific error messages
- Edge cases (same status, null values, invalid enums)

### Integration Tests

- Full workflow tests (draft → approved)
- Rejection and resubmission workflow
- Permission validation (approval authority)
- Audit trail creation

---

## References

- Prisma Schema: `packages/database/schema.prisma` (FormStatus enum)
- TypeScript Types: `packages/types/src/form-submission.ts`
- Service Implementation: `apps/backend/src/modules/submissions/submissions.service.ts` (future)

---

**Last Updated:** 2025-10-03
**Maintained By:** Backend Development Team
**Review Frequency:** Quarterly or when workflow requirements change
