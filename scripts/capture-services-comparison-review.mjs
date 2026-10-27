import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const output = 'docs/review/services-comparison';
const origins = [
  process.env.BEFORE_URL || 'http://127.0.0.1:4342',
  process.env.AFTER_URL || 'http://127.0.0.1:4340',
];
const sizes = [
  [320, 640],
  [360, 640],
  [390, 844],
  [768, 1000],
  [1440, 900],
];
for (const directory of ['before', 'after', 'videos'])
  mkdirSync(`${output}/${directory}`, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
const records = [];
try {
  for (const [width, height] of sizes) {
    const details = [];
    for (const [index, origin] of origins.entries()) {
      const context = await browser.newContext({
        viewport: { width, height },
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      await page.goto(`${origin}/services/`);
      await page.evaluate(() => document.fonts.ready);
      const side = index ? 'after' : 'before';
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
        false,
      );
      assert.equal(await page.locator('details[open]').count(), 8);
      const text = (await page.locator('.service-detail').allTextContents()).map((value) =>
        value.replace(/\s+/g, ' ').trim(),
      );
      details.push(text);
      await page.screenshot({ path: `${output}/${side}/services-${width}-opening.png` });
      await page
        .locator('.service-jumps')
        .screenshot({ path: `${output}/${side}/services-${width}-comparison.png` });
      await page
        .locator('.service-detail')
        .first()
        .evaluate((node) => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
      await page.screenshot({ path: `${output}/${side}/services-${width}-details.png` });
      records.push({ side, width, height, detailText: text, openDisclosures: 8 });
      await context.close();
    }
    assert.deepEqual(details[0], details[1], 'Existing detailed service content is preserved');
  }
  writeFileSync(`${output}/layout-evidence.json`, JSON.stringify(records, null, 2) + '\n');
  for (const scenario of ['phone', 'desktop', 'reduced-motion']) {
    const width = scenario === 'desktop' ? 1024 : 390;
    const height = scenario === 'desktop' ? 900 : 844;
    const size = { width: width * 2 + 20, height: height + 120 };
    const context = await browser.newContext({
      viewport: size,
      reducedMotion: scenario === 'reduced-motion' ? 'reduce' : 'no-preference',
      recordVideo: { dir: '/tmp/services-comparison-videos', size },
    });
    const page = await context.newPage();
    const video = page.video();
    await page.setContent(
      `<!doctype html><html lang="en"><title>Services comparison</title><style>*{box-sizing:border-box}body{margin:0;background:#e9eeeb;color:#153532;font:18px Arial}header{height:80px;padding:15px}.columns{display:grid;grid-template-columns:1fr 1fr;gap:20px}.label{height:40px;background:white;padding:10px}iframe{display:block;width:100%;height:${height}px;border:0}</style><header>Services · Before / After · ${width} × ${height}</header><div class="columns">${origins.map((origin, i) => `<div><div class="label">${i ? 'AFTER' : 'BEFORE'}</div><iframe title="${i ? 'After' : 'Before'}" name="view${i}" src="${origin}/services/"></iframe></div>`).join('')}</div></html>`,
    );
    const frames = [page.frame({ name: 'view0' }), page.frame({ name: 'view1' })];
    for (const frame of frames) {
      await frame.waitForLoadState('load');
      await frame.evaluate(() => document.fonts.ready);
    }
    await page.waitForTimeout(1400);
    await Promise.all(
      frames.map((frame) =>
        frame.locator('.service-jumps').evaluate((node) =>
          window.scrollTo({
            top: node.getBoundingClientRect().top + window.scrollY - 50,
            behavior: 'instant',
          }),
        ),
      ),
    );
    await page.waitForTimeout(2000);
    await Promise.all(
      frames.map((frame) => frame.locator('.service-jumps a[href="#workflow-audit"]').click()),
    );
    await page.waitForTimeout(1800);
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
