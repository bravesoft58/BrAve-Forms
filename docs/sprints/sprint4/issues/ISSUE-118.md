# ISSUE-118: E2E QR Portal Flow with Playwright MCP

**Sprint:** Sprint 4 | **Phase:** 3 - Testing & Polish | **Priority:** P0
**Time:** 3 hours | **Complexity:** Medium
**Created:** 2025-10-23
**Dependencies:** Phase 2 complete (all templates ready)
**Status:** COMPLETE (2025-11-27)

## What You'll Do

Create comprehensive end-to-end tests using Playwright MCP for the complete QR inspector portal workflow: token generation, QR code scanning, submission viewing, photo gallery, token expiration, and read-only enforcement.

## Prerequisites

- [ ] Phase 2 complete (ISSUE-100 through ISSUE-117)
- [ ] QR portal functional and deployed
- [ ] Playwright installed and configured
- [ ] Test project has form submissions with photos

## Step-by-Step Instructions

### Step 1: Install Playwright MCP (15 min)

```bash
cd apps/web
pnpm add -D @playwright/test
pnpm create playwright

# Answer prompts:
# - TypeScript: Yes
# - Test directory: __tests__/e2e
# - GitHub Actions: No (manual CI/CD)
# - Install browsers: Yes
```

Create playwright.config.ts:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:30102',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
    { name: 'Tablet', use: { ...devices['iPad Pro'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:30102',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Step 2: Create QR Portal E2E Test Suite (2h 30min)

Create `apps/web/__tests__/e2e/qr-portal-flow.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('QR Inspector Portal E2E Flow', () => {
  let adminToken: string;
  let qrTokenUrl: string;
  let projectId: string;

  test.beforeAll(async ({ request }) => {
    // Setup: Create test project with submissions
    const response = await request.post('/api/test-setup', {
      data: {
        projectName: 'Test Highway Project',
        templates: ['NDOT SWPPP Template'],
        submissions: 5,
        photosPerSubmission: 3,
      },
    });
    const data = await response.json();
    projectId = data.projectId;
    adminToken = data.adminToken;
  });

  test('Step 1: Admin generates QR token', async ({ page }) => {
    // Login as admin
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to project QR page
    await page.goto(`/projects/${projectId}/qr`);
    await expect(page.locator('h1:has-text("QR Inspector Portal")')).toBeVisible();

    // Generate QR code
    await page.click('button:has-text("Generate QR Code")');
    await page.waitForSelector('[data-testid="qr-code-canvas"]');

    // Extract token URL from QR code metadata
    const tokenUrlElement = page.locator('[data-testid="qr-token-url"]');
    qrTokenUrl = await tokenUrlElement.textContent();
    expect(qrTokenUrl).toContain('/inspector/');

    // Screenshot QR code for evidence
    await page.screenshot({ path: 'evidence/ISSUE-118/qr-code-generated.png' });
  });

  test('Step 2: Inspector accesses portal via QR token (no auth)', async ({ page, context }) => {
    // Open new incognito context (no auth)
    const incognitoContext = await context.browser().newContext();
    const incognitoPage = await incognitoContext.newPage();

    // Access inspector portal via token URL (no login required)
    await incognitoPage.goto(qrTokenUrl);

    // Verify inspector portal loads
    await expect(incognitoPage.locator('h1:has-text("Inspector Portal")')).toBeVisible();
    await expect(incognitoPage.locator('text=Read-Only Access')).toBeVisible();

    // Verify project information displayed
    await expect(incognitoPage.locator('text=Test Highway Project')).toBeVisible();

    // Screenshot inspector portal
    await incognitoPage.screenshot({ path: 'evidence/ISSUE-118/inspector-portal-loaded.png' });

    await incognitoContext.close();
  });

  test('Step 3: Inspector views submissions (read-only)', async ({ page, context }) => {
    const incognitoContext = await context.browser().newContext();
    const incognitoPage = await incognitoContext.newPage();
    await incognitoPage.goto(qrTokenUrl);

    // Click Submissions tab
    await incognitoPage.click('a:has-text("Submissions")');

    // Verify submissions list loads
    const submissionRows = incognitoPage.locator('[data-testid="submission-row"]');
    await expect(submissionRows).toHaveCount(5); // 5 test submissions

    // Verify NO edit/delete buttons (read-only enforcement)
    await expect(incognitoPage.locator('button:has-text("Edit")')).not.toBeVisible();
    await expect(incognitoPage.locator('button:has-text("Delete")')).not.toBeVisible();

    // Verify Create button not present
    await expect(incognitoPage.locator('button:has-text("Create")')).not.toBeVisible();

    // Screenshot read-only submissions
    await incognitoPage.screenshot({ path: 'evidence/ISSUE-118/submissions-read-only.png' });

    await incognitoContext.close();
  });

  test('Step 4: Inspector views submission details', async ({ page, context }) => {
    const incognitoContext = await context.browser().newContext();
    const incognitoPage = await incognitoContext.newPage();
    await incognitoPage.goto(qrTokenUrl);

    // Navigate to submissions
    await incognitoPage.click('a:has-text("Submissions")');

    // Click first submission
    await incognitoPage.click('[data-testid="submission-row"]:first-child');

    // Verify submission details page loads
    await expect(incognitoPage.locator('h2:has-text("Submission Details")')).toBeVisible();

    // Verify form fields displayed (read-only)
    const formFields = incognitoPage.locator('[data-testid="form-field"]');
    await expect(formFields.count()).toBeGreaterThan(0);

    // Verify all inputs are disabled (read-only)
    const inputs = incognitoPage.locator('input, textarea, select');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      await expect(inputs.nth(i)).toBeDisabled();
    }

    // Screenshot submission details
    await incognitoPage.screenshot({ path: 'evidence/ISSUE-118/submission-details.png' });

    await incognitoContext.close();
  });

  test('Step 5: Inspector views photo gallery', async ({ page, context }) => {
    const incognitoContext = await context.browser().newContext();
    const incognitoPage = await incognitoContext.newPage();
    await incognitoPage.goto(qrTokenUrl);

    // Navigate to submissions
    await incognitoPage.click('a:has-text("Submissions")');
    await incognitoPage.click('[data-testid="submission-row"]:first-child');

    // Verify photo gallery section
    await expect(incognitoPage.locator('[data-testid="photo-gallery"]')).toBeVisible();

    // Verify 3 photos present (test data)
    const photos = incognitoPage.locator('[data-testid="photo-thumbnail"]');
    await expect(photos).toHaveCount(3);

    // Click first photo to open lightbox
    await photos.first().click();
    await expect(incognitoPage.locator('[data-testid="photo-lightbox"]')).toBeVisible();

    // Verify GPS metadata displayed
    await expect(incognitoPage.locator('text=GPS:')).toBeVisible();
    await expect(incognitoPage.locator('text=Timestamp:')).toBeVisible();

    // Screenshot lightbox
    await incognitoPage.screenshot({ path: 'evidence/ISSUE-118/photo-lightbox.png' });

    // Close lightbox
    await incognitoPage.keyboard.press('Escape');
    await expect(incognitoPage.locator('[data-testid="photo-lightbox"]')).not.toBeVisible();

    await incognitoContext.close();
  });

  test('Step 6: Test token expiration (24 hours)', async ({ page, context }) => {
    const incognitoContext = await context.browser().newContext();
    const incognitoPage = await incognitoContext.newPage();

    // Mock system time to 25 hours in future
    await incognitoPage.addInitScript(() => {
      const originalDate = Date;
      // @ts-ignore
      Date = class extends originalDate {
        constructor() {
          super();
          return new originalDate(originalDate.now() + 25 * 60 * 60 * 1000);
        }
        static now() {
          return originalDate.now() + 25 * 60 * 60 * 1000;
        }
      };
    });

    // Try to access inspector portal with expired token
    await incognitoPage.goto(qrTokenUrl);

    // Verify token expiration message
    await expect(incognitoPage.locator('text=Token expired')).toBeVisible();
    await expect(incognitoPage.locator('text=Please request a new QR code')).toBeVisible();

    // Verify submissions NOT accessible
    await expect(incognitoPage.locator('a:has-text("Submissions")')).not.toBeVisible();

    // Screenshot expiration error
    await incognitoPage.screenshot({ path: 'evidence/ISSUE-118/token-expired.png' });

    await incognitoContext.close();
  });

  test('Step 7: Test token regeneration invalidates old token', async ({ page }) => {
    // Login as admin
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to project QR page
    await page.goto(`/projects/${projectId}/qr`);

    // Click Regenerate QR Code
    await page.click('button:has-text("Regenerate QR Code")');
    await page.waitForSelector('[data-testid="qr-code-canvas"]');

    // Extract NEW token URL
    const newTokenUrlElement = page.locator('[data-testid="qr-token-url"]');
    const newTokenUrl = await newTokenUrlElement.textContent();

    // Verify new token URL is different
    expect(newTokenUrl).not.toBe(qrTokenUrl);

    // Try to access OLD token URL (should fail)
    const incognitoContext = await page.context().browser().newContext();
    const incognitoPage = await incognitoContext.newPage();
    await incognitoPage.goto(qrTokenUrl); // Old token

    // Verify old token invalid
    await expect(incognitoPage.locator('text=Token invalid')).toBeVisible();

    // Verify NEW token works
    await incognitoPage.goto(newTokenUrl);
    await expect(incognitoPage.locator('h1:has-text("Inspector Portal")')).toBeVisible();

    await incognitoContext.close();
  });

  test('Step 8: Test mobile tablet viewport (iPad)', async ({ page, context }) => {
    // Create iPad context
    const ipadContext = await context.browser().newContext({
      ...devices['iPad Pro'],
    });
    const ipadPage = await ipadContext.newPage();

    // Access inspector portal on tablet
    await ipadPage.goto(qrTokenUrl);

    // Verify responsive layout
    await expect(ipadPage.locator('h1:has-text("Inspector Portal")')).toBeVisible();

    // Check touch-friendly targets (48px minimum)
    const buttons = ipadPage.locator('button, a');
    const count = await buttons.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const boundingBox = await buttons.nth(i).boundingBox();
      if (boundingBox) {
        expect(boundingBox.height).toBeGreaterThanOrEqual(48);
        expect(boundingBox.width).toBeGreaterThanOrEqual(48);
      }
    }

    // Screenshot tablet view
    await ipadPage.screenshot({ path: 'evidence/ISSUE-118/ipad-view.png' });

    await ipadContext.close();
  });

  test('Step 9: Test network inspection (no GraphQL mutations allowed)', async ({
    page,
    context,
  }) => {
    const incognitoContext = await context.browser().newContext();
    const incognitoPage = await incognitoContext.newPage();

    // Monitor network requests
    const mutations: string[] = [];
    incognitoPage.on('request', (request) => {
      if (request.url().includes('/graphql') && request.method() === 'POST') {
        const postData = request.postDataJSON();
        if (postData?.query?.includes('mutation')) {
          mutations.push(postData.query);
        }
      }
    });

    // Access inspector portal
    await incognitoPage.goto(qrTokenUrl);
    await incognitoPage.click('a:has-text("Submissions")');

    // Wait for page to fully load
    await incognitoPage.waitForTimeout(2000);

    // Verify NO mutations sent (read-only queries only)
    expect(mutations.length).toBe(0);

    await incognitoContext.close();
  });

  test.afterAll(async ({ request }) => {
    // Cleanup: Delete test project
    await request.delete(`/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  });
});
```

### Step 3: Run E2E Tests and Collect Evidence (15 min)

```bash
cd apps/web
pnpm exec playwright test --project=chromium
pnpm exec playwright test --project="Mobile Safari"
pnpm exec playwright test --project="Tablet"

# Generate HTML report
pnpm exec playwright show-report
```

Collect evidence screenshots:

- evidence/ISSUE-118/qr-code-generated.png
- evidence/ISSUE-118/inspector-portal-loaded.png
- evidence/ISSUE-118/submissions-read-only.png
- evidence/ISSUE-118/submission-details.png
- evidence/ISSUE-118/photo-lightbox.png
- evidence/ISSUE-118/token-expired.png
- evidence/ISSUE-118/ipad-view.png
- evidence/ISSUE-118/test-results.png (HTML report screenshot)

## Files Created

- apps/web/playwright.config.ts
- apps/web/**tests**/e2e/qr-portal-flow.spec.ts
- evidence/ISSUE-118/ (8 screenshots)

## Verification Checklist

- [ ] Playwright installed and configured
- [ ] 9 E2E test cases passing
- [ ] QR token generation tested
- [ ] Inspector portal access (no auth) tested
- [ ] Read-only enforcement verified
- [ ] Photo gallery lightbox tested
- [ ] Token expiration tested (24 hours)
- [ ] Token regeneration invalidation tested
- [ ] Mobile tablet viewport tested
- [ ] Network inspection (no mutations) tested
- [ ] Evidence screenshots collected

## Evidence Requirements

**Location:** evidence/ISSUE-118/

**Required:**

- test-results/
  - qr-code-generated.png
  - inspector-portal-loaded.png
  - submissions-read-only.png
  - submission-details.png
  - photo-lightbox.png
  - token-expired.png
  - ipad-view.png
  - test-results.png (HTML report)
  - playwright-html-report/ (full report)

## Success Criteria

- [ ] All 9 E2E tests passing
- [ ] QR portal workflow functional
- [ ] Token expiration verified (24 hours)
- [ ] Read-only enforcement validated
- [ ] Mobile tablet responsive
- [ ] Evidence screenshots collected

## Time Estimate

**3 hours total:**

- Install Playwright MCP: 15 min
- Create E2E test suite: 2h 30min
- Run tests and collect evidence: 15 min

## Next Issue

**ISSUE-119:** E2E Form Filling Flow with Playwright MCP (4h)

- Prerequisites: ISSUE-118 (E2E infrastructure ready)
- Phase: 3 - Testing & Polish
- Tests complete form filling workflow with all 15 field types
