import { expect, test, type Page } from '@playwright/test';

async function holdFirstReveal(page: Page) {
  await page.addInitScript(() => {
    const animate = HTMLElement.prototype.animate;
    HTMLElement.prototype.animate = function (keyframes, options) {
      const animation = animate.call(this, keyframes, options);
      if (this.hasAttribute('data-reveal')) {
        animation.pause();
        animation.currentTime = 0;
        this.dataset.heldReveal = 'true';
      }
      return animation;
    };
    for (const type of ['pointerdown', 'pointerup', 'click'])
      document.addEventListener(
        type,
        (event) => {
          if (event.target instanceof HTMLElement && event.target.closest('#getting-started')) {
            const summary = document.querySelector('#getting-started summary');
            if (summary instanceof HTMLElement) {
              summary.dataset[`${type}Target`] = event.target.tagName;
              summary.dataset[`${type}Top`] = String(summary.getBoundingClientRect().top);
            }
          }
        },
        true,
      );
  });
  await page.goto('/services/');
  const section = page.locator('#getting-started');
  const summary = section.locator('summary').first();
  await summary.scrollIntoViewIfNeeded();
  await expect(section).toHaveAttribute('data-held-reveal', 'true');
  await expect.poll(() => section.evaluate((node) => node.getAnimations().length)).toBe(1);
  return { section, summary, details: section.locator('details').first() };
}

for (const width of [320, 390, 768, 1440])
  test(`pointer activation retains its summary target at ${width}px during a held reveal`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const { section, summary, details } = await holdFirstReveal(page);
    await summary.click();
    await expect(details).not.toHaveAttribute('open');
    await expect(summary).toBeFocused();
    for (const event of ['pointerdown', 'pointerup', 'click'])
      await expect(summary).toHaveAttribute(`data-${event}-target`, 'SUMMARY');
    expect(
      Math.abs(
        Number(await summary.getAttribute('data-pointerdown-top')) -
          Number(await summary.getAttribute('data-pointerup-top')),
      ),
    ).toBeLessThan(0.5);
    await expect(section).toHaveCSS('transform', 'none');
    await expect(section).toHaveCSS('opacity', '1');
    await expect.poll(() => section.evaluate((node) => node.getAnimations().length)).toBe(0);
  });

test('keyboard focus still settles a held reveal before native Space activation', async ({
  page,
}) => {
  const { section, summary, details } = await holdFirstReveal(page);
  await summary.focus();
  await expect(section).toHaveCSS('transform', 'none');
  await expect(section).toHaveCSS('opacity', '1');
  await page.keyboard.press('Space');
  await expect(details).not.toHaveAttribute('open');
  await expect(summary).toBeFocused();
});

test('touch activation closes the native disclosure during a held reveal', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    baseURL: 'http://127.0.0.1:4321',
  });
  try {
    const page = await context.newPage();
    const { section, summary, details } = await holdFirstReveal(page);
    await summary.tap();
    await expect(details).not.toHaveAttribute('open');
    await expect(section).toHaveCSS('transform', 'none');
  } finally {
    await context.close();
  }
});

test('background clicks leave later reveals pending', async ({ page }) => {
  await page.addInitScript(() => {
    const animate = HTMLElement.prototype.animate;
    HTMLElement.prototype.animate = function (keyframes, options) {
      const animation = animate.call(this, keyframes, options);
      if (this.hasAttribute('data-reveal')) this.dataset.revealStarts = '1';
      return animation;
    };
    document.addEventListener(
      'click',
      (event) => {
        if (event.target instanceof HTMLElement)
          document.documentElement.dataset.backgroundTarget = event.target.tagName;
      },
      { once: true },
    );
  });
  await page.goto('/services/');
  await page.locator('main').click({ position: { x: 1, y: 1 } });
  await expect(page.locator('html')).toHaveAttribute('data-background-target', 'MAIN');
  const later = page.locator('#custom-automation');
  await expect(later).not.toHaveAttribute('data-reveal-starts');
  await later.scrollIntoViewIfNeeded();
  await expect(later).toHaveAttribute('data-reveal-starts', '1');
});
