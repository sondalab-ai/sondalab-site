import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { checkContent, collectLinks } from './content-links.mjs';

let root;
const put = (rel, text) => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), text);
};
const check = (md) => {
  put('content/ads-docs/page.md', md);
  return checkContent(join(root, 'content'), join(root, 'dist'));
};

before(() => {
  root = mkdtempSync(join(tmpdir(), 'content-links-'));
  put('dist/ads/docs/other/index.html', '<h2 id="real-anchor">x</h2>');
  put('dist/ads/docs/page/index.html', '<h2 id="own">x</h2>');
  put('dist/robots.txt', 'ok');
});
after(() => rmSync(root, { recursive: true, force: true }));

describe('content links', () => {
  test('a link to an existing route passes', () => {
    assert.deepEqual(check('See [x](/ads/docs/other/).\n'), []);
  });

  test('a link to a missing route fails', () => {
    const [b] = check('See [x](/ads/docs/nope/).\n');
    assert.equal(b.line, 1);
    assert.match(b.reason, /no page at \/ads\/docs\/nope\//);
  });

  test('a link without the trailing slash fails and says why', () => {
    const [b] = check('See [x](/ads/docs/other).\n');
    assert.match(b.reason, /missing trailing slash/);
  });

  test('a missing anchor fails, an existing one passes', () => {
    assert.deepEqual(check('[x](/ads/docs/other/#real-anchor)\n'), []);
    const [b] = check('[x](/ads/docs/other/#gone)\n');
    assert.match(b.reason, /no element with id "gone"/);
  });

  test('a same-page anchor is checked against the page itself', () => {
    assert.deepEqual(check('[x](#own)\n'), []);
    assert.equal(check('[x](#other)\n').length, 1);
  });

  test('a relative link resolves against the page route', () => {
    assert.deepEqual(check('[x](../other/)\n'), []);
    assert.equal(check('[x](other.md)\n').length, 1);
  });

  test('links in code spans and fenced blocks are ignored', () => {
    assert.deepEqual(check('Use `[x](/nope/)`.\n\n```md\n[x](/nope/)\n```\n'), []);
  });

  test('external links and static files are not route-checked', () => {
    assert.deepEqual(check('[a](https://example.com/x) [b](//cdn.example.com/y) [c](mailto:a@b.c) [d](/robots.txt)\n'), []);
  });

  test('the reported line counts the frontmatter', () => {
    const [b] = check('---\ntitle: t\n---\n\ntext\n\n[x](/nope/)\n');
    assert.equal(b.line, 7);
  });

  test('images and raw HTML hrefs are collected', () => {
    const links = collectLinks('![i](/a.png)\n\n<a href="/b/">b</a>\n');
    assert.deepEqual(links.map((l) => [l.target, l.line]), [['/a.png', 1], ['/b/', 3]]);
  });
});
