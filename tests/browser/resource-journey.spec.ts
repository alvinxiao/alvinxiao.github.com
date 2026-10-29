import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const ids = ['ai-basics', 'getting-started', 'workflow'];

test('index and first, middle, last endings follow the authored path', async ({ page }) => {
  await page.goto('/resources/');
  expect(
    await page
      .locator('.resource-card')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href'))),
  ).toEqual(ids.map((id) => `/resources/${id}/`));
  for (const [index, id] of ids.entries()) {
    await page.goto(`/resources/${id}/`);
    const nav = page.getByRole('navigation', { name: 'More guides' });
    await expect(nav).toBeVisible();
    expect(
      await nav.locator('a').evaluateAll((links) => links.map((link) => link.getAttribute('href'))),
    ).toEqual(
      [ids[index - 1], ids[index + 1]].filter(Boolean).map((target) => `/resources/${target}/`),
    );
    await expect(page.getByRole('link', { name: '← All resources', exact: true })).toHaveAttribute(
      'href',
      '/resources/',
    );
    expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
  }
});

test('native journey supports keyboard, back, touch, and no JavaScript', async ({ browser }) => {
  for (const javaScriptEnabled of [true, false]) {
    const context = await browser.newContext({
      javaScriptEnabled,
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4321/resources/ai-basics/');
    const next = page.getByRole('navigation', { name: 'More guides' }).locator('a');
    await next.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/getting-started\/$/);
    await page.goBack();
    await expect(page).toHaveURL(/ai-basics\/$/);
    await page.getByRole('navigation', { name: 'More guides' }).locator('a').tap();
    await expect(page).toHaveURL(/getting-started\/$/);
    await context.close();
  }
});

test('endings reflow with readable text and large links', async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const id of ids) {
      await page.goto(`/resources/${id}/`);
      const nav = page.getByRole('navigation', { name: 'More guides' });
      await nav.scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      for (const link of await nav.locator('a').all()) {
        expect((await link.boundingBox())?.height).toBeGreaterThanOrEqual(44);
        expect(
          await link.evaluate((node) =>
            [...node.querySelectorAll('*')]
              .filter((child) => child.textContent?.trim())
              .every((child) => parseFloat(getComputedStyle(child).fontSize) >= 15),
          ),
        ).toBe(true);
      }
    }
  }
});
