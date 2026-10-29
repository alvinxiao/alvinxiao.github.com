import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

function approvedPrompts(guide: string) {
  return [
    ...readFileSync(
      new URL(`../../src/content/resources/${guide}.md`, import.meta.url),
      'utf8',
    ).matchAll(/^> (.+)$/gm),
  ].map((match) => match[1]);
}

for (const guide of ['ai-basics', 'getting-started']) {
  test(`${guide} copies exactly each approved fictional prompt to the real clipboard`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      permissions: ['clipboard-read', 'clipboard-write'],
    });
    try {
      const page = await context.newPage();
      await page.goto(`http://127.0.0.1:4321/resources/${guide}/`);
      const prompts = page.locator('[data-copy-prompt]');
      const expected = approvedPrompts(guide);
      await expect(prompts).toHaveCount(expected.length);
      await page.waitForLoadState('networkidle');
      const requests: string[] = [];
      page.on('request', (r) => requests.push(r.url()));
      for (const [index, prompt] of (await prompts.all()).entries()) {
        await prompt.locator('blockquote').evaluate((node) => {
          const hidden = document.createElement('span');
          hidden.hidden = true;
          hidden.textContent = 'Hidden fixture text must not be copied.';
          node.append(hidden);
        });
        const button = prompt.getByRole('button', { name: /Copy prompt/ });
        await button.focus();
        await page.keyboard.press('Enter');
        await expect(prompt.getByRole('status')).toHaveText('Copied.');
        expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(expected[index]);
        expect(await prompt.locator('blockquote').innerText()).toBe(expected[index]);
        await expect(button).toBeFocused();
      }
      expect(requests).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

test('unmarked quotations do not receive copy controls', async ({ page }) => {
  await page.route('**/resources/ai-basics/', async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        '</article>',
        '<blockquote id="ordinary-quotation"><p>A contextual quotation, not a prompt.</p></blockquote></article>',
      ),
    });
  });
  await page.goto('/resources/ai-basics/');
  await expect(page.locator('[data-copy-button]')).toHaveCount(1);
  await expect(page.locator('#ordinary-quotation')).toContainText('A contextual quotation');
  await expect(page.locator('#ordinary-quotation button')).toHaveCount(0);
  await page.goto('/resources/workflow/');
  await expect(page.locator('[data-copy-button]')).toHaveCount(0);
});

for (const failure of ['missing', 'denied']) {
  test(`${failure} clipboard access reports manual-copy fallback without success`, async ({
    page,
  }) => {
    await page.addInitScript((failure) => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value:
          failure === 'missing'
            ? undefined
            : {
                writeText: async () => {
                  throw new DOMException('Clipboard blocked', 'NotAllowedError');
                },
              },
      });
    }, failure);
    await page.goto('/resources/getting-started/');
    const prompt = page.locator('[data-copy-prompt]').first();
    const before = await prompt.locator('blockquote').innerText();
    const button = prompt.getByRole('button', { name: /Copy prompt/ });
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(prompt.getByRole('status')).toHaveText(
      'Could not copy. Select the prompt and copy it.',
    );
    await expect(prompt.getByRole('status')).not.toContainText('Copied.');
    await expect(button).toBeFocused();
    expect(await prompt.locator('blockquote').innerText()).toBe(before);
  });
}

test('pending writes keep focus, ignore repeated activation, and announce success only after completion', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: () => {
          document.documentElement.dataset.copyCalls = String(
            Number(document.documentElement.dataset.copyCalls || 0) + 1,
          );
          return new Promise<void>((resolve) =>
            document.addEventListener('finish-test-copy', () => resolve(), { once: true }),
          );
        },
      },
    });
  });
  await page.goto('/resources/ai-basics/');
  const prompt = page.locator('[data-copy-prompt]');
  const button = prompt.getByRole('button', { name: /Copy prompt/ });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(button).toHaveAttribute('aria-disabled', 'true');
  await expect(prompt.getByRole('status')).not.toHaveText('Copied.');
  await page.keyboard.press('Enter');
  expect(await page.locator('html').getAttribute('data-copy-calls')).toBe('1');
  await page.evaluate(() => document.dispatchEvent(new Event('finish-test-copy')));
  await expect(prompt.getByRole('status')).toHaveText('Copied.');
  await expect(button).toBeFocused();
  await expect(button).not.toHaveAttribute('aria-disabled', 'true');
});

test('prompts remain fully selectable without JavaScript and controls fit narrow screens', async ({
  browser,
}) => {
  for (const javaScriptEnabled of [false, true]) {
    const context = await browser.newContext({ javaScriptEnabled, reducedMotion: 'reduce' });
    try {
      const page = await context.newPage();
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto('http://127.0.0.1:4321/resources/getting-started/');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        const prompts = page.locator('[data-copy-prompt]');
        for (const [index, prompt] of (await prompts.all()).entries()) {
          expect(await prompt.locator('blockquote').innerText()).toBe(
            approvedPrompts('getting-started')[index],
          );
          expect(
            await prompt
              .locator('blockquote')
              .evaluate((node) => getComputedStyle(node).userSelect),
          ).not.toBe('none');
        }
        if (javaScriptEnabled)
          for (const button of await page.locator('[data-copy-button]').all()) {
            expect((await button.boundingBox())?.height).toBeGreaterThanOrEqual(44);
            expect(
              await button.evaluate((node) => parseFloat(getComputedStyle(node).fontSize)),
            ).toBeGreaterThanOrEqual(15);
          }
        else await expect(page.locator('[data-copy-button]')).toHaveCount(0);
      }
    } finally {
      await context.close();
    }
  }
});

test('touch activation copies the selected revision prompt', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4321/resources/getting-started/');
    const prompt = page.locator('[data-copy-prompt]').last();
    await prompt.getByRole('button', { name: /Copy prompt/ }).tap();
    await expect(prompt.getByRole('status')).toHaveText('Copied.');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      approvedPrompts('getting-started')[1],
    );
  } finally {
    await context.close();
  }
});
