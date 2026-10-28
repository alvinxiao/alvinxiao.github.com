import { expect, test } from '@playwright/test';
import { workflowExample, workflowExamples } from '../../src/content/workflow-example';

test('the worked example keeps the original examples and shows one fictional reply', async ({
  page,
}) => {
  await page.goto('/');
  const worked = page.locator('.workflow-example');
  await expect(worked.getByRole('heading', { level: 3 })).toHaveText(workflowExample.title);
  await expect(worked).toContainText(workflowExample.caveat);
  await expect(worked.getByRole('radio')).toHaveCount(3);
  for (const [index, example] of workflowExamples.entries()) {
    await expect(worked.getByRole('radio', { name: example.need })).toHaveAttribute(
      'aria-controls',
      `worked-example-panel-${example.id}`,
    );
    const panel = worked.locator(`[data-case="${example.id}"]`);
    await expect(panel.locator('.customer-question')).toHaveText(example.question);
    await expect(panel.locator('.source-label')).toHaveText(example.sourceLabel);
    await expect(panel.locator('.source-fact')).toHaveText(example.fact);
    await expect(panel.locator('h4')).toHaveText(example.approach);
    await expect(panel.locator('.reply-card p')).toHaveText(example.reply);
    await expect(panel.locator('.reply-note')).toHaveText(example.note);
    if (index === 0) await expect(panel).toBeVisible();
    else await expect(panel).toBeHidden();
  }
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
  await expect(page.locator('.hero-actions .text-link')).toHaveAttribute('href', '/services/');
});

test('native arrow and Space selection changes the reply without requests or timed cycling', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const worked = page.locator('.workflow-example');
  const hours = worked.getByRole('radio', { name: 'Saturday pickup?' });
  const status = worked.getByRole('radio', { name: 'Order ready?' });
  const unusual = worked.getByRole('radio', { name: 'Special request' });
  await hours.focus();
  await page.waitForLoadState('networkidle');
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.keyboard.press('ArrowRight');
  await expect(status).toBeChecked();
  await expect(worked.locator('[data-case="status"]')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(unusual).toBeChecked();
  await expect(worked.locator('[data-case="request"]')).toBeVisible();
  await expect(worked.locator('[data-case="status"]')).toBeHidden();
  await hours.focus();
  await page.keyboard.press('Space');
  await expect(hours).toBeChecked();
  await expect(worked.locator('[data-case="hours"]')).toBeVisible();
  const motion = await worked.evaluate(
    (element) => element.getAnimations({ subtree: true }).length,
  );
  expect(motion).toBe(0);
  expect(requests).toEqual([]);
});

test('all choices keep a stable footprint and readable reflow at phone, tablet, and desktop widths', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const worked = page.locator('.workflow-example');
    const positions: {
      height: number;
      guideTop: number;
      controls: { left: number; top: number; width: number; height: number }[];
      cards: { top: number; height: number }[];
    }[] = [];
    for (const example of workflowExamples) {
      await worked.getByRole('radio', { name: example.need }).check();
      await expect(worked.locator(`[data-case="${example.id}"]`)).toBeVisible();
      positions.push(
        await worked.evaluate((element) => {
          const panels = element.querySelector('.workflow-example-panels')?.getBoundingClientRect();
          const guide = element.querySelector('.workflow-example-guide')?.getBoundingClientRect();
          if (!panels || !guide) throw new Error('Expected reply panel and guide');
          return {
            height: panels.height,
            guideTop: guide.top + window.scrollY,
            cards: [...element.querySelectorAll('.workflow-example-panel')]
              .filter((panel) => getComputedStyle(panel).visibility === 'visible')
              .flatMap((panel) => [
                ...panel.querySelectorAll('.customer-question,.source-card,.reply-card'),
              ])
              .map((card) => {
                const rect = card.getBoundingClientRect();
                return { top: rect.top + window.scrollY, height: rect.height };
              }),
            controls: [...element.querySelectorAll('label')].map((label) => {
              const rect = label.getBoundingClientRect();
              return {
                left: rect.left,
                top: rect.top + window.scrollY,
                width: rect.width,
                height: rect.height,
              };
            }),
          };
        }),
      );
    }
    for (const position of positions) {
      expect(position.controls).toEqual(positions[0]?.controls);
      expect(position.cards).toEqual(positions[0]?.cards);
    }
    expect(positions.every((position) => position.height === positions[0]?.height)).toBe(true);
    expect(positions.every((position) => position.guideTop === positions[0]?.guideTop)).toBe(true);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    expect(
      await worked.evaluate((element) =>
        [...element.querySelectorAll('h3,h4,p,legend,label,a')].every(
          (node) => Number.parseFloat(getComputedStyle(node).fontSize) >= 15,
        ),
      ),
    ).toBe(true);
    for (const label of await worked.locator('label').all()) {
      expect((await label.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    }
  }
});

test('touch, reduced motion, and no JavaScript retain every native choice and the full article link', async ({
  browser,
}) => {
  for (const javaScriptEnabled of [true, false]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      javaScriptEnabled,
      reducedMotion: 'reduce',
    });
    try {
      const page = await context.newPage();
      await page.goto('http://127.0.0.1:4321/');
      const worked = page.locator('.workflow-example');
      for (const example of workflowExamples) {
        await worked.getByRole('radio', { name: example.need }).tap();
        await expect(worked.getByRole('radio', { name: example.need })).toBeChecked();
        await expect(worked.locator(`[data-case="${example.id}"]`)).toBeVisible();
      }
      await worked.getByRole('link', { name: workflowExample.guideTitle }).tap();
      await expect(page).toHaveURL(/\/resources\/workflow\/$/);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'A better workflow may not need AI',
      );
    } finally {
      await context.close();
    }
  }
});

test('without styles all fictional replies remain readable in the document', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    for (const sheet of document.styleSheets) sheet.disabled = true;
  });
  const worked = page.locator('.workflow-example');
  for (const example of workflowExamples) {
    const panel = worked.locator(`[data-case="${example.id}"]`);
    await expect(panel).toBeVisible();
    await expect(panel).toContainText(example.question);
    await expect(panel).toContainText(example.fact);
    await expect(panel).toContainText(example.reply);
  }
  await worked.getByRole('link', { name: workflowExample.guideTitle }).click();
  await expect(page).toHaveURL(/\/resources\/workflow\/$/);
});

test('simulated unsupported-selector fallback hides choices and exposes every reply', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(() => {
    function removeEnhancement(sheet: CSSStyleSheet | CSSGroupingRule) {
      for (let index = sheet.cssRules.length - 1; index >= 0; index--) {
        const rule = sheet.cssRules[index];
        if (
          rule instanceof window.CSSSupportsRule &&
          rule.conditionText.includes(':has(') &&
          rule.cssText.includes('workflow-example')
        ) {
          sheet.deleteRule(index);
        } else if (rule instanceof window.CSSGroupingRule) {
          removeEnhancement(rule);
        }
      }
    }
    for (const sheet of document.styleSheets) removeEnhancement(sheet);
  });
  const worked = page.locator('.workflow-example');
  await expect(worked.getByRole('radio')).toHaveCount(0);
  for (const example of workflowExamples) {
    await expect(worked.getByRole('heading', { name: example.approach })).toBeVisible();
    await expect(worked).toContainText(example.question);
    await expect(worked).toContainText(example.reply);
  }
  await expect(worked.getByRole('link', { name: workflowExample.guideTitle })).toBeVisible();
});

test('the decorative connector progresses once while text stays stationary and reduced motion settles it', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const worked = page.locator('.workflow-example');
  await worked.scrollIntoViewIfNeeded();
  const samples = await worked.evaluate(async (element) => {
    const input = element.querySelector('input[value="status"]');
    const panel = element.querySelector('[data-case="status"]');
    const trace = panel?.querySelector('.horizontal .connector-trace');
    const reply = panel?.querySelector('.reply-card p');
    if (!(input instanceof HTMLInputElement) || !trace || !reply)
      throw new Error('Expected native choice, connector, and reply');
    input.checked = true;
    const values: { offset: number; textTop: number }[] = [];
    const started = performance.now();
    await new Promise<void>((resolve) => {
      const sample = () => {
        values.push({
          offset: Number.parseFloat(getComputedStyle(trace).strokeDashoffset),
          textTop: reply.getBoundingClientRect().top + window.scrollY,
        });
        if (performance.now() - started >= 850) resolve();
        else requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    return values;
  });
  expect(samples.some((sample) => sample.offset > 0 && sample.offset < 100)).toBe(true);
  expect(samples.at(-1)?.offset).toBeCloseTo(0, 3);
  expect(samples.every((sample) => sample.textTop === samples[0]?.textTop)).toBe(true);
  expect(
    await worked.evaluate(
      (element) =>
        element
          .getAnimations({ subtree: true })
          .filter((animation) => animation.playState === 'running').length,
    ),
  ).toBe(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await worked.getByRole('radio', { name: 'Special request' }).check();
  await expect(worked.locator('[data-case="request"] .horizontal .connector-trace')).toHaveCSS(
    'animation-name',
    'none',
  );
  await expect(worked.locator('[data-case="request"] .horizontal .connector-trace')).toHaveCSS(
    'stroke-dashoffset',
    '0px',
  );
});
