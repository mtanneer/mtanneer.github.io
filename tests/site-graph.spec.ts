import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 900 } });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // graph mounts via requestIdleCallback/setTimeout(200) — wait for it
  await expect(page.locator('#site-graph-svg').locator('.site-graph-node')).toHaveCount(await nodeCount(page));
});

async function nodeCount(page: import('@playwright/test').Page): Promise<number> {
  const json = await page.locator('#site-graph-data').textContent();
  return JSON.parse(json!).nodes.length;
}

test('renders expected node count', async ({ page }) => {
  const expected = await nodeCount(page);
  expect(expected).toBeGreaterThan(0);
  await expect(page.locator('#site-graph-svg .site-graph-node')).toHaveCount(expected);
});

test('clicking an internal node navigates to its page', async ({ page }) => {
  // page:/projects/ node — label "Projects"
  const node = page.locator('#site-graph-svg .site-graph-node', { hasText: 'Projects' });
  await node.locator('circle').last().click();
  await expect(page).toHaveURL(/\/projects\/$/);
});

test('clicking an external node opens a new tab to the right URL', async ({ page }) => {
  await page.goto('/about/');
  await page.waitForTimeout(300); // graph only renders on home; go back
  await page.goto('/');
  await expect(page.locator('#site-graph-svg .site-graph-node')).toHaveCount(await nodeCount(page));

  const node = page.locator('#site-graph-svg .site-graph-node', { hasText: 'GitHub' });
  const [popup] = await Promise.all([page.waitForEvent('popup'), node.locator('circle').last().click()]);
  await popup.waitForLoadState();
  expect(popup.url()).toContain('github.com/mtanneer');
  await expect(page).toHaveURL(/\/$/); // original page unchanged
});

test('hovering a node highlights connected nodes and dims the rest', async ({ page }) => {
  const node = page.locator('#site-graph-svg .site-graph-node', { hasText: 'Projects' });
  await node.locator('circle').last().hover();

  await expect(node).toHaveCSS('opacity', '1');

  const allNodes = page.locator('#site-graph-svg .site-graph-node');
  const count = await allNodes.count();
  let sawDimmed = false;
  for (let i = 0; i < count; i++) {
    const opacity = await allNodes.nth(i).evaluate((el) => (el as SVGElement).style.opacity);
    if (opacity === '0.25') sawDimmed = true;
  }
  expect(sawDimmed).toBe(true);

  await page.mouse.move(0, 0);
  await expect(node).toHaveCSS('opacity', '1');
});

test('dragging a node repositions it without crashing the page', async ({ page }) => {
  const node = page.locator('#site-graph-svg .site-graph-node').first();
  const hitArea = node.locator('circle').last();
  const box = await hitArea.boundingBox();
  if (!box) throw new Error('node not visible');

  const transformBefore = await node.getAttribute('transform');

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 60, box.y + 60, { steps: 5 });
  await page.mouse.up();

  const transformAfter = await node.getAttribute('transform');
  expect(transformAfter).not.toBe(transformBefore);
});
