import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
const output = 'docs/review/workflow-spacing';
const before = process.env.BEFORE_URL || 'http://127.0.0.1:4353';
const after = process.env.AFTER_URL || 'http://127.0.0.1:4340';
for (const part of ['before', 'after', 'videos'])
  mkdirSync(`${output}/${part}`, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
const evidence = [];
try {
  for (const width of [320, 390, 768, 1440]) {
    const pair = [];
    for (const [side, origin] of [
      ['before', before],
      ['after', after],
    ]) {
      const context = await browser.newContext({ viewport: { width, height: 1100 } });
      const page = await context.newPage();
      await page.goto(origin);
      await page.evaluate(() => document.fonts.ready);
      const root = page.locator('.workflow-example');
      await root.scrollIntoViewIfNeeded();
      await root.getByRole('button', { name: 'Pause email animation', exact: true }).click();
      const states = [];
      for (const [name, index] of [
        ['request', 0],
        ['history', 1],
        ['delivery', 4],
      ]) {
        await root.locator(`[data-email-step="${index}"]`).click();
        await page.mouse.move(0, 0);
        const geometry = await root.evaluate((node) => ({
          marker: [...node.querySelectorAll('.email-stage-marker')].map((n) => {
            const r = n.getBoundingClientRect();
            return { x: r.x, y: r.y + window.scrollY, width: r.width, height: r.height };
          }),
          targets: [...node.querySelectorAll('[data-email-step]')].map((n) => {
            const r = n.getBoundingClientRect();
            return { x: r.x, y: r.y + window.scrollY, width: r.width, height: r.height };
          }),
          copy: [...node.querySelectorAll('.email-stage-copy')].map((n) => {
            const r = n.getBoundingClientRect();
            return { x: r.x, y: r.y + window.scrollY, width: r.width, height: r.height };
          }),
          overflow: document.documentElement.scrollWidth > window.innerWidth,
        }));
        assert.equal(geometry.overflow, false);
        assert.ok(geometry.targets.every((target) => target.height >= 44));
        states.push({ name, ...geometry });
        await root.screenshot({ path: `${output}/${side}/${name}-${width}.png` });
        if (name === 'history') {
          const box = await root.locator('[data-email-stage="history"]').boundingBox();
          assert.ok(box);
          await page.screenshot({
            path: `${output}/${side}/detail-${width}.png`,
            clip: { x: box.x - 16, y: box.y - 16, width: box.width + 32, height: box.height + 32 },
          });
        }
      }
      if (width === 390 || width === 1440) {
        await page.keyboard.press('Shift+Tab');
        await page.keyboard.press('Space');
        await root.screenshot({ path: `${output}/${side}/keyboard-${width}.png` });
      }
      pair.push(states);
      evidence.push({ side, width, states });
      await context.close();
    }
    assert.deepEqual(pair[0], pair[1], 'Marker, copy and actual button geometry remains unchanged');
  }
  writeFileSync(`${output}/geometry.json`, JSON.stringify(evidence, null, 2) + '\n');
  for (const scenario of ['phone', 'desktop']) {
    const width = scenario === 'phone' ? 390 : 1024;
    const height = 1100;
    const size = { width: width * 2 + 20, height: height + 120 };
    const context = await browser.newContext({
      viewport: size,
      recordVideo: { dir: '/tmp/workflow-spacing-videos', size },
    });
    const page = await context.newPage();
    const video = page.video();
    await page.setContent(
      `<!doctype html><html lang="en"><title>Workflow selection spacing</title><style>*{box-sizing:border-box}body{margin:0;background:#e9eeeb;color:#153532;font:16px Arial}header{height:80px;padding:12px;line-height:1.4}.columns{display:grid;grid-template-columns:1fr 1fr;gap:20px}.label{height:40px;background:white;padding:10px}iframe{display:block;width:100%;height:${height}px;border:0}</style><header>Workflow selection spacing · ${scenario}<div id="chapter">Paused navigation · intentional step selections</div></header><div class="columns">${[before, after].map((origin, i) => `<div><div class="label">${i ? 'AFTER · More space around the icon' : 'BEFORE · Outline close to the icon'}</div><iframe title="${i ? 'After' : 'Before'}" name="view${i}" src="${origin}/"></iframe></div>`).join('')}</div></html>`,
    );
    const frames = [page.frame({ name: 'view0' }), page.frame({ name: 'view1' })];
    for (const frame of frames) {
      assert.ok(frame);
      await frame.waitForLoadState('load');
      await frame
        .locator('.workflow-example')
        .evaluate((n) => n.scrollIntoView({ block: 'start', behavior: 'instant' }));
      await frame.getByRole('button', { name: 'Pause email animation', exact: true }).click();
    }
    for (const [name, index] of [
      ['Request', 0],
      ['Past emails', 1],
      ['Delivery', 4],
    ]) {
      await page.locator('#chapter').evaluate((n, text) => {
        n.textContent = text;
      }, `Paused · select ${name} · intentional jump`);
      for (const frame of frames) await frame.locator(`[data-email-step="${index}"]`).click();
      await page.mouse.move(0, 0);
      await page.waitForTimeout(1800);
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
