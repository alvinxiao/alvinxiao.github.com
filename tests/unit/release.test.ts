import assert from 'node:assert/strict';
import { test } from 'node:test';

const modulePath = '../../scripts/check-release.mjs';
const { releaseIssues, readReleaseConfig } = await import(modulePath);

function approvedFixture() {
  return {
    publicName: 'Synthetic review identity',
    descriptor: 'Synthetic review descriptor',
    biography: 'Synthetic biography for the release guard test only.',
    contactEmail: 'review@example.test',
    siteUrl: 'https://example.test',
    formEndpoint: 'https://formspree.io/f/testreview',
    privacyText: 'Synthetic policy for a release guard test only.',
    approvals: {
      identity: true,
      services: true,
      pricing: true,
      privacy: true,
      design: true,
      resources: true,
      providerVerified: true,
      ownerNotificationVerified: true,
      retentionVerified: true,
      qualityVerified: true,
      hostingVerified: true,
      release: true,
    },
  };
}

test('the actual unapproved project cannot produce a production release', () => {
  const issues = releaseIssues(readReleaseConfig());
  assert.ok(issues.length > 0);
  assert.ok(issues.some((issue: string) => issue.includes('privacy')));
  assert.ok(issues.some((issue: string) => issue.includes('release')));
});

test('complete synthetic approvals satisfy the configuration contract', () => {
  assert.deepEqual(releaseIssues(approvedFixture()), []);
});

for (const field of ['publicName', 'descriptor', 'biography', 'contactEmail', 'privacyText']) {
  test(`missing ${field} fails closed`, () => {
    assert.ok(releaseIssues({ ...approvedFixture(), [field]: '' }).length > 0);
  });
  test(`unresolved ${field} content fails closed`, () => {
    assert.ok(
      releaseIssues({ ...approvedFixture(), [field]: 'PUBLIC_NAME_APPROVAL_REQUIRED' }).length > 0,
    );
  });
}

for (const approval of Object.keys(approvedFixture().approvals)) {
  test(`${approval} requires explicit approval`, () => {
    const fixture = approvedFixture();
    const issues = releaseIssues({
      ...fixture,
      approvals: { ...fixture.approvals, [approval]: false },
    });
    assert.ok(issues.some((issue: string) => issue.includes(approval)));
  });
}

test('a missing approval object cannot accidentally authorize release', () => {
  assert.ok(releaseIssues({ ...approvedFixture(), approvals: undefined }).length >= 10);
});

for (const formEndpoint of [
  'http://formspree.io/f/abc',
  'https://evil.example/f/abc',
  'javascript:alert(1)',
  'https://formspree.io.evil.example/f/abc',
  'https://formspree.io/f/abc?key=private',
]) {
  test(`rejects endpoint outside the HTTPS Formspree contract: ${formEndpoint}`, () => {
    assert.ok(releaseIssues({ ...approvedFixture(), formEndpoint }).length > 0);
  });
}

for (const siteUrl of [
  'http://example.test',
  'javascript:alert(1)',
  'not a URL',
  'https://user:private@example.test',
  'https://example.test/nested/',
  'https://example.test?email=private',
  'https://example.test#fragment',
]) {
  test(`rejects an unsafe canonical URL: ${siteUrl}`, () => {
    assert.ok(releaseIssues({ ...approvedFixture(), siteUrl }).length > 0);
  });
}
