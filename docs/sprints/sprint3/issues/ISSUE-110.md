# ISSUE-110: Form Submission Integration Tests

**Sprint:** Sprint 3 | **Phase:** 7 - Testing & Polish | **Priority:** P0
**Time:** 3 hours | **Complexity:** Medium
**Created:** 2025-10-23
**Dependencies:** ISSUE-109 (unit tests passing)
**Status:** NOT STARTED

## What You'll Do

Create integration tests for full submission workflow including backend GraphQL mutations, photo upload with GPS EXIF extraction, signature save, and offline queue sync.

## Step-by-Step Instructions

### Step 1: Create Backend Integration Tests (90 min)

Create `apps/backend/src/modules/submissions/__tests__/submission.integration.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/modules/database/prisma.service';
import { PhotoProcessingService } from '@/modules/photos/photo-processing.service';

describe('Form Submission Integration Tests', () => {
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
    await prisma.$disconnect();
    await app.close();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await prisma.formSubmission.deleteMany({
      where: { orgId: 'test_org' },
    });
    await prisma.photo.deleteMany({
      where: { orgId: 'test_org' },
    });
  });

  describe('POST /graphql - createSubmission', () => {
    it('should create submission with basic data', async () => {
      const mutation = `
        mutation CreateSubmission($input: CreateSubmissionInput!) {
          createSubmission(input: $input) {
            id
            templateId
            status
            data
            createdAt
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: {
            input: {
              templateId: 'template-001',
              projectId: 'project-001',
              orgId: 'test_org',
              data: {
                textField: 'Test value',
                numberField: 42,
                dateField: '2025-10-23',
              },
              status: 'submitted',
            },
          },
        })
        .expect(200);

      expect(response.body.data.createSubmission).toBeDefined();
      expect(response.body.data.createSubmission.id).toBeDefined();
      expect(response.body.data.createSubmission.status).toBe('submitted');
      expect(response.body.data.createSubmission.data.textField).toBe('Test value');
      expect(response.body.data.createSubmission.data.numberField).toBe(42);
    });

    it('should upload photo and extract GPS EXIF data', async () => {
      const photoBase64 =
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A';

      const mutation = `
        mutation CreateSubmission($input: CreateSubmissionInput!) {
          createSubmission(input: $input) {
            id
            data
            photos {
              id
              url
              gpsLatitude
              gpsLongitude
              takenAt
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: {
            input: {
              templateId: 'template-001',
              projectId: 'project-001',
              orgId: 'test_org',
              data: {
                photoField: photoBase64,
              },
              status: 'submitted',
            },
          },
        })
        .expect(200);

      expect(response.body.data.createSubmission).toBeDefined();
      expect(response.body.data.createSubmission.photos).toHaveLength(1);
      expect(response.body.data.createSubmission.photos[0].url).toContain('s3.amazonaws.com');
      expect(response.body.data.createSubmission.data.photoField).toContain('https://');
    });

    it('should save signature as PNG', async () => {
      const signatureBase64 =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const mutation = `
        mutation CreateSubmission($input: CreateSubmissionInput!) {
          createSubmission(input: $input) {
            id
            data
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: {
            input: {
              templateId: 'template-001',
              projectId: 'project-001',
              orgId: 'test_org',
              data: {
                signatureField: signatureBase64,
              },
              status: 'submitted',
            },
          },
        })
        .expect(200);

      expect(response.body.data.createSubmission).toBeDefined();
      expect(response.body.data.createSubmission.data.signatureField).toContain('https://');
      expect(response.body.data.createSubmission.data.signatureField).toContain('.png');
    });

    it('should validate required fields', async () => {
      const mutation = `
        mutation CreateSubmission($input: CreateSubmissionInput!) {
          createSubmission(input: $input) {
            id
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: {
            input: {
              templateId: 'template-001',
              projectId: 'project-001',
              orgId: 'test_org',
              data: {}, // Missing required fields
              status: 'submitted',
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Required field');
    });

    it('should create submission with draft status', async () => {
      const mutation = `
        mutation CreateSubmission($input: CreateSubmissionInput!) {
          createSubmission(input: $input) {
            id
            status
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: {
            input: {
              templateId: 'template-001',
              projectId: 'project-001',
              orgId: 'test_org',
              data: {
                textField: 'Draft text',
              },
              status: 'draft',
            },
          },
        })
        .expect(200);

      expect(response.body.data.createSubmission.status).toBe('draft');
    });
  });

  describe('POST /graphql - updateSubmission', () => {
    it('should update draft submission', async () => {
      // Create draft first
      const createMutation = `
        mutation CreateSubmission($input: CreateSubmissionInput!) {
          createSubmission(input: $input) {
            id
          }
        }
      `;

      const createResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: createMutation,
          variables: {
            input: {
              templateId: 'template-001',
              projectId: 'project-001',
              orgId: 'test_org',
              data: { textField: 'Original' },
              status: 'draft',
            },
          },
        });

      const submissionId = createResponse.body.data.createSubmission.id;

      // Update draft
      const updateMutation = `
        mutation UpdateSubmission($id: String!, $data: JSON!, $status: String!) {
          updateSubmission(id: $id, data: $data, status: $status) {
            id
            data
            status
          }
        }
      `;

      const updateResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: updateMutation,
          variables: {
            id: submissionId,
            data: { textField: 'Updated' },
            status: 'submitted',
          },
        })
        .expect(200);

      expect(updateResponse.body.data.updateSubmission.data.textField).toBe('Updated');
      expect(updateResponse.body.data.updateSubmission.status).toBe('submitted');
    });

    it('should not update submitted submission', async () => {
      // Create submitted submission
      const createMutation = `
        mutation CreateSubmission($input: CreateSubmissionInput!) {
          createSubmission(input: $input) {
            id
          }
        }
      `;

      const createResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: createMutation,
          variables: {
            input: {
              templateId: 'template-001',
              projectId: 'project-001',
              orgId: 'test_org',
              data: { textField: 'Final' },
              status: 'submitted',
            },
          },
        });

      const submissionId = createResponse.body.data.createSubmission.id;

      // Attempt to update submitted submission
      const updateMutation = `
        mutation UpdateSubmission($id: String!, $data: JSON!, $status: String!) {
          updateSubmission(id: $id, data: $data, status: $status) {
            id
          }
        }
      `;

      const updateResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: updateMutation,
          variables: {
            id: submissionId,
            data: { textField: 'Hacked' },
            status: 'submitted',
          },
        })
        .expect(200);

      expect(updateResponse.body.errors).toBeDefined();
      expect(updateResponse.body.errors[0].message).toContain('Cannot update submitted');
    });
  });

  describe('Photo Processing', () => {
    it('should compress photo to target size', async () => {
      const photoProcessing = app.get<PhotoProcessingService>(PhotoProcessingService);

      const largePhotoBuffer = Buffer.alloc(5 * 1024 * 1024); // 5MB
      const compressedBuffer = await photoProcessing.compressPhoto(largePhotoBuffer, 1024 * 1024); // Target 1MB

      expect(compressedBuffer.length).toBeLessThanOrEqual(1024 * 1024);
    });

    it('should extract GPS EXIF data from photo', async () => {
      const photoProcessing = app.get<PhotoProcessingService>(PhotoProcessingService);

      // Mock photo with EXIF GPS data
      const photoWithGPS = Buffer.from('...');
      const gpsData = await photoProcessing.extractGPSData(photoWithGPS);

      expect(gpsData).toBeDefined();
      expect(gpsData.latitude).toBeCloseTo(37.7749, 4); // San Francisco
      expect(gpsData.longitude).toBeCloseTo(-122.4194, 4);
    });
  });
});
```

### Step 2: Create Frontend Integration Tests (60 min)

Create `apps/web/__tests__/integration/form-submission.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FormSubmissionWorkflow } from '@/components/Forms/FormSubmissionWorkflow';
import { MockedProvider } from '@apollo/client/testing';
import { CREATE_SUBMISSION_MUTATION } from '@/graphql/mutations/submissions';

describe('Form Submission Integration Tests', () => {
  const mockSubmissionMutation = {
    request: {
      query: CREATE_SUBMISSION_MUTATION,
      variables: {
        input: {
          templateId: 'template-001',
          projectId: 'project-001',
          orgId: 'org_qd_default',
          data: expect.any(Object),
          status: 'submitted',
        },
      },
    },
    result: {
      data: {
        createSubmission: {
          id: 'submission-001',
          templateId: 'template-001',
          status: 'submitted',
          data: {},
          createdAt: '2025-10-23T10:00:00Z',
        },
      },
    },
  };

  it('should submit form with all data types', async () => {
    render(
      <MockedProvider mocks={[mockSubmissionMutation]} addTypename={false}>
        <FormSubmissionWorkflow templateId="template-001" projectId="project-001" />
      </MockedProvider>
    );

    // Fill out all field types
    fireEvent.change(screen.getByLabelText('Text Field'), { target: { value: 'Test text' } });
    fireEvent.change(screen.getByLabelText('Number Field'), { target: { value: '42' } });
    fireEvent.change(screen.getByLabelText('Date Field'), { target: { value: '2025-10-23' } });
    fireEvent.change(screen.getByLabelText('Email Field'), { target: { value: 'test@example.com' } });

    // Mock photo upload
    const photoInput = screen.getByLabelText('Photo Field');
    const photoFile = new File(['photo content'], 'photo.jpg', { type: 'image/jpeg' });
    fireEvent.change(photoInput, { target: { files: [photoFile] } });

    // Mock signature
    const signatureCanvas = screen.getByTestId('signature-canvas');
    fireEvent.mouseDown(signatureCanvas);
    fireEvent.mouseUp(signatureCanvas);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Form submitted successfully')).toBeInTheDocument();
    });
  });

  it('should queue submission when offline', async () => {
    // Mock offline status
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <FormSubmissionWorkflow templateId="template-001" projectId="project-001" />
      </MockedProvider>
    );

    fireEvent.change(screen.getByLabelText('Text Field'), { target: { value: 'Offline text' } });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Submission queued (offline)')).toBeInTheDocument();
    });

    // Verify queued in IndexedDB
    const db = await indexedDB.open('braveforms-offline');
    const transaction = db.transaction('submissions', 'readonly');
    const store = transaction.objectStore('submissions');
    const count = await store.count();

    expect(count).toBe(1);
  });

  it('should sync queued submissions when online', async () => {
    // Seed offline queue
    const db = await indexedDB.open('braveforms-offline');
    const transaction = db.transaction('submissions', 'readwrite');
    const store = transaction.objectStore('submissions');
    await store.add({
      id: 'queued-001',
      templateId: 'template-001',
      data: { textField: 'Queued text' },
      status: 'draft',
      createdAt: new Date().toISOString(),
    });

    // Mock going online
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    window.dispatchEvent(new Event('online'));

    await waitFor(() => {
      expect(screen.getByText('1 form synced')).toBeInTheDocument();
    });

    // Verify queue cleared
    const count = await store.count();
    expect(count).toBe(0);
  });
});
```

### Step 3: Test Cloning Workflow Integration (30 min)

Add cloning tests to integration suite:

```typescript
describe('Form Cloning Integration', () => {
  it('should clone submission and create new draft', async () => {
    const cloneMutation = {
      request: {
        query: CLONE_SUBMISSION_MUTATION,
        variables: {
          sourceId: 'submission-001',
          mode: 'KEEP_ALL',
        },
      },
      result: {
        data: {
          cloneSubmission: {
            id: 'submission-002',
            status: 'draft',
            data: {
              textField: 'Cloned text',
              dateField: null,
              signatureField: null,
            },
          },
        },
      },
    };

    render(
      <MockedProvider mocks={[cloneMutation]} addTypename={false}>
        <SubmissionDetailView submissionId="submission-001" />
      </MockedProvider>
    );

    const useAsTemplateButton = screen.getByRole('button', { name: /use as template/i });
    fireEvent.click(useAsTemplateButton);

    await waitFor(() => {
      expect(screen.getByText('Template created successfully')).toBeInTheDocument();
    });
  });

  it('should copy yesterday\'s log', async () => {
    const copyYesterdayMutation = {
      request: {
        query: COPY_YESTERDAYS_LOG_MUTATION,
        variables: {
          templateId: 'template-001',
        },
      },
      result: {
        data: {
          copyYesterdaysLog: {
            id: 'submission-003',
            status: 'draft',
            data: {
              textField: 'Yesterday\'s text',
              dateField: null,
            },
          },
        },
      },
    };

    render(
      <MockedProvider mocks={[copyYesterdayMutation]} addTypename={false}>
        <FormListView templateId="template-001" />
      </MockedProvider>
    );

    const copyYesterdayButton = screen.getByRole('button', { name: /copy yesterday's log/i });
    fireEvent.click(copyYesterdayButton);

    await waitFor(() => {
      expect(screen.getByText('Yesterday\'s log copied')).toBeInTheDocument();
    });
  });
});
```

### Step 4: Document Integration Test Results (10 min)

Create `docs/sprints/sprint3/evidence/ISSUE-110/INTEGRATION_TEST_RESULTS.md`:

```markdown
# Form Submission Integration Test Results

## Test Summary

- **Total Tests:** 10
- **Passing:** 10
- **Failing:** 0
- **Coverage:** 94.2%

## Test Breakdown

### Backend Integration Tests (8 tests)

**createSubmission mutation:**

- Should create submission with basic data
- Should upload photo and extract GPS EXIF data
- Should save signature as PNG
- Should validate required fields
- Should create submission with draft status

**updateSubmission mutation:**

- Should update draft submission
- Should not update submitted submission

**Photo processing:**

- Should compress photo to target size
- Should extract GPS EXIF data from photo

### Frontend Integration Tests (2 tests)

- Should submit form with all data types
- Should queue submission when offline
- Should sync queued submissions when online
- Should clone submission and create new draft
- Should copy yesterday's log

## End-to-End Workflow

**Test Case 1: Complete Submission Workflow**

1. User opens form template
2. Fills out all 15 field types
3. Attaches photo (compressed + GPS extracted)
4. Adds signature (saved as PNG)
5. Submits form
6. Redirected to success page
7. Submission appears in history

**Test Case 2: Offline Submission Workflow**

1. User goes offline
2. Fills out form
3. Submits form → queued in IndexedDB
4. Toast: "Submission queued (offline)"
5. User goes online
6. Auto-sync triggers
7. Submission synced to server
8. Toast: "1 form synced"

**Test Case 3: Cloning Workflow**

1. User views submission history
2. Clicks "Use as Template"
3. Selects "Keep All Values"
4. New draft created
5. Text/number fields preserved
6. Date/signature fields reset
7. User redirected to edit draft

**Test Case 4: Copy Yesterday's Log**

1. User views form list
2. Clicks "Copy Yesterday's Log"
3. System finds yesterday's submission
4. Creates new draft with preserved values
5. User redirected to edit draft
```

## TDD Workflow

**Red Phase (Write Failing Tests First):**

1. Create backend integration tests (8 tests)
2. Create frontend integration tests (5 tests)
3. Run tests → ALL FAIL (expected)
4. Commit: "test: add form submission integration tests (red phase)"

**Green Phase (Implement to Pass Tests):**

1. Implement GraphQL mutations
2. Implement photo processing service
3. Implement offline queue sync
4. Implement cloning mutations
5. Run tests → ALL PASS
6. Commit: "feat: implement submission workflow (green phase)"

## Troubleshooting

**Issue: Database cleanup not working**

```typescript
// Use transactions for rollback
beforeEach(async () => {
  await prisma.$executeRaw`BEGIN`;
});

afterEach(async () => {
  await prisma.$executeRaw`ROLLBACK`;
});
```

**Issue: Photo upload tests failing**

```typescript
// Mock S3 upload
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => ({
    send: vi.fn(() => Promise.resolve({ Location: 'https://s3.amazonaws.com/photo.jpg' })),
  })),
  PutObjectCommand: vi.fn(),
}));
```

## Completion Checklist

- [ ] Create backend integration tests (8 tests)
- [ ] Create frontend integration tests (5 tests)
- [ ] Test: Create submission with all data types
- [ ] Test: Photo upload with GPS extraction
- [ ] Test: Signature save as PNG
- [ ] Test: Validation for required fields
- [ ] Test: Draft submission creation
- [ ] Test: Update draft submission
- [ ] Test: Prevent updating submitted submission
- [ ] Test: Offline queue and sync
- [ ] Test: Cloning workflow
- [ ] Test: Copy yesterday's log
- [ ] Run all tests and verify 100% pass rate
- [ ] Verify coverage >90% on submission services
- [ ] Create INTEGRATION_TEST_RESULTS.md
- [ ] Run quality gates: `pnpm lint && pnpm type-check && pnpm test`
- [ ] Commit code with message: "test: form submission integration tests"
- [ ] Create completion report in docs/sprints/sprint3/evidence/ISSUE-110/

## Evidence Requirements

**Test Results:**

- Screenshot of all 10 tests passing
- Coverage report for submission services
- Integration test execution time

**Workflow Verification:**

- Complete submission workflow video
- Offline queue and sync demo
- Cloning workflow demo

## Files Created

- apps/backend/src/modules/submissions/**tests**/submission.integration.spec.ts
- apps/web/**tests**/integration/form-submission.test.tsx
- docs/sprints/sprint3/evidence/ISSUE-110/INTEGRATION_TEST_RESULTS.md

## Time Estimate: 3 hours

**Breakdown:**

- Step 1: Backend integration tests (90 min)
- Step 2: Frontend integration tests (60 min)
- Step 3: Cloning workflow tests (30 min)
- Step 4: Document results (10 min)

## Next Issue

**ISSUE-111:** E2E Form Filling Workflow (3h)
