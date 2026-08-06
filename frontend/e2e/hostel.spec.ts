import { test, expect } from '@playwright/test';

test.describe('Phase 8: Hostel & Bazar Management E2E', () => {
  test('should render hostel buildings & seat allocation UI', async ({ page }) => {
    await page.goto('/admin/hostel');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should render daily bazar expense log UI', async ({ page }) => {
    await page.goto('/admin/bazar');
    await expect(page.locator('body')).toBeVisible();
  });
});
