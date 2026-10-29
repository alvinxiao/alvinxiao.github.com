import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const output = 'docs/review/resource-contents';
const before = process.env.BEFORE_URL || 'http://127.0.0.1:4352';
const after = process.env.AFTER_URL || 'http://127.0.0.1:4340';
for (const directory of ['before', 'after', 'videos'])
  mkdirSync(`${output}/${directory}`, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
const records = [];
try {
  for (const guide of ['ai-basics', 'getting-started', 'workflow']) {
    for (const width of [320, 390, 768, 1440]) {
      const pair = [];
      for (const [side, origin] of [
        ['before', before],
        ['after', after],
      ]) {
        const context = await browser.newContext({
          viewport: { width, height: width < 768 ? 1000 : 900 },
          reducedMotion: 'reduce',
        });
        const page = await context.newPage();
        await page.goto(`${origin}/resources/${guide}/`);
        await page.evaluate(() => document.fonts.ready);
        await page
          .locator('.article-header')
          .evaluate((node) => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
        const evidence = await page.evaluate(() => ({
          body: document.querySelector('.article-body')?.textContent?.replace(/\s+/g, ' ').trim(),
          headings: [...document.querySelectorAll('.article-body h2[id]')].map((node) => ({
            id: node.id,
            text: node.textContent,
          })),
          scripts: [...document.querySelectorAll('script[src]')].map((node) =>
            node.getAttribute('src'),
          ),
          overflow: document.documentElement.scrollWidth > window.innerWidth,
        }));
        assert.equal(evidence.overflow, false);
        pair.push(evidence);
        await page.screenshot({ path: `${output}/${side}/${guide}-${width}.png` });
        if (side === 'after') {
          const nav = page.getByRole('navigation', { name: 'On this page' });
          await nav.screenshot({ path: `${output}/after/${guide}-contents-${width}.png` });
          const links = await nav.getByRole('link').evaluateAll((nodes) =>
            nodes.map((node) => ({
              id: node.getAttribute('href')?.slice(1),
              text: node.textContent,
            })),
          );
          assert.deepEqual(links, evidence.headings);
        }
        records.push({ side, guide, width, ...evidence });
        await context.close();
      }
      assert.equal(pair[0].body, pair[1].body, 'Original article text is preserved');
      assert.deepEqual(
        pair[0].headings,
        pair[1].headings,
        'Existing heading IDs and labels are preserved',
      );
      assert.deepEqual(pair[0].scripts, pair[1].scripts, 'No article browser scripts added');
    }
  }
  writeFileSync(`${output}/verification.json`, JSON.stringify(records, null, 2) + '\n');
  for (const scenario of ['phone', 'desktop', 'reduced-motion', 'no-javascript']) {
    const width = scenario === 'desktop' ? 1024 : 390;
    const height = 1000;
    const size = { width: width * 2 + 20, height: height + 120 };
    const context = await browser.newContext({
      viewport: size,
      javaScriptEnabled: scenario !== 'no-javascript',
      reducedMotion: scenario === 'reduced-motion' ? 'reduce' : 'no-preference',
      recordVideo: { dir: '/tmp/resource-contents-videos', size },
    });
    const page = await context.newPage();
    const video = page.video();
    await page.setContent(
      `<!doctype html><html lang="en"><title>Resource contents review</title><style>*{box-sizing:border-box}body{margin:0;background:#e9eeeb;color:#153532;font:16px Arial}header{height:80px;padding:12px;line-height:1.4}.columns{display:grid;grid-template-columns:1fr 1fr;gap:20px}.label{height:40px;background:white;padding:10px}iframe{display:block;width:100%;height:${height}px;border:0}</style><header>Resource guide contents · ${scenario} · ${width}px<div id="chapter">Opening comparison</div></header><div class="columns">${[before, after].map((origin, index) => `<div><div class="label">${index ? 'AFTER · Native section links' : 'BEFORE · No contents navigation'}</div><iframe title="${index ? 'After' : 'Before'}" name="view${index}" src="${origin}/resources/workflow/"></iframe></div>`).join('')}</div></html>`,
    );
    const frames = [page.frame({ name: 'view0' }), page.frame({ name: 'view1' })];
    for (const frame of frames) {
      assert.ok(frame);
      await frame.waitForLoadState('load');
      await frame.evaluate(() => document.fonts.ready);
      await frame
        .locator('.article-header')
        .evaluate((node) => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
    }
    const revised = frames[1];
    const chapter = (label) =>
      page.locator('#chapter').evaluate((node, text) => {
        node.textContent = text;
      }, label);
    await page.waitForTimeout(1800);
    await chapter('Keyboard · activate the last section link');
    const link = revised.getByRole('navigation', { name: 'On this page' }).getByRole('link').last();
    await link.focus();
    await page.waitForTimeout(600);
    await page.keyboard.press('Enter');
    const target = revised.locator('.article-body h2[id]').last();
    await target.waitFor({ state: 'visible' });
    await page.waitForTimeout(2000);
    assert.ok(
      await target.evaluate((node) => {
        const r = node.getBoundingClientRect();
        return r.top >= 0 && r.top < window.innerHeight;
      }),
    );
    await chapter('Browser Back · return to the guide opening');
    await revised.evaluate(() => window.history.back());
    await page.waitForTimeout(2000);
    assert.equal(await revised.evaluate(() => window.location.hash), '');
    await chapter('Native links preserve the guide and existing section URLs');
    await page.waitForTimeout(1200);
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
