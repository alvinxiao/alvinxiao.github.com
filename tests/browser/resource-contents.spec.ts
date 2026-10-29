import { expect, test, type Page } from '@playwright/test';

async function settledScroll(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        let previous = scrollY;
        let stable = 0;
        const sample = () => {
          const next = scrollY;
          stable = Math.abs(next - previous) < 0.1 ? stable + 1 : 0;
          previous = next;
          if (stable >= 6) resolve();
          else requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      }),
  );
}

const guides = ['ai-basics', 'getting-started', 'workflow'];

for (const guide of guides) {
  test(`${guide} contents match article headings and retain native history navigation`, async ({
    page,
  }) => {
    await page.goto(`/resources/${guide}/`);
    const nav = page.getByRole('navigation', { name: 'On this page' });
    const headings = await page
      .locator('.article-body h2[id]')
      .evaluateAll((nodes) =>
        nodes.map((node) => ({ href: `#${node.id}`, text: node.textContent?.trim() })),
      );
    const links = await nav
      .getByRole('link')
      .evaluateAll((nodes) =>
        nodes.map((node) => ({ href: node.getAttribute('href'), text: node.textContent?.trim() })),
      );
    expect(links).toEqual(headings);
    expect(links.length).toBeGreaterThan(1);
    const first = links[0];
    const last = links.at(-1);
    if (!first?.href || !last?.href) throw new Error('Expected section destinations');
    await nav.getByRole('link').first().click();
    await expect(page).toHaveURL(new RegExp(`${first.href}$`));
    await expect(page.locator('.article-body h2[id]').first()).toBeInViewport();
    await settledScroll(page);
    await page.goto(`/resources/${guide}/`);
    await nav.getByRole('link').last().focus();
    await expect(nav.getByRole('link').last()).toBeInViewport();
    await settledScroll(page);
    const previousScroll = await page.evaluate(() => scrollY);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`${last.href}$`));
    await settledScroll(page);
    await expect(page.locator('.article-body h2[id]').last()).toBeInViewport();
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/resources/${guide}/$`));
    await settledScroll(page);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(previousScroll, 0);
    await page.goForward();
    await expect(page).toHaveURL(new RegExp(`${last.href}$`));
    await settledScroll(page);
    await expect(page.locator('.article-body h2[id]').last()).toBeInViewport();
    await page.goto(`/resources/${guide}/${last.href}`);
    await expect(page.locator('.article-body h2[id]').last()).toBeInViewport();
    const top = await page
      .locator('.article-body h2[id]')
      .last()
      .evaluate((node) => node.getBoundingClientRect().top);
    expect(top).toBeGreaterThanOrEqual(16);
    await page.getByRole('link', { name: /All resources/ }).click();
    await expect(page).toHaveURL(/\/resources\/$/);
  });
}

for (const javaScriptEnabled of [false, true]) {
  test(`contents remain readable and usable with JavaScript ${javaScriptEnabled ? 'on' : 'off'} and reduced motion`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled, reducedMotion: 'reduce' });
    try {
      const page = await context.newPage();
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        for (const guide of guides) {
          await page.goto(`http://127.0.0.1:4321/resources/${guide}/`);
          const nav = page.getByRole('navigation', { name: 'On this page' });
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          ).toBe(true);
          for (const link of await nav.getByRole('link').all()) {
            expect((await link.boundingBox())?.height).toBeGreaterThanOrEqual(44);
            expect(
              await link.evaluate((node) => parseFloat(getComputedStyle(node).fontSize)),
            ).toBeGreaterThanOrEqual(15);
          }
          const first = nav.getByRole('link').first();
          await first.focus();
          await page.keyboard.press('Enter');
          await expect(page.locator('.article-body h2[id]').first()).toBeInViewport();
        }
      }
    } finally {
      await context.close();
    }
  });
}

test('touch visitors can jump to a section without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    javaScriptEnabled: false,
  });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4321/resources/workflow/');
    const link = page.getByRole('navigation', { name: 'On this page' }).getByRole('link').nth(2);
    const href = await link.getAttribute('href');
    await link.tap();
    expect(new URL(page.url()).hash).toBe(href);
    await expect(page.locator('.article-body h2[id]').nth(2)).toBeInViewport();
  } finally {
    await context.close();
  }
});
