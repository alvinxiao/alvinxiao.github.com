import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const output = 'docs/review/email-workflow';
const before = process.env.BEFORE_URL || 'http://127.0.0.1:4348';
const after = process.env.AFTER_URL || 'http://127.0.0.1:4340';
for (const folder of ['before', 'after', 'videos', 'prototypes'])
  mkdirSync(`${output}/${folder}`, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
const records = [];
try {
  for (const kind of ['a', 'b'])
    for (const width of [320, 390, 1440]) {
      const page = await browser.newPage({
        viewport: { width, height: 1000 },
        reducedMotion: 'no-preference',
      });
      await page.setContent(readFileSync(`${output}/prototypes/${kind}.html`, 'utf8'));
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)),
          ),
      );
      for (const [phase, time] of [
        ['blip', 400],
        ['document', 2200],
        ['email', 4400],
      ]) {
        await page.evaluate(
          (time) =>
            document.getAnimations().forEach((animation) => {
              animation.pause();
              animation.currentTime = time;
            }),
          time,
        );
        await page.screenshot({
          path: `${output}/prototypes/${kind}-${width}-${phase}.png`,
          fullPage: true,
        });
      }
      await page.close();
    }
  for (const [width, height] of [
    [320, 640],
    [390, 844],
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
      ['blip', 400],
      ['document', 2200],
      ['email', 4400],
    ]) {
      const sample = await page.locator('.email-carrier').evaluate((carrier, time) => {
        const animations = carrier.getAnimations({ subtree: true });
        if (animations.length !== 4)
          throw new Error('Expected one movement animation and three synchronized glyphs');
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
      assert.ok(Number(sample.shapes[phase]) > 0.9, `The ${phase} glyph is visible`);
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
      `<!doctype html><html lang="en"><title>Email workflow comparison</title><style>*{box-sizing:border-box}body{margin:0;background:#e9eeeb;color:#153532;font:18px Arial}header{height:80px;padding:15px}.columns{display:grid;grid-template-columns:1fr 1fr;gap:20px}.label{height:40px;background:white;padding:10px}iframe{display:block;width:100%;height:${height}px;border:0}</style><header>Previous / Email workflow · ${width} × ${height} · ${scenario}</header><div class="columns">${[before, after].map((origin, i) => `<div><div class="label">${i ? 'REVISED · Email history to delivery' : 'PREVIOUS · Shop questions'}</div><iframe title="${i ? 'Revised' : 'Previous'}" name="view${i}" src="${origin}/"></iframe></div>`).join('')}</div></html>`,
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
      await page.waitForTimeout(5900);
    } else await page.waitForTimeout(1800);
    await frames[1].getByRole('radio', { name: 'Automatic send', exact: true }).check();
    await page.waitForTimeout(animated ? 5900 : 1800);
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
