import { test } from '@playwright/test';

test.describe('BrAve Forms UI Component Review', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
  });

  test('Homepage - Desktop Viewport Analysis', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Take full page screenshot
    await page.screenshot({
      path: 'e:/BrAve Forms/ui-review-desktop-homepage.png',
      fullPage: true,
    });

    console.log('Desktop homepage screenshot captured');
  });

  test('Homepage - Mobile Viewport Analysis', async ({ page }) => {
    // Set mobile viewport (iPhone 12 Pro)
    await page.setViewportSize({ width: 390, height: 844 });

    // Take full page screenshot
    await page.screenshot({
      path: 'e:/BrAve Forms/ui-review-mobile-homepage.png',
      fullPage: true,
    });

    console.log('Mobile homepage screenshot captured');
  });

  test('Dashboard - Desktop Analysis (if accessible)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    try {
      await page.goto('http://localhost:3001/dashboard', { timeout: 5000 });

      await page.screenshot({
        path: 'e:/BrAve Forms/ui-review-desktop-dashboard.png',
        fullPage: true,
      });

      console.log('Desktop dashboard screenshot captured');
    } catch (error) {
      console.log('Dashboard not accessible without auth - expected');
    }
  });

  test('Measure Header Component Dimensions', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for header elements
    const headers = await page.locator('header').all();
    console.log(`Found ${headers.length} header elements`);

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      const box = await header.boundingBox();
      if (box) {
        console.log(`Header ${i + 1}: ${box.width}x${box.height}px at (${box.x}, ${box.y})`);
      }
    }

    // Look for buttons
    const buttons = await page.locator('button').all();
    console.log(`\nFound ${buttons.length} buttons`);

    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const button = buttons[i];
      const box = await button.boundingBox();
      const text = await button.textContent();
      if (box) {
        console.log(`Button "${text?.trim().substring(0, 20)}": ${box.width}x${box.height}px`);
      }
    }
  });

  test('Measure Text Sizes', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForLoadState('networkidle');

    // Get all text elements and their computed styles
    const textElements = await page.locator('p, span, h1, h2, h3, h4, h5, h6, button, a').all();

    console.log('\nText Size Analysis:');
    const fontSizes = new Map<string, number>();

    for (const element of textElements.slice(0, 50)) {
      const fontSize = await element.evaluate((el) => {
        return window.getComputedStyle(el).fontSize;
      });

      const count = fontSizes.get(fontSize) || 0;
      fontSizes.set(fontSize, count + 1);
    }

    console.log('\nFont Size Distribution:');
    Array.from(fontSizes.entries())
      .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))
      .forEach(([size, count]) => {
        console.log(`  ${size}: ${count} elements`);
      });
  });

  test('Measure Icon Sizes', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForLoadState('networkidle');

    // Look for SVG icons (Tabler Icons)
    const svgIcons = await page.locator('svg').all();
    console.log(`\nFound ${svgIcons.length} SVG icons`);

    for (let i = 0; i < Math.min(svgIcons.length, 20); i++) {
      const icon = svgIcons[i];
      const box = await icon.boundingBox();
      if (box) {
        console.log(`Icon ${i + 1}: ${box.width}x${box.height}px`);
      }
    }
  });

  test('Check Color Contrast Ratios', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForLoadState('networkidle');

    // Check button contrast
    const buttons = await page.locator('button').all();

    console.log('\nButton Color Analysis:');
    for (let i = 0; i < Math.min(buttons.length, 5); i++) {
      const button = buttons[i];
      const styles = await button.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color,
          fontSize: computed.fontSize,
          padding: computed.padding,
        };
      });

      const text = await button.textContent();
      console.log(`\nButton "${text?.trim().substring(0, 20)}"`);
      console.log(`  Background: ${styles.backgroundColor}`);
      console.log(`  Text Color: ${styles.color}`);
      console.log(`  Font Size: ${styles.fontSize}`);
      console.log(`  Padding: ${styles.padding}`);
    }
  });

  test('Mobile Responsiveness at 768px Breakpoint', async ({ page }) => {
    // Test at 768px (the breakpoint)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'e:/BrAve Forms/ui-review-768px-breakpoint.png',
      fullPage: true,
    });

    console.log('Breakpoint (768px) screenshot captured');
  });

  test('Touch Target Analysis', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // Mobile
    await page.waitForLoadState('networkidle');

    // Check all interactive elements
    const interactive = await page.locator('button, a, input, [role="button"]').all();

    console.log('\nTouch Target Analysis (Mobile):');
    let tooSmall = 0;
    let acceptable = 0;
    let good = 0;

    for (const element of interactive.slice(0, 30)) {
      const box = await element.boundingBox();
      if (box) {
        const minDimension = Math.min(box.width, box.height);

        if (minDimension < 44) {
          tooSmall++;
        } else if (minDimension < 48) {
          acceptable++;
        } else {
          good++;
        }
      }
    }

    console.log(`  Too Small (<44px): ${tooSmall}`);
    console.log(`  Acceptable (44-47px): ${acceptable}`);
    console.log(`  Good (>=48px): ${good}`);
  });
});
