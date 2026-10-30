import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
const output = 'docs/review/starting-point';
const origins = [
  process.env.BEFORE_URL || 'http://127.0.0.1:4355',
  process.env.AFTER_URL || 'http://127.0.0.1:4340',
];
const ids = ['getting-started', 'problem-solving', 'workflow-audit'];
for (const directory of ['before', 'after', 'videos'])
  mkdirSync(`${output}/${directory}`, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
const evidence = [];
try {
  for (const width of [320, 390, 768, 1440]) {
    const contents = [];
    for (const [index, origin] of origins.entries()) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      await page.goto(origin);
      await page.evaluate(() => document.fonts.ready);
      const preservation = await page.locator('main').evaluate((node) => {
        const clone = node.cloneNode(true);
        clone.querySelector('[data-starting-point],.closing').remove();
        return {
          text: clone.textContent.replace(/\s+/g, ' ').trim(),
          scripts: [...document.querySelectorAll('script[src]')].map((script) =>
            script.getAttribute('src'),
          ),
        };
      });
      contents.push(preservation);
      const section = page.locator(index ? '[data-starting-point]' : '.closing');
      await section.scrollIntoViewIfNeeded();
      if (!index) await section.screenshot({ path: `${output}/before/closing-${width}.png` });
      else
        for (const id of ids) {
          await section.locator(`input[value="${id}"]`).check();
          await section.screenshot({ path: `${output}/after/${id}-${width}.png` });
          assert.equal(
            await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
            false,
          );
        }
      evidence.push({ width, side: index ? 'after' : 'before', ...preservation });
      await context.close();
    }
    assert.deepEqual(
      contents[0],
      contents[1],
      'All Home text and script assets outside the replaced closing section are preserved',
    );
  }
  for (const width of [390, 1000]) {
    const context = await browser.newContext({
      viewport: { width: width * 2, height: 1000 },
      recordVideo: {
        dir: '/tmp/starting-point-review/videos',
        size: { width: width * 2, height: 1000 },
      },
    });
    const page = await context.newPage();
    await page.setContent(
      `<style>body{margin:0;background:#f8f7f3;font:16px sans-serif}#chapter{height:44px;margin:0;padding:10px;box-sizing:border-box}.pair{display:flex}section{width:${width}px}h2{font-size:16px;height:40px;margin:0;padding:8px;box-sizing:border-box}iframe{width:100%;height:910px;border:0}</style><p id="chapter">Home ending · Before: generic invitation · After: choose a starting point</p><div class="pair">${origins.map((origin, i) => `<section><h2>${i ? 'After' : 'Before'} · ${width}px</h2><iframe src="${origin}/"></iframe></section>`).join('')}</div>`,
    );
    const frames = page.frames().filter((frame) => frame !== page.mainFrame());
    await frames[0].locator('.closing').evaluate((node) => node.scrollIntoView({ block: 'start' }));
    await frames[1]
      .locator('[data-starting-point]')
      .evaluate((node) => node.scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(2400);
    for (const id of ids) {
      await page.locator('#chapter').evaluate(
        (node, label) => {
          node.textContent = label;
        },
        `After only · choose ${id.replaceAll('-', ' ')}`,
      );
      await frames[1].locator(`input[value="${id}"]`).check();
      await frames[1].locator(`[data-starting-result="${id}"]`).scrollIntoViewIfNeeded();
      await page.waitForTimeout(2200);
    }
    await page.locator('#chapter').evaluate((node) => {
      node.textContent = 'After only · open the tailored Contact form · sending remains disabled';
    });
    await frames[1].getByRole('link', { name: 'Talk about this' }).click();
    await frames[1].waitForURL('**/contact/?service=workflow-audit');
    assert.equal(await frames[1].locator('[name="interest"]').inputValue(), 'audit');
    assert.equal(await frames[1].locator('button[type=submit]').isDisabled(), true);
    await page.waitForTimeout(1600);
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
