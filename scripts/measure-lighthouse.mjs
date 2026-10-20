import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const baseURL = process.env.LIGHTHOUSE_BASE_URL || 'http://127.0.0.1:4321';
const output = resolve(process.argv[2] || 'test-results/lighthouse');
const routes = [
  { id: 'home', path: '/' },
  { id: 'services', path: '/services/' },
  { id: 'contact', path: '/contact/' },
];
const runs = [];
mkdirSync(output, { recursive: true });

for (let round = 1; round <= 5; round += 1) {
  for (const route of routes) {
    const file = resolve(output, `${route.id}-${round}.json`);
    const result = spawnSync(
      'npm',
      [
        'exec',
        '--yes',
        '--package=lighthouse@13.5.0',
        '--',
        'lighthouse',
        new URL(route.path, baseURL).href,
        '--only-categories=performance,accessibility',
        '--form-factor=mobile',
        '--throttling-method=simulate',
        '--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage',
        '--output=json',
        `--output-path=${file}`,
        '--quiet',
      ],
      { env: process.env, encoding: 'utf8', timeout: 120_000, maxBuffer: 4 * 1024 * 1024 },
    );
    if (result.error) throw result.error;
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(readFileSync(file, 'utf8'));
    assert.equal(report.runtimeError, undefined, JSON.stringify(report.runtimeError));
    assert.equal(new URL(report.finalDisplayedUrl).pathname, route.path);
    const requests = report.audits['network-requests'].details.items;
    const errors = requests.filter((request) => request.statusCode >= 400);
    assert.deepEqual(errors, [], 'A measured page returned failing requests.');
    const row = {
      route: route.path,
      round,
      performance: Math.round(report.categories.performance.score * 100),
      accessibility: Math.round(report.categories.accessibility.score * 100),
      lcpMs: report.audits['largest-contentful-paint'].numericValue,
      requests: requests.length,
      failures: errors.length,
      lighthouseVersion: report.lighthouseVersion,
      browser: report.environment.hostUserAgent,
    };
    runs.push(row);
    console.log(JSON.stringify(row));
  }
}

const summary = routes.map((route) => {
  const values = runs.filter((run) => run.route === route.path);
  const stats = (key) => {
    const sorted = values.map((run) => run[key]).sort((a, b) => a - b);
    return { median: sorted[2], min: sorted[0], max: sorted[4] };
  };
  return {
    route: route.path,
    runCount: values.length,
    performance: stats('performance'),
    accessibility: stats('accessibility'),
    lcpMs: stats('lcpMs'),
  };
});
writeFileSync(
  resolve(output, 'summary.json'),
  JSON.stringify(
    {
      note: 'Local labelled preview, not deployed production. Synthetic form requests are not submitted by Lighthouse.',
      runs,
      summary,
    },
    null,
    2,
  ),
);
for (const route of summary) {
  assert.ok(
    route.performance.median >= 90,
    `${route.route} median mobile performance is below 90.`,
  );
  assert.ok(route.accessibility.median >= 95, `${route.route} median accessibility is below 95.`);
}
console.log(
  'PASS local-preview Lighthouse median gates across five interleaved mobile runs per route.',
);
