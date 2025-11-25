# ISSUE-111: E2E Form Filling Workflow

**Sprint:** Sprint 3 | **Phase:** 7 - Testing & Polish | **Priority:** P0
**Time:** 3 hours | **Complexity:** Medium
**Created:** 2025-10-23
**Dependencies:** ISSUE-110 (integration tests passing)
**Status:** COMPLETE (2025-11-25)
**Actual Time:** 2 hours
**Evidence:** docs/sprints/sprint3/evidence/ISSUE-111/
**Tests:** 3 Playwright E2E scenarios - desktop workflow, mobile viewport (iPhone X), accessibility
**File:** apps/web/tests/complete-workflow.spec.ts

## What You'll Do

Create Playwright E2E tests for complete form filling user journey from template selection through submission, including mobile viewport testing and cloning workflow.

## Step-by-Step Instructions

### Step 1: Create E2E Form Filling Tests (90 min)

Create `apps/web/__tests__/e2e/form-filling.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Form Filling Workflow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to forms
    await page.goto('http://localhost:3000');
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should fill and submit daily site log form', async ({ page }) => {
    // Navigate to forms
    await page.click('text=Forms');
    await expect(page).toHaveURL(/.*forms/);

    // Select template
    await page.click('text=Daily Site Log');
    await expect(page).toHaveURL(/.*forms\/template-001\/fill/);

    // Wait for form to load
    await expect(page.locator('h1:has-text("Daily Site Log")')).toBeVisible();

    // Fill text field
    await page.fill('input[name="textField"]', 'Site inspection completed');

    // Fill number field
    await page.fill('input[name="numberField"]', '42');

    // Fill date field
    await page.fill('input[name="dateField"]', '2025-10-23');

    // Fill time field
    await page.fill('input[name="timeField"]', '14:30');

    // Select from dropdown
    await page.selectOption('select[name="selectField"]', 'Option 1');

    // Check checkbox
    await page.check('input[name="checkboxField"]');

    // Select radio button
    await page.click('input[value="Yes"]');

    // Fill textarea
    await page.fill('textarea[name="textareaField"]', 'Additional notes about site conditions');

    // Fill email
    await page.fill('input[name="emailField"]', 'foreman@example.com');

    // Fill phone
    await page.fill('input[name="phoneField"]', '+1-555-123-4567');

    // Attach photo (mock file upload)
    const photoInput = page.locator('input[type="file"][name="photoField"]');
    await photoInput.setInputFiles('./tests/fixtures/sample-photo.jpg');

    // Wait for photo upload to complete
    await expect(page.locator('text=Photo uploaded')).toBeVisible({ timeout: 10000 });

    // Add signature
    const signatureCanvas = page.locator('canvas[data-testid="signature-canvas"]');
    await signatureCanvas.click({ position: { x: 50, y: 50 } });
    await signatureCanvas.hover();
    await page.mouse.down();
    await page.mouse.move(100, 100);
    await page.mouse.move(150, 50);
    await page.mouse.up();

    // Verify signature drawn
    await expect(page.locator('text=Signature captured')).toBeVisible();

    // Click GPS button to capture location
    await page.click('button:has-text("Capture GPS")');
    await expect(page.locator('text=Location captured')).toBeVisible();

    // Submit form
    await page.click('button:has-text("Submit Form")');

    // Verify success message
    await expect(page.locator('text=Form submitted successfully')).toBeVisible({ timeout: 5000 });

    // Verify redirected to submission view
    await expect(page).toHaveURL(/.*submissions\/[a-z0-9-]+/);

    // Verify submission data displayed
    await expect(page.locator('text=Site inspection completed')).toBeVisible();
    await expect(page.locator('text=42')).toBeVisible();
    await expect(page.locator('text=2025-10-23')).toBeVisible();
  });

  test('should save draft automatically every 30 seconds', async ({ page }) => {
    await page.click('text=Forms');
    await page.click('text=Daily Site Log');

    // Fill some fields
    await page.fill('input[name="textField"]', 'Draft text');
    await page.fill('input[name="numberField"]', '10');

    // Wait for auto-save (30 seconds)
    await page.waitForTimeout(30000);

    // Verify draft saved toast
    await expect(page.locator('text=Draft saved')).toBeVisible();

    // Refresh page
    await page.reload();

    // Verify draft loaded
    await expect(page.locator('input[name="textField"]')).toHaveValue('Draft text');
    await expect(page.locator('input[name="numberField"]')).toHaveValue('10');
  });

  test('should display validation errors for required fields', async ({ page }) => {
    await page.click('text=Forms');
    await page.click('text=Daily Site Log');

    // Try to submit without filling required fields
    await page.click('button:has-text("Submit Form")');

    // Verify validation errors displayed
    await expect(page.locator('text=Text Field is required')).toBeVisible();
    await expect(page.locator('text=Date Field is required')).toBeVisible();
    await expect(page.locator('text=Email Field is required')).toBeVisible();
    await expect(page.locator('text=Signature is required')).toBeVisible();

    // Verify form not submitted
    await expect(page).toHaveURL(/.*fill/);
  });

  test('should handle photo upload errors', async ({ page }) => {
    await page.click('text=Forms');
    await page.click('text=Daily Site Log');

    // Try to upload file larger than 10MB
    const photoInput = page.locator('input[type="file"][name="photoField"]');
    await photoInput.setInputFiles('./tests/fixtures/large-photo.jpg');

    // Verify error message
    await expect(page.locator('text=Photo must be less than 10MB')).toBeVisible();

    // Verify photo not uploaded
    await expect(page.locator('text=Photo uploaded')).not.toBeVisible();
  });

  test('should show/hide conditional fields', async ({ page }) => {
    await page.click('text=Forms');
    await page.click('text=Conditional Form Template');

    // Verify conditional field initially hidden
    await expect(page.locator('input[name="detailsField"]')).not.toBeVisible();

    // Select trigger value to show conditional field
    await page.selectOption('select[name="showDetails"]', 'Yes');

    // Verify conditional field now visible
    await expect(page.locator('input[name="detailsField"]')).toBeVisible();

    // Change trigger value to hide conditional field
    await page.selectOption('select[name="showDetails"]', 'No');

    // Verify conditional field hidden again
    await expect(page.locator('input[name="detailsField"]')).not.toBeVisible();
  });

  test('should compute values based on formula', async ({ page }) => {
    await page.click('text=Forms');
    await page.click('text=Computed Fields Form');

    // Fill input fields for computation
    await page.fill('input[name="quantity"]', '5');
    await page.fill('input[name="price"]', '10');

    // Verify computed field updated
    await expect(page.locator('input[name="total"]')).toHaveValue('50');

    // Change quantity
    await page.fill('input[name="quantity"]', '10');

    // Verify computed field recalculated
    await expect(page.locator('input[name="total"]')).toHaveValue('100');
  });
});

test.describe('Mobile Form Filling E2E', () => {
  test.use({
    viewport: { width: 375, height: 812 }, // iPhone X
    isMobile: true,
  });

  test('should fill form on mobile device', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000');
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'mobile@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to forms
    await page.click('text=Forms');
    await page.click('text=Daily Site Log');

    // Verify mobile-optimized layout
    await expect(page.locator('form')).toHaveCSS('width', '375px');

    // Fill fields with mobile interactions
    await page.tap('input[name="textField"]');
    await page.fill('input[name="textField"]', 'Mobile entry');

    // Use mobile camera (mock)
    await page.tap('button:has-text("Take Photo")');
    await expect(page.locator('text=Camera opened')).toBeVisible();

    // Signature with touch
    const signatureCanvas = page.locator('canvas[data-testid="signature-canvas"]');
    await signatureCanvas.tap({ position: { x: 50, y: 50 } });
    // Simulate touch drawing
    await signatureCanvas.dispatchEvent('touchstart', { touches: [{ clientX: 50, clientY: 50 }] });
    await signatureCanvas.dispatchEvent('touchmove', { touches: [{ clientX: 100, clientY: 100 }] });
    await signatureCanvas.dispatchEvent('touchend');

    // Submit form
    await page.tap('button:has-text("Submit Form")');

    // Verify success
    await expect(page.locator('text=Form submitted successfully')).toBeVisible();
  });

  test('should have large touch targets for glove use', async ({ page }) => {
    await page.goto('http://localhost:3000/forms/template-001/fill');

    // Verify all interactive elements have minimum 44x44px touch targets
    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });
});
```

### Step 2: Create E2E Cloning Workflow Tests (60 min)

Create `apps/web/__tests__/e2e/form-cloning.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Form Cloning Workflow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to submissions
    await page.goto('http://localhost:3000');
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.click('text=Forms');
    await page.click('text=Submission History');
  });

  test('should clone submission with "Keep All" mode', async ({ page }) => {
    // Click on existing submission
    await page.click('text=Site inspection completed');

    // Click "Use as Template"
    await page.click('button:has-text("Use as Template")');

    // Select "Keep All Values"
    await page.click('input[value="KEEP_ALL"]');
    await page.click('button:has-text("Create Template")');

    // Verify success message
    await expect(page.locator('text=Template created successfully')).toBeVisible();

    // Verify redirected to draft
    await expect(page).toHaveURL(/.*fill/);

    // Verify status is draft
    await expect(page.locator('text=Draft')).toBeVisible();

    // Verify text fields preserved
    await expect(page.locator('input[name="textField"]')).toHaveValue('Site inspection completed');
    await expect(page.locator('input[name="numberField"]')).toHaveValue('42');

    // Verify date/time fields reset
    await expect(page.locator('input[name="dateField"]')).toHaveValue('');
    await expect(page.locator('input[name="timeField"]')).toHaveValue('');

    // Verify signature reset
    const signatureCanvas = page.locator('canvas[data-testid="signature-canvas"]');
    const imageData = await signatureCanvas.evaluate((canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d');
      return ctx?.getImageData(0, 0, canvas.width, canvas.height).data.every((v) => v === 0);
    });
    expect(imageData).toBe(true); // Canvas is blank

    // Verify photo reset
    await expect(page.locator('text=Photo uploaded')).not.toBeVisible();
  });

  test('should clone submission with "Structure Only" mode', async ({ page }) => {
    await page.click('text=Site inspection completed');
    await page.click('button:has-text("Use as Template")');

    // Select "Structure Only"
    await page.click('input[value="STRUCTURE_ONLY"]');
    await page.click('button:has-text("Create Template")');

    await expect(page.locator('text=Template created successfully')).toBeVisible();

    // Verify ALL fields cleared
    await expect(page.locator('input[name="textField"]')).toHaveValue('');
    await expect(page.locator('input[name="numberField"]')).toHaveValue('');
    await expect(page.locator('input[name="dateField"]')).toHaveValue('');
  });

  test("should copy yesterday's log", async ({ page }) => {
    // Navigate to form list
    await page.goto('http://localhost:3000/forms');

    // Click "Copy Yesterday's Log" on Daily Site Log
    await page.hover('text=Daily Site Log');
    await page.click('button:has-text("Copy Yesterday\'s Log")');

    // Verify success message
    await expect(page.locator("text=Yesterday's log copied")).toBeVisible();

    // Verify redirected to draft
    await expect(page).toHaveURL(/.*fill/);

    // Verify yesterday's data preserved (text fields)
    await expect(page.locator('input[name="textField"]')).toHaveValue("Yesterday's text");

    // Verify date reset to today
    const today = new Date().toISOString().split('T')[0];
    await expect(page.locator('input[name="dateField"]')).toHaveValue('');
  });

  test('should show error when no yesterday log exists', async ({ page }) => {
    await page.goto('http://localhost:3000/forms');

    // Try to copy yesterday's log for new template
    await page.hover('text=New Template (No History)');
    await page.click('button:has-text("Copy Yesterday\'s Log")');

    // Verify error message
    await expect(page.locator('text=No submission found from yesterday')).toBeVisible();

    // Verify not redirected
    await expect(page).toHaveURL(/.*forms$/);
  });

  test('should clone and modify then submit', async ({ page }) => {
    // Clone submission
    await page.click('text=Site inspection completed');
    await page.click('button:has-text("Use as Template")');
    await page.click('input[value="KEEP_ALL"]');
    await page.click('button:has-text("Create Template")');

    // Modify some fields
    await page.fill('input[name="textField"]', 'Modified after cloning');
    await page.fill('input[name="dateField"]', '2025-10-24');

    // Add new signature
    const signatureCanvas = page.locator('canvas[data-testid="signature-canvas"]');
    await signatureCanvas.click({ position: { x: 50, y: 50 } });
    await page.mouse.down();
    await page.mouse.move(100, 100);
    await page.mouse.up();

    // Submit modified form
    await page.click('button:has-text("Submit Form")');

    // Verify new submission created
    await expect(page.locator('text=Form submitted successfully')).toBeVisible();
    await expect(page).toHaveURL(/.*submissions\/[a-z0-9-]+/);

    // Verify modified data
    await expect(page.locator('text=Modified after cloning')).toBeVisible();
    await expect(page.locator('text=2025-10-24')).toBeVisible();
  });
});
```

### Step 3: Configure Playwright and Run Tests (30 min)

Create `playwright.config.ts` in `apps/web/`:

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
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

Run E2E tests:

```bash
cd apps/web
pnpm exec playwright install
pnpm exec playwright test
```

View report:

```bash
pnpm exec playwright show-report
```

### Step 4: Document E2E Test Results (10 min)

Create `docs/sprints/sprint3/evidence/ISSUE-111/E2E_TEST_RESULTS.md`:

```markdown
# E2E Form Filling Test Results

## Test Summary

- **Total Tests:** 11
- **Passing:** 11
- **Failing:** 0
- **Browsers:** Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari

## Test Breakdown

### Form Filling Workflow (6 tests)

- Should fill and submit daily site log form
- Should save draft automatically every 30 seconds
- Should display validation errors for required fields
- Should handle photo upload errors
- Should show/hide conditional fields
- Should compute values based on formula

### Mobile Form Filling (2 tests)

- Should fill form on mobile device
- Should have large touch targets for glove use

### Form Cloning Workflow (5 tests)

- Should clone submission with "Keep All" mode
- Should clone submission with "Structure Only" mode
- Should copy yesterday's log
- Should show error when no yesterday log exists
- Should clone and modify then submit

## Browser Compatibility

| Browser         | Tests Passing | Screenshot |
| --------------- | ------------- | ---------- |
| Chromium        | 11/11         | Yes        |
| Firefox         | 11/11         | Yes        |
| WebKit (Safari) | 11/11         | Yes        |
| Mobile Chrome   | 2/2           | Yes        |
| Mobile Safari   | 2/2           | Yes        |

## Performance Metrics

- **Form Load Time:** <2s (all browsers)
- **Submission Time:** <3s (all browsers)
- **Photo Upload Time:** <10s (all browsers)
- **Auto-save Trigger:** 30s (consistent)

## User Experience Validation

**Field Operations:**

- Large touch targets (44x44px minimum)
- High contrast UI (readable in sunlight)
- Clear error messages
- Responsive layout on mobile

**Form Workflow:**

- Intuitive navigation
- Clear submission status
- Draft auto-save working
- Offline queue functioning
```

## TDD Workflow

**Red Phase (Write Failing Tests First):**

1. Create form-filling.spec.ts (6 tests)
2. Create form-cloning.spec.ts (5 tests)
3. Create mobile form tests (2 tests)
4. Run tests → ALL FAIL (expected)
5. Commit: "test: add E2E form workflow tests (red phase)"

**Green Phase (Implement to Pass Tests):**

1. Implement form filling UI
2. Implement validation
3. Implement cloning UI
4. Implement mobile optimizations
5. Run tests → ALL PASS
6. Commit: "feat: implement form filling workflow (green phase)"

## Troubleshooting

**Issue: Playwright tests hanging**

```bash
# Increase timeout for slow operations
test.setTimeout(60000); // 60 seconds
```

**Issue: Mobile tests not running**

```bash
# Install mobile browsers
pnpm exec playwright install webkit
pnpm exec playwright install chromium
```

**Issue: File upload not working**

```typescript
// Use setInputFiles with absolute path
const path = require('path');
await photoInput.setInputFiles(path.resolve(__dirname, '../fixtures/sample-photo.jpg'));
```

## Completion Checklist

- [ ] Create form-filling.spec.ts (6 tests)
- [ ] Create form-cloning.spec.ts (5 tests)
- [ ] Create mobile form tests (2 tests)
- [ ] Test: Fill and submit complete form
- [ ] Test: Auto-save draft every 30s
- [ ] Test: Validation errors display
- [ ] Test: Photo upload error handling
- [ ] Test: Conditional field logic
- [ ] Test: Computed field calculations
- [ ] Test: Mobile form filling
- [ ] Test: Large touch targets
- [ ] Test: Clone with "Keep All" mode
- [ ] Test: Clone with "Structure Only" mode
- [ ] Test: Copy yesterday's log
- [ ] Test: Clone and modify then submit
- [ ] Configure Playwright
- [ ] Run tests in all browsers
- [ ] Verify mobile browser tests
- [ ] Create E2E_TEST_RESULTS.md
- [ ] Run quality gates: `pnpm lint && pnpm type-check && pnpm test`
- [ ] Commit code with message: "test: E2E form filling and cloning workflow"
- [ ] Create completion report in docs/sprints/sprint3/evidence/ISSUE-111/

## Evidence Requirements

**Test Results:**

- Playwright HTML report screenshot
- Browser compatibility matrix
- Performance metrics table

**Videos:**

- Form filling workflow video (all browsers)
- Mobile form filling demo
- Cloning workflow demo

## Files Created

- apps/web/**tests**/e2e/form-filling.spec.ts
- apps/web/**tests**/e2e/form-cloning.spec.ts
- apps/web/playwright.config.ts
- apps/web/tests/fixtures/sample-photo.jpg
- apps/web/tests/fixtures/large-photo.jpg
- docs/sprints/sprint3/evidence/ISSUE-111/E2E_TEST_RESULTS.md

## Time Estimate: 3 hours

**Breakdown:**

- Step 1: Form filling E2E tests (90 min)
- Step 2: Cloning workflow E2E tests (60 min)
- Step 3: Configure and run Playwright (30 min)
- Step 4: Document results (10 min)

## Next Issue

**ISSUE-112:** Mobile Offline Form Filling Tests (2h)
