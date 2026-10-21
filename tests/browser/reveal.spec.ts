import { expect, test, type Page } from '@playwright/test';

async function observeReveals(page: Page, hold = false) {
  await page.addInitScript((pause) => {
    const animate = HTMLElement.prototype.animate;
    HTMLElement.prototype.animate = function (keyframes, options) {
      const animation = animate.call(this, keyframes, options);
      if (this.hasAttribute('data-reveal')) {
        this.dataset.revealStarts = String(Number(this.dataset.revealStarts || 0) + 1);
        if (pause) animation.pause();
      }
      return animation;
    };
  }, hold);
}

async function nextFrames(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

test('below-fold cards reveal once and release their final animation styles', async ({ page }) => {
  await observeReveals(page);
  await page.goto('/');
  const card = page.locator('.path-card').first();
  await expect(card).not.toHaveAttribute('data-reveal-starts');
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveAttribute('data-reveal-starts', '1');
  await expect.poll(() => card.evaluate((element) => element.getAnimations().length)).toBe(0);
  await expect(card).toHaveCSS('opacity', '1');
  await expect(card).toHaveCSS('transform', 'none');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(card).not.toBeInViewport();
  await card.scrollIntoViewIfNeeded();
  await nextFrames(page);
  await expect(card).toHaveAttribute('data-reveal-starts', '1');
});

test('initially visible content and direct service fragments do not receive another entrance', async ({
  page,
}) => {
  await observeReveals(page);
  await page.goto('/about/');
  const biography = page.locator('.prose');
  await expect(biography).toBeInViewport();
  await nextFrames(page);
  await expect(biography).not.toHaveAttribute('data-reveal-starts');
  await page.goto('/services/#custom-automation');
  const destination = page.locator('#custom-automation');
  await expect(destination).toBeInViewport();
  await nextFrames(page);
  await expect(destination).not.toHaveAttribute('data-reveal-starts');
  await expect(destination).toHaveCSS('opacity', '1');
  await expect(page.locator('details:not([open])')).toHaveCount(0);
});

test('keyboard focus immediately clears an active reveal', async ({ page }) => {
  await observeReveals(page, true);
  await page.goto('/');
  const card = page.locator('.path-card').first();
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveAttribute('data-reveal-starts', '1');
  await expect.poll(() => card.evaluate((element) => element.getAnimations().length)).toBe(1);
  await card.focus();
  await expect(card).toBeFocused();
  await expect.poll(() => card.evaluate((element) => element.getAnimations().length)).toBe(0);
  await expect(card).toHaveCSS('opacity', '1');
  await expect(card).toHaveCSS('transform', 'none');
});

test('enabling reduced motion cancels active reveals and leaves later content static', async ({
  page,
}) => {
  await observeReveals(page, true);
  await page.goto('/');
  const card = page.locator('.path-card').first();
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveAttribute('data-reveal-starts', '1');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => card.evaluate((element) => element.getAnimations().length)).toBe(0);
  await expect(card).toHaveCSS('opacity', '1');
  const laterCard = page.locator('.service-preview').last();
  await laterCard.scrollIntoViewIfNeeded();
  await nextFrames(page);
  await expect(laterCard).not.toHaveAttribute('data-reveal-starts');
  await expect(laterCard).toHaveCSS('opacity', '1');
});

test('initial reduced motion and unavailable observers keep content readable', async ({ page }) => {
  await observeReveals(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const card = page.locator('.path-card').first();
  await card.scrollIntoViewIfNeeded();
  await nextFrames(page);
  await expect(card).not.toHaveAttribute('data-reveal-starts');
  await expect(card).toHaveCSS('opacity', '1');

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    Object.defineProperty(window, 'IntersectionObserver', { value: undefined });
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.reload();
  await card.scrollIntoViewIfNeeded();
  await nextFrames(page);
  await expect(card).not.toHaveAttribute('data-reveal-starts');
  await expect(card).toHaveCSS('opacity', '1');
  expect(errors).toEqual([]);
});

test('printing cancels animation and leaves all sections visible', async ({ page }) => {
  await observeReveals(page, true);
  await page.goto('/');
  const card = page.locator('.path-card').first();
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveAttribute('data-reveal-starts', '1');
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  await expect.poll(() => card.evaluate((element) => element.getAnimations().length)).toBe(0);
  await expect(card).toHaveCSS('opacity', '1');
  const laterCard = page.locator('.service-preview').last();
  await laterCard.scrollIntoViewIfNeeded();
  await nextFrames(page);
  await expect(laterCard).not.toHaveAttribute('data-reveal-starts');
});

test('reveal targets remain visible without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4321/');
    const card = page.locator('.path-card').first();
    await card.scrollIntoViewIfNeeded();
    await expect(card).toBeVisible();
    await expect(card).toHaveCSS('opacity', '1');
    await expect(card).toHaveCSS('transform', 'none');
    await page.goto('http://127.0.0.1:4321/services/#custom-automation');
    await expect(page.locator('#custom-automation')).toBeVisible();
    await expect(page.locator('details:not([open])')).toHaveCount(0);
  } finally {
    await context.close();
  }
});
