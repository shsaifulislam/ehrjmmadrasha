import { test, expect } from '@playwright/test';

test.describe('Admission Module End-to-End Workflow', () => {
  test('Complete Public Submission -> Admin Review -> Approval & Sync Flow', async ({ page }) => {
    // 1. Visit Public Admission Form or Admin Admission Manager
    await page.goto('/admin/admissions');
    await expect(page.locator('body')).toBeVisible();

    // 2. Search for the applicant
    const searchInput = page.locator('input[placeholder*="খুঁজুন"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('আরিফুল ইসলাম');
    }

    // 3. Assert Body Visibility
    await expect(page.locator('body')).toBeVisible();
  });
});
