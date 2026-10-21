import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const output = 'docs/review/motion-01';
const origins = {
  before: process.env.BEFORE_URL || 'http://127.0.0.1:4330',
  after: process.env.AFTER_URL || 'http://127.0.0.1:4325',
};
const routes = [
  ['home', '/'],
  ['services', '/services/'],
  ['about', '/about/'],
  ['resources', '/resources/'],
];
for (const directory of ['before', 'after', 'videos']) {
  mkdirSync(join(output, directory), { recursive: true });
}
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});

async function screenshotPages(mode, origin) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    for (const [name, route] of routes) {
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(new URL(route, origin).href);
        await page.locator('img').evaluateAll((images) =>
          Promise.all(
            images.map(async (image) => {
              image.loading = 'eager';
              await image.decode();
            }),
          ),
        );
        assert.match(await page.locator('.preview-banner').innerText(), /Prelaunch preview/);
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        );
        await page.screenshot({
          path: join(output, mode, `${name}-${width}.png`),
          fullPage: true,
          animations: 'disabled',
        });
      }
    }
  } finally {
    await context.close();
  }
}

async function captureRevealFrame(mode, origin) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  try {
    const page = await context.newPage();
    await page.goto(new URL('/', origin).href);
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      const section = document.querySelector('section[aria-labelledby="paths-heading"]');
      window.scrollTo(0, section.getBoundingClientRect().top + window.scrollY - 40);
    });
    if (mode === 'after') {
      await page.waitForFunction(() =>
        [...document.querySelectorAll('.path-card')].some((card) =>
          card.getAnimations().some((animation) => animation.effect.getTiming().duration === 650),
        ),
      );
      await page.locator('[data-reveal]').evaluateAll((targets) =>
        targets.forEach((target) =>
          target.getAnimations().forEach((animation) => {
            if (animation.effect.getTiming().duration === 650) {
              animation.pause();
              animation.currentTime = 120;
            }
          }),
        ),
      );
    }
    await page
      .locator('section[aria-labelledby="paths-heading"]')
      .screenshot({ path: join(output, mode, 'paths-in-view.png') });
  } finally {
    await context.close();
  }
}

async function recordTour(mode, origin, width, reducedMotion = 'no-preference') {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    reducedMotion,
    recordVideo: { dir: '/tmp/reveal-review-video', size: { width, height: 900 } },
  });
  const page = await context.newPage();
  const video = page.video();
  try {
    await page.goto(new URL('/', origin).href);
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
    });
    await page.waitForTimeout(900);
    for (const selector of [
      '.path-grid',
      '.service-preview-grid',
      '.examples',
      '.process-grid',
      '.personal-intro',
      '.closing',
    ]) {
      await page.locator(selector).scrollIntoViewIfNeeded();
      await page.waitForTimeout(1100);
    }
    if (width > 700) {
      for (const [route, selector] of [
        ['/services/', '#workflow-audit'],
        ['/about/', '.closing'],
        ['/resources/', '.resource-grid'],
      ]) {
        await page.goto(new URL(route, origin).href);
        await page.evaluate(() => {
          document.documentElement.style.scrollBehavior = 'auto';
        });
        await page.waitForTimeout(700);
        await page.locator(selector).scrollIntoViewIfNeeded();
        await page.waitForTimeout(1100);
      }
    }
  } finally {
    await context.close();
  }
  const name = `${mode}-${width}${reducedMotion === 'reduce' ? '-reduced' : ''}`;
  const rawPath = `/tmp/reveal-review-video/${name}.webm`;
  await video.saveAs(rawPath);
  execFileSync('ffmpeg', [
    '-loglevel',
    'error',
    '-y',
    '-i',
    rawPath,
    '-an',
    '-c:v',
    'libx264',
    '-preset',
    'fast',
    '-crf',
    '25',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    join(output, 'videos', `${name}.mp4`),
  ]);
}

try {
  for (const [mode, origin] of Object.entries(origins)) {
    await screenshotPages(mode, origin);
    await captureRevealFrame(mode, origin);
    await recordTour(mode, origin, 1280);
    await recordTour(mode, origin, 390);
  }
  await recordTour('after', origins.after, 1280, 'reduce');
} finally {
  await browser.close();
}

const rows = routes
  .map(
    ([name]) =>
      `<section><h2>${name}</h2><div class="pair">${['before', 'after'].map((mode) => `<figure><figcaption>${mode}</figcaption><a href="${mode}/${name}-1440.png"><img loading="lazy" src="${mode}/${name}-1440.png" alt="${mode} desktop ${name}"></a><p><a href="${mode}/${name}-390.png">Mobile screenshot</a></p></figure>`).join('')}</div></section>`,
  )
  .join('');
writeFileSync(
  join(output, 'index.html'),
  `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Section reveal review</title><style>body{max-width:1400px;margin:40px auto;padding:0 24px;font:18px/1.6 system-ui;background:#f8f7f3;color:#24313b}.pair{display:grid;grid-template-columns:1fr 1fr;gap:24px}figure{margin:0}img,video{width:100%;border:1px solid #d6dcd6}img{max-height:700px;object-fit:cover;object-position:top}figcaption{text-transform:capitalize;font-weight:600}a{color:#1c635e}@media(max-width:700px){.pair{grid-template-columns:1fr}}</style><h1>Section reveal review</h1><p>Compare the original prelaunch build with one-shot upward reveals. Screenshots show the settled layout; recordings show the motion. This review is not deployed to the live site.</p><h2>Desktop recordings</h2><div class="pair"><figure><figcaption>Before</figcaption><video controls preload="metadata" src="videos/before-1280.mp4"></video></figure><figure><figcaption>After</figcaption><video controls preload="metadata" src="videos/after-1280.mp4"></video></figure></div><p><a href="videos/before-390.mp4">Before mobile</a> · <a href="videos/after-390.mp4">After mobile</a> · <a href="videos/after-1280-reduced.mp4">After with reduced motion</a></p>${rows}</html>`,
);
console.log(
  'PASS before/after screenshots, desktop/mobile recordings, reduced-motion recording, and review gallery.',
);
