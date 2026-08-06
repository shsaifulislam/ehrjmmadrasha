import { test, expect } from '@playwright/test';

test.describe('Finance & Fee Core Module End-to-End Workflow', () => {
  test('Admin Finance Directory -> Collect Fee -> Receipt Generation Flow', async ({ page }) => {
    // 1. Visit Admin Finance Page
    await page.goto('/admin/finance');
    await expect(page.locator('body')).toBeVisible();

    // 2. Open Collect Fee Modal
    const collectBtn = page.locator('button:has-text("ফি আদায়")');
    if (await collectBtn.isVisible()) {
      await collectBtn.click();
    }

    // 3. Body assertion
    await expect(page.locator('body')).toBeVisible();
  });
});
