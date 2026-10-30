import { expect, test, type Locator, type Page } from '@playwright/test';

async function accent(heading: Locator) {
  return heading.evaluate((element) => {
    const style = getComputedStyle(element, '::after');
    return {
      content: style.content,
      opacity: style.opacity,
      transform: style.transform,
      animation: style.animationName,
    };
  });
}

async function waitForScrollToSettle(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        let previous = window.scrollY;
        let stableFrames = 0;
        const sample = () => {
          const current = window.scrollY;
          stableFrames = Math.abs(current - previous) < 0.1 ? stableFrames + 1 : 0;
          previous = current;
          if (stableFrames >= 8) resolve();
          else requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      }),
  );
}

async function expectSelected(heading: Locator) {
  await expect.poll(async () => (await accent(heading)).content).toBe('""');
  await expect(heading).toBeInViewport();
}

test('direct service fragments show a local heading accent with all disclosures open', async ({
  page,
}) => {
  await page.goto('/services/#workflow-audit');
  await expectSelected(page.locator('#workflow-audit h2'));
  expect((await accent(page.locator('#getting-started h2'))).content).toBe('none');
  await expect(page.locator('.service-detail details[open]')).toHaveCount(8);
});

test('native mouse, keyboard, Back, and repeated same-target navigation retain predictable selection', async ({
  page,
}) => {
  await page.addInitScript(() => {
    document.addEventListener('animationstart', (event) => {
      if (event.animationName === 'service-target-confirm' && event.target instanceof HTMLElement) {
        event.target.dataset.anchorStarts = String(
          Number(event.target.dataset.anchorStarts || 0) + 1,
        );
      }
    });
  });
  await page.goto('/services/');
  const firstLink = page.locator('.service-jumps a[href="#getting-started"]');
  const firstHeading = page.locator('#getting-started h2');
  await firstLink.scrollIntoViewIfNeeded();
  await waitForScrollToSettle(page);
  await firstLink.click();
  await expect(page).toHaveURL(/#getting-started$/);
  await expectSelected(firstHeading);
  await waitForScrollToSettle(page);
  await expect(firstHeading).toHaveAttribute('data-anchor-starts', '1');
  await firstLink.scrollIntoViewIfNeeded();
  await waitForScrollToSettle(page);
  await firstLink.click();
  await expectSelected(firstHeading);
  await waitForScrollToSettle(page);
  await expect(firstHeading).toHaveAttribute('data-anchor-starts', '1');
  const secondLink = page.locator('.service-jumps a[href="#problem-solving"]');
  await secondLink.focus();
  await waitForScrollToSettle(page);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#problem-solving$/);
  await expectSelected(page.locator('#problem-solving h2'));
  await waitForScrollToSettle(page);
  expect((await accent(firstHeading)).content).toBe('none');
  await page.goBack();
  await expect(page).toHaveURL(/#getting-started$/);
  await expectSelected(firstHeading);
});

test('the finite heading underline grows without changing heading dimensions', async ({ page }) => {
  await page.goto('/services/');
  const heading = page.locator('#workflow-audit h2');
  const before = await heading.boundingBox();
  const samples = await heading.evaluate(async (element) => {
    window.location.hash = 'workflow-audit';
    const values: number[] = [];
    const started = performance.now();
    await new Promise<void>((resolve) => {
      const sample = () => {
        const transform = getComputedStyle(element, '::after').transform;
        values.push(transform === 'none' ? 1 : new DOMMatrixReadOnly(transform).a);
        if (performance.now() - started >= 1100) resolve();
        else requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    return values;
  });
  expect(samples.some((value) => value > 0.25 && value < 1)).toBe(true);
  expect(samples.at(-1)).toBeCloseTo(1, 3);
  const after = await heading.boundingBox();
  expect(after?.width).toBe(before?.width);
  expect(after?.height).toBe(before?.height);
  expect((await accent(heading)).opacity).toBe('1');
});

test('initial and runtime reduced motion keep static selection and cancel a running underline', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/services/#getting-started');
  const first = page.locator('#getting-started h2');
  await expectSelected(first);
  expect(await accent(first)).toMatchObject({ transform: 'none', opacity: '1', animation: 'none' });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addStyleTag({
    content:
      '@media (prefers-reduced-motion: no-preference) { .service-detail:target h2::after { animation-duration: 10s; } }',
  });
  await page.evaluate(() => {
    window.location.hash = 'problem-solving';
  });
  const next = page.locator('#problem-solving h2');
  await expect.poll(async () => (await accent(next)).transform).not.toBe('none');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect
    .poll(() => accent(next))
    .toMatchObject({ transform: 'none', opacity: '1', animation: 'none' });
  await expectSelected(next);
});

test('touch and no-JavaScript links preserve fragments and static readable content', async ({
  browser,
}) => {
  for (const javaScriptEnabled of [true, false]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      javaScriptEnabled,
    });
    try {
      const page = await context.newPage();
      await page.goto('http://127.0.0.1:4321/services/');
      await page.locator('.service-jumps a[href="#custom-automation"]').tap();
      await expect(page).toHaveURL(/#custom-automation$/);
      await expectSelected(page.locator('#custom-automation h2'));
      await expect(page.locator('.service-detail details[open]')).toHaveCount(8);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
    } finally {
      await context.close();
    }
  }
});

test('selected service CTA still preselects an editable inquiry interest', async ({ page }) => {
  await page.goto('/services/#workflow-audit');
  await page
    .locator('#workflow-audit')
    .getByRole('link', { name: 'Ask about this service' })
    .click();
  await expect(page.locator('[name="interest"]')).toHaveValue('audit');
  await page.locator('[name="interest"]').selectOption('other');
  await expect(page.locator('[name="interest"]')).toHaveValue('other');
});
