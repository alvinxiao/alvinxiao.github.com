import { expect, test, type Page } from '@playwright/test';

async function holdMenuAnimations(page: Page) {
  await page.addInitScript(() => {
    const animate = HTMLElement.prototype.animate;
    HTMLElement.prototype.animate = function (keyframes, options) {
      const animation = animate.call(this, keyframes, options);
      if (this.id === 'site-navigation') animation.pause();
      return animation;
    };
  });
}

async function prepare(page: Page) {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/services/');
  const toggle = page.getByRole('button', { name: 'Menu' });
  const nav = page.locator('#site-navigation');
  await expect(nav).toHaveAttribute('data-menu-state', 'closed');
  return { toggle, nav };
}

test('closing paint becomes inert immediately and Tab cannot enter its links', async ({ page }) => {
  await holdMenuAnimations(page);
  const { toggle, nav } = await prepare(page);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(nav).toHaveJSProperty('inert', false);
  await nav.evaluate((element) =>
    element.getAnimations().forEach((animation) => animation.finish()),
  );
  await expect(nav).toHaveCSS('opacity', '1');
  await nav.getByRole('link', { name: 'Services', exact: true }).focus();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(nav).toHaveAttribute('data-menu-state', 'closing');
  await expect(nav).toBeVisible();
  await expect(nav).toHaveCSS('opacity', '1');
  await expect(nav).toHaveJSProperty('inert', true);
  await nav.locator('a').first().focus();
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Tab');
  expect(await nav.evaluate((element) => element.contains(document.activeElement))).toBe(false);
  await nav.evaluate((element) =>
    element.getAnimations().forEach((animation) => animation.finish()),
  );
  await expect(nav).toHaveAttribute('data-menu-state', 'closed');
  await expect(nav).not.toBeVisible();
});

test('rapid reversals cannot let a stale close hide the reopened menu', async ({ page }) => {
  await holdMenuAnimations(page);
  const { toggle, nav } = await prepare(page);
  await toggle.click();
  await nav.evaluate((element) =>
    element.getAnimations().forEach((animation) => {
      animation.currentTime = 100;
    }),
  );
  await toggle.click();
  await expect(nav).toHaveAttribute('data-menu-state', 'closing');
  await toggle.click();
  await expect(nav).toHaveAttribute('data-menu-state', 'open');
  await nav.evaluate((element) =>
    element.getAnimations().forEach((animation) => animation.finish()),
  );
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(nav).toHaveAttribute('data-menu-state', 'open');
  await expect(nav).toHaveCSS('opacity', '1');
  await expect(nav).toHaveCSS('transform', 'none');
  await expect(nav).toHaveJSProperty('inert', false);
  await nav.getByRole('link', { name: 'About', exact: true }).click();
  await expect(page).toHaveURL('/about/');
  await expect(nav).toHaveAttribute('data-menu-state', 'closed');
});

test('crossing the breakpoint cancels paint and keeps desktop navigation interactive', async ({
  page,
}) => {
  await holdMenuAnimations(page);
  const { toggle, nav } = await prepare(page);
  await toggle.click();
  await toggle.click();
  await expect(nav).toHaveAttribute('data-menu-state', 'closing');
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(nav).toHaveAttribute('data-menu-state', 'desktop');
  await expect(nav).toBeVisible();
  await expect(nav).toHaveJSProperty('inert', false);
  expect(await nav.evaluate((element) => element.getAnimations().length)).toBe(0);
  await nav.getByRole('link', { name: 'Resources', exact: true }).focus();
  await page.setViewportSize({ width: 900, height: 900 });
  await expect(nav).toHaveAttribute('data-menu-state', 'closed');
  await expect(toggle).toBeFocused();
  await expect(nav).not.toBeVisible();
  await toggle.click();
  await page.setViewportSize({ width: 901, height: 900 });
  await expect(nav).toHaveAttribute('data-menu-state', 'desktop');
  await expect(nav.getByRole('link', { name: 'Services', exact: true })).toBeFocused();
});

test('initial and runtime reduced motion settle the correct menu endpoint', async ({ page }) => {
  await holdMenuAnimations(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const { toggle, nav } = await prepare(page);
  await toggle.click();
  expect(await nav.evaluate((element) => element.getAnimations().length)).toBe(0);
  await expect(nav).toHaveAttribute('data-menu-state', 'open');
  await toggle.click();
  await expect(nav).toHaveAttribute('data-menu-state', 'closed');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await toggle.click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(nav).toHaveAttribute('data-menu-state', 'open');
  await expect(nav).toHaveCSS('opacity', '1');
  expect(await nav.evaluate((element) => element.getAnimations().length)).toBe(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await toggle.click();
  await expect(nav).toHaveAttribute('data-menu-state', 'closing');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(nav).toHaveAttribute('data-menu-state', 'closed');
  await expect(nav).not.toBeVisible();
});

test('missing animation or inert APIs retain instant safe toggles', async ({ browser }) => {
  for (const missing of ['animate', 'inert']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
    try {
      const page = await context.newPage();
      await page.addInitScript((property) => {
        if (property === 'animate')
          Object.defineProperty(HTMLElement.prototype, 'animate', { value: undefined });
        else Reflect.deleteProperty(HTMLElement.prototype, 'inert');
      }, missing);
      await page.goto('http://127.0.0.1:4321/services/');
      const toggle = page.getByRole('button', { name: 'Menu' });
      const nav = page.locator('#site-navigation');
      await toggle.click();
      await expect(nav).toHaveAttribute('data-menu-state', 'open');
      expect(await nav.evaluate((element) => element.getAnimations().length)).toBe(0);
      await toggle.click();
      await expect(nav).toHaveAttribute('data-menu-state', 'closed');
      await expect(nav).not.toBeVisible();
      await page.keyboard.press('Tab');
      expect(await nav.evaluate((element) => element.contains(document.activeElement))).toBe(false);
    } finally {
      await context.close();
    }
  }
});

test('touch and no-JavaScript navigation preserve access and current-link emphasis', async ({
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
      await page.goto('http://127.0.0.1:4321/services/');
      const toggle = page.getByRole('button', { name: 'Menu' });
      if (javaScriptEnabled) await toggle.tap();
      else await expect(toggle).not.toBeVisible();
      const nav = page.getByRole('navigation', { name: 'Main navigation' });
      const current = nav.getByRole('link', { name: 'Services', exact: true });
      await expect(current).toHaveAttribute('aria-current', 'page');
      const style = await current.evaluate(
        (element) => getComputedStyle(element).textDecorationColor,
      );
      expect(style).not.toBe('rgba(0, 0, 0, 0)');
      await nav.getByRole('link', { name: 'About', exact: true }).tap();
      await expect(page).toHaveURL(/\/about\/$/);
    } finally {
      await context.close();
    }
  }
});
