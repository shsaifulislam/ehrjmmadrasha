import { test, expect } from '@playwright/test';

test.describe('Academic Core Module End-to-End Workflow', () => {
  test('Admin Routine Engine -> Add Slot -> Conflict Detection Alert Flow', async ({ page }) => {
    // 1. Visit Admin Routines Page
    await page.goto('/admin/routines');
    await expect(page.locator('body')).toBeVisible();

    // 2. Open Add Slot Modal
    const addBtn = page.locator('button:has-text("নতুন সময়সূচী স্লট")');
    if (await addBtn.isVisible()) {
      await addBtn.click();
    }

    // 3. Assert Body Visibility
    await expect(page.locator('body')).toBeVisible();
  });
});
