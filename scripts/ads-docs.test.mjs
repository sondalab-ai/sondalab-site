import { test } from 'node:test';
import assert from 'node:assert/strict';
import { docHref, neighbours, orderDocs } from '../src/lib/ads-docs.ts';

const doc = (id, order) => ({ id, title: id, order });

test('orderDocs sorts the pages by order', () => {
  const sorted = orderDocs([doc('c', 2), doc('a', 0), doc('b', 1)]);
  assert.deepEqual(sorted.map((d) => d.order), [0, 1, 2]);
});

test('orderDocs refuses two pages with the same order', () => {
  assert.throws(() => orderDocs([doc('a', 0), doc('b', 1), doc('c', 1)]), /duplicate order 1/);
});

test('neighbours gives the previous and the next page, null at the ends', () => {
  const docs = orderDocs([doc('a', 0), doc('b', 1), doc('c', 2)]);
  assert.deepEqual(neighbours(docs, 'a'), { prev: null, next: docs[1] });
  assert.deepEqual(neighbours(docs, 'b'), { prev: docs[0], next: docs[2] });
  assert.deepEqual(neighbours(docs, 'c'), { prev: docs[1], next: null });
  assert.deepEqual(neighbours(docs, 'nope'), { prev: null, next: null });
});

test('docHref is the page path with the trailing slash', () => {
  assert.equal(docHref('status-api'), '/ads/docs/status-api/');
});
