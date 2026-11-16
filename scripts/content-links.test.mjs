import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { checkContent, collectLinks, htmlIds, main } from './content-links.mjs';

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
  put('dist/index.html', '<h1 id="home">x</h1>');
  put('dist/ads/docs/ids/index.html', `<h2 id="café">a</h2><h2 id="a&amp;b">b</h2><h2 id='single'>c</h2><h2 id=bare>d</h2><h2 id="n&#233;">e</h2><p data-id="nope">f</p>`);
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

  test('anchors are percent-decoded and entity-decoded', () => {
    assert.deepEqual(check('[a](/ads/docs/ids/#caf%C3%A9) [b](/ads/docs/ids/#a%26b) [c](/ads/docs/ids/#n%C3%A9)\n'), []);
  });

  test('single-quoted and unquoted ids count, data-id does not', () => {
    assert.deepEqual(check('[a](/ads/docs/ids/#single) [b](/ads/docs/ids/#bare)\n'), []);
    assert.equal(check('[a](/ads/docs/ids/#nope)\n').length, 1);
    assert.deepEqual([...htmlIds('<p data-id="x" id="y">')], ['y']);
  });

  test('malformed percent escapes are reported, not thrown', () => {
    assert.match(check('[a](#%zz)\n')[0].reason, /not a valid URL/);
    assert.match(check('[a](/%zz/)\n')[0].reason, /not a valid URL/);
  });

  test('a query string is ignored, a fragment after it is checked', () => {
    assert.deepEqual(check('[a](/ads/docs/other/?a=1) [b](/ads/docs/other/?a=1#real-anchor)\n'), []);
    assert.equal(check('[a](/ads/docs/other/?a=1#gone)\n').length, 1);
  });

  test('the root link resolves to dist/index.html', () => {
    assert.deepEqual(check('[a](/) [b](/#home)\n'), []);
    assert.equal(check('[a](/#gone)\n').length, 1);
  });

  test('a missing static file fails', () => {
    assert.match(check('[a](/missing.png)\n')[0].reason, /no page at/);
  });

  test('a reference definition after a blank line serves [text][ref]', () => {
    const md = 'See [text][ref].\n\n\n[ref]: /ads/docs/nope/\n';
    const broken = check(md);
    assert.ok(broken.some((b) => b.target === '/ads/docs/nope/' && b.line === 4));
    assert.deepEqual(check('See [text][ref].\n\n[ref]: /ads/docs/other/\n'), []);
  });

  test('unquoted raw HTML href is collected', () => {
    assert.deepEqual(collectLinks('<div>\n<a href=/b/>b</a>\n</div>\n').map((l) => [l.target, l.line]), [['/b/', 2]]);
  });

  test('a nested folder or a frontmatter slug is refused', () => {
    put('content/ads-docs/sub/deep.md', 'x\n');
    assert.throws(() => checkContent(join(root, 'content'), join(root, 'dist')), /nested/);
    rmSync(join(root, 'content/ads-docs/sub'), { recursive: true });
    assert.throws(() => check('---\nslug: other\n---\n\ntext\n'), /slug/);
  });
});

describe('main', () => {
  const run = (args) => {
    const [log, err] = [console.log, console.error];
    console.log = console.error = () => {};
    try {
      return main(args);
    } finally {
      [console.log, console.error] = [log, err];
    }
  };
  const dirs = () => ['--content', join(root, 'content'), '--dist', join(root, 'dist')];

  test('exit codes: 0 clean, 1 broken, 2 without dist', () => {
    put('content/ads-docs/page.md', '[x](/ads/docs/other/)\n');
    assert.equal(run(dirs()), 0);
    put('content/ads-docs/page.md', '[x](/ads/docs/nope/)\n');
    assert.equal(run(dirs()), 1);
    assert.equal(run(['--content', join(root, 'content'), '--dist', join(root, 'no-dist')]), 2);
  });
});
