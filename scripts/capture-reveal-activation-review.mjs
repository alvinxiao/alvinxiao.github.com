import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
const output = 'docs/review/reveal-activation';
const origins = [
  process.env.BEFORE_URL || 'http://127.0.0.1:4355',
  process.env.AFTER_URL || 'http://127.0.0.1:4340',
];
for (const directory of ['before', 'after', 'videos'])
  mkdirSync(`${output}/${directory}`, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
const evidence = [];
function holdReveal() {
  const animate = HTMLElement.prototype.animate;
  HTMLElement.prototype.animate = function (keyframes, options) {
    const animation = animate.call(this, keyframes, options);
    if (this.hasAttribute('data-reveal')) {
      animation.pause();
      animation.currentTime = 0;
      this.dataset.heldReveal = 'true';
    }
    return animation;
  };
  window.activationEvents = [];
  for (const type of ['pointerdown', 'focusin', 'pointerup', 'click', 'toggle'])
    document.addEventListener(
      type,
      (event) => {
        if (!(event.target instanceof HTMLElement) || !event.target.closest('#getting-started'))
          return;
        const summary = document.querySelector('#getting-started summary');
        window.activationEvents.push({
          type,
          target: event.target.tagName,
          top: summary.getBoundingClientRect().top,
          open: summary.parentElement.open,
        });
      },
      true,
    );
}
try {
  for (const width of [390, 1000]) {
    const context = await browser.newContext({
      viewport: { width: width * 2, height: 950 },
      recordVideo: {
        dir: '/tmp/disclosure-diagnosis/videos',
        size: { width: width * 2, height: 950 },
      },
    });
    await context.addInitScript(holdReveal);
    const page = await context.newPage();
    await page.setContent(
      `<style>body{margin:0;background:#f8f7f3;font:16px sans-serif}#chapter{height:44px;margin:0;padding:10px;box-sizing:border-box}.pair{display:flex}section{width:${width}px}h2{font-size:16px;height:40px;margin:0;padding:8px;box-sizing:border-box}iframe{width:100%;height:860px;border:0}</style><p id="chapter">Controlled reproduction · actual entrance animation held at its first frame</p><div class="pair">${origins.map((origin, i) => `<section><h2>${i ? 'After' : 'Before'} · ${width}px</h2><iframe src="${origin}/services/"></iframe></section>`).join('')}</div>`,
    );
    const frames = page.frames().filter((frame) => frame !== page.mainFrame());
    for (const frame of frames) {
      await frame.locator('#getting-started summary').first().scrollIntoViewIfNeeded();
      await frame.waitForFunction(
        () => document.querySelector('#getting-started').dataset.heldReveal === 'true',
      );
    }
    await page.waitForTimeout(1400);
    await page.locator('#chapter').evaluate((node) => {
      node.textContent = 'Native click · Before misses the summary; After closes it';
    });
    for (const [index, frame] of frames.entries()) {
      await frame.locator('#getting-started summary').first().click();
      await page.waitForTimeout(500);
      const state = await frame.evaluate(() => ({
        open: document.querySelector('#getting-started details').open,
        events: window.activationEvents,
        transform: window.getComputedStyle(document.querySelector('#getting-started')).transform,
      }));
      assert.equal(state.open, index === 0);
      assert.equal(state.transform, 'none');
      evidence.push({ width, side: index ? 'after' : 'before', ...state });
      await frame
        .locator('#getting-started details')
        .first()
        .locator('..')
        .screenshot({ path: `${output}/${index ? 'after' : 'before'}/disclosures-${width}.png` });
    }
    await page.waitForTimeout(2000);
    await page.locator('#chapter').evaluate((node) => {
      node.textContent = 'After only · native Space reopens the disclosure';
    });
    await frames[1].locator('#getting-started summary').first().focus();
    await page.keyboard.press('Space');
    await frames[1].waitForFunction(() => document.querySelector('#getting-started details').open);
    await page.waitForTimeout(1500);
    const video = page.video();
    await context.close();
    execFileSync('ffmpeg', [
      '-loglevel',
      'error',
      '-y',
      '-i',
      await video.path(),
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      `${output}/videos/${width === 390 ? 'phone' : 'desktop'}-diff.mp4`,
    ]);
  }
  writeFileSync(`${output}/verification.json`, JSON.stringify(evidence, null, 2) + '\n');
} finally {
  await browser.close();
}
