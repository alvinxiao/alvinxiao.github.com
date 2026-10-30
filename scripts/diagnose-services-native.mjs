import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
const origin = process.env.SERVICES_REVIEW_URL || 'http://127.0.0.1:4340';
const output = process.env.SERVICES_REVIEW_OUTPUT || '/tmp/services-native-diagnosis.json';
const trials = Number(process.env.SERVICES_REVIEW_TRIALS || 10);
if (!Number.isInteger(trials) || trials < 1)
  throw new Error('SERVICES_REVIEW_TRIALS must be a positive integer');
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
const results = [];
try {
  for (const settled of [false, true])
    for (let trial = 0; trial < trials; trial++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${origin}/services/`);
      await page.locator('.service-jumps a[href="#getting-started"]').click();
      await page.waitForTimeout(1000);
      const second = page.locator('.service-jumps a[href="#problem-solving"]');
      await second.focus();
      const before = await page.evaluate(() => ({
        y: window.scrollY,
        target: document.querySelector('#problem-solving').getBoundingClientRect().top,
      }));
      if (settled)
        await page.evaluate(
          () =>
            new Promise((resolve) => {
              let last = window.scrollY,
                stable = 0;
              function frame() {
                const next = window.scrollY;
                stable = Math.abs(next - last) < 0.1 ? stable + 1 : 0;
                last = next;
                if (stable >= 8) resolve();
                else window.requestAnimationFrame(frame);
              }
              window.requestAnimationFrame(frame);
            }),
        );
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1200);
      const after = await page.evaluate(() => ({
        y: window.scrollY,
        target: document.querySelector('#problem-solving').getBoundingClientRect().top,
        heading: document.querySelector('#problem-solving h2').getBoundingClientRect().top,
        hash: window.location.hash,
      }));
      await page.goto(`${origin}/`);
      await page.goto(`${origin}/about/`);
      await page.goto(`${origin}/services/`);
      await page.locator('details summary').first().click();
      const closed = await page
        .locator('details')
        .first()
        .evaluate((node) => !node.open);
      results.push({ settled, trial, before, after, disclosureClosed: closed });
      writeFileSync(
        output,
        JSON.stringify({ origin, browser: browser.version(), trials, results }, null, 2) + '\n',
      );
      await context.close();
    }
} finally {
  await browser.close();
}
