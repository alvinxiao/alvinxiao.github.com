import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
const output = 'docs/review/resource-journey';
const origins = [
  process.env.BEFORE_URL || 'http://127.0.0.1:4355',
  process.env.AFTER_URL || 'http://127.0.0.1:4340',
];
const ids = ['ai-basics', 'getting-started', 'workflow'];
for (const directory of ['before', 'after', 'videos'])
  mkdirSync(`${output}/${directory}`, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
const evidence = [];
try {
  for (const width of [320, 390, 768, 1440]) {
    for (const id of ids) {
      const contents = [];
      for (const [index, origin] of origins.entries()) {
        const side = index ? 'after' : 'before';
        const context = await browser.newContext({
          viewport: { width, height: 1000 },
          reducedMotion: 'reduce',
        });
        const page = await context.newPage();
        await page.goto(`${origin}/resources/${id}/`);
        await page.evaluate(() => document.fonts.ready);
        const article = await page.locator('.article-body').evaluate((node) => ({
          text: node.textContent.replace(/\s+/g, ' ').trim(),
          headings: [...node.querySelectorAll('h2')].map((h) => ({
            id: h.id,
            text: h.textContent,
          })),
        }));
        contents.push(article);
        if (index) {
          for (const link of await page.locator('.guide-navigation a').all()) {
            const target = await context.newPage();
            await target.goto(origin + (await link.getAttribute('href')));
            assert.equal(
              await link.locator('.guide-title').textContent(),
              await target.locator('h1').textContent(),
            );
            assert.equal(
              await link.locator('.guide-description').textContent(),
              await target.locator('meta[name=description]').getAttribute('content'),
            );
            await target.close();
          }
        }
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
          false,
        );
        await page
          .locator('.article-body')
          .evaluate((node) =>
            window.scrollTo(0, node.getBoundingClientRect().bottom + window.scrollY - 210),
          );
        await page.screenshot({ path: `${output}/${side}/${id}-${width}.png` });
        evidence.push({
          side,
          id,
          width,
          article,
          scripts: await page
            .locator('script[src]')
            .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('src'))),
        });
        await context.close();
      }
      assert.deepEqual(
        contents[0],
        contents[1],
        'Article text and heading IDs must remain unchanged',
      );
    }
  }
  for (const width of [390, 1000]) {
    const context = await browser.newContext({
      viewport: { width: width * 2, height: 950 },
      recordVideo: {
        dir: '/tmp/resource-journey-review/videos',
        size: { width: width * 2, height: 950 },
      },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.setContent(
      `<style>body{margin:0;font:16px sans-serif;background:#f8f7f3}.pair{display:flex}section{width:${width}px}h2{font-size:16px;height:42px;padding:8px;margin:0;box-sizing:border-box}iframe{width:100%;height:900px;border:0}#chapter{height:32px;margin:0;padding:8px;box-sizing:border-box}</style><p id="chapter">Article endings · first guide</p><div class="pair">${origins.map((origin, i) => `<section><h2>${i ? 'After' : 'Before'} · ${width}px</h2><iframe src="${origin}/resources/ai-basics/"></iframe></section>`).join('')}</div>`,
    );
    const frames = page.frames().filter((frame) => frame !== page.mainFrame());
    await Promise.all(frames.map((frame) => frame.locator('.article-body').waitFor()));
    for (const [index, id] of ids.entries()) {
      await page.locator('#chapter').evaluate(
        (node, label) => {
          node.textContent = label;
        },
        `Article ending · ${['first', 'middle', 'last'][index]} guide · scroll comparison`,
      );
      if (index)
        await Promise.all(
          frames.map((frame, side) => frame.goto(`${origins[side]}/resources/${id}/`)),
        );
      await Promise.all(
        frames.map((frame) =>
          frame.locator('.article-body').evaluate((node) =>
            window.scrollTo({
              top: node.getBoundingClientRect().bottom + window.scrollY - 210,
              behavior: 'smooth',
            }),
          ),
        ),
      );
      await page.waitForTimeout(3200);
    }
    await page.locator('#chapter').evaluate((node) => {
      node.textContent = 'After only · native Previous guide link';
    });
    await frames[1].getByRole('navigation', { name: 'More guides' }).locator('a').click();
    await frames[1].waitForURL('**/resources/getting-started/');
    assert.equal(new URL(frames[1].url()).pathname, '/resources/getting-started/');
    await page.waitForTimeout(2000);
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
