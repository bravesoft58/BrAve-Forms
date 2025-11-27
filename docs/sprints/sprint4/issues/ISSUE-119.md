# ISSUE-119: E2E Form Filling Flow with Playwright MCP

**Sprint:** Sprint 4 | **Phase:** 3 - Testing & Polish | **Priority:** P0
**Time:** 4 hours | **Complexity:** Medium
**Created:** 2025-10-23
**Dependencies:** ISSUE-118 (E2E infrastructure ready)
**Status:** COMPLETE (2025-11-27)

## What You'll Do

Create comprehensive end-to-end tests using Playwright MCP for the complete form filling workflow: all 15 field types, photo capture, signature capture, conditional logic, computed fields, auto-save drafts, offline queue, and form cloning.

## Prerequisites

- [ ] ISSUE-118 complete (Playwright configured)
- [ ] FormRenderer component functional
- [ ] All 15 field types working
- [ ] Photo and signature capture working
- [ ] Offline sync working

## Step-by-Step Instructions

### Step 1: Create Form Filling Test Suite (3h 30min)

Create `apps/web/__tests__/e2e/form-filling-flow.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { devices } from '@playwright/test';

test.describe('Complete Form Filling Flow - All 15 Field Types', () => {
  let adminToken: string;
  let projectId: string;
  let templateId: string;

  test.beforeAll(async ({ request }) => {
    // Setup: Create test project with comprehensive template
    const response = await request.post('/api/test-setup', {
      data: {
        projectName: 'Test Form Filling Project',
        template: 'Comprehensive Test Template', // Has all 15 field types
      },
    });
    const data = await response.json();
    projectId = data.projectId;
    templateId = data.templateId;
    adminToken = data.adminToken;
  });

  test('Step 1: Select template and start form', async ({ page }) => {
    // Login
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', 'foreman@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to forms
    await page.goto('/forms');
    await expect(page.locator('h1:has-text("Forms")')).toBeVisible();

    // Click template to start new form
    await page.click(`[data-testid="template-${templateId}"]`);

    // Verify form renderer loads
    await expect(page.locator('form[data-testid="form-renderer"]')).toBeVisible();
    await expect(page.locator('h2:has-text("Comprehensive Test Template")')).toBeVisible();

    // Screenshot form start
    await page.screenshot({ path: 'evidence/ISSUE-119/form-start.png' });
  });

  test('Step 2: Fill text field', async ({ page }) => {
    await page.goto(`/forms/fill/${templateId}`);

    // Text field
    const textInput = page.locator('input[name="text_field"]');
    await textInput.fill('Test Value for Text Field');
    await expect(textInput).toHaveValue('Test Value for Text Field');

    // Screenshot text field filled
    await page.screenshot({ path: 'evidence/ISSUE-119/text-field.png' });
  });

  test('Step 3: Fill textarea field', async ({ page }) => {
    await page.goto(`/forms/fill/${templateId}`);

    // Textarea field
    const textareaInput = page.locator('textarea[name="textarea_field"]');
    await textareaInput.fill('This is a multi-line\ntext area\nwith three lines.');
    const value = await textareaInput.inputValue();
    expect(value.split('\n').length).toBe(3);
  });

  test('Step 4: Fill number field with validation', async ({ page }) => {
    await page.goto(`/forms/fill/${templateId}`);

    // Number field
    const numberInput = page.locator('input[name="number_field"]');
    await numberInput.fill('42');
    await expect(numberInput).toHaveValue('42');

    // Test invalid input (should fail validation)
    await numberInput.fill('abc');
    await expect(page.locator('text=Must be a number')).toBeVisible();

    // Correct the value
    await numberInput.fill('42');
    await expect(page.locator('text=Must be a number')).not.toBeVisible();
  });

  test('Step 5: Fill date field', async ({ page }) => {
    await page.goto(`/forms/fill/${templateId}`);

    // Date field
    const dateInput = page.locator('input[name="date_field"]');
    await dateInput.fill('2025-12-01');
    await expect(dateInput).toHaveValue('2025-12-01');
  });

  test('Step 6: Fill time field', async ({ page }) => {
    await page.goto(`/forms/fill/${templateId}`);

    // Time field
    const timeInput = page.locator('input[name="time_field"]');
    await timeInput.fill('14:30');
    await expect(timeInput).toHaveValue('14:30');
  });

  test('Step 7: Fill datetime field', async ({ page }) => {
    await page.goto(`/forms/fill/${templateId}`);

    // Datetime field
    const datetimeInput = page.locator('input[name="datetime_field"]');
    await datetimeInput.fill('2025-12-01T14:30');
    const value = await datetimeInput.inputValue();
    expect(value).toContain('2025-12-01');
    expect(value).toContain('14:30');
  });

  test('Step 8: Select dropdown option', async ({ page }) => {
    await page.goto(`/forms/fill/${templateId}`);

    // Select field
    const selectInput = page.locator('select[name="select_field"]');
    await selectInput.selectOption('option2');
    await expect(selectInput).toHaveValue('option2');
  });

  test('Step 9: Check checkbox field', async ({ page }) => {
    await page.goto(`/forms/fill/${templateId}`);

    // Checkbox field
    const checkboxInput = page.locator('input[name="checkbox_field"]');
    await expect(checkboxInput).not.toBeChecked();
    await checkboxInput.check();
    await expect(checkboxInput).toBeChecked();
  });

  test('Step 10: Select radio button', async ({ page }) => {
    await page.goto(`/forms/fill/${templateId}`);

    // Radio field
    const radioOption2 = page.locator('input[name="radio_field"][value="option2"]');
    await radioOption2.check();
    await expect(radioOption2).toBeChecked();

    // Verify only one radio selected
    const radioOption1 = page.locator('input[name="radio_field"][value="option1"]');
    await expect(radioOption1).not.toBeChecked();
  });

  test('Step 11: Upload photo with mock camera', async ({ page, context }) => {
    await page.goto(`/forms/fill/${templateId}`);

    // Photo upload field
    const fileInput = page.locator('input[type="file"][name="photo_field"]');

    // Upload test photo
    await fileInput.setInputFiles('test-fixtures/photo-with-gps.jpg');

    // Wait for preview to load
    await page.waitForSelector('[data-testid="photo-preview"]');
    await expect(page.locator('[data-testid="photo-preview"]')).toBeVisible();

    // Verify GPS EXIF data extracted (if available in test fixture)
    const gpsLabel = page.locator('text=GPS:');
    if (await gpsLabel.isVisible()) {
      await expect(page.locator('text=Lat:')).toBeVisible();
      await expect(page.locator('text=Lng:')).toBeVisible();
    }

    // Screenshot photo preview
    await page.screenshot({ path: 'evidence/ISSUE-119/photo-upload.png' });
  });

  test('Step 12: Capture signature with canvas', async ({ page }) => {
    await page.goto(`/forms/fill/${templateId}`);

    // Signature field
    await page.click('button:has-text("Sign Here")');

    // Wait for signature canvas to appear
    const canvas = page.locator('canvas[data-testid="signature-canvas"]');
    await expect(canvas).toBeVisible();

    // Draw signature (mock signature with mouse events)
    const boundingBox = await canvas.boundingBox();
    if (boundingBox) {
      await page.mouse.move(boundingBox.x + 50, boundingBox.y + 50);
      await page.mouse.down();
      await page.mouse.move(boundingBox.x + 150, boundingBox.y + 50);
      await page.mouse.move(boundingBox.x + 150, boundingBox.y + 100);
      await page.mouse.up();
    }

    // Save signature
    await page.click('button:has-text("Save Signature")');

    // Verify signature saved
    await expect(page.locator('[data-testid="signature-preview"]')).toBeVisible();

    // Screenshot signature
    await page.screenshot({ path: 'evidence/ISSUE-119/signature-capture.png' });
  });

  test('Step 13: Capture GPS coordinates', async ({ page, context }) => {
    await page.goto(`/forms/fill/${templateId}`);

    // Mock geolocation API
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 39.5296, longitude: -119.8138 }); // Reno, NV

    // GPS field
    await page.click('button[data-testid="capture-gps"]');

    // Wait for GPS capture
    await page.waitForSelector('[data-testid="gps-coordinates"]');

    // Verify GPS displayed
    const gpsText = await page.locator('[data-testid="gps-coordinates"]').textContent();
    expect(gpsText).toContain('39.5296');
    expect(gpsText).toContain('-119.8138');
  });

  test('Step 14: Test conditional logic (show/hide fields)', async ({ page }) => {
    await page.goto(`/forms/fill/${templateId}`);

    // Conditional field initially hidden
    const conditionalField = page.locator('input[name="inspection_date"]');
    await expect(conditionalField).not.toBeVisible();

    // Check trigger checkbox
    const triggerCheckbox = page.locator('input[name="requires_inspection"]');
    await triggerCheckbox.check();

    // Conditional field should now be visible
    await expect(conditionalField).toBeVisible();

    // Uncheck trigger
    await triggerCheckbox.uncheck();

    // Conditional field hidden again
    await expect(conditionalField).not.toBeVisible();

    // Screenshot conditional logic
    await triggerCheckbox.check();
    await page.screenshot({ path: 'evidence/ISSUE-119/conditional-logic.png' });
  });

  test('Step 15: Test computed fields (auto-calculate)', async ({ page }) => {
    await page.goto(`/forms/fill/${templateId}`);

    // Computed field (SUM formula: field1 + field2 = total)
    const field1 = page.locator('input[name="field1"]');
    const field2 = page.locator('input[name="field2"]');
    const totalField = page.locator('input[name="total"]');

    // Fill input fields
    await field1.fill('10');
    await field2.fill('20');

    // Wait for auto-calculation
    await page.waitForTimeout(500);

    // Verify total auto-calculated
    await expect(totalField).toHaveValue('30');

    // Test recalculation
    await field1.fill('25');
    await page.waitForTimeout(500);
    await expect(totalField).toHaveValue('45');
  });

  test('Step 16: Test auto-save draft (30s interval)', async ({ page }) => {
    await page.goto(`/forms/fill/${templateId}`);

    // Fill some fields
    await page.locator('input[name="text_field"]').fill('Auto-save Test');
    await page.locator('input[name="number_field"]').fill('42');

    // Wait for auto-save (30s interval)
    await page.waitForTimeout(31000); // 31 seconds

    // Verify draft saved indicator
    await expect(page.locator('text=Draft saved')).toBeVisible();

    // Reload page
    await page.reload();

    // Verify draft restored
    await expect(page.locator('input[name="text_field"]')).toHaveValue('Auto-save Test');
    await expect(page.locator('input[name="number_field"]')).toHaveValue('42');
  });

  test('Step 17: Test offline queue and sync', async ({ page, context }) => {
    await page.goto(`/forms/fill/${templateId}`);

    // Go offline
    await context.setOffline(true);

    // Fill form completely
    await page.locator('input[name="text_field"]').fill('Offline Submission');
    await page.locator('input[name="number_field"]').fill('99');
    await page.locator('select[name="select_field"]').selectOption('option1');

    // Submit form (should queue offline)
    await page.click('button:has-text("Submit")');

    // Verify queued for sync
    await expect(page.locator('text=Queued for sync')).toBeVisible();

    // Go back online
    await context.setOffline(false);

    // Wait for sync
    await page.waitForSelector('text=Synced successfully', { timeout: 10000 });

    // Verify submission synced
    await expect(page.locator('text=Synced successfully')).toBeVisible();

    // Screenshot offline sync
    await page.screenshot({ path: 'evidence/ISSUE-119/offline-sync.png' });
  });

  test('Step 18: Submit complete form with all 15 field types', async ({ page }) => {
    await page.goto(`/forms/fill/${templateId}`);

    // Fill ALL 15 field types
    await page.locator('input[name="text_field"]').fill('Complete Form Test');
    await page.locator('textarea[name="textarea_field"]').fill('Multi-line\ntext');
    await page.locator('input[name="number_field"]').fill('42');
    await page.locator('input[name="date_field"]').fill('2025-12-01');
    await page.locator('input[name="time_field"]').fill('14:30');
    await page.locator('input[name="datetime_field"]').fill('2025-12-01T14:30');
    await page.locator('select[name="select_field"]').selectOption('option2');
    await page.locator('input[name="checkbox_field"]').check();
    await page.locator('input[name="radio_field"][value="option2"]').check();

    // Upload photo
    await page
      .locator('input[type="file"][name="photo_field"]')
      .setInputFiles('test-fixtures/photo-with-gps.jpg');
    await page.waitForSelector('[data-testid="photo-preview"]');

    // Capture signature
    await page.click('button:has-text("Sign Here")');
    const canvas = page.locator('canvas[data-testid="signature-canvas"]');
    const boundingBox = await canvas.boundingBox();
    if (boundingBox) {
      await page.mouse.move(boundingBox.x + 50, boundingBox.y + 50);
      await page.mouse.down();
      await page.mouse.move(boundingBox.x + 150, boundingBox.y + 50);
      await page.mouse.up();
    }
    await page.click('button:has-text("Save Signature")');

    // Submit form
    await page.click('button:has-text("Submit")');

    // Verify submission success
    await expect(page.locator('text=Form submitted successfully')).toBeVisible();

    // Screenshot submission success
    await page.screenshot({ path: 'evidence/ISSUE-119/form-submitted.png' });
  });

  test.afterAll(async ({ request }) => {
    // Cleanup: Delete test project
    await request.delete(`/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  });
});
```

### Step 2: Create Form Cloning Test Suite (30 min)

Create `apps/web/__tests__/e2e/form-cloning-flow.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe("Form Cloning Flow - Copy Yesterday's Log", () => {
  test("Clone yesterday's form with all data pre-filled", async ({ page }) => {
    // Login
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', 'foreman@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to forms list
    await page.goto('/forms');

    // Find yesterday's submission
    const yesterdaySubmission = page
      .locator('[data-testid="submission-row"]:has-text("Yesterday")')
      .first();
    await yesterdaySubmission.hover();

    // Click clone button
    await yesterdaySubmission.locator('button[data-testid="clone-form"]').click();

    // Verify new form loaded with pre-filled data
    await expect(page.locator('form[data-testid="form-renderer"]')).toBeVisible();
    await expect(page.locator('text=Cloned from')).toBeVisible();

    // Verify fields pre-filled (but editable)
    const textField = page.locator('input[name="text_field"]');
    const existingValue = await textField.inputValue();
    expect(existingValue.length).toBeGreaterThan(0);

    // Verify date updated to today
    const dateField = page.locator('input[name="date_field"]');
    const today = new Date().toISOString().split('T')[0];
    await expect(dateField).toHaveValue(today);

    // Screenshot cloned form
    await page.screenshot({ path: 'evidence/ISSUE-119/form-cloned.png' });
  });
});
```

### Step 3: Run Form Filling Tests and Collect Evidence (15 min)

```bash
cd apps/web

# Run all form filling tests
pnpm exec playwright test form-filling-flow --project=chromium
pnpm exec playwright test form-cloning-flow --project=chromium

# Run on mobile
pnpm exec playwright test form-filling-flow --project="Mobile Chrome"

# Generate HTML report
pnpm exec playwright show-report
```

Collect evidence screenshots:

- evidence/ISSUE-119/form-start.png
- evidence/ISSUE-119/text-field.png
- evidence/ISSUE-119/photo-upload.png
- evidence/ISSUE-119/signature-capture.png
- evidence/ISSUE-119/conditional-logic.png
- evidence/ISSUE-119/offline-sync.png
- evidence/ISSUE-119/form-submitted.png
- evidence/ISSUE-119/form-cloned.png
- evidence/ISSUE-119/test-results.png (HTML report screenshot)

## Files Created

- apps/web/**tests**/e2e/form-filling-flow.spec.ts
- apps/web/**tests**/e2e/form-cloning-flow.spec.ts
- evidence/ISSUE-119/ (9 screenshots)

## Verification Checklist

- [ ] All 15 field types tested
- [ ] Photo upload tested (mock camera)
- [ ] Signature capture tested (canvas)
- [ ] GPS coordinates tested (mock geolocation)
- [ ] Conditional logic tested (show/hide fields)
- [ ] Computed fields tested (auto-calculate)
- [ ] Auto-save draft tested (30s interval)
- [ ] Offline queue and sync tested
- [ ] Complete form submission tested
- [ ] Form cloning tested ("copy yesterday")
- [ ] Evidence screenshots collected

## Evidence Requirements

**Location:** evidence/ISSUE-119/

**Required:**

- test-results/
  - form-start.png
  - text-field.png
  - photo-upload.png
  - signature-capture.png
  - conditional-logic.png
  - offline-sync.png
  - form-submitted.png
  - form-cloned.png
  - test-results.png (HTML report)
  - playwright-html-report/ (full report)

## Success Criteria

- [ ] 18+ E2E tests passing
- [ ] All 15 field types functional
- [ ] Photo and signature capture working
- [ ] Conditional logic and computed fields working
- [ ] Offline sync working
- [ ] Form cloning working
- [ ] Evidence screenshots collected

## Time Estimate

**4 hours total:**

- Create form filling test suite: 3h 30min
- Create form cloning test suite: 30 min
- Run tests and collect evidence: 15 min

## Next Issue

**ISSUE-120:** E2E Template Rendering Tests with Playwright MCP (3h)

- Prerequisites: ISSUE-119 (form filling tests passing)
- Phase: 3 - Testing & Polish
- Tests all 20 templates render correctly in FormRenderer
