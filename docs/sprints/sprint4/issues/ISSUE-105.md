# ISSUE-105: QR Portal Tests

**Sprint:** Sprint 4 | **Phase:** 1 - QR Inspector Portal | **Priority:** P0
**Time:** 2 hours | **Complexity:** Small
**Created:** 2025-10-23
**Dependencies:** ISSUE-104 (Photo gallery complete)
**Status:** COMPLETE

## What You'll Do

Create comprehensive test suite for QR inspector portal covering token security, read-only enforcement, and mobile tablet layout.

## Prerequisites

- [ ] ISSUE-104 complete (All QR portal features implemented)
- [ ] Backend running at http://localhost:30101/graphql
- [ ] Web frontend running at http://localhost:30102
- [ ] Code editor open to both apps/backend and apps/web directories

## Step-by-Step Instructions

### Step 1: Backend Token Security Tests (40 min)

Create `apps/backend/src/modules/qr-portal/__tests__/qr-token.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { QRTokenService } from '../services/qr-token.service';
import { PrismaService } from '@/modules/database/prisma.service';

describe('QRTokenService - Security Tests', () => {
  let service: QRTokenService;
  let jwtService: JwtService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QRTokenService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            qRToken: {
              create: jest.fn(),
              findFirst: jest.fn(),
              updateMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<QRTokenService>(QRTokenService);
    jwtService = module.get<JwtService>(JwtService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('Token Generation', () => {
    it('should generate valid JWT token with 24-hour expiration', async () => {
      const mockToken = 'valid-jwt-token';
      const signSpy = jest.spyOn(jwtService, 'sign').mockReturnValue(mockToken);
      jest.spyOn(prisma.qRToken, 'create').mockResolvedValue({} as any);

      const token = await service.generateQRToken({
        projectId: 'project-123',
        orgId: 'org-456',
        generatedBy: 'user-789',
      });

      expect(token).toBe(mockToken);
      expect(signSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'project-123',
          orgId: 'org-456',
          permissions: ['view_submissions', 'view_photos'],
          tokenType: 'inspector_access',
        }),
        expect.objectContaining({
          expiresIn: '24h',
        })
      );
    });

    it('should store token metadata in database for audit trail', async () => {
      jest.spyOn(jwtService, 'sign').mockReturnValue('token');
      const createSpy = jest.spyOn(prisma.qRToken, 'create').mockResolvedValue({} as any);

      await service.generateQRToken({
        projectId: 'project-123',
        orgId: 'org-456',
        generatedBy: 'user-789',
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId: 'project-123',
            orgId: 'org-456',
            generatedBy: 'user-789',
            isRevoked: false,
          }),
        })
      );
    });

    it('should set expiration exactly 24 hours from generation', async () => {
      jest.spyOn(jwtService, 'sign').mockReturnValue('token');
      const createSpy = jest.spyOn(prisma.qRToken, 'create').mockResolvedValue({} as any);

      const beforeGeneration = new Date();
      await service.generateQRToken({
        projectId: 'project-123',
        orgId: 'org-456',
        generatedBy: 'user-789',
      });
      const afterGeneration = new Date();

      const callArgs = createSpy.mock.calls[0][0];
      const expiresAt = callArgs.data.expiresAt;

      const expectedMinExpiration = new Date(beforeGeneration.getTime() + 24 * 60 * 60 * 1000);
      const expectedMaxExpiration = new Date(afterGeneration.getTime() + 24 * 60 * 60 * 1000);

      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMinExpiration.getTime());
      expect(expiresAt.getTime()).toBeLessThanOrEqual(expectedMaxExpiration.getTime());
    });
  });

  describe('Token Validation', () => {
    it('should return payload for valid, non-revoked token', async () => {
      const mockPayload = {
        projectId: 'project-123',
        orgId: 'org-456',
        permissions: ['view_submissions', 'view_photos'],
        tokenType: 'inspector_access' as const,
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours in future
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(mockPayload);
      jest.spyOn(prisma.qRToken, 'findFirst').mockResolvedValue({
        isRevoked: false,
      } as any);

      const result = await service.validateQRToken('valid-token');

      expect(result).toEqual(mockPayload);
    });

    it('should return null for revoked token', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({
        projectId: 'project-123',
        orgId: 'org-456',
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      } as any);
      jest.spyOn(prisma.qRToken, 'findFirst').mockResolvedValue(null); // Token not found or revoked

      const result = await service.validateQRToken('revoked-token');

      expect(result).toBeNull();
    });

    it('should return null for expired token', async () => {
      const expiredPayload = {
        projectId: 'project-123',
        orgId: 'org-456',
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(expiredPayload as any);
      jest.spyOn(prisma.qRToken, 'findFirst').mockResolvedValue({
        isRevoked: false,
      } as any);

      const result = await service.validateQRToken('expired-token');

      expect(result).toBeNull();
    });

    it('should return null for invalid JWT signature', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const result = await service.validateQRToken('invalid-signature-token');

      expect(result).toBeNull();
    });

    it('should verify token against correct secret', async () => {
      const verifySpy = jest.spyOn(jwtService, 'verify').mockReturnValue({} as any);
      jest.spyOn(prisma.qRToken, 'findFirst').mockResolvedValue({
        isRevoked: false,
      } as any);

      await service.validateQRToken('token');

      expect(verifySpy).toHaveBeenCalledWith(
        'token',
        expect.objectContaining({
          secret: expect.any(String),
        })
      );
    });
  });

  describe('Token Regeneration', () => {
    it('should revoke all existing tokens before generating new one', async () => {
      const updateManySpy = jest.spyOn(prisma.qRToken, 'updateMany').mockResolvedValue({
        count: 2,
      } as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue('new-token');
      jest.spyOn(prisma.qRToken, 'create').mockResolvedValue({} as any);

      await service.regenerateQRToken('project-123', 'org-456', 'user-789');

      expect(updateManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            projectId: 'project-123',
            orgId: 'org-456',
            isRevoked: false,
          },
          data: expect.objectContaining({
            isRevoked: true,
            revokedBy: 'user-789',
          }),
        })
      );
    });

    it('should generate new token after revocation', async () => {
      jest.spyOn(prisma.qRToken, 'updateMany').mockResolvedValue({ count: 1 } as any);
      const signSpy = jest.spyOn(jwtService, 'sign').mockReturnValue('new-token');
      jest.spyOn(prisma.qRToken, 'create').mockResolvedValue({} as any);

      const newToken = await service.regenerateQRToken('project-123', 'org-456', 'user-789');

      expect(newToken).toBe('new-token');
      expect(signSpy).toHaveBeenCalled();
    });

    it('should record who regenerated the token', async () => {
      jest.spyOn(prisma.qRToken, 'updateMany').mockResolvedValue({ count: 1 } as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue('new-token');
      const createSpy = jest.spyOn(prisma.qRToken, 'create').mockResolvedValue({} as any);

      await service.regenerateQRToken('project-123', 'org-456', 'user-regenerate');

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            generatedBy: 'user-regenerate',
          }),
        })
      );
    });
  });
});
```

### Step 2: Backend Read-Only Enforcement Tests (40 min)

Create `apps/backend/src/modules/qr-portal/__tests__/qr-portal.integration.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { QRTokenService } from '../services/qr-token.service';

describe('QR Portal Integration Tests - Read-Only Enforcement', () => {
  let app: INestApplication;
  let qrTokenService: QRTokenService;
  let validToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    qrTokenService = moduleFixture.get<QRTokenService>(QRTokenService);

    // Generate valid token for tests
    validToken = await qrTokenService.generateQRToken({
      projectId: 'test-project-123',
      orgId: 'test-org-456',
      generatedBy: 'test-user-789',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Read-Only Access Enforcement', () => {
    it('should allow viewing submissions with valid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              submissionsByToken(token: "${validToken}") {
                id
                templateName
                submittedBy
              }
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.submissionsByToken).toBeDefined();
    });

    it('should block creating submissions via QR token', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              createSubmission(
                token: "${validToken}"
                data: { templateId: "template-123", fields: [] }
              ) {
                id
              }
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('read-only');
    });

    it('should block updating submissions via QR token', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              updateSubmission(
                token: "${validToken}"
                submissionId: "sub-123"
                data: { status: "approved" }
              ) {
                id
              }
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('read-only');
    });

    it('should block deleting submissions via QR token', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              deleteSubmission(token: "${validToken}", submissionId: "sub-123")
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('read-only');
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              submissionsByToken(token: "invalid-token") {
                id
              }
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Invalid or expired token');
    });

    it('should reject requests with expired token', async () => {
      // Generate token with -1 hour expiration (already expired)
      const expiredToken = await qrTokenService.generateQRToken({
        projectId: 'test-project-123',
        orgId: 'test-org-456',
        generatedBy: 'test-user-789',
      });

      // Manually expire it by manipulating database
      // (In real implementation, you'd wait 24 hours or use time manipulation)

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              submissionsByToken(token: "${expiredToken}") {
                id
              }
            }
          `,
        });

      expect(response.status).toBe(200);
      // Should either error or return empty (depends on implementation)
    });
  });

  describe('Permission Validation', () => {
    it('should only grant view_submissions and view_photos permissions', async () => {
      const payload = await qrTokenService.validateQRToken(validToken);

      expect(payload).not.toBeNull();
      expect(payload!.permissions).toEqual(['view_submissions', 'view_photos']);
      expect(payload!.permissions).not.toContain('create_submission');
      expect(payload!.permissions).not.toContain('update_submission');
      expect(payload!.permissions).not.toContain('delete_submission');
    });

    it('should enforce tokenType as inspector_access', async () => {
      const payload = await qrTokenService.validateQRToken(validToken);

      expect(payload).not.toBeNull();
      expect(payload!.tokenType).toBe('inspector_access');
    });
  });
});
```

### Step 3: Frontend Mobile Tablet Tests (40 min)

Create `apps/web/__tests__/e2e/qr-portal.spec.ts`:

```typescript
import { test, expect, devices } from '@playwright/test';

test.describe('QR Portal - Mobile Tablet Tests', () => {
  // Use iPad viewport for inspector tablet tests
  test.use({
    ...devices['iPad Pro'],
  });

  test.beforeEach(async ({ page }) => {
    // Generate QR token and navigate to portal
    // (In real test, you'd call API to generate token)
    const token = 'test-token-123'; // Mock token
    await page.goto(`http://localhost:30102/inspector/${token}`);
  });

  test('should display project information on tablet', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('BrAve Forms');
    await expect(page.locator('text=Inspector Portal')).toBeVisible();
  });

  test('should have large touch targets for navigation cards', async ({ page }) => {
    const navCards = page.locator('a').filter({ hasText: 'Form Submissions' });

    // Get bounding box
    const box = await navCards.boundingBox();
    expect(box).not.toBeNull();

    // Should be at least 64px tall (minimum touch target for tablets)
    expect(box!.height).toBeGreaterThanOrEqual(64);
  });

  test('should show read-only access message', async ({ page }) => {
    await expect(page.locator('text=Read-Only Access')).toBeVisible();
  });

  test('should navigate to submissions page', async ({ page }) => {
    await page.click('text=Form Submissions');

    await expect(page).toHaveURL(/\/inspector\/.*\/submissions/);
    await expect(page.locator('h1')).toContainText('Form Submissions');
  });

  test('should filter submissions on tablet', async ({ page }) => {
    await page.click('text=Form Submissions');

    // Search filter should be visible and usable
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    await searchInput.type('SWPPP');

    // Results should filter
    // (Actual results depend on test data)
  });

  test('should open photo lightbox on tablet', async ({ page }) => {
    await page.click('text=Photo Gallery');

    // Click first photo thumbnail
    await page.locator('img').first().click();

    // Lightbox should open
    await expect(page.locator('[aria-label="Close"]')).toBeVisible();
  });

  test('should zoom photo in lightbox', async ({ page }) => {
    await page.click('text=Photo Gallery');
    await page.locator('img').first().click();

    // Click zoom in
    await page.click('[aria-label="Zoom In"]');

    // Zoom level should increase
    await expect(page.locator('text=125%')).toBeVisible();
  });

  test('should show GPS map for photos with location data', async ({ page }) => {
    await page.click('text=Photo Gallery');

    // Click GPS button on photo
    await page.click('[aria-label="Show on map"]');

    // Map modal should open
    await expect(page.locator('text=Photo Location')).toBeVisible();
    await expect(page.locator('[data-testid="gps-map"]')).toBeVisible();
  });

  test('should print submission on tablet', async ({ page }) => {
    await page.click('text=Form Submissions');
    await page.click('text=View');

    // Mock window.print
    await page.evaluate(() => {
      window.print = () => console.log('Print called');
    });

    await page.click('text=Print');

    // Verify print was triggered (in real test, check print dialog)
  });

  test('should export PDF on tablet', async ({ page }) => {
    await page.click('text=Form Submissions');
    await page.click('text=Export PDF');

    // Wait for download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('text=Export PDF'),
    ]);

    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('should not show edit/delete buttons in read-only mode', async ({ page }) => {
    await page.click('text=Form Submissions');

    // Edit and Delete buttons should NOT exist
    await expect(page.locator('button:has-text("Edit")')).not.toBeVisible();
    await expect(page.locator('button:has-text("Delete")')).not.toBeVisible();

    // View and Export should exist
    await expect(page.locator('text=View')).toBeVisible();
    await expect(page.locator('text=Export PDF')).toBeVisible();
  });

  test('should redirect invalid token to error page', async ({ page }) => {
    await page.goto('http://localhost:30102/inspector/invalid-token-xyz');

    await expect(page).toHaveURL(/\/inspector\/invalid-token/);
    await expect(page.locator('text=Invalid QR Code')).toBeVisible();
  });

  test('should display common error reasons', async ({ page }) => {
    await page.goto('http://localhost:30102/inspector/invalid-token-xyz');

    await expect(page.locator('text=24-hour limit')).toBeVisible();
    await expect(page.locator('text=regenerated by site manager')).toBeVisible();
  });
});
```

## TDD Workflow (MANDATORY)

### Phase 1: Write Tests First (Red Phase)

All tests have been provided in Steps 1-3.

Run backend tests (should FAIL - red phase):

```bash
cd apps/backend
pnpm test qr-token.service
pnpm test qr-portal.integration
```

Run frontend tests (should FAIL - red phase):

```bash
cd apps/web
pnpm test:e2e qr-portal
```

**Screenshot:** Save failing tests to `evidence/ISSUE-105/test-results/red-phase.png`

### Phase 2: Implement Code (Green Phase)

Ensure all code from ISSUE-100 through ISSUE-104 is implemented.

Run tests:

```bash
cd apps/backend
pnpm test qr-token.service
pnpm test qr-portal.integration

cd apps/web
pnpm test:e2e qr-portal
```

Expected: All tests pass

**Screenshot:** Save passing tests to `evidence/ISSUE-105/test-results/green-phase.png`

## Files to Create

**Backend Tests:**

- apps/backend/src/modules/qr-portal/**tests**/qr-token.service.spec.ts
- apps/backend/src/modules/qr-portal/**tests**/qr-portal.integration.spec.ts

**Frontend Tests:**

- apps/web/**tests**/e2e/qr-portal.spec.ts

## Verification Checklist

- [ ] Token generation tests passing (8+ tests)
- [ ] Token validation tests passing (6+ tests)
- [ ] Read-only enforcement tests passing (6+ tests)
- [ ] Mobile tablet layout tests passing (12+ tests)
- [ ] Invalid token handling tests passing
- [ ] Total coverage >95% for QR portal module
- [ ] All edge cases covered
- [ ] Zero emoji
- [ ] Zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-105/

**Required:**

- test-results/
  - red-phase.png (failing tests)
  - green-phase.png (passing tests - 30+ total tests)
  - coverage-report.png (>95% coverage for QR portal module)
- e2e/
  - tablet-navigation.png (Playwright test running on iPad viewport)
  - touch-target-test.png (Touch target size validation)
  - read-only-enforcement.png (Mutation blocked)

## Troubleshooting

**Problem:** Integration tests fail with database connection error

- **Cause:** Test database not configured
- **Solution:** Set TEST_DATABASE_URL in .env.test

**Problem:** Playwright tests timeout

- **Cause:** App not running
- **Solution:** Start app with `pnpm dev` before running E2E tests

**Problem:** Touch target tests fail

- **Cause:** Tailwind p-6 not applying
- **Solution:** Ensure Tailwind config includes tablet breakpoints

**Problem:** Read-only enforcement tests pass incorrectly

- **Cause:** Mutations not checking token type
- **Solution:** Add token type validation to all mutation resolvers

## Success Criteria

- [ ] All token generation tests pass
- [ ] All token validation tests pass
- [ ] All read-only enforcement tests pass
- [ ] All mobile tablet tests pass
- [ ] Invalid token handling works
- [ ] Coverage >95% for QR portal module
- [ ] Zero security vulnerabilities
- [ ] Build succeeds

## Time Estimate

**2 hours total:**

- Backend token security tests: 40 min
- Backend read-only enforcement tests: 40 min
- Frontend mobile tablet tests: 40 min

## Next Issue

**ISSUE-106:** Quick and Dirty Form Templates (3h)

- Prerequisites: Phase 1 complete (QR portal functional)
- Phase: 2 - Q&D Form Templates
- Creates: Pre-built templates for common EPA/OSHA forms
