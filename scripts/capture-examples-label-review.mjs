import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const output = 'docs/review/examples-label';
const origins = [
  process.env.BEFORE_URL || 'http://127.0.0.1:4341',
  process.env.AFTER_URL || 'http://127.0.0.1:4340',
];
for (const folder of ['before', 'after', 'videos'])
  mkdirSync(`${output}/${folder}`, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
const evidence = [];
try {
  for (const width of [320, 390, 768, 1440]) {
    const pair = [];
    for (const [index, origin] of origins.entries()) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      await page.goto(origin);
      await page.evaluate(() => document.fonts.ready);
      const section = page.locator('section[aria-labelledby="examples-heading"]');
      await section.evaluate((element) =>
        element.scrollIntoView({ block: 'start', behavior: 'instant' }),
      );
      const session = await context.newCDPSession(page);
      const { root } = await session.send('DOM.getDocument');
      const { nodeId } = await session.send('DOM.querySelector', {
        nodeId: root.nodeId,
        selector: 'section[aria-labelledby="examples-heading"]',
      });
      const { node } = await session.send('DOM.describeNode', { nodeId });
      const { nodes } = await session.send('Accessibility.getPartialAXTree', {
        backendNodeId: node.backendNodeId,
        fetchRelatives: false,
      });
      await page.locator('.service-preview').last().focus();
      await page.keyboard.press('Tab');
      const keyboardNext = await page.evaluate(() => ({
        tag: document.activeElement?.tagName,
        href: document.activeElement?.getAttribute('href'),
        text: document.activeElement?.textContent?.trim(),
      }));
      await section.evaluate((element) =>
        element.scrollIntoView({ block: 'start', behavior: 'instant' }),
      );
      const record = {
        keyboardNext,
        width,
        side: index ? 'after' : 'before',
        role: nodes[0].role?.value,
        name: nodes[0].name?.value || '',
        ignored: nodes[0].ignored,
        text: await section.innerText(),
        focusOrder: await page
          .locator('a[href],button,input,select,textarea,[tabindex]')
          .evaluateAll((elements) =>
            elements.map((element) => ({
              tag: element.tagName,
              text: element.textContent?.trim(),
              href: element.getAttribute('href'),
              tabindex: element.getAttribute('tabindex'),
            })),
          ),
      };
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
        false,
      );
      await page.screenshot({
        path: `${output}/${index ? 'after' : 'before'}/examples-${width}.png`,
      });
      pair.push(record);
      evidence.push(record);
      await context.close();
    }
    assert.equal(pair[0].text, pair[1].text);
    assert.deepEqual(pair[0].focusOrder, pair[1].focusOrder);
    assert.deepEqual(pair[0].keyboardNext, pair[1].keyboardNext);
    assert.equal(pair[1].keyboardNext.href, '/about/');
    assert.equal(pair[1].role, 'region');
    assert.match(pair[1].name, /Less repetitive work.*More time for your business/);
    assert.notEqual(pair[0].role, 'region');
  }
  writeFileSync(`${output}/accessibility-evidence.json`, JSON.stringify(evidence, null, 2) + '\n');
  const context = await browser.newContext({
    viewport: { width: 800, height: 1050 },
    reducedMotion: 'reduce',
    recordVideo: { dir: '/tmp/examples-label-video', size: { width: 800, height: 1050 } },
  });
  const page = await context.newPage();
  const video = page.video();
  const roles = [
    evidence.find((item) => item.side === 'before'),
    evidence.find((item) => item.side === 'after'),
  ];
  await page.setContent(
    `<!doctype html><html lang="en"><title>Examples label comparison</title><style>*{box-sizing:border-box}body{margin:0;background:#e9eeeb;color:#153532;font:18px Arial}header{height:95px;padding:12px}h1{font-size:23px;margin:0 0 8px}.columns{display:grid;grid-template-columns:1fr 1fr;gap:20px}.label{height:115px;padding:12px;background:white;font-size:16px;line-height:1.45}.after{background:#cce6df}iframe{width:100%;height:840px;border:0;display:block}</style><header><h1>Examples label · Before / After</h1>Appearance unchanged. Accessibility label repaired.</header><div class="columns">${origins.map((origin, index) => `<div><div class="label ${index ? 'after' : ''}"><b>${index ? 'AFTER' : 'BEFORE'}</b><br>Accessible role: ${roles[index].role}<br>${roles[index].name || 'No accessible section name'}</div><iframe name="view${index}" title="${index ? 'After' : 'Before'}" src="${origin}/"></iframe></div>`).join('')}</div></html>`,
  );
  for (const name of ['view0', 'view1']) {
    const frame = page.frame({ name });
    await frame.waitForLoadState('load');
    await frame
      .locator('section[aria-labelledby="examples-heading"]')
      .evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
  }
  await page.waitForTimeout(1600);
  await Promise.all(
    ['view0', 'view1'].map((name) =>
      page.frame({ name }).evaluate(() => window.scrollBy({ top: 250, behavior: 'instant' })),
    ),
  );
  await page.waitForTimeout(1600);
  await context.close();
  const raw = await video.path();
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
    `${output}/videos/label-comparison.mp4`,
  ]);
} finally {
  await browser.close();
}
console.log(
  'Captured label comparison and verified accessible names, unchanged text/focus order at four widths.',
);
