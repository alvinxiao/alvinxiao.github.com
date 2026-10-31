import { expect, test } from '@playwright/test';

const heading = "Let's figure out how AI can help your business.";

test('the complete Contact action is visible in the compact 360px opening', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const action = page.locator('.hero-actions .button');
  const bounds = await action.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds?.y).toBeGreaterThan(0);
  expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThanOrEqual(640);
});

test('Home keeps readable content and a complete workflow at phone, tablet, and desktop widths', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const viewports = [
    { width: 320, height: 640 },
    { width: 360, height: 640 },
    { width: 390, height: 844 },
    { width: 768, height: 1000 },
    { width: 1440, height: 900 },
  ];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.locator('.hero h1')).toHaveText(heading);
    await expect(page.locator('.hero-description')).toContainText(
      "You don't need to be a tech expert",
    );
    await expect(page.locator('.workflow-steps li')).toHaveCount(3);
    await expect(page.locator('.workflow-steps')).toContainText('Review and send');
    const measurements = await page.locator('.hero').evaluate((hero) => {
      const copy = hero.querySelector('.hero-copy')?.getBoundingClientRect();
      const workflow = hero.querySelector('.workflow-illustration')?.getBoundingClientRect();
      const description = hero.querySelector('.hero-description')?.getBoundingClientRect();
      const actions = hero.querySelector('.hero-actions')?.getBoundingClientRect();
      if (!copy || !workflow || !description || !actions) throw new Error('Expected hero content');
      return {
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        minimumText: [
          ...hero.querySelectorAll('h1,h2,p,a,figcaption,label,.workflow-number'),
        ].every((element) => Number.parseFloat(getComputedStyle(element).fontSize) >= 15),
        copyBottom: copy.bottom,
        copyRight: copy.right,
        workflowTop: workflow.top,
        workflowLeft: workflow.left,
        actionsTop: actions.top,
        descriptionBottom: description.bottom,
      };
    });
    expect(measurements.overflow).toBe(false);
    expect(measurements.minimumText).toBe(true);
    expect(measurements.actionsTop).toBeGreaterThanOrEqual(measurements.descriptionBottom);
    if (viewport.width <= 900)
      expect(measurements.workflowTop).toBeGreaterThanOrEqual(measurements.copyBottom);
    else expect(measurements.workflowLeft).toBeGreaterThan(measurements.copyRight);
  }
});

test('200 percent root text enlargement reflows the mobile hero without clipping', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 390, 720]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await page.addStyleTag({ content: 'html { font-size: 200%; }' });
    await expect(page.locator('.hero h1')).toHaveText(heading);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    const clipping = await page
      .locator('.hero h1')
      .evaluate((element) => element.scrollWidth > element.clientWidth);
    expect(clipping).toBe(false);
    await expect(page.locator('.hero-actions .button')).toBeVisible();
    await expect(page.locator('.workflow-steps li')).toHaveCount(3);
  }
});

test('hero actions retain native keyboard and touch destinations', async ({ page, browser }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('/');
  await page.locator('.hero-actions .button').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/contact/');
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    const touchPage = await context.newPage();
    await touchPage.goto('http://127.0.0.1:4321/');
    await touchPage.locator('.hero-actions .text-link').tap();
    await expect(touchPage).toHaveURL(/\/services\/$/);
  } finally {
    await context.close();
  }
});

test('no JavaScript and missing observers retain the full workflow and CSS pause control', async ({
  browser,
}) => {
  for (const javaScriptEnabled of [false, true]) {
    const context = await browser.newContext({
      viewport: { width: 320, height: 640 },
      javaScriptEnabled,
    });
    try {
      const page = await context.newPage();
      if (javaScriptEnabled)
        await page.addInitScript(() =>
          Object.defineProperty(window, 'IntersectionObserver', { value: undefined }),
        );
      await page.goto('http://127.0.0.1:4321/');
      await expect(page.locator('.hero h1')).toHaveText(heading);
      await expect(page.locator('.workflow-steps li')).toHaveCount(3);
      const pause = page.getByRole('checkbox', { name: 'Pause workflow animation' });
      await pause.check();
      await expect(page.locator('.workflow-steps li').first()).toHaveCSS(
        'animation-play-state',
        'paused',
      );
      await pause.uncheck();
      await expect(page.locator('.workflow-steps li').first()).toHaveCSS(
        'animation-play-state',
        'running',
      );
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      await page.locator('.hero-actions .text-link').click();
      await expect(page).toHaveURL(/\/services\/$/);
    } finally {
      await context.close();
    }
  }
});
