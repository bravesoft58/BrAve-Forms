# ISSUE-066: Submission CRUD Resolvers

**STATUS:** COMPLETE
**Completed:** 2025-10-03
**Evidence:** [COMPLETION-REPORT.md](../../evidence/ISSUE-066/COMPLETION-REPORT.md)

**Sprint:** Sprint 2 | **Phase:** 3 - Form Submission Workflow | **Priority:** P0
**Time:** 4 hours | **Complexity:** Medium
**Created:** 2025-10-02
**Dependencies:** ISSUE-065 (schema exists)

## What You'll Do

Implement createFormSubmission and updateFormSubmission mutations, add status workflow validation (state machine), implement required field validation (server-side), and test in GraphQL Playground.

## Step-by-Step Instructions

### Step 1: Create Submission Validation Service (90 min)

Create `apps/backend/src/modules/submissions/services/submission-validation.service.ts`:

```typescript
@Injectable()
export class SubmissionValidationService {
  validateRequiredFields(data: Record<string, any>, template: FormTemplate): ValidationResult {
    const errors: string[] = [];
    const fields = template.fields as FieldDefinition[];

    fields.forEach((field) => {
      if (field.required && !data[field.id]) {
        errors.push(`Required field '${field.label}' is missing`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  validateStatusTransition(currentStatus: string, newStatus: string): boolean {
    const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
    return validTransitions?.includes(newStatus) || false;
  }

  validateFieldTypes(data: Record<string, any>, template: FormTemplate): ValidationResult {
    const errors: string[] = [];
    const fields = template.fields as FieldDefinition[];

    fields.forEach((field) => {
      const value = data[field.id];
      if (value === undefined) return;

      switch (field.type) {
        case 'number':
          if (typeof value !== 'number') {
            errors.push(`Field '${field.label}' must be a number`);
          }
          break;
        case 'date':
          if (!Date.parse(value)) {
            errors.push(`Field '${field.label}' must be a valid date`);
          }
          break;
        // Add more type validations
      }
    });

    return { isValid: errors.length === 0, errors };
  }
}
```

### Step 2: Create Form Submissions Service (90 min)

Create `apps/backend/src/modules/submissions/services/form-submissions.service.ts`:

```typescript
@Injectable()
export class FormSubmissionsService {
  constructor(
    private prisma: PrismaService,
    private validationService: SubmissionValidationService,
    private formTemplatesService: FormTemplatesService
  ) {}

  async create(
    input: CreateFormSubmissionInput,
    orgId: string,
    userId: string
  ): Promise<FormSubmission> {
    // Verify template exists and belongs to org
    const template = await this.formTemplatesService.findOne(input.templateId, orgId);
    if (!template) {
      throw new NotFoundException('Form template not found');
    }

    // Validate field types
    const typeValidation = this.validationService.validateFieldTypes(input.data, template);
    if (!typeValidation.isValid) {
      throw new BadRequestException(typeValidation.errors.join(', '));
    }

    return this.prisma.formSubmission.create({
      data: {
        orgId,
        templateId: input.templateId,
        data: input.data as any,
        status: FormSubmissionStatus.DRAFT,
        createdBy: userId,
      },
    });
  }

  async update(
    id: string,
    input: UpdateFormSubmissionInput,
    orgId: string,
    userId: string
  ): Promise<FormSubmission> {
    const existing = await this.prisma.formSubmission.findFirst({
      where: { id, orgId },
      include: { template: true },
    });

    if (!existing) {
      throw new NotFoundException('Form submission not found');
    }

    // Validate status transition if status changing
    if (
      input.status &&
      !this.validationService.validateStatusTransition(existing.status, input.status)
    ) {
      throw new BadRequestException(
        `Invalid status transition: ${existing.status} → ${input.status}`
      );
    }

    // If submitting, validate required fields
    if (input.status === FormSubmissionStatus.SUBMITTED) {
      const validation = this.validationService.validateRequiredFields(
        input.data || (existing.data as any),
        existing.template
      );
      if (!validation.isValid) {
        throw new BadRequestException(validation.errors.join(', '));
      }
    }

    return this.prisma.formSubmission.update({
      where: { id },
      data: {
        ...input,
        status: input.status || existing.status,
        ...(input.status === FormSubmissionStatus.SUBMITTED && {
          submittedAt: new Date(),
          submittedBy: userId,
        }),
      },
    });
  }
}
```

### Step 3: Create GraphQL Resolvers (45 min)

Create `apps/backend/src/modules/submissions/resolvers/form-submissions.resolver.ts`:

```typescript
@Resolver(() => FormSubmission)
@UseGuards(ClerkAuthGuard)
export class FormSubmissionsResolver {
  constructor(private submissionsService: FormSubmissionsService) {}

  @Mutation(() => FormSubmission)
  async createFormSubmission(
    @Args('input') input: CreateFormSubmissionInput,
    @CurrentUser() user: ClerkUser
  ): Promise<FormSubmission> {
    return this.submissionsService.create(input, user.orgId, user.userId);
  }

  @Mutation(() => FormSubmission)
  async updateFormSubmission(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateFormSubmissionInput,
    @CurrentUser() user: ClerkUser
  ): Promise<FormSubmission> {
    return this.submissionsService.update(id, input, user.orgId, user.userId);
  }
}
```

### Step 4: Test in GraphQL Playground (45 min)

```graphql
mutation CreateSubmission {
  createFormSubmission(
    input: {
      templateId: "clXXXXXXXX"
      data: { inspector_name: "John Doe", inspection_date: "2025-10-02" }
    }
  ) {
    id
    status
    data
  }
}

mutation SubmitForm {
  updateFormSubmission(id: "clYYYYYYYY", input: { status: "submitted" }) {
    id
    status
    submittedAt
    submittedBy
  }
}
```

## Files to Create

- `submission-validation.service.ts`
- `form-submissions.service.ts`
- `form-submissions.resolver.ts`
- `submissions.module.ts`

## Verification Checklist

- [x] Create and update mutations working
- [x] Status workflow validation enforced
- [x] Required field validation working
- [x] GraphQL tests successful

## Status: ✅ COMPLETE (2025-10-03)

**Evidence:** [COMPLETION-REPORT.md](../evidence/ISSUE-066/COMPLETION-REPORT.md)

**Test Results:** [TEST_RESULTS.md](../../sprint1/evidence/ISSUE-066/TEST_RESULTS.md)

**Commit:** 85fd92a

## Time Estimate: 4 hours

## Next Issue

**ISSUE-067:** Approval Workflow (2h)
