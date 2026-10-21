import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const output = 'docs/review/motion-07';
const origins = [
  process.env.BEFORE_URL || 'http://127.0.0.1:4337',
  process.env.AFTER_URL || 'http://127.0.0.1:4325',
];
for (const folder of ['before', 'after', 'videos'])
  mkdirSync(`${output}/${folder}`, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
try {
  for (const width of [320, 390, 768, 1440]) {
    const words = [];
    for (const [i, origin] of origins.entries()) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      await page.goto(origin);
      await page.evaluate(() => document.fonts.ready);
      const figure = page.locator('.workflow-illustration');
      await figure.scrollIntoViewIfNeeded();
      words.push(await figure.innerText());
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      );
      await figure.screenshot({
        path: `${output}/${i ? 'after' : 'before'}/workflow-${width}.png`,
      });
      await context.close();
    }
    assert.equal(words[0], words[1], `Workflow wording unchanged at ${width}px`);
  }
  for (const scenario of ['phone', 'desktop', 'reduced-motion']) {
    const width = scenario === 'desktop' ? 1440 : 390;
    const size = { width: 2 * width + 20, height: 1050 };
    const reduced = scenario === 'reduced-motion';
    const context = await browser.newContext({
      viewport: size,
      reducedMotion: reduced ? 'reduce' : 'no-preference',
      recordVideo: { dir: '/tmp/workflow-review-video', size },
    });
    const page = await context.newPage();
    const video = page.video();
    await page.setContent(
      `<!doctype html><html lang="en"><title>Workflow visibility comparison</title><style>*{box-sizing:border-box}body{margin:0;background:#e9eeeb;color:#153532;font:20px Arial}header{height:100px;padding:12px}h1{font-size:24px;margin:0 0 8px}.columns{display:grid;grid-template-columns:1fr 1fr;gap:20px}.label{height:50px;padding:8px 14px;background:white;font-weight:bold}.after{background:#cce6df}.clock{font-size:16px;font-weight:normal}iframe{width:100%;height:900px;border:0;display:block}</style><header><h1>Workflow playback · Before / After</h1><div id="scene">Preparing actual workflow effects</div></header><div class="columns">${origins.map((origin, i) => `<div><div class="label ${i ? 'after' : ''}">${i ? 'AFTER' : 'BEFORE'} <span class="clock" id="clock${i}"></span></div><iframe name="view${i}" title="${i ? 'After' : 'Before'}" src="${origin}/"></iframe></div>`).join('')}</div></html>`,
    );
    const frames = [page.frame({ name: 'view0' }), page.frame({ name: 'view1' })];
    for (const frame of frames) {
      await frame.waitForLoadState('load');
      await frame.evaluate(() => document.fonts.ready);
    }
    async function label(value) {
      await page.locator('#scene').evaluate((element, text) => {
        element.textContent = text;
      }, value);
    }
    async function showWorkflow() {
      await Promise.all(
        frames.map((frame) =>
          frame
            .locator('.workflow-illustration')
            .evaluate((element) =>
              element.scrollIntoView({ block: 'center', behavior: 'instant' }),
            ),
        ),
      );
      await page.waitForTimeout(250);
    }
    async function clock(frame) {
      return frame
        .locator('.workflow-steps li')
        .first()
        .evaluate((element) => {
          const effect = element
            .getAnimations()
            .find(
              (animation) =>
                animation instanceof window.CSSAnimation &&
                animation.animationName === 'workflow-focus',
            );
          return typeof effect?.currentTime === 'number' ? effect.currentTime : null;
        });
    }
    async function observe(duration) {
      const started = Date.now();
      while (Date.now() - started < duration) {
        const values = await Promise.all(frames.map(clock));
        for (const [i, value] of values.entries())
          await page.locator(`#clock${i}`).evaluate((element, value) => {
            element.textContent =
              value === null ? 'Static' : 'Effect clock ' + (value / 1000).toFixed(1) + 's';
          }, value);
        await page.waitForTimeout(200);
      }
    }
    await showWorkflow();
    if (!reduced) {
      await Promise.all(
        frames.map((frame) =>
          frame.locator('.workflow-illustration').evaluate((figure) => {
            for (const effect of figure.getAnimations({ subtree: true })) effect.currentTime = 1000;
          }),
        ),
      );
      await label('Visible · actual CSS effects aligned at 1.0s');
    } else await label('Reduced motion · both workflows stay static');
    await observe(1600);
    await label('Workflow offscreen · watch the effect clocks');
    await Promise.all(
      frames.map((frame) =>
        frame.evaluate(() =>
          window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
        ),
      ),
    );
    await page.waitForTimeout(250);
    const offscreenStart = await Promise.all(frames.map(clock));
    await observe(1800);
    const offscreenEnd = await Promise.all(frames.map(clock));
    if (!reduced) {
      assert.ok(offscreenEnd[0] - offscreenStart[0] > 1000);
      assert.ok(Math.abs(offscreenEnd[1] - offscreenStart[1]) < 100);
    }
    await label('Return · After resumes its paused phase');
    await showWorkflow();
    await observe(1600);
    if (!reduced) {
      await label('Manual pause · survives leaving and returning');
      await Promise.all(
        frames.map((frame) =>
          frame.getByRole('checkbox', { name: 'Pause workflow animation' }).check(),
        ),
      );
      await Promise.all(
        frames.map((frame) =>
          frame.evaluate(() =>
            window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
          ),
        ),
      );
      await page.waitForTimeout(300);
      await showWorkflow();
      const pausedStart = await Promise.all(frames.map(clock));
      await observe(1400);
      const pausedEnd = await Promise.all(frames.map(clock));
      for (let i = 0; i < 2; i++) assert.ok(Math.abs(pausedEnd[i] - pausedStart[i]) < 100);
      await label('Manual resume · both continue');
      await Promise.all(
        frames.map((frame) =>
          frame.getByRole('checkbox', { name: 'Pause workflow animation' }).uncheck(),
        ),
      );
      await observe(1200);
    }
    await context.close();
    const raw = await video.path();
    const target = `${output}/videos/${scenario}-diff.mp4`;
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
      target,
    ]);
    console.log(`Captured ${scenario} workflow comparison.`);
  }
} finally {
  await browser.close();
}
