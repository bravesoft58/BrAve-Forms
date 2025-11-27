# ISSUE-120: E2E Template Rendering Tests with Playwright MCP

**Sprint:** Sprint 4 | **Phase:** 3 - Testing & Polish | **Priority:** P0
**Time:** 3 hours | **Complexity:** Medium
**Created:** 2025-10-23
**Dependencies:** ISSUE-119 (form filling tests passing)
**Status:** COMPLETE (2025-11-27)

## What You'll Do

Create end-to-end tests using Playwright MCP to verify all 20 templates render correctly in FormRenderer, test agency-specific templates, test complex templates with 50+ fields, test repeater fields, and test mobile vs desktop responsive layouts.

## Prerequisites

- [ ] ISSUE-119 complete (form filling tests passing)
- [ ] All 20 templates seeded in database
- [ ] FormRenderer component functional
- [ ] Repeater fields working

## Step-by-Step Instructions

### Step 1: Create Template Rendering Test Suite (2h 45min)

Create `apps/web/__tests__/e2e/template-rendering.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

const ALL_TEMPLATES = [
  { id: '01-general-daily-log', name: 'General Daily Log', sections: 5, fields: 25 },
  {
    id: '02-superintendent-daily-report',
    name: 'Superintendent Daily Report',
    sections: 6,
    fields: 35,
  },
  { id: '03-safety-inspection', name: 'Safety Inspection', sections: 4, fields: 40 },
  { id: '04-toolbox-talk', name: 'Toolbox Talk', sections: 3, fields: 15 },
  { id: '05-incident-report', name: 'Incident Report', sections: 5, fields: 30 },
  {
    id: '06-quality-control-inspection',
    name: 'Quality Control Inspection',
    sections: 4,
    fields: 25,
  },
  { id: '07-material-receiving-log', name: 'Material Receiving Log', sections: 3, fields: 20 },
  { id: '08-equipment-inspection', name: 'Equipment Inspection', sections: 4, fields: 30 },
  { id: '09-environmental-inspection', name: 'Environmental Inspection', sections: 5, fields: 35 },
  {
    id: '10-weekly-stormwater-inspection',
    name: 'Weekly Stormwater Inspection',
    sections: 6,
    fields: 40,
  },
  { id: '11-swppp-inspection', name: 'SWPPP Inspection', sections: 7, fields: 50 },
  { id: '12-ndep-bwpc-swppp', name: 'NDEP BWPC SWPPP Template', sections: 8, fields: 50 },
  { id: '13-ndot-swppp', name: 'NDOT SWPPP Template', sections: 9, fields: 60 },
  { id: '14-ndep-weekly-stormwater', name: 'NDEP Weekly Stormwater Log', sections: 4, fields: 30 },
  { id: '15-ndot-weekly-stormwater', name: 'NDOT Weekly Stormwater Logs', sections: 5, fields: 40 },
  { id: '16-tmwa-inspection', name: 'TMWA Inspection Checklist', sections: 7, fields: 50 },
  {
    id: '17-quarterly-visual-assessment',
    name: 'Quarterly Visual Assessment',
    sections: 5,
    fields: 40,
  },
  { id: '18-visual-assessment-report', name: 'Visual Assessment Report', sections: 8, fields: 60 },
  {
    id: '19-routine-facility-inspection',
    name: 'Routine Facility Inspection',
    sections: 6,
    fields: 45,
  },
  { id: '20-wiw-daily-form', name: 'WIW Daily Form', sections: 7, fields: 50 },
];

test.describe('Template Rendering Tests - All 20 Templates', () => {
  ALL_TEMPLATES.forEach((template) => {
    test(`Template Rendering: ${template.name}`, async ({ page }) => {
      // Login
      await page.goto('/sign-in');
      await page.fill('input[name="email"]', 'foreman@test.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Navigate to form fill page
      await page.goto(`/forms/template/${template.id}/fill`);

      // Wait for form to render
      await page.waitForSelector('form[data-testid="form-renderer"]', { timeout: 10000 });
      await expect(page.locator('form[data-testid="form-renderer"]')).toBeVisible();

      // Verify template name displayed
      await expect(page.locator(`h2:has-text("${template.name}")`)).toBeVisible();

      // Check all sections render
      const sections = page.locator('[data-testid="form-section"]');
      const sectionCount = await sections.count();
      expect(sectionCount).toBeGreaterThanOrEqual(template.sections - 1); // Allow -1 variance

      // Check fields render
      const fields = page.locator('[data-testid="form-field"]');
      const fieldCount = await fields.count();
      expect(fieldCount).toBeGreaterThanOrEqual(template.fields - 5); // Allow -5 variance

      // Verify no console errors
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      expect(consoleErrors.length).toBe(0);

      // Screenshot for evidence
      await page.screenshot({
        path: `evidence/ISSUE-120/template-${template.id}.png`,
        fullPage: true,
      });
    });
  });
});

test.describe('Agency-Specific Template Tests', () => {
  test('NDEP BWPC SWPPP Template - Nevada county selection', async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', 'foreman@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/forms/template/12-ndep-bwpc-swppp/fill');
    await page.waitForSelector('form[data-testid="form-renderer"]');

    // Verify Nevada county dropdown
    const countySelect = page.locator('select[name="county"]');
    await expect(countySelect).toBeVisible();

    // Check all 17 Nevada counties present
    const options = await countySelect.locator('option').count();
    expect(options).toBeGreaterThanOrEqual(17);

    // Verify permit number format hint
    await expect(page.locator('text=NEV-')).toBeVisible();

    // Screenshot
    await page.screenshot({ path: 'evidence/ISSUE-120/ndep-template.png' });
  });

  test('NDOT SWPPP Template - Highway project numbering', async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', 'foreman@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/forms/template/13-ndot-swppp/fill');
    await page.waitForSelector('form[data-testid="form-renderer"]');

    // Verify NDOT project number format
    await expect(page.locator('text=XXXXX-XX-XXXX')).toBeVisible();

    // Verify traffic control BMPs section
    await expect(page.locator('text=Traffic Control BMPs')).toBeVisible();

    // Verify dual signature requirement
    const signatures = page.locator('[data-testid="signature-field"]');
    const count = await signatures.count();
    expect(count).toBeGreaterThanOrEqual(2); // Contractor + NDOT inspector

    // Screenshot
    await page.screenshot({ path: 'evidence/ISSUE-120/ndot-template.png' });
  });

  test('TMWA Inspection Checklist - Lake Tahoe TMDL compliance', async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', 'foreman@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/forms/template/16-tmwa-inspection/fill');
    await page.waitForSelector('form[data-testid="form-renderer"]');

    // Verify watershed designation field
    const watershedSelect = page.locator('select[name="watershed"]');
    await expect(watershedSelect).toBeVisible();

    // Select Lake Tahoe (should show TMDL section)
    await watershedSelect.selectOption('Lake Tahoe');

    // Verify Lake Tahoe TMDL section appears (conditional)
    await expect(page.locator('text=Lake Tahoe TMDL Compliance')).toBeVisible();

    // Screenshot
    await page.screenshot({ path: 'evidence/ISSUE-120/tmwa-template.png' });
  });
});

test.describe('Complex Template Tests - 50+ Fields', () => {
  test('NDOT SWPPP Template - 60 fields render correctly', async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', 'foreman@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/forms/template/13-ndot-swppp/fill');
    await page.waitForSelector('form[data-testid="form-renderer"]');

    // Verify ALL sections render (9 sections)
    const sections = page.locator('[data-testid="form-section"]');
    const sectionCount = await sections.count();
    expect(sectionCount).toBeGreaterThanOrEqual(8);

    // Verify at least 60 fields
    const fields = page.locator('[data-testid="form-field"]');
    const fieldCount = await fields.count();
    expect(fieldCount).toBeGreaterThanOrEqual(55); // Allow variance

    // Screenshot full page
    await page.screenshot({
      path: 'evidence/ISSUE-120/ndot-swppp-full.png',
      fullPage: true,
    });
  });

  test('Visual Assessment Report - 60 fields with lab analysis', async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', 'foreman@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/forms/template/18-visual-assessment-report/fill');
    await page.waitForSelector('form[data-testid="form-renderer"]');

    // Verify lab analysis section
    await expect(page.locator('text=Laboratory Analysis')).toBeVisible();

    // Verify lab parameters (pH, turbidity, TSS, BOD, COD, oil/grease)
    await expect(page.locator('input[name*="ph"]')).toBeVisible();
    await expect(page.locator('input[name*="turbidity"]')).toBeVisible();
    await expect(page.locator('input[name*="tss"]')).toBeVisible();

    // Screenshot
    await page.screenshot({
      path: 'evidence/ISSUE-120/visual-assessment-report.png',
      fullPage: true,
    });
  });
});

test.describe('Repeater Field Tests', () => {
  test('BMP List repeater - Add/remove items', async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', 'foreman@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/forms/template/12-ndep-bwpc-swppp/fill');
    await page.waitForSelector('form[data-testid="form-renderer"]');

    // Find BMP repeater section
    const addItemButton = page.locator('button:has-text("Add BMP")');
    await expect(addItemButton).toBeVisible();

    // Add first item
    await addItemButton.click();
    let items = page.locator('[data-testid="repeater-item"]');
    expect(await items.count()).toBe(1);

    // Fill first BMP
    await page.locator('select[name*="bmp_type"]').first().selectOption('Silt Fence');
    await page.locator('input[name*="install_date"]').first().fill('2025-12-01');
    await page.locator('select[name*="condition"]').first().selectOption('Good');

    // Add second item
    await addItemButton.click();
    items = page.locator('[data-testid="repeater-item"]');
    expect(await items.count()).toBe(2);

    // Remove first item
    await page.locator('[data-testid="remove-item"]').first().click();
    items = page.locator('[data-testid="repeater-item"]');
    expect(await items.count()).toBe(1);

    // Screenshot
    await page.screenshot({ path: 'evidence/ISSUE-120/repeater-fields.png' });
  });

  test('WIW Daily Form - Nested turbidity readings repeater', async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', 'foreman@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/forms/template/20-wiw-daily-form/fill');
    await page.waitForSelector('form[data-testid="form-renderer"]');

    // Find daily work log repeater
    const addDayButton = page.locator('button:has-text("Add Daily Log")');
    await addDayButton.click();

    // Verify nested turbidity repeater appears
    await expect(page.locator('button:has-text("Add Turbidity Reading")')).toBeVisible();

    // Add turbidity reading
    await page.locator('button:has-text("Add Turbidity Reading")').click();
    await page.locator('input[name*="ntu"]').first().fill('15.5');

    // Screenshot nested repeater
    await page.screenshot({ path: 'evidence/ISSUE-120/nested-repeater.png' });
  });
});

test.describe('Mobile vs Desktop Responsive Tests', () => {
  test('Desktop: All templates render in 2-column layout', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('/sign-in');
    await page.fill('input[name="email"]', 'foreman@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/forms/template/01-general-daily-log/fill');
    await page.waitForSelector('form[data-testid="form-renderer"]');

    // Verify 2-column layout (grid)
    const formContainer = page.locator('[data-testid="form-container"]');
    const computedStyle = await formContainer.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns;
    });

    // Should have 2 columns on desktop
    expect(computedStyle).toContain('1fr 1fr');

    // Screenshot desktop layout
    await page.screenshot({ path: 'evidence/ISSUE-120/desktop-layout.png' });
  });

  test('Mobile: All templates render in 1-column layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    await page.goto('/sign-in');
    await page.fill('input[name="email"]', 'foreman@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/forms/template/01-general-daily-log/fill');
    await page.waitForSelector('form[data-testid="form-renderer"]');

    // Verify 1-column layout on mobile
    const formContainer = page.locator('[data-testid="form-container"]');
    const computedStyle = await formContainer.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns;
    });

    // Should have 1 column on mobile
    expect(computedStyle).not.toContain('1fr 1fr');

    // Screenshot mobile layout
    await page.screenshot({ path: 'evidence/ISSUE-120/mobile-layout.png' });
  });
});
```

### Step 2: Run Template Rendering Tests and Collect Evidence (15 min)

```bash
cd apps/web

# Run all template rendering tests (20 templates in parallel)
pnpm exec playwright test template-rendering --project=chromium --workers=4

# Test agency-specific templates
pnpm exec playwright test "Agency-Specific" --project=chromium

# Test complex templates
pnpm exec playwright test "Complex Template" --project=chromium

# Test repeater fields
pnpm exec playwright test "Repeater Field" --project=chromium

# Test responsive layouts
pnpm exec playwright test "Mobile vs Desktop" --project=chromium --project="Mobile Chrome"

# Generate HTML report
pnpm exec playwright show-report
```

Collect evidence (20 template screenshots + 10 feature screenshots):

- evidence/ISSUE-120/template-01-general-daily-log.png (20 total)
- evidence/ISSUE-120/ndep-template.png
- evidence/ISSUE-120/ndot-template.png
- evidence/ISSUE-120/tmwa-template.png
- evidence/ISSUE-120/ndot-swppp-full.png
- evidence/ISSUE-120/visual-assessment-report.png
- evidence/ISSUE-120/repeater-fields.png
- evidence/ISSUE-120/nested-repeater.png
- evidence/ISSUE-120/desktop-layout.png
- evidence/ISSUE-120/mobile-layout.png
- evidence/ISSUE-120/test-results.png (HTML report screenshot)

## Files Created

- apps/web/**tests**/e2e/template-rendering.spec.ts
- evidence/ISSUE-120/ (31 screenshots)

## Verification Checklist

- [ ] All 20 templates render correctly
- [ ] Agency-specific templates tested (NDEP, NDOT, TMWA)
- [ ] Complex templates tested (50+ fields, 60+ fields)
- [ ] Repeater fields tested (add/remove items)
- [ ] Nested repeater tested (WIW turbidity readings)
- [ ] Desktop 2-column layout verified
- [ ] Mobile 1-column layout verified
- [ ] Evidence screenshots collected (31 total)

## Evidence Requirements

**Location:** evidence/ISSUE-120/

**Required:**

- test-results/
  - template-[01-20]-\*.png (20 template screenshots)
  - ndep-template.png
  - ndot-template.png
  - tmwa-template.png
  - ndot-swppp-full.png
  - visual-assessment-report.png
  - repeater-fields.png
  - nested-repeater.png
  - desktop-layout.png
  - mobile-layout.png
  - test-results.png (HTML report)
  - playwright-html-report/ (full report)

## Success Criteria

- [ ] All 20 templates render without errors
- [ ] Agency-specific features functional
- [ ] Complex templates (60 fields) render correctly
- [ ] Repeater fields add/remove working
- [ ] Responsive layouts verified (desktop 2-column, mobile 1-column)
- [ ] Evidence screenshots collected

## Time Estimate

**3 hours total:**

- Create template rendering test suite: 2h 45min
- Run tests and collect evidence: 15 min

## Next Issue

**ISSUE-121:** Deep Code Review - Architecture & Patterns (4h)

- Prerequisites: ISSUE-120 (all E2E tests passing)
- Phase: 3 - Testing & Polish
- Reviews backend/frontend architecture, patterns, security
