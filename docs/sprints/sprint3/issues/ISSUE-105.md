# ISSUE-105: SubmissionCloningService

**Sprint:** Sprint 3 | **Phase:** 6 - Form Cloning | **Priority:** P1
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-23
**Dependencies:** Phase 2 complete (submission workflow ready)
**Status:** NOT STARTED

## What You'll Do

Create backend service to clone filled forms with reset logic for date/time/signature/photo fields while preserving text/number/select values.

## Step-by-Step Instructions

### Step 1: Create SubmissionCloningService (75 min)

Create `apps/backend/src/modules/submissions/services/submission-cloning.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { FormSubmission, Prisma } from '@prisma/client';

export enum CloneMode {
  KEEP_ALL = 'keep_all', // Keep all field values
  STRUCTURE_ONLY = 'structure_only', // Keep structure, clear values
  CLEAR_ALL = 'clear_all', // Clear all except template
}

interface CloneSubmissionInput {
  sourceId: string;
  userId: string;
  mode?: CloneMode;
}

@Injectable()
export class SubmissionCloningService {
  constructor(private readonly prisma: PrismaService) {}

  async cloneSubmission({
    sourceId,
    userId,
    mode = CloneMode.KEEP_ALL,
  }: CloneSubmissionInput): Promise<FormSubmission> {
    // Get source submission
    const source = await this.prisma.formSubmission.findUnique({
      where: { id: sourceId },
      include: {
        template: {
          include: {
            schema: true,
          },
        },
      },
    });

    if (!source) {
      throw new NotFoundException(`Submission ${sourceId} not found`);
    }

    // Clone data based on mode
    const clonedData = this.processFieldsByMode(
      source.data as Record<string, any>,
      source.template.schema,
      mode
    );

    // Create new submission as draft
    const cloned = await this.prisma.formSubmission.create({
      data: {
        templateId: source.templateId,
        data: clonedData,
        status: 'draft',
        createdBy: userId,
        orgId: source.orgId,
        projectId: source.projectId,
      },
    });

    return cloned;
  }

  private processFieldsByMode(
    data: Record<string, any>,
    schema: any,
    mode: CloneMode
  ): Record<string, any> {
    if (mode === CloneMode.CLEAR_ALL) {
      return {};
    }

    if (mode === CloneMode.STRUCTURE_ONLY) {
      // Keep only non-temporal, non-identity fields
      return this.resetTemporalFields(data, schema, true);
    }

    // KEEP_ALL mode: Reset only identity fields
    return this.resetTemporalFields(data, schema, false);
  }

  private resetTemporalFields(
    data: Record<string, any>,
    schema: any,
    clearAll: boolean
  ): Record<string, any> {
    const result: Record<string, any> = {};

    // Iterate through all sections and fields
    for (const section of schema.sections || []) {
      for (const field of section.fields || []) {
        const fieldId = field.id;
        const fieldType = field.type;
        const value = data[fieldId];

        // Determine if field should be reset
        const shouldReset = this.shouldResetField(fieldType, clearAll);

        if (shouldReset) {
          // Reset to appropriate empty value
          result[fieldId] = this.getEmptyValue(fieldType);
        } else if (value !== undefined) {
          // Keep existing value
          result[fieldId] = value;
        }
      }
    }

    return result;
  }

  private shouldResetField(fieldType: string, clearAll: boolean): boolean {
    // Always reset identity fields
    const identityFields = ['date', 'time', 'datetime', 'signature', 'photo'];
    if (identityFields.includes(fieldType)) {
      return true;
    }

    // If clearAll, reset everything except structural fields
    if (clearAll) {
      const structuralFields = ['section', 'heading', 'divider'];
      return !structuralFields.includes(fieldType);
    }

    // Otherwise, keep field value
    return false;
  }

  private getEmptyValue(fieldType: string): any {
    switch (fieldType) {
      case 'text':
      case 'textarea':
      case 'email':
      case 'phone':
        return '';
      case 'number':
        return null;
      case 'date':
      case 'time':
      case 'datetime':
        return null;
      case 'select':
      case 'radio':
        return '';
      case 'checkbox':
        return false;
      case 'checkboxes':
        return [];
      case 'photo':
      case 'signature':
      case 'file':
        return null;
      default:
        return null;
    }
  }

  async cloneYesterdaysSubmission(
    templateId: string,
    userId: string,
    orgId: string
  ): Promise<FormSubmission> {
    // Calculate yesterday's date range
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find yesterday's submission
    const yesterdaySubmission = await this.prisma.formSubmission.findFirst({
      where: {
        templateId,
        orgId,
        createdBy: userId,
        submittedAt: {
          gte: yesterday,
          lt: today,
        },
        status: 'submitted',
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    if (!yesterdaySubmission) {
      throw new NotFoundException('No submission found for yesterday');
    }

    // Clone with KEEP_ALL mode
    return this.cloneSubmission({
      sourceId: yesterdaySubmission.id,
      userId,
      mode: CloneMode.KEEP_ALL,
    });
  }
}
```

### Step 2: Create CloneSubmission Resolver (30 min)

Create `apps/backend/src/modules/submissions/resolvers/clone-submission.resolver.ts`:

```typescript
import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '@/modules/auth/clerk-auth.guard';
import { CurrentUser } from '@/modules/auth/current-user.decorator';
import { SubmissionCloningService, CloneMode } from '../services/submission-cloning.service';
import { FormSubmission } from '../entities/form-submission.entity';

@Resolver()
export class CloneSubmissionResolver {
  constructor(private readonly cloningService: SubmissionCloningService) {}

  @Mutation(() => FormSubmission)
  @UseGuards(ClerkAuthGuard)
  async cloneSubmission(
    @Args('sourceId') sourceId: string,
    @Args('mode', { nullable: true, defaultValue: CloneMode.KEEP_ALL }) mode: CloneMode,
    @CurrentUser() user: any
  ): Promise<FormSubmission> {
    return this.cloningService.cloneSubmission({
      sourceId,
      userId: user.id,
      mode,
    });
  }

  @Mutation(() => FormSubmission)
  @UseGuards(ClerkAuthGuard)
  async copyYesterdaysLog(
    @Args('templateId') templateId: string,
    @CurrentUser() user: any
  ): Promise<FormSubmission> {
    return this.cloningService.cloneYesterdaysSubmission(templateId, user.id, user.orgId);
  }
}
```

### Step 3: Update SubmissionsModule (10 min)

Update `apps/backend/src/modules/submissions/submissions.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '@/modules/database/prisma.module';
import { SubmissionCloningService } from './services/submission-cloning.service';
import { CloneSubmissionResolver } from './resolvers/clone-submission.resolver';

@Module({
  imports: [PrismaModule],
  providers: [
    SubmissionCloningService,
    CloneSubmissionResolver,
    // ... other providers
  ],
  exports: [SubmissionCloningService],
})
export class SubmissionsModule {}
```

### Step 4: Test SubmissionCloningService (5 min)

Create test file `apps/backend/src/modules/submissions/services/submission-cloning.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionCloningService, CloneMode } from './submission-cloning.service';
import { PrismaService } from '@/modules/database/prisma.service';

describe('SubmissionCloningService', () => {
  let service: SubmissionCloningService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionCloningService,
        {
          provide: PrismaService,
          useValue: {
            formSubmission: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<SubmissionCloningService>(SubmissionCloningService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('cloneSubmission', () => {
    it('should clone submission with new ID', async () => {
      const sourceSubmission = {
        id: 'source-id',
        templateId: 'template-id',
        data: { field1: 'value1', dateField: '2025-10-22' },
        orgId: 'org_qd_default',
        projectId: 'project-id',
        template: {
          schema: {
            sections: [
              {
                fields: [
                  { id: 'field1', type: 'text' },
                  { id: 'dateField', type: 'date' },
                ],
              },
            ],
          },
        },
      };

      jest.spyOn(prisma.formSubmission, 'findUnique').mockResolvedValue(sourceSubmission as any);
      jest.spyOn(prisma.formSubmission, 'create').mockResolvedValue({
        id: 'cloned-id',
        data: { field1: 'value1', dateField: null },
        status: 'draft',
      } as any);

      const result = await service.cloneSubmission({
        sourceId: 'source-id',
        userId: 'user-id',
        mode: CloneMode.KEEP_ALL,
      });

      expect(result.id).not.toBe('source-id');
      expect(result.status).toBe('draft');
    });

    it('should reset date/time/signature fields', async () => {
      // Test date, time, signature reset
      // (full test implementation)
    });

    it('should keep text/number/select fields', async () => {
      // Test text, number, select preserved
      // (full test implementation)
    });
  });
});
```

Run tests:

```bash
cd apps/backend
pnpm test submissions/services/submission-cloning.service
```

## TDD Workflow

**Red Phase (Write Failing Tests First):**

1. Write test: "should clone submission with new ID"
2. Write test: "should reset date/time/signature fields"
3. Write test: "should keep text/number/select fields"
4. Write test: "should respect CloneMode.STRUCTURE_ONLY"
5. Write test: "should respect CloneMode.CLEAR_ALL"
6. Run tests → ALL FAIL (expected)

**Green Phase (Implement to Pass Tests):**

1. Create SubmissionCloningService
2. Implement cloneSubmission method
3. Implement field reset logic
4. Add CloneMode handling
5. Run tests → ALL PASS

**Refactor Phase:**

1. Extract field type checks to constants
2. Add error handling for invalid modes
3. Improve TypeScript types

## Troubleshooting

**Issue: All fields being reset**

```typescript
// Ensure field type check is correct
const identityFields = ['date', 'time', 'datetime', 'signature', 'photo'];
if (identityFields.includes(fieldType)) {
  // Only reset these types
}
```

**Issue: Status not set to draft**

```typescript
// Always create clones as draft
const cloned = await this.prisma.formSubmission.create({
  data: {
    // ...
    status: 'draft', // CRITICAL: Never copy submitted status
  },
});
```

**Issue: Yesterday's submission not found**

```typescript
// Ensure date range is correct (UTC vs local time)
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
yesterday.setHours(0, 0, 0, 0); // Start of day

const today = new Date();
today.setHours(0, 0, 0, 0); // Start of today
```

## Completion Checklist

- [ ] Create apps/backend/src/modules/submissions/services/submission-cloning.service.ts
- [ ] Create apps/backend/src/modules/submissions/resolvers/clone-submission.resolver.ts
- [ ] Implement cloneSubmission method
- [ ] Implement field reset logic (date, time, signature, photo → null)
- [ ] Implement field preservation logic (text, number, select → keep)
- [ ] Add CloneMode enum (KEEP_ALL, STRUCTURE_ONLY, CLEAR_ALL)
- [ ] Implement cloneYesterdaysSubmission method
- [ ] Add cloneSubmission GraphQL mutation
- [ ] Add copyYesterdaysLog GraphQL mutation
- [ ] Update SubmissionsModule (add providers)
- [ ] Create submission-cloning.service.spec.ts tests
- [ ] Run quality gates: `pnpm lint && pnpm type-check && pnpm test`
- [ ] Commit code with message: "feat: submission cloning service with field reset logic"
- [ ] Create completion report in docs/sprints/sprint3/evidence/ISSUE-105/

## Evidence Requirements

**Test Results:**

- SubmissionCloningService tests passing (5+ tests)
- Screenshot of test coverage report

**Code Review:**

- Date/time/signature fields reset correctly
- Text/number/select fields preserved
- CloneMode respected
- Status always set to draft

**GraphQL Test:**

```graphql
mutation {
  cloneSubmission(sourceId: "submission-id", mode: KEEP_ALL) {
    id
    status
    data
  }
}

mutation {
  copyYesterdaysLog(templateId: "template-id") {
    id
    status
    data
  }
}
```

## Files Created/Modified

**Created:**

- apps/backend/src/modules/submissions/services/submission-cloning.service.ts
- apps/backend/src/modules/submissions/resolvers/clone-submission.resolver.ts
- apps/backend/src/modules/submissions/services/submission-cloning.service.spec.ts

**Modified:**

- apps/backend/src/modules/submissions/submissions.module.ts (add providers)

## Time Estimate: 2 hours

**Breakdown:**

- Step 1: Create SubmissionCloningService (75 min)
- Step 2: Create resolver (30 min)
- Step 3: Update module (10 min)
- Step 4: Testing (5 min)

## Next Issue

**ISSUE-106:** "Copy Yesterday's Log" Button (2h)
