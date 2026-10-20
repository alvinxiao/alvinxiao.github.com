import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function completeInquiry(page: Page) {
  await page.goto('/contact/?service=getting-started');
  await page.locator('[name="name"]').fill('Synthetic Test');
  await page.locator('[name="email"]').fill('synthetic@example.test');
  await page
    .locator('textarea[name="description"]')
    .fill('This is a synthetic browser test inquiry about learning practical AI basics.');
}

test('without JavaScript inquiry data cannot leak through a native GET submission', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const navigations: string[] = [];
  page.on('request', (request) => {
    if (request.isNavigationRequest()) navigations.push(request.url());
  });
  try {
    await page.goto('http://127.0.0.1:4321/contact/');
    await page.locator('[name="name"]').fill('Must stay private');
    await page.locator('[name="email"]').fill('must-stay-private@example.test');
    await page
      .locator('textarea[name="description"]')
      .fill('This description must never enter a navigation URL.');
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
    await page.locator('[name="name"]').press('Enter');
    expect(navigations.join(' ')).not.toContain('Must');
    expect(navigations.join(' ')).not.toContain('private');
    expect(page.url()).toBe('http://127.0.0.1:4321/contact/');
    await expect(page.getByRole('link', { name: 'Email your inquiry instead.' })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('validation explains missing fields and focuses an accessible summary', async ({ page }) => {
  await page.goto('/contact/');
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('#error-summary')).toBeVisible();
  await expect(page.locator('#error-summary')).toBeFocused();
  await expect(page.locator('[name="name"]')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('[name="email"]')).toHaveAttribute('aria-invalid', 'true');
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(result.violations).toEqual([]);
});

test('invalid email is rejected without contacting the provider', async ({ page }) => {
  let requests = 0;
  await page.route('https://formspree.io/**', async (route) => {
    requests += 1;
    await route.fulfill({ json: { ok: true } });
  });
  await completeInquiry(page);
  await page.locator('[name="email"]').fill('not-an-email');
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('[name="email"]')).toHaveAttribute('aria-invalid', 'true');
  expect(requests).toBe(0);
});

test('one accepted submission navigates to confirmation without putting inquiry data in a URL', async ({
  page,
}) => {
  const logs: string[] = [];
  const requests: string[] = [];
  page.on('console', (message) => logs.push(message.text()));
  let payload = '';
  await page.route('https://formspree.io/**', async (route) => {
    requests.push(route.request().url());
    payload = route.request().postData() ?? '';
    await route.fulfill({ json: { ok: true } });
  });
  await completeInquiry(page);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL('/thank-you/');
  await expect(page.locator('main')).toContainText(/received|sent|thank/i);
  expect(requests).toHaveLength(1);
  expect(payload).toContain('Synthetic');
  expect(page.url()).not.toContain('synthetic');
  expect(logs.join(' ')).not.toContain('synthetic@example.test');
  const stored = await page.evaluate(() =>
    [...Object.values(localStorage), ...Object.values(sessionStorage)].join(' '),
  );
  expect(stored).not.toContain('Synthetic');
  expect(stored).not.toContain('synthetic@example.test');
});

test('pending state prevents repeated deliberate submits', async ({ page }) => {
  let count = 0;
  let accept: (() => void) | undefined;
  const responseGate = new Promise<void>((resolve) => {
    accept = resolve;
  });
  await page.route('https://formspree.io/**', async (route) => {
    count += 1;
    await responseGate;
    await route.fulfill({ json: { ok: true } });
  });
  await completeInquiry(page);
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('button[type="submit"]')).toBeDisabled();
  await page.locator('#inquiry-form').evaluate((form) => {
    if (form instanceof HTMLFormElement) {
      form.requestSubmit();
      form.requestSubmit();
    }
  });
  expect(count).toBe(1);
  accept?.();
  await expect(page).toHaveURL('/thank-you/');
});

for (const scenario of [
  {
    name: 'validation rejection',
    status: 422,
    body: { errors: [{ message: 'Synthetic validation rejection.' }] },
  },
  { name: 'quota limit', status: 429, body: { error: 'Synthetic rate limit.' } },
  { name: 'provider failure', status: 503, body: { error: 'Synthetic unavailable provider.' } },
  { name: 'unconfirmed acceptance', status: 200, body: {} },
  { name: 'explicit rejection in a successful HTTP response', status: 200, body: { ok: false } },
]) {
  test(`${scenario.name} preserves input and never shows false success`, async ({ page }) => {
    let attempts = 0;
    await page.route('https://formspree.io/**', async (route) => {
      attempts += 1;
      await route.fulfill({ status: scenario.status, json: scenario.body });
    });
    await completeInquiry(page);
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('#form-status')).toContainText(
      /try|retry|could|unable|not|limit|confirm/i,
    );
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
    await expect(page).toHaveURL(/\/contact\//);
    await expect(page.locator('[name="email"]')).toHaveValue('synthetic@example.test');
    await expect(page.locator('textarea[name="description"]')).toHaveValue(
      /synthetic browser test/,
    );
    await expect(page.locator('a[href="mailto:review@example.test"]')).toBeVisible();
    expect(attempts).toBe(1);
  });
}

test('malformed success response warns about possible duplication and requires deliberate retry', async ({
  page,
}) => {
  let attempts = 0;
  await page.route('https://formspree.io/**', async (route) => {
    attempts += 1;
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<html>Unconfirmed gateway response</html>',
    });
  });
  await completeInquiry(page);
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('#form-status')).toContainText(/confirm|duplicate|already|may have/i);
  await expect(page.locator('button[type="submit"]')).toBeEnabled();
  expect(attempts).toBe(1);
  await page.locator('button[type="submit"]').click();
  await expect.poll(() => attempts).toBe(2);
  await expect(page.locator('[name="name"]')).toHaveValue('Synthetic Test');
});

test('network failure retains inquiry and warns before retrying', async ({ page }) => {
  await page.route('https://formspree.io/**', (route) => route.abort('failed'));
  await completeInquiry(page);
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('#form-status')).toContainText(/confirm|duplicate|already|may have/i);
  await expect(page.locator('[name="name"]')).toHaveValue('Synthetic Test');
  await expect(page.locator('button[type="submit"]')).toBeEnabled();
});

test('an actual timeout preserves input and makes no automatic retry', async ({ page }) => {
  let attempts = 0;
  await page.clock.install();
  await page.route('https://formspree.io/**', () => {
    attempts += 1;
  });
  await completeInquiry(page);
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('button[type="submit"]')).toBeDisabled();
  await page.clock.fastForward(15_001);
  await expect(page.locator('#form-status')).toContainText(/timed out|interrupted/i);
  await expect(page.locator('[name="email"]')).toHaveValue('synthetic@example.test');
  await expect(page.locator('button[type="submit"]')).toBeEnabled();
  expect(attempts).toBe(1);
});

test('provider success remains safe when session storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', {
      get() {
        throw new Error('Synthetic unavailable storage');
      },
    });
  });
  await page.route('https://formspree.io/**', (route) => route.fulfill({ json: { ok: true } }));
  await completeInquiry(page);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL('/thank-you/');
  await expect(page.locator('main')).toContainText(
    'Opening this page alone does not mean a message has been sent.',
  );
});

test('server-side failure warns that acceptance may be ambiguous', async ({ page }) => {
  await page.route('https://formspree.io/**', (route) =>
    route.fulfill({ status: 502, json: { error: 'Synthetic gateway failure' } }),
  );
  await completeInquiry(page);
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('#form-status')).toContainText(/may have|duplicate|confirm/i);
});

test('changing category excludes previous contextual data', async ({ page }) => {
  let payload = '';
  await page.route('https://formspree.io/**', async (route) => {
    payload = route.request().postData() ?? '';
    await route.fulfill({ json: { ok: true } });
  });
  await completeInquiry(page);
  const context = page.locator('[name="optional_context"]');
  await expect(context).toBeVisible();
  await context.fill('This contextual value must not survive a category change.');
  await page.locator('[name="interest"]').selectOption('other');
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL('/thank-you/');
  expect(payload).not.toContain('must not survive');
});
