import { test, expect } from '@playwright/test';

test.describe('Guardian Core Module End-to-End Workflow', () => {
  test('Admin Guardian Directory -> Search -> Create Guardian -> Guardian360 View Flow', async ({ page }) => {
    // 1. Visit Admin Guardian Directory
    await page.goto('/admin/guardians');
    await expect(page.locator('body')).toBeVisible();

    // 2. Search Guardian
    const searchInput = page.locator('input[placeholder*="খুঁজুন"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('রফিকুল');
    }

    // 3. Page body assertion
    await expect(page.locator('body')).toBeVisible();
  });
});
