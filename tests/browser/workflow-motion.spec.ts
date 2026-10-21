import { expect, test } from '@playwright/test';

test('workflow attention progresses from question to draft to human review', async ({ page }) => {
  await page.goto('/');
  const workflow = page.locator('.workflow-illustration');
  const stages: [number, number][] = [
    [1000, 0],
    [4600, 1],
    [8200, 2],
  ];
  for (const [time, activeStep] of stages) {
    const borders = await workflow.evaluate((figure, currentTime) => {
      for (const animation of figure.getAnimations({ subtree: true })) {
        animation.pause();
        animation.currentTime = currentTime;
      }
      return [...figure.querySelectorAll('li')].map(
        (step) => getComputedStyle(step).borderTopColor,
      );
    }, time);
    expect(borders[activeStep]).toBe('rgb(36, 126, 120)');
    expect(borders.filter((border) => border === 'rgb(36, 126, 120)')).toHaveLength(1);
  }
});

test('pause control stops cards, progress lines, and arrows without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4321/');
    const pause = page.getByRole('checkbox', { name: 'Pause workflow animation' });
    await pause.check();
    const states = await page
      .locator('.workflow-steps li')
      .evaluateAll((steps) =>
        steps.flatMap((step) => [
          getComputedStyle(step).animationPlayState,
          getComputedStyle(step, '::after').animationPlayState,
          ...[...step.querySelectorAll('svg')].map(
            (icon) => getComputedStyle(icon).animationPlayState,
          ),
        ]),
      );
    expect(states.every((state) => state === 'paused')).toBe(true);
    await pause.uncheck();
    await expect(page.locator('.workflow-steps li').first()).toHaveCSS(
      'animation-play-state',
      'running',
    );
  } finally {
    await context.close();
  }
});

test('reduced motion keeps the workflow static and all steps readable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('checkbox', { name: 'Pause workflow animation' })).toBeHidden();
  for (const step of await page.locator('.workflow-steps li').all()) {
    await expect(step).toBeVisible();
    await expect(step).toHaveCSS('animation-name', 'none');
    expect(
      await step.evaluate((element) => getComputedStyle(element, '::after').animationName),
    ).toBe('none');
  }
});
