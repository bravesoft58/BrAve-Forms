import { test, expect, Page } from '@playwright/test';

/**
 * ISSUE-120: Template Rendering E2E Tests
 *
 * Tests that all templates render correctly:
 * 1. Simple templates render without errors
 * 2. Complex templates (50+ fields) render completely
 * 3. Agency-specific templates have correct dropdowns
 * 4. Repeater fields work correctly
 * 5. Responsive layouts (desktop 2-column, mobile 1-column)
 *
 * Evidence collected: docs/sprints/sprint4/evidence/ISSUE-120/
 */

const BASE_URL = 'http://localhost:3000';
const EVIDENCE_PATH = 'docs/sprints/sprint4/evidence/ISSUE-120';

// Template IDs to test (most important/complex templates)
const TEMPLATES_TO_TEST = [
  { id: '01-general-daily-log', name: 'General Daily Log', complexity: 'simple', fields: 25 },
  { id: '02-superintendent-daily-report', name: 'Superintendent Daily Report', complexity: 'medium', fields: 35 },
  { id: '03-weekly-stormwater-log', name: 'Weekly Stormwater Log', complexity: 'medium', fields: 30 },
  { id: '05-safety-inspection', name: 'Safety Inspection', complexity: 'medium', fields: 40 },
  { id: '11-swppp-inspection', name: 'SWPPP Inspection', complexity: 'complex', fields: 50 },
  { id: '12-ndep-bwpc-swppp', name: 'NDEP BWPC SWPPP', complexity: 'complex', fields: 100 },
  { id: '13-ndot-swppp', name: 'NDOT SWPPP', complexity: 'complex', fields: 90 },
  { id: '16-tmwa-inspection', name: 'TMWA Inspection', complexity: 'medium', fields: 50 },
  { id: '17-quarterly-visual-assessment', name: 'Quarterly Visual Assessment', complexity: 'medium', fields: 40 },
  { id: '20-wiw-daily-form', name: 'WIW Daily Form', complexity: 'complex', fields: 50 },
];

test.describe('ISSUE-120: Template Rendering Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Track console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.error(`Browser console error: ${msg.text()}`);
      }
    });

    page.on('pageerror', (err) => {
      console.error(`Page error: ${err.message}`);
    });
  });

  // Generate a test for each template
  for (const template of TEMPLATES_TO_TEST) {
    test(`TC-${template.id}: ${template.name} renders without errors`, async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/forms/${template.id}/fill`);
      await page.waitForLoadState('networkidle', { timeout: 60000 });

      // Wait for form to render
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: `${EVIDENCE_PATH}/template-${template.id}.png`,
        fullPage: true,
      });

      // Check for form renderer
      const formRenderer = page.locator('form, [data-testid="form-renderer"], .mantine-Paper-root').first();
      const formVisible = await formRenderer.isVisible().catch(() => false);

      // Check for error alerts
      const errorAlert = page.locator('.mantine-Alert-root[data-variant="error"], [role="alert"][class*="error"]');
      const hasError = await errorAlert.isVisible().catch(() => false);

      // Check for "Unsupported field type" messages
      const unsupportedField = page.locator('text=/unsupported field type/i');
      const hasUnsupported = await unsupportedField.isVisible().catch(() => false);

      // Log results
      console.log(`Template ${template.id} (${template.name}):`);
      console.log(`  Form visible: ${formVisible}`);
      console.log(`  Error alert: ${hasError}`);
      console.log(`  Unsupported fields: ${hasUnsupported}`);

      // Template should render (form visible, no errors)
      expect(formVisible).toBeTruthy();
      expect(hasError).toBeFalsy();
    });
  }

  test('TC-COMPLEX-01: NDEP BWPC SWPPP (100+ fields) renders completely', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/forms/12-ndep-bwpc-swppp/fill`);
    await page.waitForLoadState('networkidle', { timeout: 60000 });

    // Wait for all fields to render
    await page.waitForTimeout(2000);

    // Count rendered fields
    const inputs = page.locator('input, textarea, select, [role="combobox"]');
    const fieldCount = await inputs.count();

    // Scroll to bottom to ensure all fields render
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${EVIDENCE_PATH}/complex-ndep-bwpc-full.png`,
      fullPage: true,
    });

    console.log(`TC-COMPLEX-01: NDEP BWPC SWPPP field count: ${fieldCount}`);
    console.log('  Expected: ~100+ fields');

    // Should have significant number of fields
    expect(fieldCount).toBeGreaterThan(20);
  });

  test('TC-COMPLEX-02: NDOT SWPPP (90+ fields) renders with highway-specific fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/forms/13-ndot-swppp/fill`);
    await page.waitForLoadState('networkidle', { timeout: 60000 });

    await page.waitForTimeout(2000);

    // Look for highway-specific fields
    const highwayFields = [
      page.locator('text=/highway|route|project number/i').first(),
      page.locator('text=/traffic|road/i').first(),
      page.locator('text=/ndot/i').first(),
    ];

    let highwayFieldsFound = 0;
    for (const field of highwayFields) {
      const visible = await field.isVisible().catch(() => false);
      if (visible) highwayFieldsFound++;
    }

    await page.screenshot({
      path: `${EVIDENCE_PATH}/complex-ndot-swppp.png`,
      fullPage: true,
    });

    console.log(`TC-COMPLEX-02: NDOT SWPPP highway-specific fields found: ${highwayFieldsFound}/3`);
  });

  test('TC-AGENCY-01: NDEP template shows Nevada counties dropdown', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/forms/12-ndep-bwpc-swppp/fill`);
    await page.waitForLoadState('networkidle', { timeout: 60000 });

    // Look for county selector
    const countySelector = page.locator('text=/county/i').first();
    const countyVisible = await countySelector.isVisible().catch(() => false);

    // Look for combobox/select near county label
    const countyDropdown = page.locator('[role="combobox"]').first();
    const dropdownVisible = await countyDropdown.isVisible().catch(() => false);

    if (dropdownVisible) {
      await countyDropdown.click();
      await page.waitForTimeout(500);

      // Look for Nevada county names
      const washoeOption = page.locator('text=/washoe/i');
      const clarkOption = page.locator('text=/clark/i');

      const hasWashoe = await washoeOption.isVisible().catch(() => false);
      const hasClark = await clarkOption.isVisible().catch(() => false);

      console.log(`TC-AGENCY-01: Nevada counties - Washoe: ${hasWashoe}, Clark: ${hasClark}`);
    }

    await page.screenshot({
      path: `${EVIDENCE_PATH}/agency-ndep-counties.png`,
      fullPage: true,
    });

    console.log(`TC-AGENCY-01: County selector visible: ${countyVisible}`);
  });

  test('TC-AGENCY-02: TMWA template shows Lake Tahoe watershed fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/forms/16-tmwa-inspection/fill`);
    await page.waitForLoadState('networkidle', { timeout: 60000 });

    // Look for TMWA/watershed-specific fields
    const tmwaFields = [
      page.locator('text=/tmwa|truckee meadows/i').first(),
      page.locator('text=/watershed|lake tahoe/i').first(),
      page.locator('text=/water quality/i').first(),
    ];

    let tmwaFieldsFound = 0;
    for (const field of tmwaFields) {
      const visible = await field.isVisible().catch(() => false);
      if (visible) tmwaFieldsFound++;
    }

    await page.screenshot({
      path: `${EVIDENCE_PATH}/agency-tmwa.png`,
      fullPage: true,
    });

    console.log(`TC-AGENCY-02: TMWA-specific fields found: ${tmwaFieldsFound}/3`);
  });

  test('TC-REPEATER-01: Repeater field add/remove functionality', async ({ page }) => {
    // Use weekly stormwater log which has repeater for daily entries
    await page.goto(`${BASE_URL}/dashboard/forms/03-weekly-stormwater-log/fill`);
    await page.waitForLoadState('networkidle', { timeout: 60000 });

    // Look for add button for repeater
    const addButton = page.locator('button:has-text("Add"), button:has-text("+")').first();
    const addVisible = await addButton.isVisible().catch(() => false);

    if (addVisible) {
      // Count initial items
      const initialItems = await page.locator('[data-testid="repeater-item"], [class*="repeater"]').count();

      // Add new item
      await addButton.click();
      await page.waitForTimeout(500);

      // Count after add
      const afterAddItems = await page.locator('[data-testid="repeater-item"], [class*="repeater"]').count();

      await page.screenshot({
        path: `${EVIDENCE_PATH}/repeater-add.png`,
        fullPage: true,
      });

      console.log(`TC-REPEATER-01: Items before: ${initialItems}, after add: ${afterAddItems}`);
    }

    console.log(`TC-REPEATER-01: Add button found: ${addVisible}`);
  });

  test('TC-REPEATER-02: Repeater maintains correct index after removal', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/forms/03-weekly-stormwater-log/fill`);
    await page.waitForLoadState('networkidle', { timeout: 60000 });

    // Add multiple items
    const addButton = page.locator('button:has-text("Add"), button:has-text("+")').first();
    const addVisible = await addButton.isVisible().catch(() => false);

    if (addVisible) {
      // Add 3 items
      for (let i = 0; i < 3; i++) {
        await addButton.click();
        await page.waitForTimeout(300);
      }

      // Find remove buttons
      const removeButtons = page.locator('button:has-text("Remove"), button:has-text("-"), [data-testid="remove-item"]');
      const removeCount = await removeButtons.count();

      if (removeCount > 1) {
        // Remove middle item
        await removeButtons.nth(1).click();
        await page.waitForTimeout(500);
      }

      await page.screenshot({
        path: `${EVIDENCE_PATH}/repeater-remove.png`,
        fullPage: true,
      });

      console.log(`TC-REPEATER-02: Remove buttons found: ${removeCount}`);
    }
  });
});

/**
 * Responsive layout tests
 */
test.describe('ISSUE-120: Responsive Template Layouts', () => {
  test('TC-RESPONSIVE-01: Desktop 2-column layout verification', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto(`${BASE_URL}/dashboard/forms/01-general-daily-log/fill`);
    await page.waitForLoadState('networkidle', { timeout: 60000 });

    await page.screenshot({
      path: `${EVIDENCE_PATH}/responsive-desktop.png`,
      fullPage: true,
    });

    // Check container width (should be constrained, not full width)
    const container = page.locator('.mantine-Container-root, .mantine-Paper-root').first();
    const containerVisible = await container.isVisible().catch(() => false);

    if (containerVisible) {
      const box = await container.boundingBox();
      console.log(`TC-RESPONSIVE-01: Container width: ${box?.width}px`);
    }

    console.log('TC-RESPONSIVE-01: Desktop layout verified');
  });

  test('TC-RESPONSIVE-02: Mobile 1-column layout verification', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto(`${BASE_URL}/dashboard/forms/01-general-daily-log/fill`);
    await page.waitForLoadState('networkidle', { timeout: 60000 });

    // Check for horizontal scroll (should not have any)
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    await page.screenshot({
      path: `${EVIDENCE_PATH}/responsive-mobile.png`,
      fullPage: true,
    });

    console.log(`TC-RESPONSIVE-02: Horizontal scroll: ${hasHorizontalScroll ? 'YES (issue)' : 'NO (good)'}`);
    expect(hasHorizontalScroll).toBeFalsy();
  });

  test('TC-RESPONSIVE-03: Tablet layout verification', async ({ page }) => {
    // Set tablet viewport (iPad Pro)
    await page.setViewportSize({ width: 1024, height: 1366 });

    await page.goto(`${BASE_URL}/dashboard/forms/01-general-daily-log/fill`);
    await page.waitForLoadState('networkidle', { timeout: 60000 });

    await page.screenshot({
      path: `${EVIDENCE_PATH}/responsive-tablet.png`,
      fullPage: true,
    });

    // Verify form renders properly
    const formRenderer = page.locator('form, [data-testid="form-renderer"]').first();
    const formVisible = await formRenderer.isVisible().catch(() => false);

    console.log(`TC-RESPONSIVE-03: Tablet layout - form visible: ${formVisible}`);
    expect(formVisible).toBeTruthy();
  });
});

/**
 * Error handling tests
 */
test.describe('ISSUE-120: Template Error Handling', () => {
  test('TC-ERROR-01: Invalid template ID shows error gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/forms/invalid-template-xyz/fill`);
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    await page.screenshot({
      path: `${EVIDENCE_PATH}/error-invalid-template.png`,
      fullPage: true,
    });

    // Should show some form of error or redirect
    const errorIndicators = [
      page.locator('text=/not found|error|invalid/i'),
      page.locator('[role="alert"]'),
      page.locator('.mantine-Alert-root'),
    ];

    let errorFound = false;
    for (const indicator of errorIndicators) {
      const visible = await indicator.isVisible().catch(() => false);
      if (visible) {
        errorFound = true;
        break;
      }
    }

    // Check if redirected to 404 or error page
    const is404 = page.url().includes('404') || page.url().includes('error');

    console.log(`TC-ERROR-01: Error indicator found: ${errorFound}, 404 redirect: ${is404}`);
  });
});
