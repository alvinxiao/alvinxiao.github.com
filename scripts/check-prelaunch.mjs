import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2] || 'dist';
let htmlCount = 0;

function inspect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) inspect(file);
    else if (/\.(html|js|json|xml|txt)$/.test(entry.name)) {
      const text = readFileSync(file, 'utf8');
      assert.doesNotMatch(
        text,
        /APPROVAL_REQUIRED|\bPLACEHOLDER\b|review@example\.test|approved@example\.test|synthetic@example\.test|formspree\.io\/f\/testreview|-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/i,
        `Unsafe prelaunch output in ${file}.`,
      );
      if (entry.name.endsWith('.html')) {
        htmlCount += 1;
        assert.match(text, /Prelaunch preview\./, `Missing public prelaunch label in ${file}.`);
        assert.match(text, /href="\/launch-checklist\/"/, `Missing checklist link in ${file}.`);
        assert.match(
          text,
          /name="robots"[^>]*content="noindex, nofollow"/,
          `Indexable prelaunch page in ${file}.`,
        );
        assert.doesNotMatch(text, /Not published\./, `Local-only preview wording in ${file}.`);
      }
    }
  }
}

inspect(root);
assert.ok(htmlCount > 0, 'No generated prelaunch pages were checked.');
const contact = readFileSync(join(root, 'contact/index.html'), 'utf8');
const form = contact.match(/<form\b[^>]*id="inquiry-form"[^>]*>/)?.[0];
assert.ok(form, 'Prelaunch contact form is missing.');
assert.match(form, /data-prelaunch="true"/, 'Prelaunch submission lock is missing.');
assert.doesNotMatch(form, /data-endpoint="[^"]+"/, 'Prelaunch has an active form endpoint.');
assert.doesNotMatch(contact, /href="mailto:/, 'Prelaunch exposes an active contact address.');
assert.match(
  contact,
  /<button[^>]*type="submit"[^>]*disabled/,
  'Prelaunch submit button is enabled.',
);
const checklist = readFileSync(join(root, 'launch-checklist/index.html'), 'utf8');
assert.match(checklist, /Before the full launch\./, 'Public launch checklist is missing.');
assert.match(readFileSync(join(root, 'robots.txt'), 'utf8'), /Disallow: \//);
console.log(
  `PASS ${htmlCount} labelled prelaunch pages, inactive inquiry form, and public launch checklist.`,
);
