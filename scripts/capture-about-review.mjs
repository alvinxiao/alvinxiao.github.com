import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const output = 'docs/review/motion-06';
const origins = [
  process.env.BEFORE_URL || 'http://127.0.0.1:4336',
  process.env.AFTER_URL || 'http://127.0.0.1:4325',
];
for (const folder of ['before', 'after', 'videos'])
  mkdirSync(`${output}/${folder}`, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
try {
  for (const width of [320, 390, 768, 1440]) {
    const biographies = [];
    for (const [i, origin] of origins.entries()) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      await page.goto(`${origin}/about/`);
      await page.evaluate(() => document.fonts.ready);
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      );
      biographies.push(await page.locator('.prose').innerText());
      await page.screenshot({ path: `${output}/${i ? 'after' : 'before'}/about-${width}.png` });
      await context.close();
    }
    assert.equal(biographies[0], biographies[1], `Biography unchanged at ${width}px`);
  }
  for (const scenario of ['phone', 'desktop', 'reduced-motion']) {
    const width = scenario === 'desktop' ? 1440 : 390;
    const size = { width: width * 2 + 20, height: 1050 };
    const context = await browser.newContext({
      viewport: size,
      reducedMotion: scenario === 'reduced-motion' ? 'reduce' : 'no-preference',
      recordVideo: { dir: '/tmp/about-review-video', size },
    });
    await context.addInitScript(() => {
      const animate = HTMLElement.prototype.animate;
      HTMLElement.prototype.animate = function (keyframes, options) {
        const effect = animate.call(this, keyframes, options);
        if (this.classList.contains('about-heading-accent')) effect.pause();
        return effect;
      };
      document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.page-hero > *').forEach((element) => {
          element.getAnimations().forEach((effect) => {
            effect.pause();
            effect.currentTime = 0;
          });
        });
      });
    });
    const page = await context.newPage();
    const video = page.video();
    await page.setContent(
      `<!doctype html><html lang="en"><title>About accent comparison</title><style>*{box-sizing:border-box}body{margin:0;background:#e9eeeb;color:#153532;font:20px Arial}header{height:90px;padding:14px}h1{font-size:24px;margin:0 0 8px}.columns{display:grid;grid-template-columns:1fr 1fr;gap:20px}.label{height:40px;padding:8px 14px;background:white;font-weight:bold}.after{background:#cce6df}iframe{width:100%;height:920px;border:0;display:block}</style><header><h1>About accent · Before / After</h1><div id="scene">Preparing comparison</div></header><div class="columns">${origins.map((origin, i) => `<div><div class="label ${i ? 'after' : ''}">${i ? 'AFTER' : 'BEFORE'}</div><iframe name="view${i}" title="${i ? 'After' : 'Before'}" src="${origin}/about/"></iframe></div>`).join('')}</div></html>`,
    );
    const frames = [page.frame({ name: 'view0' }), page.frame({ name: 'view1' })];
    for (const frame of frames) {
      await frame.waitForLoadState('load');
      await frame.evaluate(() => document.fonts.ready);
    }
    async function label(text) {
      await page.locator('#scene').evaluate((element, value) => {
        element.textContent = value;
      }, text);
    }
    await label(
      scenario === 'reduced-motion'
        ? 'Reduced motion · static accent'
        : 'One heading accent · biography stays still',
    );
    await page.waitForTimeout(700);
    await Promise.all(
      frames.map((frame) =>
        frame.evaluate(() => document.getAnimations().forEach((effect) => effect.play())),
      ),
    );
    await page.waitForTimeout(2300);
    await label('Scroll down · biography remains readable');
    await Promise.all(
      frames.map((frame) =>
        frame.evaluate(() => window.scrollTo({ top: 520, behavior: 'instant' })),
      ),
    );
    await page.waitForTimeout(1700);
    await label('Return · accent does not replay');
    await Promise.all(
      frames.map((frame) => frame.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))),
    );
    await page.waitForTimeout(1700);
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
    if (scenario === 'phone')
      execFileSync('ffmpeg', [
        '-loglevel',
        'error',
        '-y',
        '-i',
        target,
        '-vf',
        "setpts=2*PTS,drawtext=text='HALF SPEED - 0.5x replay':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.8:x=12:y=h-38",
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
        `${output}/videos/phone-slow.mp4`,
      ]);
    console.log(`Captured ${scenario} About comparison.`);
  }
} finally {
  await browser.close();
}
