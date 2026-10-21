import { expect, test, type Page } from '@playwright/test';

async function focusFirstResource(page: Page) {
  const card = page.locator('.resource-card').first();
  for (let step = 0; step < 25; step += 1) {
    await page.keyboard.press('Tab');
    if (await card.evaluate((element) => element === document.activeElement)) return card;
  }
  throw new Error('The first resource must be reachable by keyboard.');
}

test('pointer feedback stays inside the artwork frame without moving surrounding content', async ({
  page,
}) => {
  await page.goto('/resources/');
  const card = page.locator('.resource-card').first();
  await card.scrollIntoViewIfNeeded();
  await expect.poll(() => card.evaluate((element) => element.getAnimations().length)).toBe(0);
  const artwork = card.locator('.resource-artwork');
  const image = artwork.locator('img');
  const heading = card.locator('h2');
  const frameBefore = await artwork.boundingBox();
  const headingBefore = await heading.boundingBox();
  const imageBefore = await image.boundingBox();
  expect(imageBefore).not.toBeNull();
  await heading.hover();
  await expect(image).not.toHaveCSS('transform', 'none');
  await expect
    .poll(async () => (await image.boundingBox())?.width ?? 0)
    .toBeGreaterThan(imageBefore?.width ?? 0);
  await expect(artwork).not.toHaveCSS('box-shadow', 'none');
  await expect(card.locator('.text-link svg')).not.toHaveCSS('transform', 'none');
  expect(await artwork.boundingBox()).toEqual(frameBefore);
  expect(await heading.boundingBox()).toEqual(headingBefore);
  await expect(artwork).toHaveCSS('overflow', 'hidden');
  await page.mouse.move(0, 0);
  await expect(image).toHaveCSS('transform', 'none');
  await expect(artwork).toHaveCSS('box-shadow', 'none');
});

test('keyboard focus emphasizes the whole resource link and Enter opens its article', async ({
  page,
}) => {
  await page.goto('/resources/');
  const card = await focusFirstResource(page);
  await expect(card).toHaveCSS('outline-style', 'solid');
  await expect(card).toHaveCSS('outline-width', '3px');
  await expect(card.locator('.resource-artwork')).not.toHaveCSS('box-shadow', 'none');
  await expect(card.locator('img')).not.toHaveCSS('transform', 'none');
  await expect(card.locator('.text-link svg')).not.toHaveCSS('transform', 'none');
  const href = await card.getAttribute('href');
  expect(href).toMatch(/^\/resources\/.+\/$/);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  const articleArtwork = page.locator('.article-body > .resource-artwork');
  await articleArtwork.hover();
  await expect(articleArtwork).toHaveCSS('box-shadow', 'none');
  await expect(articleArtwork.locator('img')).toHaveCSS('transform', 'none');
});

test('enabling reduced motion removes zoom and arrow movement while keeping static focus emphasis', async ({
  page,
}) => {
  await page.goto('/resources/');
  const card = await focusFirstResource(page);
  await expect(card.locator('img')).not.toHaveCSS('transform', 'none');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(card.locator('img')).toHaveCSS('transform', 'none');
  await expect(card.locator('.text-link svg')).toHaveCSS('transform', 'none');
  await expect(card.locator('img')).toHaveCSS('transition-duration', '0s');
  await expect(card.locator('.resource-artwork')).not.toHaveCSS('box-shadow', 'none');
  await card.locator('h2').hover();
  await expect(card.locator('img')).toHaveCSS('transform', 'none');
  await expect(card.locator('.text-link svg')).toHaveCSS('transform', 'none');
});

test('touch users can open a resource without a sticky enlarged artwork state', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4321/resources/');
    const card = page.locator('.resource-card').first();
    await card.scrollIntoViewIfNeeded();
    await card.evaluate((element) =>
      element.addEventListener('click', (event) => event.preventDefault(), { once: true }),
    );
    await card.tap();
    await expect(card.locator('img')).toHaveCSS('transform', 'none');
    await expect(card.locator('.text-link svg')).toHaveCSS('transform', 'none');
    await card.tap();
    await expect(page).toHaveURL(/\/resources\/.+\/$/);
  } finally {
    await context.close();
  }
});

test('resource feedback and ordinary article navigation work without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4321/resources/');
    const card = await focusFirstResource(page);
    await expect(card.locator('img')).not.toHaveCSS('transform', 'none');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/resources\/.+\/$/);
    await expect(page.locator('main h1')).toBeVisible();
  } finally {
    await context.close();
  }
});
