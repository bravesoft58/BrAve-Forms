# ISSUE-065: Form Submission Schema Design - Completion Report

**Issue:** ISSUE-065
**Title:** Form Submission Schema Design
**Status:** ✅ COMPLETE
**Completed:** 2025-10-03
**Estimated:** 2 hours (Small)
**Actual:** ~2 hours
**Sprint:** Sprint 2 - Phase 3 (Form Submissions)

## Objective

Add IN_PROGRESS status to FormStatus enum and create comprehensive state machine documentation for form submission workflow.

## Implementation Summary

Successfully added IN_PROGRESS status to existing form_submissions table schema and created complete state machine documentation covering all 6 states, transitions, business rules, and compliance requirements.

**Schema Changes:**

- FormStatus enum expanded from 5 to 6 states
- Added IN_PROGRESS between DRAFT and SUBMITTED
- FormSubmission model already exists (created in previous sprint)

**Documentation Created:**

- STATE_MACHINE.md (244 lines) with comprehensive workflow specification
- TypeScript types with transition validation helpers
- State transition map with allowed/forbidden paths

## Files Created/Modified

### Schema Changes

1. **[schema.prisma](../../../../packages/database/schema.prisma)** (+1 line)
   - Added `IN_PROGRESS` to FormStatus enum
   - New enum: `DRAFT, IN_PROGRESS, SUBMITTED, REVIEWED, APPROVED, REJECTED`
   - FormSubmission model already exists with all required fields (created in prior work)

### TypeScript Types

2. **[packages/types/src/form-submission.ts](../../../../packages/types/src/form-submission.ts)** (+61 lines, NEW FILE)
   - FormSubmissionStatus enum (lowercase values matching Prisma)
   - VALID_STATUS_TRANSITIONS map defining allowed state changes
   - `isValidStatusTransition(from, to)` helper function
   - `canTransitionToStatus(current, target)` with reason messages
   - Complete transition validation logic

### Documentation

3. **[STATE_MACHINE.md](../../../../apps/backend/src/modules/submissions/docs/STATE_MACHINE.md)** (+244 lines, NEW FILE)
   - All 6 states documented with descriptions
   - Editability rules for each state
   - Valid transitions with business logic explanations
   - Forbidden transitions with explicit error cases
   - Business rules: audit trail, rejection notes (min 10 chars), approval authority, immutability
   - Technical implementation examples
   - Workflow examples: standard approval, fast-track, rejection/resubmission
   - Offline considerations with IndexedDB queue
   - EPA/OSHA compliance (3-year retention, immutable approved records)
   - Multi-tenant isolation requirements
   - Testing requirements (unit + integration)

## State Machine Specification

### Six States Defined

1. **DRAFT** - Initial creation, fully editable
2. **IN_PROGRESS** - Being actively filled out, editable
3. **SUBMITTED** - Submitted for review, read-only
4. **REVIEWED** - Under review by supervisor, read-only
5. **APPROVED** - Approved and final, immutable
6. **REJECTED** - Rejected with notes, can return to DRAFT

### Valid Transitions

```typescript
const VALID_STATUS_TRANSITIONS = {
  DRAFT: [IN_PROGRESS, SUBMITTED],
  IN_PROGRESS: [SUBMITTED, DRAFT],
  SUBMITTED: [REVIEWED, APPROVED, REJECTED],
  REVIEWED: [APPROVED, REJECTED],
  APPROVED: [], // Final state - no transitions allowed
  REJECTED: [DRAFT], // Can resubmit after fixes
};
```

### Forbidden Transitions (Examples)

- ❌ DRAFT → APPROVED (must go through review)
- ❌ IN_PROGRESS → APPROVED (must submit first)
- ❌ APPROVED → any status (immutable final state)
- ❌ SUBMITTED → DRAFT (read-only after submission)

## Business Rules Documented

### Audit Trail Requirements

- **submittedAt** - Timestamp when status changes to SUBMITTED
- **reviewedAt** - Timestamp when status changes to REVIEWED/APPROVED/REJECTED
- **reviewedBy** - UserID of reviewer
- All timestamps immutable once set

### Rejection Notes

- **Required:** When status changes to REJECTED
- **Minimum:** 10 characters
- **Purpose:** Explain why submission was rejected
- **Validation:** Enforced server-side

### Approval Authority

- **Reviewers:** Users with SUPERVISOR or ADMIN role
- **Submitters:** Users with FIELD or OFFICE role
- **Self-approval:** Prohibited (reviewedBy ≠ submittedBy)

### Immutability Rules

- **APPROVED submissions:** Cannot be edited or deleted
- **Reason:** EPA/OSHA compliance (3-year retention)
- **Enforcement:** Server-side validation throws ForbiddenException

## Workflow Examples Documented

### Standard Approval Flow

```
DRAFT → IN_PROGRESS → SUBMITTED → REVIEWED → APPROVED
```

1. Field worker creates form (DRAFT)
2. Field worker starts filling out (IN_PROGRESS)
3. Field worker submits (SUBMITTED)
4. Supervisor reviews (REVIEWED)
5. Supervisor approves (APPROVED - final)

### Fast-Track Approval

```
DRAFT → SUBMITTED → APPROVED
```

1. Field worker creates and completes form (DRAFT)
2. Field worker submits directly (SUBMITTED)
3. Supervisor approves immediately (APPROVED)

### Rejection and Resubmission

```
DRAFT → SUBMITTED → REJECTED → DRAFT → SUBMITTED → APPROVED
```

1. Field worker submits form (DRAFT → SUBMITTED)
2. Supervisor rejects with notes (REJECTED)
3. Field worker fixes issues (DRAFT)
4. Field worker resubmits (SUBMITTED)
5. Supervisor approves (APPROVED)

## Compliance Requirements

### EPA/OSHA Regulations

- **Retention Period:** 3 years minimum
- **Immutability:** Approved records cannot be modified or deleted
- **Audit Trail:** Complete history of status changes with timestamps
- **Multi-Tenant:** Complete data isolation between organizations

### Implementation Notes

- APPROVED submissions deletion throws `ForbiddenException`
- All status changes logged in audit trail (future: separate audit_log table)
- Rejection notes minimum 10 characters (specific feedback required)
- Multi-tenant filtering via orgId on all queries

## Offline Considerations

### IndexedDB Queue

When offline, form submission operations queue in IndexedDB:

```
Offline Operation Queue:
1. CREATE submission (DRAFT)
2. UPDATE submission (IN_PROGRESS)
3. UPDATE submission (SUBMITTED)
```

When online, operations sync in order with conflict resolution.

### Conflict Resolution

- **Optimistic Locking:** Use `version` field for conflict detection
- **Last Write Wins:** For DRAFT and IN_PROGRESS edits
- **Server Authority:** For SUBMITTED/REVIEWED/APPROVED transitions

## Testing Requirements Specified

### Unit Tests (ISSUE-066)

- ✅ validateStatusTransition() for all valid/invalid transitions
- ✅ validateRequiredFields() before SUBMITTED
- ✅ validateRejectionNotes() minimum 10 characters
- ✅ validateFieldTypes() for all field types

### Integration Tests (ISSUE-068)

- State machine transitions (all valid paths)
- Required field validation (missing fields throw error)
- Approval workflow (SUBMITTED → REVIEWED → APPROVED)
- Rejection workflow (REJECTED → DRAFT)
- Multi-tenant isolation (orgId filtering)

## Success Criteria

✅ **All criteria met:**

1. ✅ FormStatus enum includes IN_PROGRESS
2. ✅ STATE_MACHINE.md created with comprehensive documentation
3. ✅ TypeScript types created with validation helpers
4. ✅ 6 states documented with transitions
5. ✅ Business rules specified (audit trail, rejection notes, immutability)
6. ✅ Workflow examples provided (3 scenarios)
7. ✅ Compliance requirements documented (EPA/OSHA 3-year retention)
8. ✅ Testing requirements specified

## Migration Status

**Database Migration:** Deferred to next deployment

**Reason:** Port-forward instability during development session

**Prisma Client:** Generated successfully with new IN_PROGRESS enum

**Next Steps:** Run migration when database accessible:

```bash
pnpm --filter database prisma migrate dev --name add_in_progress_status
```

## Evidence Collected

### Code Artifacts

1. **State Machine Documentation** - [STATE_MACHINE.md](../../../../apps/backend/src/modules/submissions/docs/STATE_MACHINE.md)
2. **TypeScript Types** - [form-submission.ts](../../../../packages/types/src/form-submission.ts)
3. **Schema Update** - [schema.prisma](../../../../packages/database/schema.prisma) line 144

### Git Commit

```
Commit: d9e9e1b
Message: feat: complete ISSUE-065 form submission schema and state machine

Files Changed:
 .../src/modules/submissions/docs/STATE_MACHINE.md  | 244 +++++++++
 packages/database/schema.prisma                    |   1 +
 packages/types/src/form-submission.ts              |  61 +++

Total: 3 files changed, +306 lines
```

## Known Issues

None. Schema and documentation complete.

## Next Steps

**ISSUE-066: Submission CRUD Resolvers** - ✅ Complete (already done)

Uses state machine from this issue for validation.

## Related Documentation

- [ISSUE-065 Issue Definition](../../issues/ISSUE-065-form-submission-schema.md)
- [STATE_MACHINE.md](../../../../apps/backend/src/modules/submissions/docs/STATE_MACHINE.md)
- [ISSUE-066 Completion Report](../ISSUE-066/COMPLETION-REPORT.md) (Uses state machine)
- [Sprint 2 Master Plan](../../SPRINT_2_MASTER_PLAN.md)

---

**Completed:** 2025-10-03
**Sprint 2 Progress:** 17/27 issues (63%)
**Phase 3 Progress:** 2/4 issues (50%)
