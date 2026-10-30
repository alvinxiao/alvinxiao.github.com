import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { services } from '../../src/content/services';
const ids = ['getting-started', 'problem-solving', 'workflow-audit'];

test('each starting point presents approved service copy and tailored contact routing', async ({
  page,
}) => {
  await page.goto('/');
  const section = page.locator('[data-starting-point]');
  await section.scrollIntoViewIfNeeded();
  const requests: string[] = [];
  page.on('request', (request) => {
    if (['fetch', 'xhr'].includes(request.resourceType())) requests.push(request.url());
  });
  for (const id of ids) {
    const service = services.find((item) => item.id === id);
    if (!service) throw new Error(`Missing test service ${id}`);
    await section.locator(`input[value="${id}"]`).check();
    const result = section.locator(`[data-starting-result="${id}"]`);
    await expect(result).toBeVisible();
    await expect(result).toHaveCSS('opacity', '1');
    await expect(result).toContainText(service.name);
    await expect(result).toContainText(service.summary);
    await expect(result.getByRole('link', { name: 'Talk about this' })).toHaveAttribute(
      'href',
      `/contact/?service=${id}`,
    );
    await expect(result.getByRole('link', { name: /See what's included/ })).toHaveAttribute(
      'href',
      `/services/#${id}`,
    );
    for (const other of ids.filter((value) => value !== id))
      await expect(section.locator(`[data-starting-result="${other}"]`)).not.toBeVisible();
    expect(
      (await new AxeBuilder({ page }).include('[data-starting-point]').analyze()).violations,
    ).toEqual([]);
  }
  expect(requests).toEqual([]);
  await section.getByRole('link', { name: 'Talk about this' }).click();
  await expect(page.locator('[name="interest"]')).toHaveValue('audit');
  await page.locator('[name="interest"]').selectOption('other');
  await expect(page.locator('[name="interest"]')).toHaveValue('other');
});

test('native keyboard selection and links work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL: 'http://127.0.0.1:4321',
  });
  try {
    const page = await context.newPage();
    await page.goto('/');
    const section = page.locator('[data-starting-point]');
    await section.locator('input[value="getting-started"]').focus();
    await page.keyboard.press('ArrowRight');
    await expect(section.locator('input[value="problem-solving"]')).toBeChecked();
    await expect(section.locator('[data-starting-result="problem-solving"]')).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(section.getByRole('link', { name: 'Talk about this' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/contact\/\?service=problem-solving$/);
  } finally {
    await context.close();
  }
});

test('selection stays stable and readable across compact and wide layouts', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    const section = page.locator('[data-starting-point]');
    await section.scrollIntoViewIfNeeded();
    const initial = await section.boundingBox();
    for (const id of ids) {
      await section.locator(`input[value="${id}"]`).check();
      expect((await section.boundingBox())?.height).toBe(initial?.height);
      expect((await section.boundingBox())?.width).toBe(initial?.width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const result = section.locator(`[data-starting-result="${id}"]`);
      for (const link of await result.getByRole('link').all())
        expect((await link.boundingBox())?.height).toBeGreaterThanOrEqual(44);
      expect(
        await section.evaluate((node) =>
          [...node.querySelectorAll('p,label,legend,a')]
            .filter((element) => getComputedStyle(element).visibility === 'visible')
            .every((element) => parseFloat(getComputedStyle(element).fontSize) >= 15),
        ),
      ).toBe(true);
    }
  }
});

test('touch selection opens the chosen scope', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:4321',
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  try {
    const page = await context.newPage();
    await page.goto('/');
    const section = page.locator('[data-starting-point]');
    await section
      .locator('label')
      .filter({ has: page.locator('input[value="workflow-audit"]') })
      .tap();
    await section.getByRole('link', { name: /See what's included/ }).tap();
    await expect(page).toHaveURL(/\/services\/#workflow-audit$/);
    await expect(page.locator('details[open]')).toHaveCount(8);
  } finally {
    await context.close();
  }
});

test('forced colors preserve native radio selection and keyboard focus', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await page.goto('/');
  const section = page.locator('[data-starting-point]');
  for (const id of ids) {
    const radio = section.locator(`input[value="${id}"]`);
    await radio.focus();
    await page.keyboard.press('Space');
    await expect(radio).toBeChecked();
    await expect(radio).toHaveCSS('appearance', 'auto');
    await expect(section.locator(`[data-starting-result="${id}"]`)).toBeVisible();
    await expect(radio.locator('..')).toHaveCSS('outline-width', '3px');
  }
});
