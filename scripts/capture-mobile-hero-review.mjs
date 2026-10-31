import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const output = 'docs/review/mobile-hero';
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
for (const folder of ['before', 'after', 'videos'])
  mkdirSync(`${output}/${folder}`, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
async function safeContext(options) {
  const context = await browser.newContext(options);
  await context.addInitScript(() => {
    window.Element.prototype.requestPointerLock = () => Promise.resolve();
    window.Element.prototype.setPointerCapture = () => {};
  });
  return context;
}
const records = [];
try {
  for (const [width, height] of sizes) {
    const pair = [];
    for (const [index, origin] of origins.entries()) {
      const context = await safeContext({ viewport: { width, height }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto(origin);
      await page.evaluate(() => document.fonts.ready);
      const metrics = await page.evaluate(() =>
        Object.fromEntries(
          [
            '.hero-actions',
            '.hero-actions .button',
            '.workflow-illustration',
            '#paths-heading',
          ].map((selector) => {
            const r = document.querySelector(selector).getBoundingClientRect();
            return [selector, { top: r.top, bottom: r.bottom, height: r.height }];
          }),
        ),
      );
      const record = {
        width,
        height,
        side: index ? 'after' : 'before',
        metrics,
        text: (await page.locator('.hero').innerText()).replace(/\s+/g, ' ').trim(),
      };
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
        false,
      );
      for (const [stage, top] of [
        ['opening', 0],
        ['middle', Math.max(0, metrics['.workflow-illustration'].top - 100)],
        ['exit', Math.max(0, metrics['#paths-heading'].top - 200)],
      ]) {
        await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), top);
        await page.screenshot({ path: `${output}/${record.side}/hero-${width}-${stage}.png` });
      }
      if (index === 1 && width === 360)
        assert.ok(metrics['.hero-actions .button'].bottom <= height);
      if (index === 1 && width === 390) {
        await page.addStyleTag({ content: 'html { font-size: 200%; }' });
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        assert.equal(
          await page
            .locator('.hero h1')
            .evaluate((element) => element.scrollWidth > element.clientWidth),
          false,
        );
        await page.screenshot({ path: `${output}/after/text-200-390-opening.png` });
        await page
          .locator('.workflow-illustration')
          .evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
        await page.screenshot({ path: `${output}/after/text-200-390-workflow.png` });
      }
      if (index === 1 && width === 1440) {
        await page.setViewportSize({ width: 720, height: 900 });
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
          false,
        );
        await page.screenshot({ path: `${output}/after/reflow-720.png` });
      }
      pair.push(record);
      records.push(record);
      await context.close();
    }
    assert.equal(pair[0].text, pair[1].text, `Approved hero text unchanged at ${width}px`);
  }
  writeFileSync(`${output}/layout-evidence.json`, JSON.stringify(records, null, 2) + '\n');
  for (const scenario of ['phone', 'tablet', 'reduced-motion']) {
    const width = scenario === 'tablet' ? 768 : 360;
    const height = scenario === 'tablet' ? 1000 : 640;
    const size = { width: width * 2 + 20, height: height + 140 };
    const context = await safeContext({
      viewport: size,
      reducedMotion: scenario === 'reduced-motion' ? 'reduce' : 'no-preference',
      recordVideo: { dir: '/tmp/mobile-hero-video', size },
    });
    const page = await context.newPage();
    const video = page.video();
    await page.setContent(
      `<!doctype html><html lang="en"><title>Mobile hero comparison</title><style>*{box-sizing:border-box}body{margin:0;background:#e9eeeb;color:#153532;font:18px Arial}header{height:95px;padding:12px}h1{font-size:23px;margin:0 0 8px}.columns{display:grid;grid-template-columns:1fr 1fr;gap:20px}.label{height:45px;padding:12px;background:white;font-size:16px;font-weight:bold}.after{background:#cce6df}iframe{width:100%;height:${height}px;border:0;display:block}</style><header><h1>Mobile hero · Before / After</h1><div id="scene">Opening · ${width} × ${height} viewports</div></header><div class="columns">${origins.map((origin, i) => `<div><div class="label ${i ? 'after' : ''}">${i ? 'AFTER' : 'BEFORE'}</div><iframe name="view${i}" title="${i ? 'After' : 'Before'}" src="${origin}/"></iframe></div>`).join('')}</div></html>`,
    );
    const frames = [page.frame({ name: 'view0' }), page.frame({ name: 'view1' })];
    for (const frame of frames) {
      await frame.waitForLoadState('load');
      await frame.evaluate(() => document.fonts.ready);
    }
    async function label(value) {
      await page.locator('#scene').evaluate((node, text) => {
        node.textContent = text;
      }, value);
    }
    await page.waitForTimeout(1800);
    await label('Workflow · same steps, more usable width');
    await Promise.all(
      frames.map((frame) =>
        frame.locator('.workflow-illustration').evaluate((node) =>
          window.scrollTo({
            top: node.getBoundingClientRect().top + window.scrollY - 60,
            behavior: 'instant',
          }),
        ),
      ),
    );
    await page.waitForTimeout(1900);
    await label('Next section · natural scroll, no pinned space');
    await Promise.all(
      frames.map((frame) =>
        frame.locator('#paths-heading').evaluate((node) =>
          window.scrollTo({
            top: node.getBoundingClientRect().top + window.scrollY - 150,
            behavior: 'instant',
          }),
        ),
      ),
    );
    await page.waitForTimeout(1600);
    if (scenario !== 'reduced-motion') {
      await label('Manual pause control remains available');
      await Promise.all(
        frames.map((frame) =>
          frame.getByRole('checkbox', { name: 'Pause workflow animation' }).check(),
        ),
      );
      await page.waitForTimeout(1200);
    }
    await context.close();
    const raw = await video.path();
    execFileSync('ffmpeg', [
      '-loglevel',
      'error',
      '-y',
      '-i',
      raw,
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
