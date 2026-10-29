import { expect, test, type Locator } from '@playwright/test';
import {
  deliveryModes,
  workflowExample,
  workflowStages,
  workflowDuration,
  workflowTiming,
} from '../../src/content/workflow-example';

async function currentTime(root: Locator) {
  return root.locator('.email-carrier').evaluate(async (carrier) => {
    const animation = carrier.getAnimations()[0];
    if (animation) await animation.ready;
    return animation && typeof animation.currentTime === 'number' ? animation.currentTime : 0;
  });
}
async function seek(root: Locator, time: number) {
  await root.evaluate((element, value) => {
    for (const animation of element.getAnimations({ subtree: true })) {
      animation.pause();
      animation.currentTime = value;
    }
  }, time);
}
async function centre(element: Locator) {
  const bounds = await element.boundingBox();
  if (!bounds) throw new Error('Expected visible diagram geometry');
  return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
}

test('the fictional email workflow preserves original examples and shows both delivery choices', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const root = page.locator('.workflow-example');
  await expect(root.getByRole('heading', { level: 3 })).toHaveText(workflowExample.title);
  await expect(root).toContainText(workflowExample.caveat);
  await expect(root.locator('.email-stage')).toHaveCount(workflowStages.length);
  await expect(root.locator('.email-preview')).toContainText(workflowExample.email);
  await expect(root.getByRole('radio', { name: 'Human approval', exact: true })).toBeChecked();
  const automatic = root.getByRole('radio', { name: 'Automatic send', exact: true });
  const approval = root.getByRole('radio', { name: 'Human approval', exact: true });
  await approval.focus();
  await page.waitForLoadState('networkidle');
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.keyboard.press('ArrowRight');
  await expect(automatic).toBeChecked();
  await expect(root.locator('.email-chain [data-delivery="automatic"]')).toBeVisible();
  await expect(root.locator('.email-chain [data-delivery="approval"]')).toBeHidden();
  await approval.focus();
  await page.keyboard.press('Space');
  await expect(approval).toBeChecked();
  expect(requests).toEqual([]);
  await expect(page.locator('.example-row')).toHaveCount(3);
  for (const [index, title] of [
    'The same questions. Again.',
    'Less copying. More doing.',
    'Find the useful bits.',
  ].entries()) {
    await expect(page.locator('.example-row').nth(index).getByRole('heading')).toHaveText(title);
  }
  await expect(page.locator('.workflow-steps li')).toHaveCount(3);
  await expect(page.locator('.hero-actions .button')).toHaveAttribute('href', '/contact/');
});

test('one carrier shows request, two thinking stages, document draft, then email delivery', async ({
  page,
}) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1100 });
    await page.goto('/');
    const root = page.locator('.workflow-example');
    await root.scrollIntoViewIfNeeded();
    await expect(root).toHaveAttribute('data-email-enhanced', '');
    await root.getByRole('button', { name: 'Pause email animation', exact: true }).click();
    const carrier = root.locator('.email-carrier');
    const positions = [];
    for (const [index, phase] of [
      { time: 400, shape: 'request' },
      { time: workflowDuration * 0.25, shape: 'thinking' },
      { time: workflowDuration * 0.45, shape: 'thinking' },
      { time: workflowDuration * 0.65, shape: 'document' },
      { time: workflowDuration, shape: 'email' },
    ].entries()) {
      await seek(root, phase.time);
      for (const shape of ['request', 'thinking', 'document', 'email']) {
        await expect(root.locator(`[data-shape="${shape}"]`)).toHaveCSS(
          'opacity',
          shape === phase.shape ? '1' : '0',
        );
      }
      const position = await centre(carrier);
      const marker = root.locator('.email-stage-marker').nth(index);
      const node = await centre(marker);
      expect(position.x).toBeCloseTo(node.x, 0);
      expect(position.y).toBeCloseTo(node.y, 0);
      await expect(marker.locator('svg')).toHaveCount(1);
      for (const [step, stage] of (await root.locator('.email-stage-marker').all()).entries())
        await expect(stage).toHaveCSS('opacity', step <= index ? '1' : '0');
      positions.push(position);
    }
    for (const [index, arrival] of workflowTiming
      .map((phase) => phase.arrival * workflowDuration)
      .entries()) {
      if (index === 0) continue;
      const marker = root.locator('.email-stage-marker').nth(index);
      await seek(root, arrival - 1);
      await expect(marker).toHaveCSS('opacity', '0');
      await seek(root, arrival);
      await expect(marker).toHaveCSS('opacity', '1');
    }
    await seek(root, workflowDuration * 0.18);
    const between = await centre(carrier);
    await expect(root.locator('.email-stage-marker').nth(1)).toHaveCSS('opacity', '0');
    const axis = width > 650 ? 'x' : 'y';
    const [start, second] = positions;
    if (!start || !second) throw new Error('Expected request and context positions');
    expect(between[axis]).toBeGreaterThan(start[axis]);
    expect(between[axis]).toBeLessThan(second[axis]);
    let previous = start;
    for (const position of positions.slice(1)) {
      expect(position[axis]).toBeGreaterThan(previous[axis]);
      previous = position;
    }
  }
});

test('pause survives delivery changes and responsive resize, and replay explicitly resumes', async ({
  page,
}) => {
  await page.goto('/');
  const root = page.locator('.workflow-example');
  await root.scrollIntoViewIfNeeded();
  await expect(root).toHaveAttribute('data-email-enhanced', '');
  await root.getByRole('button', { name: 'Replay email animation' }).click();
  await expect.poll(() => currentTime(root)).toBeGreaterThan(800);
  await root.getByRole('button', { name: 'Pause email animation', exact: true }).click();
  const paused = await currentTime(root);
  await root.getByRole('radio', { name: 'Automatic send', exact: true }).check();
  await page.setViewportSize({ width: 390, height: 1000 });
  await expect(root).toHaveAttribute('data-email-state', 'paused');
  expect(await currentTime(root)).toBeCloseTo(paused, 0);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(
    root.getByRole('button', { name: 'Resume email animation', exact: true }),
  ).toBeVisible();
  expect(await currentTime(root)).toBeCloseTo(paused, 0);
  await root.getByRole('button', { name: 'Replay email animation' }).click();
  await expect(root).toHaveAttribute('data-email-state', 'playing');
  await expect.poll(() => currentTime(root)).toBeGreaterThan(300);
  await expect(root.locator('.email-stage-marker').nth(4)).toHaveCSS('opacity', '0');
});

test('offscreen and hidden-document pauses retain phase, and the finite journey completes', async ({
  page,
}) => {
  await page.goto('/');
  const root = page.locator('.workflow-example');
  await root.scrollIntoViewIfNeeded();
  await expect(root).toHaveAttribute('data-email-enhanced', '');
  await root.getByRole('button', { name: 'Replay email animation' }).click();
  await expect.poll(() => currentTime(root)).toBeGreaterThan(500);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(root).toHaveAttribute('data-email-state', 'paused');
  const frozen = await currentTime(root);
  await page.waitForTimeout(180);
  expect(await currentTime(root)).toBeCloseTo(frozen, 0);
  await root.scrollIntoViewIfNeeded();
  await expect(root).toHaveAttribute('data-email-state', 'playing');
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(root).toHaveAttribute('data-email-state', 'paused');
  const hidden = await currentTime(root);
  await page.waitForTimeout(120);
  expect(await currentTime(root)).toBeCloseTo(hidden, 0);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(root).toHaveAttribute('data-email-state', 'complete', { timeout: 22000 });
  await expect(
    root.getByRole('button', { name: 'Pause email animation', exact: true }),
  ).toBeDisabled();
  expect(
    await root.evaluate(
      (n) => n.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length,
    ),
  ).toBe(0);
});

test('reduced motion is static initially and cancels an active journey without automatic restart', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const root = page.locator('.workflow-example');
  await root.scrollIntoViewIfNeeded();
  await expect(root.locator('.email-carrier')).toBeHidden();
  await expect(root.getByRole('button', { name: 'Replay email animation' })).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(root.locator('.email-carrier')).toBeHidden();
  await root.getByRole('button', { name: 'Replay email animation' }).click();
  await expect(root).toHaveAttribute('data-email-state', 'playing');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(root.locator('.email-carrier')).toBeHidden();
  expect(await root.evaluate((n) => n.getAnimations({ subtree: true }).length)).toBe(0);
  for (const marker of await root.locator('.email-stage-marker').all())
    await expect(marker).toHaveCSS('opacity', '1');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(root.locator('.email-carrier')).toBeHidden();
});

test('delivery choices and readable diagram remain usable without JavaScript or animation APIs', async ({
  browser,
}) => {
  for (const fallback of [
    'no-javascript',
    'no-animation',
    'no-observer',
    'no-resize',
    'throwing-animation',
  ]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 1000 },
      hasTouch: true,
      isMobile: true,
      javaScriptEnabled: fallback !== 'no-javascript',
    });
    try {
      const page = await context.newPage();
      if (fallback === 'no-animation')
        await page.addInitScript(() =>
          Object.defineProperty(Element.prototype, 'animate', { value: undefined }),
        );
      if (fallback === 'throwing-animation')
        await page.addInitScript(() =>
          Object.defineProperty(Element.prototype, 'animate', {
            value() {
              throw new Error('Unavailable animation');
            },
          }),
        );
      if (fallback === 'no-observer')
        await page.addInitScript(() =>
          Object.defineProperty(window, 'IntersectionObserver', { value: undefined }),
        );
      if (fallback === 'no-resize')
        await page.addInitScript(() =>
          Object.defineProperty(window, 'ResizeObserver', { value: undefined }),
        );
      await page.goto('http://127.0.0.1:4321/');
      const root = page.locator('.workflow-example');
      await root.getByRole('radio', { name: 'Automatic send', exact: true }).tap();
      await expect(root.locator('.email-chain [data-delivery="automatic"]')).toBeVisible();
      await expect(root.locator('.email-preview')).toContainText(workflowExample.email);
      await expect(root.locator('.email-carrier')).toBeHidden();
      for (const marker of await root.locator('.email-stage-marker').all())
        await expect(marker).toHaveCSS('opacity', '1');
      await expect(root.locator('.email-animation-controls')).toBeHidden();
      for (const step of await root.locator('[data-email-step]').all())
        await expect(step).toBeDisabled();
    } finally {
      await context.close();
    }
  }
});

test('diagram stays readable, stationary, and inside phone, tablet, and desktop layouts', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    const root = page.locator('.workflow-example');
    const measure = () =>
      root.locator('.email-preview').evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return { top: rect.top + window.scrollY, width: rect.width, height: rect.height };
      });
    const before = await measure();
    for (const mode of deliveryModes)
      await root.getByRole('radio', { name: mode.title, exact: true }).check();
    const after = await measure();
    expect(after).toEqual(before);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    expect(
      await root.evaluate((n) =>
        [...n.querySelectorAll('h3,h4,p,label,legend,button,.email-stage-marker')].every(
          (e) => parseFloat(getComputedStyle(e).fontSize) >= 15,
        ),
      ),
    ).toBe(true);
    for (const label of await root.locator('label').all())
      expect((await label.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  }
});

test('paused steps seek the carrier and description together, including keyboard and delivery choices', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 1100 });
  await page.goto('/');
  const root = page.locator('.workflow-example');
  await root.scrollIntoViewIfNeeded();
  await expect(root.locator('[data-email-step="3"]')).toBeDisabled();
  await root.getByRole('button', { name: 'Pause email animation', exact: true }).click();
  const preview = root.locator('.email-preview');
  const measure = () =>
    preview.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return { top: rect.top + window.scrollY, height: rect.height };
    });
  const before = await measure();
  for (const index of [3, 0, 4, 1, 2]) {
    const button = root.locator(`[data-email-step="${index}"]`);
    await expect(button).toBeEnabled();
    if (index === 2) {
      await button.focus();
      await page.keyboard.press('Enter');
    } else await button.click();
    await expect(root).toHaveAttribute('data-email-current', String(index));
    await expect(root).toHaveAttribute('data-email-state', 'paused');
    const timing = workflowTiming[index];
    const stage = workflowStages[index];
    if (!timing || !stage) throw new Error('Missing workflow stage');
    expect(await currentTime(root)).toBeCloseTo(timing.arrival * workflowDuration, 0);
    await expect(root.locator(`[data-email-detail="${index}"]`)).toBeVisible();
    await expect(root.locator(`[data-email-detail="${index}"]`)).toContainText(
      stage.descriptionTitle,
    );
    for (const [step, panel] of (await root.locator('[data-email-detail]').all()).entries()) {
      if (step !== index) await expect(panel).toBeHidden();
    }
    expect(await measure()).toEqual(before);
  }
  await root.locator('[data-email-step="4"]').click();
  await expect(root.locator('[data-email-detail="4"] [data-detail-mode="approval"]')).toBeVisible();
  await expect(root.locator('[data-email-detail="4"] [data-detail-mode="automatic"]')).toBeHidden();
  await root.getByRole('radio', { name: 'Automatic send', exact: true }).check();
  await expect(
    root.locator('[data-email-detail="4"] [data-detail-mode="automatic"]'),
  ).toBeVisible();
  await expect(root.locator('[data-email-detail="4"] [data-detail-mode="approval"]')).toBeHidden();
  await expect(root).toHaveAttribute('data-email-state', 'paused');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(root).toHaveAttribute('data-email-current', '4');
  expect(await currentTime(root)).toBeCloseTo(workflowDuration * 0.8, 0);
  await root.locator('[data-email-step="2"]').click();
  await root.getByRole('button', { name: 'Resume email animation', exact: true }).click();
  await expect(root).toHaveAttribute('data-email-state', 'playing');
  await expect(root.locator('[data-email-step="2"]')).toBeDisabled();
  await expect.poll(() => currentTime(root)).toBeGreaterThan(workflowDuration * 0.4 + 200);
});

test('automatic playback describes the active step and holds long enough to read', async ({
  page,
}) => {
  await page.goto('/');
  const root = page.locator('.workflow-example');
  await root.scrollIntoViewIfNeeded();
  await root.getByRole('button', { name: 'Replay email animation', exact: true }).click();
  expect(workflowDuration).toBeGreaterThanOrEqual(15000);
  for (const timing of workflowTiming)
    expect((timing.holdUntil - timing.arrival) * workflowDuration).toBeGreaterThanOrEqual(2500);
  await expect(root).toHaveAttribute('data-email-current', '0');
  await expect(root.locator('[data-email-detail="0"]')).toBeVisible();
  await expect(root).toHaveAttribute('data-email-current', '1', { timeout: 6000 });
  await expect(root.locator('[data-email-detail="1"]')).toContainText('Friday updates');
  await expect(root).toHaveAttribute('data-email-current', '2', { timeout: 6000 });
  await expect(root.locator('[data-email-detail="2"]')).toBeVisible();
});
