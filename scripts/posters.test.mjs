import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  PAGE_POSTERS,
  PAGE_POSTER_LOOKS,
  POSTER_FLIP,
  POSTER_VARIANTS,
  posterClass,
  posterSequence,
} from '../src/lib/posters.ts';

// Every internal page head wears a poster from the kit (ui-kit 0.42), beside
// its text, and two pages a reader opens one after the other do not wear the
// same composition (owner, 2026-10-27: "the site must appear unique"). Read
// from the source, since CI runs the tests before the build.

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const KIT_CSS = read('node_modules/@sondalab/ui-kit/components.css');
const SITE_CSS = read('src/styles/site.css');

/** A poster's classes exist where they are painted: the kit's, or the site's mirror. */
function assertPainted(cls) {
  const parts = cls.split(' ');
  assert.equal(parts[0], 'sl-art-poster', cls);
  for (const c of parts.slice(1)) {
    const where = c === POSTER_FLIP ? SITE_CSS : KIT_CSS;
    assert.ok(where.includes(`.${c}`), `nothing paints .${c}`);
  }
}

/** The composition a class string names: its modifier, or '' for the bare horizon. */
const variantOf = (cls) => cls.match(/sl-art-poster--(\w+)/)?.[1] ?? '';

// Enough slugs to reach every look; their order stands in for a reading order.
const SLUGS = Array.from({ length: 64 }, (_, i) => `slug-${i}-${(i * 7919).toString(36)}`);

test('every composition the helper names is one the kit paints', () => {
  for (const v of POSTER_VARIANTS) {
    if (v) assert.ok(KIT_CSS.includes(`.sl-art-poster--${v}::before`), `the kit has no poster ${v}`);
  }
  assert.match(SITE_CSS, new RegExp(`\\.${POSTER_FLIP}\\s*\\{[^}]*transform:\\s*scaleX\\(-1\\)`), 'site.css mirrors the flip');
});

test('posterSequence is deterministic and keyed by slug', () => {
  const a = posterSequence(SLUGS);
  const b = posterSequence([...SLUGS]);
  assert.deepEqual([...a], [...b]);
  assert.deepEqual([...a.keys()], SLUGS);
  for (const cls of a.values()) assertPainted(cls);
});

test('posterSequence never gives neighbours the same composition, mirrored or not', () => {
  for (const before of [undefined, ...POSTER_VARIANTS]) {
    const run = [...posterSequence(SLUGS, before).values()].map(variantOf);
    if (before !== undefined) assert.notEqual(run[0], before, `the first page repeats the one before it (${before})`);
    for (let i = 1; i < run.length; i++) assert.notEqual(run[i], run[i - 1], `pages ${i} and ${i + 1}`);
  }
});

test('posterSequence reaches all eight looks', () => {
  const looks = new Set(posterSequence(SLUGS).values());
  const all = POSTER_VARIANTS.flatMap((v) => [posterClass(v), posterClass(v, true)]);
  assert.deepEqual([...looks].sort(), all.sort());
});

test('the fixed pages each wear a different look', () => {
  const looks = Object.values(PAGE_POSTERS);
  assert.equal(new Set(looks).size, looks.length);
  for (const cls of looks) assertPainted(cls);
  assert.equal(PAGE_POSTERS.blog, posterClass(...PAGE_POSTER_LOOKS.blog));
});

// Each internal page head, from where it opens to where it ends, and the
// expression its poster's class is built from.
const HEADS = [
  ['src/pages/products/[slug].astro', '<header class="product__head">', '</header>', 'poster'],
  ['src/pages/blog/[slug].astro', '<header class="post__head">', '</header>', 'poster'],
  ['src/pages/blog/[...page].astro', '<header class="tlog-head">', '</header>', 'PAGE_POSTERS.blog'],
  ['src/pages/spexr.astro', '<header class="sl-wrap hero">', '</header>', 'PAGE_POSTERS.spexr'],
  ['src/pages/daos.astro', '<div class="hero">', '<!-- 01', 'PAGE_POSTERS.daos'],
  ['src/pages/apparel/index.astro', '<section class="ap-open">', '</section>', 'PAGE_POSTERS.apparel'],
  ['src/pages/design-system.astro', '<header class="ds-head sl-wrap">', '</header>', 'PAGE_POSTERS.designSystem'],
];

for (const [file, open, close, expr] of HEADS) {
  test(`${file}: the head carries an empty, hidden poster`, () => {
    const src = read(file);
    const start = src.indexOf(open);
    assert.ok(start >= 0, `no ${open}`);
    const head = src.slice(start, src.indexOf(close, start));
    const poster = new RegExp(`<div class=\\{\`[\\w-]+ \\$\\{${expr.replace('.', '\\.')}\\}\`\\} aria-hidden="true"></div>`);
    assert.match(head, poster);
  });
}

test('every fixed page poster is worn by exactly one page', () => {
  const used = HEADS.map(([, , , expr]) => expr).filter((e) => e.startsWith('PAGE_POSTERS.'));
  assert.deepEqual(used.map((e) => e.slice('PAGE_POSTERS.'.length)).sort(), Object.keys(PAGE_POSTERS).sort());
});

test('products and posts take their poster from posterSequence', () => {
  assert.match(read('src/pages/products/[slug].astro'), /posterSequence\(products\.map\(\(p\) => p\.id\)\)/);
  assert.match(read('src/pages/blog/[slug].astro'), /posterSequence\(posts\.map\(\(p\) => p\.id\), PAGE_POSTER_LOOKS\.blog\[0\]\)/);
});

// The kit's cell is the box's width over 48, rounded down: a width that is
// not a multiple of 48 loses its remainder as an uneven margin.
test('every poster width is a whole multiple of 48px, at least 144px', () => {
  for (const [file] of HEADS) {
    const widths = [...read(file).matchAll(/poster[\w-]*\s*\{[^}]*?width:\s*(\d+)px/g)].map((m) => Number(m[1]));
    assert.ok(widths.length >= 2, `${file}: poster widths found`);
    for (const w of widths) assert.ok(w % 48 === 0 && w >= 144, `${file}: ${w}px`);
  }
});
