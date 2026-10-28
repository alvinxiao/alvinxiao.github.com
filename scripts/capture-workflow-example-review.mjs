import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const output = 'docs/review/workflow-example';
const origins = [
  process.env.BEFORE_URL || 'http://127.0.0.1:4342',
  process.env.AFTER_URL || 'http://127.0.0.1:4340',
];
for (const folder of ['before', 'after', 'videos', 'prototypes'])
  mkdirSync(`${output}/${folder}`, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
const records = [];
try {
  for (const kind of ['choice', 'disclosures'])
    for (const width of [320, 390, 1440]) {
      const page = await browser.newPage({
        viewport: { width, height: 900 },
        reducedMotion: 'reduce',
      });
      await page.setContent(readFileSync(`${output}/prototypes/${kind}.html`, 'utf8'));
      await page.screenshot({ path: `${output}/prototypes/${kind}-${width}.png`, fullPage: true });
      if (kind === 'choice') {
        await page.locator('#request').check();
        await page.screenshot({
          path: `${output}/prototypes/${kind}-${width}-request.png`,
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
    for (const [index, origin] of origins.entries()) {
      const context = await browser.newContext({
        viewport: { width, height },
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      await page.goto(origin);
      await page.evaluate(() => document.fonts.ready);
      const side = index ? 'after' : 'before';
      const exampleCopy = (await page.locator('.example-row').allTextContents()).map((value) =>
        value.replace(/\s+/g, ' ').trim(),
      );
      copy.push(exampleCopy);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
        false,
      );
      await page.screenshot({ path: `${output}/${side}/home-${width}-opening.png` });
      await page
        .locator('#examples-heading')
        .evaluate((node) => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
      await page.screenshot({ path: `${output}/${side}/examples-${width}-context.png` });
      await page
        .locator('.examples')
        .screenshot({ path: `${output}/${side}/examples-${width}-complete.png` });
      if (index) {
        const inputs = page.locator('.workflow-example input[type="radio"]');
        assert.equal(await inputs.count(), 3);
        for (let choice = 0; choice < 3; choice++) {
          await inputs.nth(choice).check();
          await page
            .locator('.workflow-example')
            .screenshot({ path: `${output}/after/example-${width}-choice-${choice + 1}.png` });
        }
      }
      if (index && width === 390) {
        await page.locator('.workflow-example input').first().focus();
        await page.keyboard.press('ArrowRight');
        await page
          .locator('.workflow-example')
          .screenshot({ path: `${output}/after/keyboard-focus-390.png` });
        const removed = await page.evaluate(() => {
          let removed = 0;
          function removeEnhancement(sheet) {
            for (let index = sheet.cssRules.length - 1; index >= 0; index--) {
              const rule = sheet.cssRules[index];
              if (
                rule instanceof window.CSSSupportsRule &&
                rule.conditionText.includes(':has(') &&
                rule.cssText.includes('workflow-example')
              ) {
                sheet.deleteRule(index);
                removed++;
              } else if (rule instanceof window.CSSGroupingRule) removeEnhancement(rule);
            }
          }
          for (const sheet of document.styleSheets) removeEnhancement(sheet);
          return removed;
        });
        assert.ok(removed > 0, 'Selection enhancement removed for static fallback capture');
        assert.equal(await page.getByRole('radio').count(), 0);
        await page
          .locator('.workflow-example')
          .screenshot({ path: `${output}/after/selection-enhancement-removed-390.png` });
      }
      records.push({ side, width, height, exampleCopy });
      await context.close();
    }
    assert.deepEqual(copy[0], copy[1], 'All original example rows are retained');
  }
  writeFileSync(`${output}/layout-evidence.json`, JSON.stringify(records, null, 2) + '\n');
  for (const scenario of ['phone', 'desktop', 'reduced-motion', 'no-javascript']) {
    const width = scenario === 'desktop' ? 1024 : 390;
    const height = scenario === 'desktop' ? 900 : 1100;
    const size = { width: width * 2 + 20, height: height + 120 };
    const context = await browser.newContext({
      viewport: size,
      javaScriptEnabled: scenario !== 'no-javascript',
      reducedMotion: scenario === 'reduced-motion' ? 'reduce' : 'no-preference',
      recordVideo: { dir: '/tmp/workflow-example-videos', size },
    });
    const page = await context.newPage();
    const video = page.video();
    await page.setContent(
      `<!doctype html><html lang="en"><title>Workflow example comparison</title><style>*{box-sizing:border-box}body{margin:0;background:#e9eeeb;color:#153532;font:18px Arial}header{height:80px;padding:15px}.columns{display:grid;grid-template-columns:1fr 1fr;gap:20px}.label{height:40px;padding:10px;background:white}iframe{display:block;width:100%;height:${height}px;border:0}</style><header>Before / After · ${width} × ${height} · ${scenario}</header><div class="columns">${origins.map((origin, i) => `<div><div class="label">${i ? 'AFTER · Select a customer need' : 'BEFORE · Static examples'}</div><iframe title="${i ? 'After' : 'Before'}" name="view${i}" src="${origin}/"></iframe></div>`).join('')}</div></html>`,
    );
    const frames = [page.frame({ name: 'view0' }), page.frame({ name: 'view1' })];
    for (const frame of frames) {
      await frame.waitForLoadState('load');
      await frame.evaluate(() => document.fonts.ready);
    }
    await frames[0]
      .locator('.examples')
      .evaluate((node) => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await frames[1]
      .locator('.workflow-example')
      .evaluate((node) => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await page.waitForTimeout(1400);
    const radios = frames[1].locator('.workflow-example input[type="radio"]');
    for (let choice = 0; choice < 3; choice++) {
      await radios.nth(choice).check();
      await page.waitForTimeout(1500);
    }
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
