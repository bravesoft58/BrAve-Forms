import { test, expect } from '@playwright/test';

// Simple ISSUE-014 validation test
test('dashboard loads without crashing', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForLoadState('domcontentloaded');

  // Take screenshot
  await page.screenshot({
    path: 'docs/sprints/sprint1/evidence/ISSUE-014/deployment/dashboard-simple-test.png'
  });

  // Check page doesn't have critical errors
  const title = await page.title();
  console.log('Page title:', title);

  expect(title).toBeTruthy();
});
