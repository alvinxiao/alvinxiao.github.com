import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const output = 'docs/review/order-workflow';
const before = process.env.BEFORE_URL || 'http://127.0.0.1:4349';
const after = process.env.AFTER_URL || 'http://127.0.0.1:4340';
for (const folder of ['before', 'after', 'videos'])
  mkdirSync(`${output}/${folder}`, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
const records = [];
try {
  for (const [width, height] of [
    [320, 640],
    [390, 844],
    [651, 1000],
    [768, 1000],
    [1440, 900],
  ]) {
    const copy = [];
    for (const [side, origin] of [
      ['before', before],
      ['after', after],
    ]) {
      const context = await browser.newContext({
        viewport: { width, height },
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      await page.goto(origin);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
        false,
      );
      const text = (await page.locator('.example-row').allTextContents()).map((value) =>
        value.replace(/\s+/g, ' ').trim(),
      );
      copy.push(text);
      await page
        .locator('.hero')
        .screenshot({ path: `${output}/${side}/hero-${width}.png`, animations: 'disabled' });
      await page
        .locator('.workflow-example')
        .screenshot({ path: `${output}/${side}/example-${width}.png` });
      if (side === 'after') {
        await page.getByRole('radio', { name: 'Automatic send', exact: true }).check();
        await page
          .locator('.workflow-example')
          .screenshot({ path: `${output}/after/automatic-${width}.png` });
      }
      records.push({
        side,
        width,
        height,
        originalExamples: text,
        words: (await page.locator('.workflow-example').innerText()).trim().split(/\s+/).length,
      });
      await context.close();
    }
    assert.deepEqual(copy[0], copy[1], 'Original example rows are preserved');
  }
  for (const width of [390, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      reducedMotion: 'no-preference',
    });
    const page = await context.newPage();
    await page.goto(after);
    await page.locator('.email-chain').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Pause email animation', exact: true }).click();
    for (const [phase, time] of [
      ['request', 400],
      ['history', 1904],
      ['voice', 3536],
      ['document', 5168],
      ['email', 6800],
    ]) {
      const sample = await page.locator('.email-carrier').evaluate((carrier, time) => {
        const animations = carrier.getAnimations({ subtree: true });
        if (animations.length !== 5)
          throw new Error('Expected one movement animation and four synchronized glyphs');
        for (const animation of animations) {
          animation.pause();
          animation.currentTime = time;
        }
        const rect = carrier.getBoundingClientRect();
        return {
          x: rect.x,
          y: rect.y,
          shapes: Object.fromEntries(
            [...carrier.querySelectorAll('[data-shape]')].map((node) => [
              node.getAttribute('data-shape'),
              window.getComputedStyle(node).opacity,
            ]),
          ),
        };
      }, time);
      assert.ok(
        Number(sample.shapes[phase === 'history' || phase === 'voice' ? 'thinking' : phase]) > 0.9,
        `The ${phase} glyph is visible`,
      );
      records.push({ width, phase, time, sample });
      await page
        .locator('.workflow-example')
        .screenshot({ path: `${output}/after/${phase}-${width}.png` });
    }
    await context.close();
  }
  const staticContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    javaScriptEnabled: false,
    reducedMotion: 'reduce',
  });
  const staticPage = await staticContext.newPage();
  await staticPage.goto(after);
  await staticPage.getByRole('radio', { name: 'Automatic send', exact: true }).check();
  await staticPage
    .locator('.workflow-example')
    .screenshot({ path: `${output}/after/no-javascript-390.png` });
  await staticContext.close();
  writeFileSync(`${output}/layout-evidence.json`, JSON.stringify(records, null, 2) + '\n');
  for (const scenario of ['phone', 'desktop', 'reduced-motion', 'no-javascript']) {
    const width = scenario === 'desktop' ? 1024 : 390;
    const height = scenario === 'desktop' ? 900 : 1100;
    const size = { width: width * 2 + 20, height: height + 120 };
    const context = await browser.newContext({
      viewport: size,
      javaScriptEnabled: scenario !== 'no-javascript',
      reducedMotion: scenario === 'reduced-motion' ? 'reduce' : 'no-preference',
      recordVideo: { dir: '/tmp/email-workflow-videos', size },
    });
    const page = await context.newPage();
    const video = page.video();
    await page.setContent(
      `<!doctype html><html lang="en"><title>Email workflow comparison</title><style>*{box-sizing:border-box}body{margin:0;background:#e9eeeb;color:#153532;font:18px Arial}header{height:80px;padding:15px}.columns{display:grid;grid-template-columns:1fr 1fr;gap:20px}.label{height:40px;background:white;padding:10px}iframe{display:block;width:100%;height:${height}px;border:0}</style><header>Previous / Order-change workflow · ${width} × ${height} · ${scenario}</header><div class="columns">${[before, after].map((origin, i) => `<div><div class="label">${i ? 'REVISED · Request to email' : 'PREVIOUS · Email history to delivery'}</div><iframe title="${i ? 'Revised' : 'Previous'}" name="view${i}" src="${origin}/"></iframe></div>`).join('')}</div></html>`,
    );
    const frames = [page.frame({ name: 'view0' }), page.frame({ name: 'view1' })];
    for (const frame of frames) {
      await frame.waitForLoadState('load');
      await frame.evaluate(() => document.fonts.ready);
      await frame
        .locator('.workflow-example')
        .evaluate((node) => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
    }
    const animated = scenario === 'phone' || scenario === 'desktop';
    if (animated) {
      await frames[1].getByRole('button', { name: 'Replay email animation', exact: true }).click();
      await page.waitForTimeout(7500);
    } else await page.waitForTimeout(1800);
    await frames[1].getByRole('radio', { name: 'Automatic send', exact: true }).check();
    await page.waitForTimeout(animated ? 7500 : 1800);
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
