import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const output = 'docs/review/motion-01/videos';
const origins = [
  process.env.BEFORE_URL || 'http://127.0.0.1:4330',
  process.env.AFTER_URL || 'http://127.0.0.1:4325',
];
const scenes = [
  ['Visitor paths', '/', '.path-grid'],
  ['Service cards', '/', '.service-preview-grid'],
  ['Everyday examples', '/', '.examples'],
  ['Process steps', '/', '.process-grid'],
  ['About introduction', '/', '.personal-intro'],
  ['Resource cards', '/resources/', '.resource-grid'],
];
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
try {
  for (const width of [1000, 390]) {
    const size = { width: width * 2 + 24, height: 900 };
    const context = await browser.newContext({
      viewport: size,
      recordVideo: { dir: '/tmp/reveal-diff-video', size },
    });
    const page = await context.newPage();
    const video = page.video();
    await page.setContent(`<!doctype html><html lang="en"><title>Section reveal comparison</title>
      <style>*{box-sizing:border-box}body{margin:0;background:#e9eeeb;color:#153532;font:20px Arial,sans-serif}header{height:96px;padding:14px 12px}h1{font-size:24px;margin:0 0 8px}#scene{font-size:18px}.columns{display:grid;grid-template-columns:1fr 1fr;gap:24px}.label{height:40px;padding:8px 16px;font-weight:bold;background:#fff}.after .label{background:#cce6df}iframe{display:block;width:100%;height:764px;border:0;background:#faf9f5}</style>
      <header><h1>Section reveals · Before / After</h1><div id="scene">Preparing comparison · normal speed</div></header>
      <div class="columns">${origins.map((origin, i) => `<div class="${i ? 'after' : 'before'}"><div class="label">${i ? 'AFTER · proposed' : 'BEFORE · current'}</div><iframe name="view${i}" title="${i ? 'After' : 'Before'}" src="${origin}"></iframe></div>`).join('')}</div></html>`);
    const frames = [page.frame({ name: 'view0' }), page.frame({ name: 'view1' })];
    let route = '/';
    for (const [label, nextRoute, selector] of scenes) {
      if (route !== nextRoute) {
        await Promise.all(
          frames.map((frame, i) => frame.goto(new URL(nextRoute, origins[i]).href)),
        );
        route = nextRoute;
      }
      await Promise.all(
        frames.map((frame) =>
          frame.evaluate(async () => {
            document.documentElement.style.scrollBehavior = 'auto';
            await document.fonts.ready;
            await Promise.all(
              [...document.images].map(async (img) => {
                img.loading = 'eager';
                await img.decode();
              }),
            );
          }),
        ),
      );
      const positions = await Promise.all(
        frames.map((frame) =>
          frame
            .locator(selector)
            .evaluate((element) =>
              Math.round(element.getBoundingClientRect().top + window.scrollY - 90),
            ),
        ),
      );
      assert.ok(Math.abs(positions[0] - positions[1]) <= 1, `${label}: layouts must match`);
      await page.locator('#scene').evaluate((element, text) => {
        element.textContent = `${text} · normal speed`;
      }, label);
      await Promise.all(
        frames.map((frame) => frame.evaluate((top) => window.scrollTo(0, top), positions[0])),
      );
      await page.waitForTimeout(2400);
    }
    await context.close();
    const raw = await video.path();
    const target = `${output}/diff-${width}.mp4`;
    execFileSync('ffmpeg', [
      '-loglevel',
      'error',
      '-y',
      '-i',
      raw,
      '-an',
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '23',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      target,
    ]);
    // Slow playback changes only the review video, never the website animation.
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
      '-preset',
      'fast',
      '-crf',
      '23',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      `${output}/diff-${width}-slow.mp4`,
    ]);
    console.log(`Recorded matched ${width}px views at normal and half speed.`);
  }
} finally {
  await browser.close();
}
