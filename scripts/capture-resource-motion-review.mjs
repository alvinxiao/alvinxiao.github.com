import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const output = 'docs/review/motion-02';
const origins = [
  process.env.BEFORE_URL || 'http://127.0.0.1:4332',
  process.env.AFTER_URL || 'http://127.0.0.1:4325',
];
const modes = ['before', 'after'];
mkdirSync(`${output}/videos`, { recursive: true });
for (const mode of modes) mkdirSync(`${output}/${mode}`, { recursive: true });
function alignStages(file) {
  const width = 1000;
  const frameBytes = width * 44;
  const sides = [0, width].map((left) => {
    const pixels = execFileSync(
      'ffmpeg',
      [
        '-loglevel',
        'error',
        '-threads',
        '2',
        '-i',
        file,
        '-vf',
        `crop=${width}:44:${left}:50,format=gray`,
        '-f',
        'rawvideo',
        '-',
      ],
      { maxBuffer: 64 * 1024 * 1024 },
    );
    const boundaries = [0];
    // Stationary label pixels identify stages independently of page animation.
    for (let offset = frameBytes; offset < pixels.length; offset += frameBytes) {
      let difference = 0;
      for (let pixel = 0; pixel < frameBytes; pixel += 1)
        difference += Math.abs(pixels[offset + pixel] - pixels[offset - frameBytes + pixel]);
      const mean = difference / frameBytes;
      if (mean > 1.5 && mean < 10) boundaries.push(offset / frameBytes / 25);
    }
    assert.equal(boundaries.length, 5, 'Expected idle plus four interaction label stages');
    boundaries.push(pixels.length / frameBytes / 25);
    return boundaries;
  });
  const filters = [];
  for (let stage = 0; stage < 5; stage += 1) {
    for (let side = 0; side < 2; side += 1) {
      const start = sides[side][stage] + (stage ? 0.04 : 0.3);
      const end = sides[side][stage + 1];
      filters.push(
        `[0:v]crop=1000:950:${side * 1000}:0,trim=start=${start}:end=${end},setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=2,trim=duration=2[s${stage}${side}]`,
      );
    }
    filters.push(`[s${stage}0][s${stage}1]hstack[p${stage}]`);
  }
  filters.push('[p0][p1][p2][p3][p4]concat=n=5:v=1:a=0[out]');
  const aligned = `${file}.aligned.mp4`;
  execFileSync('ffmpeg', [
    '-loglevel',
    'error',
    '-y',
    '-i',
    file,
    '-filter_complex',
    filters.join(';'),
    '-map',
    '[out]',
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
    aligned,
  ]);
  renameSync(aligned, file);
}
if (process.env.ALIGN_ONLY) {
  for (const name of ['desktop', 'reduced-motion'])
    alignStages(`${output}/videos/${name}-diff.mp4`);
  process.exit(0);
}
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function prepare(page, origin) {
  await page.goto(`${origin}/resources/`);
  await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto';
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map(async (img) => {
        img.loading = 'eager';
        await img.decode();
      }),
    );
  });
  await page.locator('.resource-card').first().scrollIntoViewIfNeeded();
  await page.waitForFunction(() =>
    [...document.querySelectorAll('[data-reveal]')].every(
      (element) => !element.getAnimations().length,
    ),
  );
  assert.match(await page.locator('.preview-banner').innerText(), /Prelaunch preview/);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
}

try {
  for (const width of process.env.REVIEW_SCENARIO ? [] : [320, 390, 768, 1440]) {
    for (const [i, origin] of origins.entries()) {
      const context = await browser.newContext({ viewport: { width, height: 1000 } });
      const page = await context.newPage();
      await prepare(page, origin);
      await page.screenshot({
        path: `${output}/${modes[i]}/resources-${width}.png`,
        fullPage: true,
      });
      if (width === 1440) {
        await page.locator('.resource-card').first().hover();
        await wait(600);
        await page
          .locator('.resource-grid')
          .screenshot({ path: `${output}/${modes[i]}/hover.png` });
        await page.mouse.move(0, 0);
        await page.keyboard.press('Tab');
        await page.locator('.resource-card').first().focus();
        await wait(600);
        await page
          .locator('.resource-grid')
          .screenshot({ path: `${output}/${modes[i]}/focus.png` });
      }
      await context.close();
    }
  }

  for (const scenario of ['desktop', 'reduced-motion', 'touch']) {
    if (process.env.REVIEW_SCENARIO && process.env.REVIEW_SCENARIO !== scenario) continue;
    const touch = scenario === 'touch';
    const width = touch ? 390 : 1000;
    const height = 900;
    const contexts = await Promise.all(
      origins.map(() =>
        browser.newContext({
          viewport: { width, height },
          hasTouch: touch,
          isMobile: touch,
          reducedMotion: scenario === 'reduced-motion' ? 'reduce' : 'no-preference',
          recordVideo: { dir: '/tmp/resource-motion-video', size: { width, height } },
        }),
      ),
    );
    const pages = await Promise.all(contexts.map((context) => context.newPage()));
    const videos = pages.map((page) => page.video());
    await Promise.all(pages.map((page, i) => prepare(page, origins[i])));
    await Promise.all(
      pages.map((page) =>
        page.evaluate(() => {
          const label = document.createElement('div');
          label.id = 'review-scene';
          label.style.cssText =
            'position:fixed;top:0;left:0;right:0;padding:12px;background:#153532;color:white;z-index:99999;font:18px Arial';
          label.textContent = 'Ready';
          document.body.append(label);
        }),
      ),
    );
    const started = Date.now();
    async function scene(label, action) {
      await Promise.all(
        pages.map(async (page) => {
          await page.locator('#review-scene').evaluate((element, text) => {
            element.textContent = text;
          }, label);
          await action(page);
        }),
      );
      await wait(1800);
    }
    await scene('Idle', async (page) => page.mouse.move(0, 0));
    if (touch) {
      await scene('Touch scroll · no hover enlargement', async (page) =>
        page.evaluate(() => window.scrollBy(0, 180)),
      );
    } else {
      await scene('Pointer enters artwork', async (page) =>
        page.locator('.resource-card').first().hover(),
      );
      await scene('Pointer leaves artwork', async (page) => page.mouse.move(0, 0));
      await scene('Keyboard focus · first guide', async (page) => {
        await page.keyboard.press('Tab');
        await page.locator('.resource-card').first().focus();
      });
      await scene('Keyboard focus · next guide', async (page) => page.keyboard.press('Tab'));
    }
    const elapsed = (Date.now() - started) / 1000;
    await Promise.all(contexts.map((context) => context.close()));
    const raw = await Promise.all(videos.map((video) => video.path()));
    const durations = raw.map((file) =>
      Number(
        execFileSync(
          'ffprobe',
          ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file],
          { encoding: 'utf8' },
        ).trim(),
      ),
    );
    const filters =
      raw
        .map(
          (_, i) =>
            `[${i}:v]trim=start=${Math.max(0, durations[i] - elapsed)},setpts=PTS-STARTPTS,fps=25,pad=iw:ih+50:0:50:color=0xe9eeeb,drawtext=text='${modes[i].toUpperCase()}':fontcolor=0x153532:fontsize=26:x=16:y=12[v${i}]`,
        )
        .join(';') + ';[v0][v1]hstack=inputs=2:shortest=1[out]';
    execFileSync('ffmpeg', [
      '-loglevel',
      'error',
      '-y',
      '-i',
      raw[0],
      '-i',
      raw[1],
      '-filter_complex',
      filters,
      '-map',
      '[out]',
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
    if (!touch) alignStages(`${output}/videos/${scenario}-diff.mp4`);
    console.log(`Captured ${scenario} comparison with synchronized interactions.`);
  }
  writeFileSync(
    `${output}/capture.json`,
    JSON.stringify(
      {
        baseline: '8332413696eed532359d9d33b6959aaa83fc2e99',
        widths: [320, 390, 768, 1440],
        recordings: ['desktop', 'reduced-motion', 'touch'],
        synchronization:
          'Parallel interactions on separate pages. Desktop and reduced-motion stages aligned by stationary interaction-label changes and shown in two-second segments at recorded speed, holding settled frames when needed.',
      },
      null,
      2,
    ) + '\n',
  );
} finally {
  await browser.close();
}
