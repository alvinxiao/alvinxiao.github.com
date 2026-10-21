import { expect, test, type Locator, type Page } from '@playwright/test';

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

async function prepareWorkflow(page: Page) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  const workflow = page.locator('.workflow-illustration');
  await workflow.scrollIntoViewIfNeeded();
  await expect(workflow).not.toHaveAttribute('data-workflow-paused');
  return workflow;
}

async function expectPlayback(workflow: Locator, state: 'paused' | 'running') {
  await expect(workflow.locator('li').first()).toHaveCSS('animation-play-state', state);
  const states = await workflow
    .locator('li')
    .evaluateAll((steps) =>
      steps.flatMap((step) => [
        getComputedStyle(step).animationPlayState,
        getComputedStyle(step, '::after').animationPlayState,
        ...[...step.querySelectorAll('svg')].map(
          (icon) => getComputedStyle(icon).animationPlayState,
        ),
      ]),
    );
  expect(states.every((value) => value === state)).toBe(true);
}

async function animationTime(workflow: Locator) {
  return workflow
    .locator('li')
    .first()
    .evaluate(async (step) => {
      const animation = step.getAnimations()[0];
      if (!animation) throw new Error('Expected workflow card animation');
      await animation.ready;
      if (typeof animation.currentTime !== 'number') throw new Error('Expected animation time');
      return animation.currentTime;
    });
}

async function hideWorkflow(page: Page, workflow: Locator) {
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }),
  );
  await expect(workflow).toHaveAttribute('data-workflow-paused');
  await expectPlayback(workflow, 'paused');
}

async function visibility(page: Page, state: 'hidden' | 'visible') {
  await page.evaluate((value) => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value });
    document.dispatchEvent(new Event('visibilitychange'));
  }, state);
}

test('offscreen playback freezes every effect and resumes its existing phase', async ({ page }) => {
  const workflow = await prepareWorkflow(page);
  await expectPlayback(workflow, 'running');
  await hideWorkflow(page, workflow);
  const stopped = await animationTime(workflow);
  await page.waitForTimeout(180);
  expect(await animationTime(workflow)).toBe(stopped);
  await workflow.scrollIntoViewIfNeeded();
  await expect(workflow).not.toHaveAttribute('data-workflow-paused');
  await expectPlayback(workflow, 'running');
  expect(await animationTime(workflow)).toBeGreaterThanOrEqual(stopped);
  await expect.poll(() => animationTime(workflow)).toBeGreaterThan(stopped + 20);
  for (let iteration = 0; iteration < 3; iteration++) {
    await hideWorkflow(page, workflow);
    await workflow.scrollIntoViewIfNeeded();
    await expect(workflow).not.toHaveAttribute('data-workflow-paused');
  }
  await expectPlayback(workflow, 'running');
});

test('simulated document visibility preserves phase and never overrides a user pause', async ({
  page,
}) => {
  const workflow = await prepareWorkflow(page);
  const pause = page.getByRole('checkbox', { name: 'Pause workflow animation' });
  await visibility(page, 'hidden');
  await expectPlayback(workflow, 'paused');
  const stopped = await animationTime(workflow);
  await page.waitForTimeout(180);
  expect(await animationTime(workflow)).toBe(stopped);
  await visibility(page, 'visible');
  await expectPlayback(workflow, 'running');
  await expect.poll(() => animationTime(workflow)).toBeGreaterThan(stopped + 20);
  await pause.focus();
  await page.keyboard.press('Space');
  await expect(pause).toBeChecked();
  await hideWorkflow(page, workflow);
  await visibility(page, 'hidden');
  await visibility(page, 'visible');
  await workflow.scrollIntoViewIfNeeded();
  await expectPlayback(workflow, 'paused');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(pause).toBeHidden();
  await expect(workflow.locator('li').first()).toHaveCSS('animation-name', 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(pause).toBeChecked();
  await expectPlayback(workflow, 'paused');
  await hideWorkflow(page, workflow);
  await pause.evaluate((input) => {
    if (!(input instanceof HTMLInputElement)) throw new Error('Expected pause checkbox');
    input.checked = false;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expectPlayback(workflow, 'paused');
  await workflow.scrollIntoViewIfNeeded();
  await expectPlayback(workflow, 'running');
});

test('initially offscreen mobile workflow starts paused and motion preferences stay static', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto('/');
  const workflow = page.locator('.workflow-illustration');
  await expect(workflow).toHaveAttribute('data-workflow-paused');
  await expectPlayback(workflow, 'paused');
  await workflow.scrollIntoViewIfNeeded();
  await expectPlayback(workflow, 'running');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(workflow.locator('li').first()).toHaveCSS('animation-name', 'none');
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }),
  );
  await expect(workflow).toHaveAttribute('data-workflow-paused');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expectPlayback(workflow, 'paused');
  await workflow.scrollIntoViewIfNeeded();
  await expectPlayback(workflow, 'running');
  await page.evaluate(() =>
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })),
  );
  await expectPlayback(workflow, 'running');
});

test('missing and throwing observers retain CSS animation and the pause checkbox', async ({
  browser,
}) => {
  for (const failure of ['missing', 'constructor', 'observe']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 700 } });
    try {
      const page = await context.newPage();
      await page.addInitScript((mode) => {
        if (mode === 'missing')
          Object.defineProperty(window, 'IntersectionObserver', { value: undefined });
        else if (mode === 'constructor') {
          Object.defineProperty(window, 'IntersectionObserver', {
            value: class {
              constructor() {
                throw new Error('Observer unavailable');
              }
            },
          });
        } else
          IntersectionObserver.prototype.observe = () => {
            throw new Error('Observation unavailable');
          };
      }, failure);
      await page.goto('http://127.0.0.1:4321/');
      const workflow = page.locator('.workflow-illustration');
      await expect(workflow).not.toHaveAttribute('data-workflow-paused');
      await expectPlayback(workflow, 'running');
      const pause = page.getByRole('checkbox', { name: 'Pause workflow animation' });
      await pause.check();
      await expectPlayback(workflow, 'paused');
      await pause.uncheck();
      await expectPlayback(workflow, 'running');
    } finally {
      await context.close();
    }
  }
});

test('the no-JavaScript pause control works with keyboard and touch', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 900 },
    javaScriptEnabled: false,
    hasTouch: true,
    isMobile: true,
  });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4321/');
    const pause = page.getByRole('checkbox', { name: 'Pause workflow animation' });
    const workflow = page.locator('.workflow-illustration');
    await pause.focus();
    await page.keyboard.press('Space');
    await expect(pause).toBeChecked();
    await expectPlayback(workflow, 'paused');
    await pause.tap();
    await expect(pause).not.toBeChecked();
    await expectPlayback(workflow, 'running');
  } finally {
    await context.close();
  }
});
