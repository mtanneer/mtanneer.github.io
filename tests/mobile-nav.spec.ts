import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test('mobile nav toggle shows and hides the nav panel', async ({ page }) => {
  await page.goto('/');
  const panel = page.locator('#nav-panel');
  await expect(panel).toBeHidden();

  await page.click('#nav-toggle');
  await expect(panel).toBeVisible();
  await expect(page.locator('#nav-toggle')).toHaveAttribute('aria-expanded', 'true');

  await page.click('#nav-toggle');
  await expect(panel).toBeHidden();
  await expect(page.locator('#nav-toggle')).toHaveAttribute('aria-expanded', 'false');
});
