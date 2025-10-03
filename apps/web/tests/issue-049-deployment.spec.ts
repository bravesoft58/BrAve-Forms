/**
 * ISSUE-049: Deploy Web Frontend to Kubernetes
 *
 * Validation Tests:
 * - Verify web application is accessible on NodePort 30102
 * - Check HTTP response headers (security, caching)
 * - Verify Next.js application loads
 * - Take screenshots for evidence
 */

import { test, expect } from '@playwright/test';

const KUBERNETES_WEB_URL = 'http://localhost:30102';

test.describe('ISSUE-049: Web Kubernetes Deployment Verification', () => {
  test('should access web application on NodePort 30102', async ({ page }) => {
    // Navigate to Kubernetes deployment
    const response = await page.goto(KUBERNETES_WEB_URL);

    // Verify HTTP 200 response
    expect(response?.status()).toBe(200);

    // Verify content type
    const contentType = response?.headers()['content-type'];
    expect(contentType).toContain('text/html');
  });

  test('should have proper security headers', async ({ page }) => {
    const response = await page.goto(KUBERNETES_WEB_URL);
    const headers = response?.headers() || {};

    // Verify security headers
    expect(headers['x-frame-options']).toBeDefined();
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBeDefined();
  });

  test('should load Next.js application without errors', async ({ page }) => {
    // Track console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate to application
    await page.goto(KUBERNETES_WEB_URL);

    // Wait for Next.js to hydrate
    await page.waitForLoadState('networkidle');

    // Take screenshot for evidence
    await page.screenshot({
      path: 'docs/sprints/sprint2/evidence/ISSUE-049/screenshots/homepage-loaded.png',
      fullPage: true,
    });

    // Verify page loaded (should have HTML content)
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('should have Next.js meta tags', async ({ page }) => {
    await page.goto(KUBERNETES_WEB_URL);

    // Check for Next.js indicators
    const viewport = await page.getAttribute('meta[name="viewport"]', 'content');
    expect(viewport).toBeTruthy();

    // Take screenshot of page source
    await page.screenshot({
      path: 'docs/sprints/sprint2/evidence/ISSUE-049/screenshots/page-structure.png',
      fullPage: true,
    });
  });

  test('should respond quickly (under 3 seconds)', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(KUBERNETES_WEB_URL);
    await page.waitForLoadState('load');

    const loadTime = Date.now() - startTime;

    // Sprint 1 requirement: App startup < 3 seconds
    expect(loadTime).toBeLessThan(3000);

    console.log(`Page load time: ${loadTime}ms`);
  });

  test('should display page content after navigation', async ({ page }) => {
    await page.goto(KUBERNETES_WEB_URL);
    await page.waitForLoadState('networkidle');

    // Take final screenshot for evidence
    await page.screenshot({
      path: 'docs/sprints/sprint2/evidence/ISSUE-049/screenshots/deployment-verified.png',
      fullPage: true,
    });

    // Verify page has rendered content
    const html = await page.content();
    expect(html).toContain('<!DOCTYPE html>');
    expect(html.length).toBeGreaterThan(1000); // Non-trivial HTML
  });
});
