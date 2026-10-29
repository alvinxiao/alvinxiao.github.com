import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { workflowDuration, workflowTiming } from '../src/content/workflow-example.ts';

const output = process.env.REVIEW_OUTPUT || 'docs/review/workflow-descriptions';
const before = process.env.BEFORE_URL || 'http://127.0.0.1:4351';
const after = process.env.AFTER_URL || 'http://127.0.0.1:4340';
for (const folder of ['before', 'after', 'videos'])
  mkdirSync(`${output}/${folder}`, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
const records = [];
try {
  if (process.env.ONLY_VIDEOS !== '1') {
    for (const [width, height] of [
      [320, 640],
      [390, 844],
      [651, 1000],
      [768, 1000],
      [1440, 900],
    ]) {
      const copy = [];
      for (const [side, origin] of [
        ['before', before],
        ['after', after],
      ]) {
        const context = await browser.newContext({
          viewport: { width, height },
          reducedMotion: 'reduce',
        });
        const page = await context.newPage();
        await page.goto(origin);
        await page.evaluate(() => document.fonts.ready);
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
          false,
        );
        const text = (await page.locator('.example-row').allTextContents()).map((value) =>
          value.replace(/\s+/g, ' ').trim(),
        );
        copy.push(text);
        await page
          .locator('.hero')
          .screenshot({ path: `${output}/${side}/hero-${width}.png`, animations: 'disabled' });
        await page
          .locator('.workflow-example')
          .screenshot({ path: `${output}/${side}/example-${width}.png` });
        if (side === 'after') {
          await page.getByRole('radio', { name: 'Automatic send', exact: true }).check();
          await page
            .locator('.workflow-example')
            .screenshot({ path: `${output}/after/automatic-${width}.png` });
        }
        records.push({
          side,
          width,
          height,
          originalExamples: text,
          words: (await page.locator('.workflow-example').innerText()).trim().split(/\s+/).length,
        });
        await context.close();
      }
      assert.deepEqual(copy[0], copy[1], 'Original example rows are preserved');
    }
    for (const width of [390, 1440]) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        reducedMotion: 'no-preference',
      });
      const page = await context.newPage();
      await page.goto(after);
      await page.locator('.email-chain').scrollIntoViewIfNeeded();
      await page.getByRole('button', { name: 'Pause email animation', exact: true }).click();
      for (const [phase, time] of [
        ['request', 400],
        ['history', workflowDuration * 0.2],
        ['voice', workflowDuration * 0.4],
        ['document', workflowDuration * 0.6],
        ['email', workflowDuration * 0.8],
      ]) {
        const reached = ['request', 'history', 'voice', 'document', 'email'].indexOf(phase);
        await page.locator(`[data-email-step="${reached}"]`).click();
        const sample = await page.locator('.workflow-example').evaluate((root, time) => {
          const carrier = root.querySelector('.email-carrier');
          if (!carrier) throw new Error('Missing carrier');
          const animations = root.getAnimations({ subtree: true });
          if (animations.length !== 10)
            throw new Error('Expected one movement animation, four glyphs, and five stage reveals');
          for (const animation of animations) {
            animation.pause();
            animation.currentTime = time;
          }
          const rect = carrier.getBoundingClientRect();
          return {
            current: root.getAttribute('data-email-current'),
            description: root.querySelector('.email-detail[data-current]')?.textContent?.trim(),
            x: rect.x,
            y: rect.y,
            markers: [...root.querySelectorAll('.email-stage-marker')].map(
              (node) => window.getComputedStyle(node).opacity,
            ),
            shapes: Object.fromEntries(
              [...carrier.querySelectorAll('[data-shape]')].map((node) => [
                node.getAttribute('data-shape'),
                window.getComputedStyle(node).opacity,
              ]),
            ),
          };
        }, time);
        assert.ok(
          Number(sample.shapes[phase === 'history' || phase === 'voice' ? 'thinking' : phase]) >
            0.9,
          `The ${phase} glyph is visible`,
        );
        assert.equal(sample.current, String(reached));
        assert.deepEqual(
          sample.markers,
          [0, 1, 2, 3, 4].map((index) => (index <= reached ? '1' : '0')),
        );
        records.push({ width, phase, time, sample });
        await page
          .locator('.workflow-example')
          .screenshot({ path: `${output}/after/${phase}-${width}.png` });
      }
      await context.close();
    }
    const staticContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      javaScriptEnabled: false,
      reducedMotion: 'reduce',
    });
    const staticPage = await staticContext.newPage();
    await staticPage.goto(after);
    await staticPage.getByRole('radio', { name: 'Automatic send', exact: true }).check();
    await staticPage
      .locator('.workflow-example')
      .screenshot({ path: `${output}/after/no-javascript-390.png` });
    await staticContext.close();
    writeFileSync(`${output}/layout-evidence.json`, JSON.stringify(records, null, 2) + '\n');
  }
  for (const scenario of [
    'phone',
    'desktop',
    'reduced-motion',
    'no-javascript',
    'approval-uninterrupted',
  ]) {
    const solo = scenario === 'approval-uninterrupted';
    const width = scenario === 'desktop' ? 1024 : 390;
    const height = scenario === 'desktop' ? 900 : 1100;
    const size = { width: solo ? width : width * 2 + 20, height: height + 120 };
    const context = await browser.newContext({
      viewport: size,
      javaScriptEnabled: scenario !== 'no-javascript',
      reducedMotion: scenario === 'reduced-motion' ? 'reduce' : 'no-preference',
      recordVideo: { dir: '/tmp/email-workflow-videos', size },
    });
    const page = await context.newPage();
    const video = page.video();
    const sources = solo ? [after] : [before, after];
    await page.setContent(
      `<!doctype html><html lang="en"><title>Email workflow review</title><style>*{box-sizing:border-box}body{margin:0;background:#e9eeeb;color:#153532;font:16px Arial}header{height:80px;padding:10px;line-height:1.4}.columns{display:grid;grid-template-columns:${solo ? '1fr' : '1fr 1fr'};gap:20px}.label{height:40px;background:white;padding:10px}iframe{display:block;width:100%;height:${height}px;border:0}</style><header><div>${solo ? 'Human approval · uninterrupted playback' : `Before / after · ${width} × ${height} · ${scenario}`}</div><div id="chapter">Loading review</div></header><div class="columns">${sources.map((origin, i) => `<div><div class="label" id="label${i}">${solo || i ? 'REVISED · 18-second workflow' : 'PREVIOUS · 6.8-second workflow'}</div><iframe title="${solo || i ? 'Revised' : 'Previous'}" name="view${i}" src="${origin}/"></iframe></div>`).join('')}</div></html>`,
    );
    const frames = sources.map((_, index) => page.frame({ name: `view${index}` }));
    for (const frame of frames) {
      assert.ok(frame, 'Review frame is available');
      await frame.waitForLoadState('load');
      await frame.evaluate(() => document.fonts.ready);
      await frame
        .locator('.workflow-example')
        .evaluate((node) => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
    }
    const revised = frames.at(-1);
    assert.ok(revised, 'Revised review frame is available');
    const chapter = (text) =>
      page.locator('#chapter').evaluate((node, value) => {
        node.textContent = value;
      }, text);
    const replay = (frame) =>
      frame.getByRole('button', { name: 'Replay email animation', exact: true }).click();
    const animated = scenario === 'phone' || scenario === 'desktop';
    if (solo) {
      await chapter('Playing · no pauses or step selections');
      await replay(revised);
      const observations = [];
      const started = Date.now();
      while (Date.now() - started < workflowDuration + 1000) {
        const observation = await revised.locator('.workflow-example').evaluate((root) => {
          const carrier = root.querySelector('.email-carrier');
          const animation = carrier?.getAnimations()[0];
          return {
            state: root.getAttribute('data-email-state'),
            step: root.getAttribute('data-email-current'),
            time: typeof animation?.currentTime === 'number' ? animation.currentTime : 0,
          };
        });
        observations.push(observation);
        const seconds = (observation.time / 1000).toFixed(1);
        await chapter(
          observation.state === 'complete'
            ? `Complete at ${seconds}s · animation rests here`
            : observation.step === '4'
              ? `${seconds}s · Human approval: final reading hold`
              : `${seconds}s · Playing continuously`,
        );
        await page.waitForTimeout(100);
      }
      assert.deepEqual(
        [...new Set(observations.map((sample) => sample.step))],
        ['0', '1', '2', '3', '4'],
      );
      assert.equal(observations.at(-1)?.state, 'complete');
      assert.equal(observations.at(-1)?.step, '4');
      assert.ok(
        observations.every(
          (sample, index) => index === 0 || sample.time >= observations[index - 1].time,
        ),
      );
      writeFileSync(
        `${output}/approval-playback.json`,
        JSON.stringify(observations, null, 2) + '\n',
      );
    } else if (animated) {
      await chapter('1 · Uninterrupted human approval · previous finishes sooner');
      for (const frame of frames) await replay(frame);
      await page.waitForTimeout(workflowDuration + 1000);
      await chapter('2 · Paused navigation demo · intentional step jumps');
      await replay(revised);
      await page.waitForTimeout(700);
      await revised.getByRole('button', { name: 'Pause email animation', exact: true }).click();
      for (const [index, label] of [
        [0, 'request'],
        [3, 'draft'],
      ]) {
        await chapter(`Paused · select ${label} · intentional jump`);
        await revised.locator(`[data-email-step="${index}"]`).click();
        await page.waitForTimeout(1200);
      }
      await chapter('Resume · continue from the selected draft');
      await revised.getByRole('button', { name: 'Resume email animation', exact: true }).click();
      await page.waitForTimeout(workflowDuration * (1 - workflowTiming[3].arrival) + 800);
      await chapter('3 · Automatic delivery · uninterrupted playback');
      for (const frame of frames)
        await frame.getByRole('radio', { name: 'Automatic send', exact: true }).check();
      await page.waitForTimeout(workflowDuration + 1000);
    } else {
      await chapter('Static fallback · no motion is expected');
      await page.waitForTimeout(1800);
      for (const frame of frames)
        await frame.getByRole('radio', { name: 'Automatic send', exact: true }).check();
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
      `${output}/videos/${solo ? scenario : `${scenario}-diff`}.mp4`,
    ]);
    console.log(`Captured ${scenario}.`);
  }
} finally {
  await browser.close();
}
