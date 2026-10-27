import { expect, test } from '@playwright/test';
import { services } from '../../src/content/services';

test('the comparison uses the central service content and keeps every scope disclosure open', async ({
  page,
}) => {
  await page.goto('/services/');
  const overview = page.getByRole('navigation', { name: 'Service sections' });
  await expect(overview.getByRole('listitem')).toHaveCount(services.length);
  for (const service of services) {
    const link = overview.locator(`a[href="#${service.id}"]`);
    await expect(link.locator('.service-jump-label')).toHaveText(service.label);
    await expect(link.locator('strong')).toHaveText(service.name);
    await expect(link.locator('.service-jump-summary')).toHaveText(service.summary);
  }
  await expect(page.locator('.service-detail details[open]')).toHaveCount(8);
});

test('the overview reflows into readable mobile rows without horizontal scrolling', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/services/');
    const layout = await page.locator('.service-jumps').evaluate((nav) => {
      const rows = [...nav.querySelectorAll('a')].map((link) => {
        const identity = link.querySelector('.service-jump-identity')?.getBoundingClientRect();
        const summary = link.querySelector('.service-jump-summary')?.getBoundingClientRect();
        if (!identity || !summary) throw new Error('Expected comparison text');
        return {
          height: link.getBoundingClientRect().height,
          summaryTop: summary.top,
          summaryLeft: summary.left,
          identityBottom: identity.bottom,
          identityRight: identity.right,
        };
      });
      return {
        rows,
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        readable: [
          ...nav.querySelectorAll('.service-jump-label,strong,.service-jump-summary'),
        ].every((element) => Number.parseFloat(getComputedStyle(element).fontSize) >= 15),
      };
    });
    expect(layout.overflow).toBe(false);
    expect(layout.readable).toBe(true);
    for (const row of layout.rows) {
      expect(row.height).toBeGreaterThanOrEqual(44);
      if (width <= 900) expect(row.summaryTop).toBeGreaterThanOrEqual(row.identityBottom);
      else expect(row.summaryLeft).toBeGreaterThan(row.identityRight);
    }
  }
  for (const width of [320, 390, 720]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/services/');
    await page.addStyleTag({ content: 'html { font-size: 200%; }' });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await expect(page.locator('.service-jumps a')).toHaveCount(4);
  }
});

test('keyboard fragments continue into the selected service and preserve inquiry preselection', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const service of services) {
    await page.goto('/services/');
    await page.locator(`.service-jumps a[href="#${service.id}"]`).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`#${service.id}$`));
    await expect(page.locator(`#${service.id} h2`)).toBeInViewport();
    await page.keyboard.press('Tab');
    const contact = page.locator(`#${service.id} .button`);
    await expect(contact).toBeFocused();
    await expect(page.locator('.service-detail details[open]')).toHaveCount(8);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/contact/\\?service=${service.id}$`));
    await expect(page.locator('[name="interest"]')).toHaveValue(service.interest);
    await page.locator('[name="interest"]').selectOption('other');
    await expect(page.locator('[name="interest"]')).toHaveValue('other');
  }
});

test('touch and no-JavaScript overview links retain native destinations and open details', async ({
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
      await page.goto('http://127.0.0.1:4321/services/');
      await page.locator('.service-jumps a[href="#custom-automation"]').tap();
      await expect(page).toHaveURL(/#custom-automation$/);
      await expect(page.locator('#custom-automation h2')).toBeInViewport();
      await expect(page.locator('.service-detail details[open]')).toHaveCount(8);
      await page.locator('#custom-automation .button').tap();
      await expect(page).toHaveURL(/\/contact\/\?service=custom-automation$/);
    } finally {
      await context.close();
    }
  }
});
