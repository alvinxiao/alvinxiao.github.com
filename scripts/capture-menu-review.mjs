import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const output = 'docs/review/motion-05';
const origins = [
  process.env.BEFORE_URL || 'http://127.0.0.1:4335',
  process.env.AFTER_URL || 'http://127.0.0.1:4325',
];
for (const folder of ['before', 'after', 'videos'])
  mkdirSync(`${output}/${folder}`, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
try {
  for (const width of [320, 390, 768, 1440]) {
    for (const [i, origin] of origins.entries()) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      await page.goto(`${origin}/services/`);
      await page.evaluate(() => document.fonts.ready);
      if (width <= 900) await page.locator('.menu-toggle').click();
      assert.ok(await page.locator('#site-navigation').isVisible());
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      );
      await page
        .locator('.site-header')
        .screenshot({ path: `${output}/${i ? 'after' : 'before'}/navigation-${width}.png` });
      await context.close();
    }
  }
  for (const scenario of ['phone', 'tablet', 'reduced-motion']) {
    const width = scenario === 'tablet' ? 768 : 390;
    const size = { width: width * 2 + 20, height: 960 };
    const context = await browser.newContext({
      viewport: size,
      reducedMotion: scenario === 'reduced-motion' ? 'reduce' : 'no-preference',
      recordVideo: { dir: '/tmp/menu-review-video', size },
    });
    const page = await context.newPage();
    const video = page.video();
    await page.setContent(
      `<!doctype html><html lang="en"><title>Mobile menu comparison</title><style>*{box-sizing:border-box}body{margin:0;background:#e9eeeb;color:#153532;font:20px Arial}header{height:90px;padding:14px}h1{font-size:24px;margin:0 0 8px}.columns{display:grid;grid-template-columns:1fr 1fr;gap:20px}.label{height:40px;padding:8px 14px;background:white;font-weight:bold}.after{background:#cce6df}iframe{width:100%;height:830px;border:0;display:block}</style><header><h1>Mobile menu · Before / After</h1><div id="scene">Preparing comparison</div></header><div class="columns">${origins.map((origin, i) => `<div><div class="label ${i ? 'after' : ''}">${i ? 'AFTER' : 'BEFORE'}</div><iframe name="view${i}" title="${i ? 'After' : 'Before'}" src="${origin}/services/"></iframe></div>`).join('')}</div></html>`,
    );
    const frames = [page.frame({ name: 'view0' }), page.frame({ name: 'view1' })];
    await page.waitForTimeout(1100);
    const started = Date.now();
    async function label(text) {
      await page.locator('#scene').evaluate((element, value) => {
        element.textContent = value;
      }, text);
    }
    async function toggle() {
      await Promise.all(
        frames.map((frame) =>
          frame.locator('.menu-toggle').evaluate((button) => {
            if (!(button instanceof window.HTMLButtonElement))
              throw new Error('Expected menu button');
            button.click();
          }),
        ),
      );
    }
    await label('Navigation closed');
    await page.waitForTimeout(700);
    await label('Open navigation');
    await toggle();
    await page.waitForTimeout(1600);
    await label('Close navigation');
    await toggle();
    await page.waitForTimeout(1600);
    await label('Open, close, then reopen quickly');
    await Promise.all(
      frames.map((frame) =>
        frame.locator('.menu-toggle').evaluate(async (button) => {
          if (!(button instanceof window.HTMLButtonElement))
            throw new Error('Expected menu button');
          button.click();
          await new Promise((resolve) => setTimeout(resolve, 70));
          button.click();
          await new Promise((resolve) => setTimeout(resolve, 70));
          button.click();
        }),
      ),
    );
    await page.waitForTimeout(1800);
    for (const frame of frames)
      assert.equal(await frame.locator('.menu-toggle').getAttribute('aria-expanded'), 'true');
    await label('Follow About without waiting for the exit');
    await Promise.all(
      frames.map((frame) =>
        frame.locator('#site-navigation a[href="/about/"]').evaluate((anchor) => {
          if (!(anchor instanceof HTMLElement)) throw new Error('Expected navigation link');
          anchor.click();
        }),
      ),
    );
    await Promise.all(frames.map((frame) => frame.waitForURL('**/about/')));
    await page.waitForTimeout(1800);
    const elapsed = (Date.now() - started) / 1000;
    await context.close();
    const raw = await video.path();
    const duration = Number(
      execFileSync(
        'ffprobe',
        ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', raw],
        { encoding: 'utf8' },
      ).trim(),
    );
    const target = `${output}/videos/${scenario}-diff.mp4`;
    execFileSync('ffmpeg', [
      '-loglevel',
      'error',
      '-y',
      '-ss',
      String(Math.max(0, duration - elapsed)),
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
    console.log(`Captured ${scenario} menu comparison.`);
  }
} finally {
  await browser.close();
}
