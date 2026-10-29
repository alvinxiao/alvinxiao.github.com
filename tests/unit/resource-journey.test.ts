import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveResourceJourney } from '../../src/content/resource-journey';

test('authored path orders guides independently of collection iteration', () => {
  const articles = ['workflow', 'ai-basics', 'getting-started'].map((id) => ({ id, title: id }));
  const result = resolveResourceJourney(articles);
  assert.deepEqual(
    result.map(({ id }) => id),
    ['ai-basics', 'getting-started', 'workflow'],
  );
  assert.equal(result[0], articles[1]);
  assert.deepEqual(
    articles.map(({ id }) => id),
    ['workflow', 'ai-basics', 'getting-started'],
  );
});

test('invalid authored relationships fail instead of rendering broken navigation', () => {
  const articles = [{ id: 'one' }, { id: 'two' }];
  for (const order of [[], ['one', 'one'], ['one', 'missing'], ['one'], [''], null, 3]) {
    assert.throws(() => resolveResourceJourney(articles, order));
  }
  assert.throws(() => resolveResourceJourney([{ id: 'one' }, { id: 'one' }], ['one']));
  assert.deepEqual(resolveResourceJourney([{ id: 'one' }], ['one']), [{ id: 'one' }]);
});
