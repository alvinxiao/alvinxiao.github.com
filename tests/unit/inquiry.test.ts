import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fieldLimits, isInterest, validateInquiry } from '../../src/lib/inquiry/model';

const valid = {
  name: 'Synthetic Test',
  email: 'synthetic@example.test',
  interest: 'learning',
  description: 'A synthetic inquiry for validation tests.',
  optional_context: '',
};

test('all five documented interests are accepted and unknown values are rejected', () => {
  for (const interest of ['learning', 'problem', 'audit', 'implementation', 'other']) {
    assert.ok(isInterest(interest));
    assert.deepEqual(validateInquiry({ ...valid, interest }), {});
  }
  for (const interest of ['', 'constructor', '__proto__', '<script>', 'LEARNING', null, 3]) {
    assert.equal(isInterest(interest), false);
  }
});

test('whitespace-only required fields fail with field-specific errors', () => {
  const errors = validateInquiry({
    name: ' ',
    email: ' ',
    interest: '',
    description: '\n\t',
    optional_context: '',
  });
  assert.deepEqual(Object.keys(errors).sort(), ['description', 'email', 'interest', 'name']);
});

for (const field of [
  'name',
  'description',
  'optional_context',
] satisfies (keyof typeof fieldLimits)[]) {
  test(`${field} accepts its documented maximum and rejects one character over`, () => {
    const limit = fieldLimits[field];
    assert.deepEqual(validateInquiry({ ...valid, [field]: 'a'.repeat(limit) }), {});
    assert.ok(validateInquiry({ ...valid, [field]: 'a'.repeat(limit + 1) })[field]);
  });
}

test('oversized irrelevant context is excluded from validation for other/not sure', () => {
  assert.deepEqual(
    validateInquiry({ ...valid, interest: 'other', optional_context: 'a'.repeat(10_000) }),
    {},
  );
});

test('email validation rejects malformed, missing, oversized and newline-containing values', () => {
  for (const email of [
    'invalid',
    'a@',
    '@example.test',
    'a b@example.test',
    'a@example.test\nBcc: other@example.test',
    `${'a'.repeat(250)}@example.test`,
  ]) {
    assert.ok(validateInquiry({ ...valid, email }).email);
  }
});
