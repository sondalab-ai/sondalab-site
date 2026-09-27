import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractSources } from '../src/lib/sources.ts';

test('external links become numbered sources in reading order', () => {
  const body = 'See [one](https://a.example/x) and then [two](http://b.example/y).';
  assert.deepEqual(extractSources(body), [
    { n: 1, text: 'one', href: 'https://a.example/x', host: 'a.example' },
    { n: 2, text: 'two', href: 'http://b.example/y', host: 'b.example' },
  ]);
});

test('link text that wraps across lines reads as one line', () => {
  const [s] = extractSources('the [Commission\'s enforcement powers came into\napplication](https://ec.europa.eu/x).');
  assert.equal(s.text, "Commission's enforcement powers came into application");
});

test('emphasis and code in link text are plain in the source list', () => {
  const [s] = extractSources('[**bold** and `code`](https://x.example/)');
  assert.equal(s.text, 'bold and code');
});

test('www is dropped from the host', () => {
  assert.equal(extractSources('[a](https://www.darkreading.com/p)')[0].host, 'darkreading.com');
});

test('images, relative links and the site itself are not sources', () => {
  const body = '![pic](https://img.example/a.png) [home](/blog/) [self](https://sondalab.eu/blog/) [real](https://r.example/)';
  assert.deepEqual(extractSources(body).map((s) => s.href), ['https://r.example/']);
});

test('fenced code is not scanned for links', () => {
  assert.deepEqual(extractSources('```\n[not](https://x.example/)\n```\n'), []);
});
