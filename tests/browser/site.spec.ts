import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = [
  '/',
  '/services/',
  '/about/',
  '/resources/',
  '/contact/',
  '/thank-you/',
  '/privacy/',
  '/launch-checklist/',
];

for (const route of routes) {
  test(`${route} is accessible, labelled nonproduction, and has valid local links`, async ({
    page,
  }) => {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.locator('body')).toContainText(/preview|nonproduction|not for publication/i);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://alvinxiao.github.io${route}`,
    );
    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(accessibility.violations).toEqual([]);
    const localLinks = await page.locator('a[href]').evaluateAll((anchors) => [
      ...new Set(
        anchors.flatMap((anchor) => {
          const href = anchor.getAttribute('href');
          return href?.startsWith('/') && !href.startsWith('//') ? [href] : [];
        }),
      ),
    ]);
    for (const href of localLinks) {
      const linked = await page.request.get(href);
      expect(linked.ok(), `${route} links to ${href}`).toBe(true);
      const fragment = new URL(href, 'https://example.test').hash;
      if (fragment) {
        const html = await linked.text();
        expect(html).toContain(`id="${fragment.slice(1)}"`);
      }
    }
  });
}

test('both homepage visitor paths reach the intended service', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    "Let's figure out how AI can help your business.",
  );
  await page.getByRole('link', { name: 'Explore AI Getting Started' }).click();
  await expect(page).toHaveURL(/\/services\/#getting-started$/);
  await expect(page.locator('#getting-started')).toBeVisible();
  await page.goto('/');
  await page.getByRole('link', { name: 'Explore Problem-Solving' }).click();
  await expect(page).toHaveURL(/\/services\/#problem-solving$/);
  await expect(page.locator('#problem-solving')).toBeVisible();
});

for (const [service, interest] of [
  ['getting-started', 'learning'],
  ['problem-solving', 'problem'],
  ['workflow-audit', 'audit'],
  ['custom-automation', 'implementation'],
]) {
  test(`${service} preselects an editable ${interest} interest`, async ({ page }) => {
    await page.goto('/services/');
    await page.locator(`#${service}`).getByRole('link', { name: 'Ask about this service' }).click();
    await expect(page.locator('[name="interest"]')).toHaveValue(interest ?? '');
    await page.locator('[name="interest"]').selectOption('other');
    await expect(page.locator('[name="interest"]')).toHaveValue('other');
  });
}

test('unknown and malicious service selections cannot inject page content', async ({ page }) => {
  await page.goto('/contact/?service=%3Cscript%3Ealert(1)%3C%2Fscript%3E');
  await expect(page.locator('[name="interest"]')).not.toHaveValue('<script>alert(1)</script>');
  await expect(page.locator('main script:not([src])')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('<script>alert(1)</script>');
});

test('direct thank-you navigation makes no submission claim', async ({ page }) => {
  await page.goto('/thank-you/');
  await expect(page.locator('main')).not.toContainText(
    /your (message|inquiry) (has been|was) (sent|received)|thanks for (your|getting in touch)/i,
  );
  await expect(page.locator('main')).toContainText(/contact|inquiry|message/i);
});

test('expired confirmation cannot claim a fresh submission', async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem('inquiry-confirmed-at', String(Date.now() - 600_000)),
  );
  await page.goto('/thank-you/');
  await expect(page.locator('#confirmation-heading')).toHaveText("Let's start a conversation.");
});

test('a confirmation marker is consumed once', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => sessionStorage.setItem('inquiry-confirmed-at', String(Date.now())));
  await page.goto('/thank-you/');
  await expect(page.locator('#confirmation-heading')).toHaveText('Thanks for reaching out.');
  await page.reload();
  await expect(page.locator('#confirmation-heading')).toHaveText("Let's start a conversation.");
});

for (const width of [320, 390, 768, 1440]) {
  for (const route of ['/', '/services/', '/contact/']) {
    test(`${route} fits a ${width}px viewport`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      const undersizedText = await page.locator('body *').evaluateAll((elements) =>
        elements.flatMap((element) => {
          const hasText = [...element.childNodes].some(
            (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
          );
          const style = getComputedStyle(element);
          const visible = element.getClientRects().length > 0 && style.visibility !== 'hidden';
          return hasText && visible && Number.parseFloat(style.fontSize) < 15
            ? [`${element.tagName}.${element.className}: ${style.fontSize}`]
            : [];
        }),
      );
      expect(undersizedText, 'Visible text must be at least 15px').toEqual([]);
      const dimensions = await page.evaluate(() => ({
        width: window.innerWidth,
        content: document.documentElement.scrollWidth,
      }));
      expect(dimensions.content, `${route} overflows at ${width}px`).toBeLessThanOrEqual(
        dimensions.width,
      );
      const path = testInfo.outputPath(
        `${route === '/' ? 'home' : route.replaceAll('/', '')}-${width}.png`,
      );
      await page.screenshot({ path, fullPage: true, animations: 'disabled' });
      await testInfo.attach(`${route} ${width}px`, { path, contentType: 'image/png' });
    });
  }
}

test('keyboard users can skip navigation to the main content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: /skip/i })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main/);
});

test('navigation works at mobile size with reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const motion = await page.locator('.hero-copy h1').evaluate((heading) => {
    const style = getComputedStyle(heading);
    return { animation: style.animationName, transition: style.transitionDuration };
  });
  expect(motion.animation).toBe('none');
  expect(motion.transition).toBe('0s');
  const menu = page.getByRole('button', { name: /menu|navigation/i });
  if (await menu.count()) {
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
  }
  await page
    .getByRole('navigation', { name: /main|primary/i })
    .getByRole('link', { name: 'Services', exact: true })
    .click();
  await expect(page).toHaveURL('/services/');
});

test('mobile navigation remains available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 640 },
  });
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:4321/');
    await expect(page.getByRole('button', { name: 'Menu' })).not.toBeVisible();
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Services', exact: true })
      .click();
    await expect(page).toHaveURL('http://127.0.0.1:4321/services/');
  } finally {
    await context.close();
  }
});

test('missing routes return a useful 404', async ({ page }) => {
  await page.goto('/404.html');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/page|found|404/i);
  await expect(page.getByRole('link', { name: /home/i }).first()).toBeVisible();
});
