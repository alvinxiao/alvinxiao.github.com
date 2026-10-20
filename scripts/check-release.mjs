import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function releaseIssues(config) {
  const issues = [];
  for (const key of ['publicName', 'descriptor', 'biography', 'contactEmail', 'privacyText']) {
    if (
      typeof config[key] !== 'string' ||
      !config[key].trim() ||
      /APPROVAL_REQUIRED|PLACEHOLDER|TODO/i.test(config[key])
    )
      issues.push(`${key} requires approved content.`);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.contactEmail ?? ''))
    issues.push('A valid public contact email is required.');
  if (!/^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(config.formEndpoint ?? ''))
    issues.push('A verified Formspree endpoint is required.');
  try {
    const url = new URL(config.siteUrl);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      issues.push(
        'The canonical site URL must be an HTTPS origin without credentials, a path, query, or fragment.',
      );
    }
  } catch {
    issues.push('A valid canonical site URL is required.');
  }
  for (const key of [
    'identity',
    'services',
    'pricing',
    'privacy',
    'design',
    'resources',
    'providerVerified',
    'ownerNotificationVerified',
    'retentionVerified',
    'qualityVerified',
    'hostingVerified',
    'release',
  ]) {
    if (config.approvals?.[key] !== true) issues.push(`${key} approval is missing.`);
  }
  return issues;
}

export function readReleaseConfig() {
  return JSON.parse(readFileSync(new URL('../src/content/approval.json', import.meta.url), 'utf8'));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const issues = releaseIssues(readReleaseConfig());
  if (issues.length) {
    console.error(`Production release blocked:\n${issues.map((issue) => `- ${issue}`).join('\n')}`);
    process.exitCode = 1;
  }
}
