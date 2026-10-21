import { expect, test, type Page } from '@playwright/test';
import approvals from '../../src/content/approval.json' with { type: 'json' };

async function holdAccent(page: Page) {
  await page.addInitScript(() => {
    const animate = HTMLElement.prototype.animate;
    HTMLElement.prototype.animate = function (keyframes, options) {
      const animation = animate.call(this, keyframes, options);
      if (this.classList.contains('about-heading-accent')) {
        this.dataset.starts = String(Number(this.dataset.starts || 0) + 1);
        animation.pause();
      }
      return animation;
    };
  });
}

async function finishOtherMotion(page: Page) {
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      const effect = animation.effect;
      if (
        effect instanceof KeyframeEffect &&
        effect.target instanceof Element &&
        !effect.target.classList.contains('about-heading-accent')
      )
        animation.finish();
    }
  });
}

test('the decorative line progresses once while biography stays unchanged and stationary', async ({
  page,
}) => {
  await holdAccent(page);
  await page.setViewportSize({ width: 390, height: 500 });
  await page.goto('/about/');
  const accent = page.locator('.about-heading-accent');
  await expect(accent).toHaveAttribute('aria-hidden', 'true');
  await expect(accent).toHaveAttribute('data-starts', '1');
  await accent.evaluate((element) => {
    for (const animation of element.getAnimations()) animation.currentTime = 200;
  });
  await expect(accent).toHaveCSS('transform', 'matrix(0, 0, 0, 1, 0, 0)');
  await accent.evaluate((element) => {
    for (const animation of element.getAnimations()) animation.currentTime = 450;
  });
  const scale = await accent.evaluate(
    (element) => new DOMMatrix(getComputedStyle(element).transform).a,
  );
  expect(scale).toBeGreaterThan(0);
  expect(scale).toBeLessThan(1);
  await accent.evaluate((element) => {
    for (const animation of element.getAnimations()) animation.finish();
  });
  await expect(accent).toHaveCSS('transform', 'none');
  await expect.poll(() => accent.evaluate((element) => element.getAnimations().length)).toBe(0);
  const prose = page.locator('.prose');
  await expect(prose).not.toHaveAttribute('data-reveal');
  expect(await prose.locator('p').allTextContents()).toEqual(approvals.biography.split('\n\n'));
  await prose.locator('p').last().scrollIntoViewIfNeeded();
  await expect(prose).toHaveCSS('opacity', '1');
  await expect(prose).toHaveCSS('transform', 'none');
  expect(await prose.evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(
    0,
  );
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(accent).toHaveAttribute('data-starts', '1');
  await expect(accent).toHaveCSS('transform', 'none');
});

test('reduced motion is static initially and cancels permanently during a visit', async ({
  page,
}) => {
  await holdAccent(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/about/');
  const accent = page.locator('.about-heading-accent');
  await expect(accent).not.toHaveAttribute('data-starts');
  await expect(accent).toHaveCSS('transform', 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(accent).not.toHaveAttribute('data-starts');
  await page.reload();
  await expect(accent).toHaveAttribute('data-starts', '1');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => accent.evaluate((element) => element.getAnimations().length)).toBe(0);
  await expect(accent).toHaveCSS('transform', 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(accent).toHaveAttribute('data-starts', '1');
  await expect(accent).toHaveCSS('transform', 'none');
  expect(await accent.evaluate((element) => element.getAnimations().length)).toBe(0);
});

test('accent geometry never shifts heading or biography at supported widths', async ({ page }) => {
  await holdAccent(page);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/about/');
    await page.evaluate(() => document.fonts.ready);
    await finishOtherMotion(page);
    const heading = page.locator('h1');
    const prose = page.locator('.prose');
    const before = [await heading.boundingBox(), await prose.boundingBox()];
    await page.locator('.about-heading-accent').evaluate((element) => {
      for (const animation of element.getAnimations()) animation.currentTime = 850;
    });
    expect([await heading.boundingBox(), await prose.boundingBox()]).toEqual(before);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const decoration = await page.locator('.about-heading-accent').boundingBox();
    expect(decoration?.width).toBe(96);
    expect(decoration?.height).toBe(4);
  }
});

test('missing animation API and no JavaScript keep static artwork and usable navigation', async ({
  browser,
}) => {
  for (const javaScriptEnabled of [true, false]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 900 },
      hasTouch: true,
      isMobile: true,
      javaScriptEnabled,
    });
    try {
      const page = await context.newPage();
      if (javaScriptEnabled)
        await page.addInitScript(() => {
          Object.defineProperty(HTMLElement.prototype, 'animate', { value: undefined });
        });
      await page.goto('http://127.0.0.1:4321/about/');
      const accent = page.locator('.about-heading-accent');
      await expect(accent).toHaveCSS('transform', 'none');
      await expect(page.locator('h1')).toHaveText("Hi, I'm Alvin.");
      await expect(page.locator('.prose p').first()).toHaveText(
        approvals.biography.split('\n\n').slice(0, 1),
      );
      if (javaScriptEnabled) await page.getByRole('button', { name: 'Menu' }).tap();
      else await expect(page.getByRole('button', { name: 'Menu' })).not.toBeVisible();
      await page
        .getByRole('navigation', { name: 'Main navigation' })
        .getByRole('link', { name: 'Services', exact: true })
        .tap();
      await expect(page).toHaveURL(/\/services\/$/);
    } finally {
      await context.close();
    }
  }
});
