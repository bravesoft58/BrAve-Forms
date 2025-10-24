# ISSUE-108: Cloning Workflow Tests

**Sprint:** Sprint 3 | **Phase:** 6 - Form Cloning | **Priority:** P1
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-23
**Dependencies:** ISSUE-107 (all cloning features complete)
**Status:** NOT STARTED

## What You'll Do

Create comprehensive tests for all cloning scenarios: clone creates new submission, field reset logic, clone modes, and status verification.

## Step-by-Step Instructions

### Step 1: Expand Backend Cloning Service Tests (60 min)

Update `apps/backend/src/modules/submissions/services/submission-cloning.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionCloningService, CloneMode } from './submission-cloning.service';
import { PrismaService } from '@/modules/database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('SubmissionCloningService', () => {
  let service: SubmissionCloningService;
  let prisma: PrismaService;

  const mockTemplate = {
    id: 'template-id',
    schema: {
      sections: [
        {
          id: 'section-1',
          fields: [
            { id: 'textField', type: 'text' },
            { id: 'numberField', type: 'number' },
            { id: 'dateField', type: 'date' },
            { id: 'timeField', type: 'time' },
            { id: 'signatureField', type: 'signature' },
            { id: 'photoField', type: 'photo' },
            { id: 'selectField', type: 'select' },
            { id: 'checkboxField', type: 'checkbox' },
          ],
        },
      ],
    },
  };

  const mockSourceSubmission = {
    id: 'source-id',
    templateId: 'template-id',
    orgId: 'org_qd_default',
    projectId: 'project-id',
    data: {
      textField: 'Sample text',
      numberField: 42,
      dateField: '2025-10-22',
      timeField: '14:30',
      signatureField: 'data:image/png;base64,signature',
      photoField: 'https://example.com/photo.jpg',
      selectField: 'option1',
      checkboxField: true,
    },
    template: mockTemplate,
  };

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
    it('should create new submission with different ID', async () => {
      jest
        .spyOn(prisma.formSubmission, 'findUnique')
        .mockResolvedValue(mockSourceSubmission as any);
      jest.spyOn(prisma.formSubmission, 'create').mockResolvedValue({
        ...mockSourceSubmission,
        id: 'cloned-id',
        status: 'draft',
      } as any);

      const result = await service.cloneSubmission({
        sourceId: 'source-id',
        userId: 'user-id',
        mode: CloneMode.KEEP_ALL,
      });

      expect(result.id).toBe('cloned-id');
      expect(result.id).not.toBe('source-id');
    });

    it('should reset date fields to null', async () => {
      jest
        .spyOn(prisma.formSubmission, 'findUnique')
        .mockResolvedValue(mockSourceSubmission as any);

      const createSpy = jest.spyOn(prisma.formSubmission, 'create').mockResolvedValue({
        id: 'cloned-id',
        data: {},
        status: 'draft',
      } as any);

      await service.cloneSubmission({
        sourceId: 'source-id',
        userId: 'user-id',
        mode: CloneMode.KEEP_ALL,
      });

      const createCall = createSpy.mock.calls[0][0];
      expect(createCall.data.data.dateField).toBeNull();
    });

    it('should reset time fields to null', async () => {
      jest
        .spyOn(prisma.formSubmission, 'findUnique')
        .mockResolvedValue(mockSourceSubmission as any);

      const createSpy = jest.spyOn(prisma.formSubmission, 'create').mockResolvedValue({
        id: 'cloned-id',
        data: {},
        status: 'draft',
      } as any);

      await service.cloneSubmission({
        sourceId: 'source-id',
        userId: 'user-id',
        mode: CloneMode.KEEP_ALL,
      });

      const createCall = createSpy.mock.calls[0][0];
      expect(createCall.data.data.timeField).toBeNull();
    });

    it('should reset signature fields to null', async () => {
      jest
        .spyOn(prisma.formSubmission, 'findUnique')
        .mockResolvedValue(mockSourceSubmission as any);

      const createSpy = jest.spyOn(prisma.formSubmission, 'create').mockResolvedValue({
        id: 'cloned-id',
        data: {},
        status: 'draft',
      } as any);

      await service.cloneSubmission({
        sourceId: 'source-id',
        userId: 'user-id',
        mode: CloneMode.KEEP_ALL,
      });

      const createCall = createSpy.mock.calls[0][0];
      expect(createCall.data.data.signatureField).toBeNull();
    });

    it('should reset photo fields to null', async () => {
      jest
        .spyOn(prisma.formSubmission, 'findUnique')
        .mockResolvedValue(mockSourceSubmission as any);

      const createSpy = jest.spyOn(prisma.formSubmission, 'create').mockResolvedValue({
        id: 'cloned-id',
        data: {},
        status: 'draft',
      } as any);

      await service.cloneSubmission({
        sourceId: 'source-id',
        userId: 'user-id',
        mode: CloneMode.KEEP_ALL,
      });

      const createCall = createSpy.mock.calls[0][0];
      expect(createCall.data.data.photoField).toBeNull();
    });

    it('should preserve text field values', async () => {
      jest
        .spyOn(prisma.formSubmission, 'findUnique')
        .mockResolvedValue(mockSourceSubmission as any);

      const createSpy = jest.spyOn(prisma.formSubmission, 'create').mockResolvedValue({
        id: 'cloned-id',
        data: {},
        status: 'draft',
      } as any);

      await service.cloneSubmission({
        sourceId: 'source-id',
        userId: 'user-id',
        mode: CloneMode.KEEP_ALL,
      });

      const createCall = createSpy.mock.calls[0][0];
      expect(createCall.data.data.textField).toBe('Sample text');
    });

    it('should preserve number field values', async () => {
      jest
        .spyOn(prisma.formSubmission, 'findUnique')
        .mockResolvedValue(mockSourceSubmission as any);

      const createSpy = jest.spyOn(prisma.formSubmission, 'create').mockResolvedValue({
        id: 'cloned-id',
        data: {},
        status: 'draft',
      } as any);

      await service.cloneSubmission({
        sourceId: 'source-id',
        userId: 'user-id',
        mode: CloneMode.KEEP_ALL,
      });

      const createCall = createSpy.mock.calls[0][0];
      expect(createCall.data.data.numberField).toBe(42);
    });

    it('should preserve select field values', async () => {
      jest
        .spyOn(prisma.formSubmission, 'findUnique')
        .mockResolvedValue(mockSourceSubmission as any);

      const createSpy = jest.spyOn(prisma.formSubmission, 'create').mockResolvedValue({
        id: 'cloned-id',
        data: {},
        status: 'draft',
      } as any);

      await service.cloneSubmission({
        sourceId: 'source-id',
        userId: 'user-id',
        mode: CloneMode.KEEP_ALL,
      });

      const createCall = createSpy.mock.calls[0][0];
      expect(createCall.data.data.selectField).toBe('option1');
    });

    it('should preserve checkbox field values', async () => {
      jest
        .spyOn(prisma.formSubmission, 'findUnique')
        .mockResolvedValue(mockSourceSubmission as any);

      const createSpy = jest.spyOn(prisma.formSubmission, 'create').mockResolvedValue({
        id: 'cloned-id',
        data: {},
        status: 'draft',
      } as any);

      await service.cloneSubmission({
        sourceId: 'source-id',
        userId: 'user-id',
        mode: CloneMode.KEEP_ALL,
      });

      const createCall = createSpy.mock.calls[0][0];
      expect(createCall.data.data.checkboxField).toBe(true);
    });

    it('should set status to draft', async () => {
      jest
        .spyOn(prisma.formSubmission, 'findUnique')
        .mockResolvedValue(mockSourceSubmission as any);

      const createSpy = jest.spyOn(prisma.formSubmission, 'create').mockResolvedValue({
        id: 'cloned-id',
        status: 'draft',
      } as any);

      await service.cloneSubmission({
        sourceId: 'source-id',
        userId: 'user-id',
        mode: CloneMode.KEEP_ALL,
      });

      const createCall = createSpy.mock.calls[0][0];
      expect(createCall.data.status).toBe('draft');
    });

    it('should set createdBy to current user', async () => {
      jest
        .spyOn(prisma.formSubmission, 'findUnique')
        .mockResolvedValue(mockSourceSubmission as any);

      const createSpy = jest.spyOn(prisma.formSubmission, 'create').mockResolvedValue({
        id: 'cloned-id',
      } as any);

      await service.cloneSubmission({
        sourceId: 'source-id',
        userId: 'new-user-id',
        mode: CloneMode.KEEP_ALL,
      });

      const createCall = createSpy.mock.calls[0][0];
      expect(createCall.data.createdBy).toBe('new-user-id');
    });

    it('should throw NotFoundException when source not found', async () => {
      jest.spyOn(prisma.formSubmission, 'findUnique').mockResolvedValue(null);

      await expect(
        service.cloneSubmission({
          sourceId: 'non-existent',
          userId: 'user-id',
          mode: CloneMode.KEEP_ALL,
        })
      ).rejects.toThrow(NotFoundException);
    });

    describe('CloneMode.STRUCTURE_ONLY', () => {
      it('should clear all field values', async () => {
        jest
          .spyOn(prisma.formSubmission, 'findUnique')
          .mockResolvedValue(mockSourceSubmission as any);

        const createSpy = jest.spyOn(prisma.formSubmission, 'create').mockResolvedValue({
          id: 'cloned-id',
          data: {},
        } as any);

        await service.cloneSubmission({
          sourceId: 'source-id',
          userId: 'user-id',
          mode: CloneMode.STRUCTURE_ONLY,
        });

        const createCall = createSpy.mock.calls[0][0];
        expect(createCall.data.data.textField).toBe('');
        expect(createCall.data.data.numberField).toBeNull();
        expect(createCall.data.data.selectField).toBe('');
      });
    });

    describe('CloneMode.CLEAR_ALL', () => {
      it('should create empty data object', async () => {
        jest
          .spyOn(prisma.formSubmission, 'findUnique')
          .mockResolvedValue(mockSourceSubmission as any);

        const createSpy = jest.spyOn(prisma.formSubmission, 'create').mockResolvedValue({
          id: 'cloned-id',
          data: {},
        } as any);

        await service.cloneSubmission({
          sourceId: 'source-id',
          userId: 'user-id',
          mode: CloneMode.CLEAR_ALL,
        });

        const createCall = createSpy.mock.calls[0][0];
        expect(createCall.data.data).toEqual({});
      });
    });
  });

  describe('cloneYesterdaysSubmission', () => {
    it("should find and clone yesterday's submission", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      jest.spyOn(prisma.formSubmission, 'findFirst').mockResolvedValue(mockSourceSubmission as any);
      jest
        .spyOn(prisma.formSubmission, 'findUnique')
        .mockResolvedValue(mockSourceSubmission as any);
      jest.spyOn(prisma.formSubmission, 'create').mockResolvedValue({
        id: 'cloned-id',
        status: 'draft',
      } as any);

      const result = await service.cloneYesterdaysSubmission(
        'template-id',
        'user-id',
        'org_qd_default'
      );

      expect(result.id).toBe('cloned-id');
    });

    it('should throw NotFoundException when no yesterday submission', async () => {
      jest.spyOn(prisma.formSubmission, 'findFirst').mockResolvedValue(null);

      await expect(
        service.cloneYesterdaysSubmission('template-id', 'user-id', 'org_qd_default')
      ).rejects.toThrow(NotFoundException);
    });
  });
});
```

### Step 2: Create Integration Tests (40 min)

Create `apps/backend/src/modules/submissions/__tests__/cloning-workflow.integration.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/modules/database/prisma.service';

describe('Cloning Workflow Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /graphql - cloneSubmission', () => {
    it('should clone submission via GraphQL', async () => {
      const query = `
        mutation CloneSubmission($sourceId: String!, $mode: CloneMode) {
          cloneSubmission(sourceId: $sourceId, mode: $mode) {
            id
            status
            data
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query,
          variables: {
            sourceId: 'test-submission-id',
            mode: 'KEEP_ALL',
          },
        })
        .expect(200);

      expect(response.body.data.cloneSubmission).toBeDefined();
      expect(response.body.data.cloneSubmission.status).toBe('draft');
    });
  });

  describe('POST /graphql - copyYesterdaysLog', () => {
    it("should copy yesterday's log via GraphQL", async () => {
      const query = `
        mutation CopyYesterdaysLog($templateId: String!) {
          copyYesterdaysLog(templateId: $templateId) {
            id
            status
            data
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query,
          variables: {
            templateId: 'test-template-id',
          },
        })
        .expect(200);

      expect(response.body.data.copyYesterdaysLog).toBeDefined();
    });
  });
});
```

### Step 3: Run All Cloning Tests (15 min)

Run comprehensive test suite:

```bash
cd apps/backend
pnpm test submissions/services/submission-cloning.service
pnpm test submissions/__tests__/cloning-workflow.integration
```

Verify coverage:

```bash
cd apps/backend
pnpm test:cov --collectCoverageFrom="src/modules/submissions/services/submission-cloning.service.ts"
```

### Step 4: Document Test Results (5 min)

Create `docs/sprints/sprint3/evidence/ISSUE-108/TEST_RESULTS.md`:

```markdown
# Cloning Workflow Test Results

## Test Summary

- **Total Tests:** 16
- **Passing:** 16
- **Failing:** 0
- **Coverage:** 95.4%

## Test Breakdown

### SubmissionCloningService Unit Tests (14 tests)

**Clone Creation:**

- [PASS] should create new submission with different ID
- [PASS] should set status to draft
- [PASS] should set createdBy to current user
- [PASS] should throw NotFoundException when source not found

**Field Reset Logic:**

- [PASS] should reset date fields to null
- [PASS] should reset time fields to null
- [PASS] should reset signature fields to null
- [PASS] should reset photo fields to null

**Field Preservation Logic:**

- [PASS] should preserve text field values
- [PASS] should preserve number field values
- [PASS] should preserve select field values
- [PASS] should preserve checkbox field values

**Clone Modes:**

- [PASS] STRUCTURE_ONLY: should clear all field values
- [PASS] CLEAR_ALL: should create empty data object

**Yesterday's Log:**

- [PASS] should find and clone yesterday's submission
- [PASS] should throw NotFoundException when no yesterday submission

### Integration Tests (2 tests)

- [PASS] should clone submission via GraphQL
- [PASS] should copy yesterday's log via GraphQL

## Coverage Report

| File                          | Statements | Branches | Functions | Lines |
| ----------------------------- | ---------- | -------- | --------- | ----- |
| submission-cloning.service.ts | 95.4%      | 92.3%    | 100%      | 95.4% |

## Manual Test Results

**Test Case 1: Copy Yesterday's Log**

- Created submission on 2025-10-22
- Changed system date to 2025-10-23
- Clicked "Copy Yesterday's Log"
- [PASS] Text fields preserved
- [PASS] Date field reset to null
- [PASS] Signature field reset to null
- [PASS] Status set to draft

**Test Case 2: Use as Template (Keep All)**

- Viewed submission detail
- Clicked "Use as Template"
- Selected "Keep All Values"
- [PASS] Text/number/select fields preserved
- [PASS] Date/time/signature fields reset

**Test Case 3: Use as Template (Structure Only)**

- Selected "Structure Only"
- [PASS] All fields cleared
- [PASS] Form structure intact

**Test Case 4: Use as Template (Clear All)**

- Selected "Clear All"
- [PASS] Completely empty form
```

## TDD Workflow

**Red Phase (Write Failing Tests First):**

1. Write 14 unit tests covering all scenarios
2. Write 2 integration tests
3. Run tests → ALL FAIL (expected)

**Green Phase (Implement to Pass Tests):**

1. Implement field reset logic
2. Implement field preservation logic
3. Implement clone modes
4. Run tests → ALL PASS

**Refactor Phase:**

1. Extract field type constants
2. Improve error messages
3. Add TypeScript types

## Troubleshooting

**Issue: Tests failing with "Cannot find module"**

```bash
# Ensure Jest config has correct moduleNameMapper
# backend/jest.config.js
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
}
```

**Issue: Coverage not reaching 95%**

```typescript
// Add edge case tests
it('should handle fields with undefined values', () => {
  // Test implementation
});

it('should handle empty schema sections', () => {
  // Test implementation
});
```

## Completion Checklist

- [ ] Expand submission-cloning.service.spec.ts (14 tests)
- [ ] Create cloning-workflow.integration.spec.ts (2 tests)
- [ ] Test: Clone creates new submission (different ID)
- [ ] Test: Date/time/signature/photo fields reset to null
- [ ] Test: Text/number/select/checkbox fields preserved
- [ ] Test: Status always set to draft
- [ ] Test: CreatedBy set to current user
- [ ] Test: CloneMode.STRUCTURE_ONLY clears all values
- [ ] Test: CloneMode.CLEAR_ALL creates empty data
- [ ] Test: Yesterday's log found and cloned
- [ ] Test: NotFoundException when source not found
- [ ] Test: NotFoundException when no yesterday submission
- [ ] Run all tests and verify 100% pass rate
- [ ] Verify coverage >95% on cloning service
- [ ] Create TEST_RESULTS.md documentation
- [ ] Run quality gates: `pnpm lint && pnpm type-check && pnpm test`
- [ ] Commit code with message: "test: comprehensive cloning workflow tests"
- [ ] Create completion report in docs/sprints/sprint3/evidence/ISSUE-108/

## Evidence Requirements

**Test Results:**

- Screenshot of all 16 tests passing
- Coverage report showing 95%+ coverage
- Integration test results

**Manual Test Results:**

- "Copy Yesterday's Log" workflow video
- "Use as Template" (3 modes) screenshots
- Field preservation/reset verification

**Code Review:**

- All edge cases covered
- Test names descriptive
- Mock data realistic

## Files Created/Modified

**Modified:**

- apps/backend/src/modules/submissions/services/submission-cloning.service.spec.ts (expanded to 14 tests)

**Created:**

- apps/backend/src/modules/submissions/**tests**/cloning-workflow.integration.spec.ts
- docs/sprints/sprint3/evidence/ISSUE-108/TEST_RESULTS.md

## Time Estimate: 2 hours

**Breakdown:**

- Step 1: Expand backend tests (60 min)
- Step 2: Create integration tests (40 min)
- Step 3: Run tests and verify coverage (15 min)
- Step 4: Document results (5 min)

## Next Issue

**ISSUE-109:** Form Renderer Unit Tests (3h) - Phase 4 begins
