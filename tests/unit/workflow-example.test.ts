import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { workflowExample, workflowExamples } from '../../src/content/workflow-example';

test('worked example explanations remain verbatim excerpts of the workflow article', () => {
  const article = readFileSync(
    new URL('../../src/content/resources/workflow.md', import.meta.url),
    'utf8',
  );
  assert.ok(article.includes(workflowExample.question));
  assert.ok(article.includes(workflowExample.caveat));
  assert.ok(article.includes(`title: '${workflowExample.guideTitle}'`));
  for (const example of workflowExamples) {
    const section = article.split(`## ${example.heading}\n\n`)[1]?.split('\n\n## ')[0];
    assert.ok(section, `Article section exists for ${example.id}`);
    assert.deepEqual(section.split('\n\n').slice(0, 2), example.paragraphs);
  }
});
