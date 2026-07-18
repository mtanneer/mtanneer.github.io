import { test, expect } from '@playwright/test';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/projects/', label: 'Projects' },
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
];

const ROUTES = NAV.map((n) => n.href);

for (const route of ROUTES) {
  test(`${route} loads with no console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/.+/);
    expect(errors).toEqual([]);
  });
}

test('nav sidebar has all links and they navigate correctly', async ({ page }) => {
  await page.goto('/');
  for (const item of NAV) {
    const link = page.locator('nav, aside').getByRole('link', { name: item.label, exact: true });
    await expect(link.first()).toHaveAttribute('href', item.href);
  }

  for (const item of NAV) {
    await page.goto('/');
    await page.locator('nav, aside').getByRole('link', { name: item.label, exact: true }).first().click();
    await expect(page).toHaveURL(new RegExp(item.href.replace('/', '\\/') + '$'));
  }
});
