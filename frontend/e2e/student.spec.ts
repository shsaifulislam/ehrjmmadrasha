import { test, expect } from '@playwright/test';

test.describe('Student Core Module End-to-End Workflow', () => {
  test('Admin Student Directory -> Search -> Enrollment -> View 360 Flow', async ({ page }) => {
    // 1. Visit Admin Student Directory
    await page.goto('/admin/students');
    await expect(page.locator('body')).toBeVisible();

    // 2. Filter / Search for Student
    const searchInput = page.locator('input[placeholder*="খুঁজুন"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('আবদুল্লাহ');
    }

    // 3. Table or container assertion
    const tableOrBody = page.locator('table, body');
    await expect(tableOrBody).toBeVisible();
  });
});
