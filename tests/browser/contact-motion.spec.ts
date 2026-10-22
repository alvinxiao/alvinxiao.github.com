import { expect, test, type Page } from '@playwright/test';

async function holdIntro(page: Page) {
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      document
        .querySelector('.contact-hero')
        ?.getAnimations()
        .forEach((animation) => {
          animation.pause();
          animation.currentTime = 0;
        });
    });
  });
}

async function expectStationaryChildren(page: Page) {
  const states = await page.locator('.contact-hero > *').evaluateAll((elements) =>
    elements.map((element) => ({
      animations: element.getAnimations().length,
      transform: getComputedStyle(element).transform,
      translate: getComputedStyle(element).translate,
      delay: getComputedStyle(element).animationDelay,
    })),
  );
  expect(states).toEqual(
    Array.from({ length: 3 }, () => ({
      animations: 0,
      transform: 'none',
      translate: 'none',
      delay: '0s',
    })),
  );
}

test('Contact fades as one group without moving text at four viewport widths', async ({ page }) => {
  await holdIntro(page);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/contact/');
    await page.evaluate(() => document.fonts.ready);
    const hero = page.locator('.contact-hero');
    await expect.poll(() => hero.evaluate((element) => element.getAnimations().length)).toBe(1);
    await expectStationaryChildren(page);
    const positions = await page.locator('.contact-hero > *').evaluateAll((elements) =>
      elements.map((element) => ({
        x: element.getBoundingClientRect().x,
        y: element.getBoundingClientRect().y,
        width: element.getBoundingClientRect().width,
        height: element.getBoundingClientRect().height,
      })),
    );
    const opacity = [];
    for (const time of [0, 250, 500]) {
      await hero.evaluate((element, currentTime) => {
        element.getAnimations().forEach((animation) => {
          animation.currentTime = currentTime;
        });
      }, time);
      opacity.push(await hero.evaluate((element) => Number(getComputedStyle(element).opacity)));
      expect(
        await page.locator('.contact-hero > *').evaluateAll((elements) =>
          elements.map((element) => ({
            x: element.getBoundingClientRect().x,
            y: element.getBoundingClientRect().y,
            width: element.getBoundingClientRect().width,
            height: element.getBoundingClientRect().height,
          })),
        ),
      ).toEqual(positions);
      await expect(hero).toHaveCSS('transform', 'none');
      await expect(hero).toHaveCSS('translate', 'none');
    }
    expect(opacity[0]).toBeCloseTo(0.65);
    expect(opacity[1]).toBeGreaterThan(0.65);
    expect(opacity[1]).toBeLessThan(1);
    expect(opacity[2]).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});

test('initial and runtime reduced motion immediately settle the Contact intro', async ({
  page,
}) => {
  await holdIntro(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/contact/');
  const hero = page.locator('.contact-hero');
  await expect(hero).toHaveCSS('opacity', '1');
  expect(await hero.evaluate((element) => element.getAnimations().length)).toBe(0);
  await expectStationaryChildren(page);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.reload();
  await expect(hero).toHaveCSS('opacity', '0.65');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(hero).toHaveCSS('opacity', '1');
  expect(await hero.evaluate((element) => element.getAnimations().length)).toBe(0);
  await expectStationaryChildren(page);
});

test('Contact stays readable and navigation usable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 1000 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4321/contact/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/What are you\s*working on\?/);
    await expect(page.locator('.contact-hero')).toHaveCSS('opacity', '1');
    await expectStationaryChildren(page);
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Services', exact: true })
      .tap();
    await expect(page).toHaveURL(/\/services\/$/);
  } finally {
    await context.close();
  }
});

test('native navigation reaches the single Contact fade while Services keeps its entrance', async ({
  page,
}) => {
  await holdIntro(page);
  await page.goto('/services/');
  const names = await page
    .locator('.page-hero > *')
    .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).animationName));
  expect(names.every((name) => name === 'settle-in')).toBe(true);
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .locator('a[href="/contact/"]')
    .click();
  await expect(page).toHaveURL('/contact/');
  const hero = page.locator('.contact-hero');
  await expect.poll(() => hero.evaluate((element) => element.getAnimations().length)).toBe(1);
  await expectStationaryChildren(page);
  await hero.evaluate((element) =>
    element.getAnimations().forEach((animation) => animation.finish()),
  );
  await expect(hero).toHaveCSS('opacity', '1');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/What are you\s*working on\?/);
});
