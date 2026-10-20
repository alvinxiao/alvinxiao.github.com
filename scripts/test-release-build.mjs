import assert from 'node:assert/strict';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const sandbox = mkdtempSync(join(tmpdir(), 'consulting-release-test-'));
const excluded = new Set([
  '.git',
  '.astro',
  'node_modules',
  'dist',
  'playwright-report',
  'test-results',
]);

function runBuild(env = {}, script = 'build') {
  const result = spawnSync('npm', ['run', script], {
    cwd: sandbox,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    timeout: 120_000,
    maxBuffer: 8 * 1024 * 1024,
  });
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  if (result.error) throw result.error;
  return { status: result.status, output };
}

try {
  for (const entry of readdirSync(root)) {
    if (!excluded.has(entry) && !entry.startsWith('.env'))
      cpSync(join(root, entry), join(sandbox, entry), { recursive: true });
  }
  symlinkSync(join(root, 'node_modules'), join(sandbox, 'node_modules'), 'dir');

  const blocked = runBuild();
  assert.notEqual(blocked.status, 0, 'Unapproved production build unexpectedly passed.');
  assert.match(blocked.output, /Production release blocked/, blocked.output);
  console.log('PASS actual production build rejects the current unapproved content.');

  const prelaunch = runBuild(
    {
      PUBLIC_FORMSPREE_ENDPOINT: 'https://unapproved.example.test/f/override',
      PUBLIC_CONTACT_EMAIL: 'unapproved@example.test',
    },
    'build:prelaunch',
  );
  assert.equal(prelaunch.status, 0, prelaunch.output);
  const prelaunchHome = readFileSync(join(sandbox, 'dist/index.html'), 'utf8');
  const prelaunchContact = readFileSync(join(sandbox, 'dist/contact/index.html'), 'utf8');
  assert.match(prelaunchHome, /Prelaunch preview\./);
  assert.match(prelaunchHome, /href="\/launch-checklist\/"/);
  assert.match(prelaunchContact, /data-prelaunch="true"/);
  assert.doesNotMatch(
    prelaunchContact,
    /data-endpoint="[^"]+"|mailto:|unapproved\.example\.test|unapproved@example\.test/,
  );
  console.log(
    'PASS public prelaunch builds with pending launch gates and disables inquiry collection.',
  );

  const configPath = join(sandbox, 'src/content/approval.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  Object.assign(config, {
    publicName: 'Synthetic release fixture',
    descriptor: 'Synthetic consulting description',
    biography: 'Synthetic biography used only in an isolated build test.',
    contactEmail: 'approved@example.test',
    siteUrl: 'https://example.test',
    formEndpoint: 'https://formspree.io/f/testreview',
    privacyText: 'Synthetic privacy text used only in an isolated build test.',
  });
  config.approvals = Object.fromEntries(Object.keys(config.approvals).map((key) => [key, true]));
  writeFileSync(configPath, JSON.stringify(config));

  const approved = runBuild({
    PUBLIC_FORMSPREE_ENDPOINT: 'https://unapproved.example.test/f/override',
    PUBLIC_CONTACT_EMAIL: 'unapproved@example.test',
  });
  assert.equal(approved.status, 0, approved.output);
  assert.ok(existsSync(join(sandbox, 'dist/index.html')), 'Production output was not generated.');
  const home = readFileSync(join(sandbox, 'dist/index.html'), 'utf8');
  const contact = readFileSync(join(sandbox, 'dist/contact/index.html'), 'utf8');
  assert.doesNotMatch(home, /NONPRODUCTION|Owner review preview|noindex/);
  assert.match(home, /Synthetic release fixture/);
  assert.match(contact, /approved@example\.test/);
  assert.doesNotMatch(contact, /unapproved\.example\.test|unapproved@example\.test/);
  console.log(
    'PASS approved synthetic production build removes preview labeling and rejects environment overrides.',
  );

  const check = spawnSync(process.execPath, [join(sandbox, 'scripts/check-output.mjs')], {
    cwd: sandbox,
    encoding: 'utf8',
  });
  assert.equal(check.status, 0, check.stderr);
  writeFileSync(join(sandbox, 'dist/leaked-preview.html'), 'PUBLIC_NAME_APPROVAL_REQUIRED');
  const leak = spawnSync(process.execPath, [join(sandbox, 'scripts/check-output.mjs')], {
    cwd: sandbox,
    encoding: 'utf8',
  });
  assert.notEqual(leak.status, 0, 'Output guard missed a leaked placeholder token.');
  console.log('PASS built-output guard rejects unresolved placeholder content.');
} finally {
  rmSync(sandbox, { recursive: true, force: true });
  console.log(`Removed isolated synthetic build ${basename(sandbox)}.`);
}
