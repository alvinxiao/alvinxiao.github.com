import { expect, test, type Locator, type Page } from '@playwright/test';

const detailsSelector = '#getting-started details';

async function firstDisclosure(page: Page) {
  await page.goto('/services/#getting-started');
  const details = page.locator(detailsSelector).first();
  await details.locator('summary').scrollIntoViewIfNeeded();
  return details;
}

async function settle(details: Locator) {
  await expect
    .poll(() => details.evaluate((element) => element.getAnimations({ subtree: true }).length))
    .toBe(0);
}

async function contentHeight(details: Locator) {
  return details.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element, '::details-content').blockSize),
  );
}

test('all service disclosures start open and native mouse, Enter, and Space retain summary focus', async ({
  page,
}) => {
  const details = await firstDisclosure(page);
  await expect(page.locator('.service-detail details[open]')).toHaveCount(8);
  const summary = details.locator('summary');
  await summary.click();
  await expect(details).not.toHaveAttribute('open');
  await expect(summary).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(details).toHaveAttribute('open');
  await expect(summary).toBeFocused();
  await page.keyboard.press('Space');
  await expect(details).not.toHaveAttribute('open');
  await expect(summary).toBeFocused();
  await settle(details);
});

test('supported disclosures animate intrinsic height in both directions and rapid reversal settles', async ({
  page,
}) => {
  const details = await firstDisclosure(page);
  const summary = details.locator('summary');
  const openHeight = await contentHeight(details);
  expect(openHeight).toBeGreaterThan(0);
  const sampleToggle = () =>
    details.evaluate(async (element) => {
      element.querySelector('summary')?.click();
      const heights: number[] = [];
      const started = performance.now();
      await new Promise<void>((resolve) => {
        const sample = () => {
          heights.push(Number.parseFloat(getComputedStyle(element, '::details-content').blockSize));
          if (performance.now() - started >= 500) resolve();
          else requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });
      return heights;
    });
  const closing = await sampleToggle();
  expect(closing.some((height) => height > 0 && height < openHeight)).toBe(true);
  expect(closing.at(-1)).toBe(0);
  const opening = await sampleToggle();
  expect(opening.some((height) => height > 0 && height < openHeight)).toBe(true);
  expect(opening.at(-1)).toBeCloseTo(openHeight, 0);
  await summary.focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await settle(details);
  await expect(details).not.toHaveAttribute('open');
  await expect.poll(() => contentHeight(details)).toBe(0);
  await expect(summary).toBeFocused();
  await page.keyboard.press('Enter');
  await settle(details);
  await expect.poll(() => contentHeight(details)).toBeGreaterThan(0);
});

test('enabling reduced motion stops an active transition and subsequent toggles stay instant', async ({
  page,
}) => {
  const details = await firstDisclosure(page);
  await page.addStyleTag({
    content:
      '@media (prefers-reduced-motion: no-preference) { .service-detail details::details-content, .service-detail summary::before { transition-duration: 10s; } }',
  });
  await details.locator('summary').click();
  await expect
    .poll(() => details.evaluate((element) => element.getAnimations({ subtree: true }).length))
    .toBeGreaterThan(0);
  expect(await contentHeight(details)).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await settle(details);
  expect(
    await details.evaluate(
      (element) => getComputedStyle(element, '::details-content').contentVisibility,
    ),
  ).toBe('hidden');
  await expect(details).not.toHaveAttribute('open');
  await expect(details.locator('summary')).toBeFocused();
  await expect(details.locator('summary')).toHaveCSS('transition-duration', '0s');
  await page.keyboard.press('Enter');
  await expect(details).toHaveAttribute('open');
  await expect(details.locator('li').last()).toBeVisible();
  expect(await details.evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(
    0,
  );
  await page.keyboard.press('Space');
  await expect(details).not.toHaveAttribute('open');
  expect(await details.evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(
    0,
  );
});

test('wrapped enlarged text remains inside the fully expanded disclosure at narrow width', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  const details = await firstDisclosure(page);
  await page.addStyleTag({
    content: '.service-detail details, .service-detail details ul { font-size: 30px; }',
  });
  const summary = details.locator('summary');
  await summary.click();
  await settle(details);
  await summary.click();
  await settle(details);
  const bounds = await details.boundingBox();
  const lastItem = await details.locator('li').last().boundingBox();
  expect(bounds).not.toBeNull();
  expect(lastItem).not.toBeNull();
  expect((lastItem?.y ?? 0) + (lastItem?.height ?? 0)).toBeLessThanOrEqual(
    (bounds?.y ?? 0) + (bounds?.height ?? 0),
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('native disclosures work with touch and without JavaScript', async ({ browser }) => {
  for (const javaScriptEnabled of [true, false]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      javaScriptEnabled,
    });
    try {
      const page = await context.newPage();
      await page.goto('http://127.0.0.1:4321/services/#getting-started');
      const details = page.locator(detailsSelector).first();
      await expect(page.locator('.service-detail details[open]')).toHaveCount(8);
      await details.locator('summary').tap();
      await expect(details).not.toHaveAttribute('open');
      await details.locator('summary').tap();
      await expect(details).toHaveAttribute('open');
      await expect(details.locator('li').last()).toBeVisible();
      await details.locator('summary').focus();
      await page.keyboard.press('Space');
      await expect(details).not.toHaveAttribute('open');
      await expect(details.locator('summary')).toBeFocused();
    } finally {
      await context.close();
    }
  }
});

test('initial reduced motion keeps disclosure content and indicators instant', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const details = await firstDisclosure(page);
  const summary = details.locator('summary');
  await expect(page.locator('.service-detail details[open]')).toHaveCount(8);
  expect(
    await details.evaluate(
      (element) => getComputedStyle(element, '::details-content').transitionDuration,
    ),
  ).toBe('0s');
  expect(
    await summary.evaluate((element) => getComputedStyle(element, '::before').transitionDuration),
  ).toBe('0s');
  await summary.click();
  await expect(details).not.toHaveAttribute('open');
  await expect(summary).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(details).toHaveAttribute('open');
  await expect(details.locator('li').last()).toBeVisible();
  expect(await details.evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(
    0,
  );
});
