import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
const output = 'docs/review/copy-prompts';
const before = process.env.BEFORE_URL || 'http://127.0.0.1:4354';
const after = process.env.AFTER_URL || 'http://127.0.0.1:4340';
for (const directory of ['before', 'after', 'videos'])
  mkdirSync(`${output}/${directory}`, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
const evidence = [];
try {
  for (const guide of ['ai-basics', 'getting-started'])
    for (const width of [320, 390, 768, 1440]) {
      const pair = [];
      for (const [side, origin] of [
        ['before', before],
        ['after', after],
      ]) {
        const context = await browser.newContext({
          viewport: { width, height: 1100 },
          permissions: ['clipboard-read', 'clipboard-write'],
          reducedMotion: 'reduce',
        });
        const page = await context.newPage();
        await page.goto(`${origin}/resources/${guide}/`);
        await page.evaluate(() => document.fonts.ready);
        const article = await page.locator('.article-body').evaluate((node) => {
          const clone = node.cloneNode(true);
          for (const control of clone.querySelectorAll('[data-copy-controls]')) control.remove();
          return {
            text: clone.textContent.replace(/\s+/g, ' ').trim(),
            headings: [...node.querySelectorAll('h2[id]')].map((h) => ({
              id: h.id,
              text: h.textContent,
            })),
            quotes: [...node.querySelectorAll('blockquote')].map((q) => q.innerText.trim()),
          };
        });
        pair.push(article);
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
          false,
        );
        for (const [index, quote] of (
          await page.locator('.article-body blockquote').all()
        ).entries()) {
          const item = side === 'after' ? page.locator('[data-copy-prompt]').nth(index) : quote;
          await item.screenshot({ path: `${output}/${side}/${guide}-${index}-${width}.png` });
          if (side === 'after') {
            await item.getByRole('button', { name: /Copy prompt/ }).click();
            await item.getByRole('status').filter({ hasText: 'Copied.' }).waitFor();
            assert.equal(
              await page.evaluate(() => window.navigator.clipboard.readText()),
              article.quotes[index],
            );
            await item.screenshot({
              path: `${output}/after/${guide}-${index}-copied-${width}.png`,
            });
          }
        }
        evidence.push({ side, guide, width, ...article });
        await context.close();
      }
      assert.deepEqual(
        pair[0],
        pair[1],
        'Article text, section IDs, and original prompts are preserved',
      );
    }
  for (const scenario of ['denied', 'no-javascript']) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 1100 },
      javaScriptEnabled: scenario !== 'no-javascript',
    });
    const page = await context.newPage();
    if (scenario === 'denied')
      await page.addInitScript(() =>
        Object.defineProperty(window.navigator, 'clipboard', {
          value: {
            writeText: async () => {
              throw new window.DOMException('Blocked for review', 'NotAllowedError');
            },
          },
        }),
      );
    await page.goto(`${after}/resources/getting-started/`);
    const prompt = page.locator('[data-copy-prompt]').first();
    if (scenario === 'denied') {
      await prompt.getByRole('button', { name: /Copy prompt/ }).click();
      await prompt.getByRole('status').filter({ hasText: 'Could not copy.' }).waitFor();
    } else assert.equal(await prompt.getByRole('button').count(), 0);
    await prompt.screenshot({ path: `${output}/after/${scenario}-390.png` });
    await context.close();
  }
  writeFileSync(`${output}/verification.json`, JSON.stringify(evidence, null, 2) + '\n');
  for (const scenario of ['phone', 'desktop', 'denied', 'no-javascript']) {
    const width = scenario === 'desktop' ? 760 : 390;
    const height = 1000;
    const size = { width: width * 2 + 20, height: height + 120 };
    const context = await browser.newContext({
      viewport: size,
      permissions: ['clipboard-read', 'clipboard-write'],
      javaScriptEnabled: scenario !== 'no-javascript',
      recordVideo: { dir: '/tmp/copy-prompts-videos', size },
    });
    if (scenario === 'denied')
      await context.addInitScript(() =>
        Object.defineProperty(window.navigator, 'clipboard', {
          value: {
            writeText: async () => {
              throw new window.DOMException('Blocked for review', 'NotAllowedError');
            },
          },
        }),
      );
    const page = await context.newPage();
    const video = page.video();
    await page.goto(after);
    await page.setContent(
      `<!doctype html><html lang="en"><title>Copy prompt review</title><style>*{box-sizing:border-box}body{margin:0;background:#e9eeeb;color:#153532;font:16px Arial}header{height:80px;padding:12px;line-height:1.4}.columns{display:grid;grid-template-columns:1fr 1fr;gap:20px}.label{height:40px;background:white;padding:10px}iframe{display:block;width:100%;height:${height}px;border:0}</style><header>Copy prompt · ${scenario} · ${width}px<div id="chapter">${scenario === 'denied' ? 'Simulated clipboard rejection' : scenario === 'no-javascript' ? 'No JavaScript · selectable text, no copy control' : 'Copy control before and after'}</div></header><div class="columns">${[before, after].map((origin, i) => `<div><div class="label">${i ? 'AFTER · Copy prompt control' : 'BEFORE · Select the text manually'}</div><iframe title="${i ? 'After' : 'Before'}" name="view${i}" allow="clipboard-read *; clipboard-write *" src="${origin}/resources/getting-started/"></iframe></div>`).join('')}</div></html>`,
    );
    const frames = [page.frame({ name: 'view0' }), page.frame({ name: 'view1' })];
    for (const [index, frame] of frames.entries()) {
      assert.ok(frame);
      await frame.waitForLoadState('load');
      await frame.evaluate(() => document.fonts.ready);
      await frame
        .locator(index ? '[data-copy-prompt]' : '.article-body blockquote')
        .first()
        .evaluate((n) => n.scrollIntoView({ block: 'start', behavior: 'instant' }));
    }
    const revised = frames[1];
    const prompt = revised.locator('[data-copy-prompt]').first();
    await page.waitForTimeout(1800);
    if (scenario !== 'no-javascript') {
      await page.locator('#chapter').evaluate(
        (n, text) => {
          n.textContent = text;
        },
        scenario === 'denied'
          ? 'Keyboard · rejected copy shows manual fallback'
          : 'Keyboard · copy the first draft prompt',
      );
      await prompt.getByRole('button', { name: /Copy prompt/ }).focus();
      await page.keyboard.press('Enter');
      await prompt
        .getByRole('status')
        .filter({ hasText: scenario === 'denied' ? 'Could not copy.' : 'Copied.' })
        .waitFor();
      if (scenario !== 'denied')
        assert.equal(
          await revised.evaluate(() => window.navigator.clipboard.readText()),
          (await prompt.locator('blockquote').innerText()).trim(),
        );
    } else assert.equal(await prompt.getByRole('button').count(), 0);
    await page.waitForTimeout(2800);
    await context.close();
    execFileSync('ffmpeg', [
      '-loglevel',
      'error',
      '-y',
      '-i',
      await video.path(),
      '-an',
      '-c:v',
      'libx264',
      '-threads',
      '2',
      '-preset',
      'fast',
      '-crf',
      '24',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      `${output}/videos/${scenario}-diff.mp4`,
    ]);
    console.log(`Captured ${scenario}.`);
  }
} finally {
  await browser.close();
}
