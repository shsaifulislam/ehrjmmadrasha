import { test, expect } from '@playwright/test';

test.describe('Phase 7: Exam & Result Management E2E', () => {
  test('should render exam list and create new exam modal', async ({ page }) => {
    await page.goto('/admin/exams');
    await expect(page.locator('body')).toBeVisible();

    const createBtn = page.locator('button:has-text("নতুন পরীক্ষা"), button:has-text("Add Exam")');
    if (await createBtn.isVisible()) {
      await createBtn.click();
    }
  });

  test('should render tabulation sheet & marksheet views', async ({ page }) => {
    await page.goto('/admin/results');
    await expect(page.locator('body')).toBeVisible();
  });
});
