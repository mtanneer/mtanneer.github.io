import { test, expect } from '@playwright/test';

test('theme toggle flips data-theme and persists across reload', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');

  const initial = await html.getAttribute('data-theme');
  await page.click('#theme-toggle');
  const toggled = await html.getAttribute('data-theme');
  expect(toggled).not.toBe(initial);

  await page.reload();
  await expect(html).toHaveAttribute('data-theme', toggled!);
});
