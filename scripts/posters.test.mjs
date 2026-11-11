import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  PAGE_POSTERS,
  PAGE_POSTER_LOOKS,
  PAGE_POSTER_SEEDS,
  POSTER_VARIANTS,
  posterClass,
  posterSequence,
} from '../src/lib/posters.ts';

// Every internal page head wears a poster from the kit (procedural prints
// since ui-kit 0.45), beside its text. Two pages a reader opens one after the
// other do not wear the same scene, and every page has a seed of its own, so
// no two pages show the same picture (owner, 2026-10-27: "the site must
// appear unique"). Read from the source, since CI runs the tests before the
// build.

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const KIT_CSS = read('node_modules/@sondalab/ui-kit/components.css');
const SITE_CSS = read('src/styles/site.css');

/** A poster's classes exist where they are painted: in the kit. */
function assertPainted(cls) {
  const parts = cls.split(' ');
  assert.equal(parts[0], 'sl-art-poster', cls);
  for (const c of parts.slice(1)) assert.ok(KIT_CSS.includes(`.${c}`), `nothing paints .${c}`);
}

/** The scene a class string names: its modifier, or '' for the bare dawn. */
const variantOf = (cls) => cls.match(/sl-art-poster--(\w+)/)?.[1] ?? '';

// Enough slugs to reach every look; their order stands in for a reading order.
const SLUGS = Array.from({ length: 64 }, (_, i) => `slug-${i}-${(i * 7919).toString(36)}`);

test('every composition the helper names is one the kit paints', () => {
  for (const v of POSTER_VARIANTS) {
    if (v) assert.ok(KIT_CSS.includes(`.sl-art-poster--${v}::before`), `the kit has no poster ${v}`);
  }
  assert.deepEqual([...POSTER_VARIANTS], ['', 'overprint', 'hills', 'orbit']);
  assert.doesNotMatch(SITE_CSS, /poster--flip/, 'the 0.42 mirror is gone: a seed varies the picture');
});

test('posterSequence is deterministic and keyed by slug', () => {
  const a = posterSequence(SLUGS);
  const b = posterSequence([...SLUGS]);
  assert.deepEqual([...a], [...b]);
  assert.deepEqual([...a.keys()], SLUGS);
  for (const cls of a.values()) assertPainted(cls);
});

test('posterSequence never gives neighbours the same scene', () => {
  for (const before of [undefined, ...POSTER_VARIANTS]) {
    const run = [...posterSequence(SLUGS, before).values()].map(variantOf);
    if (before !== undefined) assert.notEqual(run[0], before, `the first page repeats the one before it (${before})`);
    for (let i = 1; i < run.length; i++) assert.notEqual(run[i], run[i - 1], `pages ${i} and ${i + 1}`);
  }
});

test('posterSequence reaches all four scenes', () => {
  const looks = new Set(posterSequence(SLUGS).values());
  assert.deepEqual([...looks].sort(), POSTER_VARIANTS.map((v) => posterClass(v)).sort());
});

test('the fixed pages each show a picture of their own: a scene and a seed', () => {
  const looks = Object.entries(PAGE_POSTER_LOOKS).map(([, [variant, seed]]) => `${variant}:${seed}`);
  assert.equal(new Set(looks).size, looks.length);
  const seeds = Object.values(PAGE_POSTER_SEEDS);
  assert.equal(new Set(seeds).size, seeds.length, 'two fixed pages share a seed');
  for (const seed of seeds) assert.match(seed, /^[a-z][a-z-]*$/, `${seed} is not a text seed`);
  for (const cls of Object.values(PAGE_POSTERS)) assertPainted(cls);
  assert.equal(PAGE_POSTERS.spexr, posterClass(PAGE_POSTER_LOOKS.spexr[0]));
});

test('the kit draws the art: Base.astro mounts it once for every page', () => {
  const base = read('src/layouts/Base.astro');
  assert.match(base, /import \{ mountArt \} from '@sondalab\/ui-kit\/art\.js';/);
  assert.match(base, /\bmountArt\(\);/);
});

test('every page ends on a horizon, new on every visit, with its content above it', () => {
  const footer = read('src/components/SiteFooter.astro');
  assert.match(footer, /<footer class="site-footer sl-art-horizon" data-site-horizon>/);
  // The seed and the scene are picked in the browser, so no two visits end alike.
  assert.match(footer, /classList\.toggle\('sl-art-horizon--dawn', Math\.random\(\) < 0\.5\)/);
  assert.match(footer, /dataset\.slArtSeed = String\(1 \+ Math\.floor\(Math\.random\(\) \* 0xfffffffe\)\)/);
  assert.ok(KIT_CSS.includes('.sl-art-horizon::before') && KIT_CSS.includes('.sl-art-horizon--dawn::before'), 'the kit has no horizon');
  // The horizon is 200px tall: the footer's bottom padding clears all of it.
  assert.match(KIT_CSS, /\.sl-art-horizon::after\s*\{[^}]*height:\s*min\(200px, 100%\)/);
  assert.match(footer, /padding-block:\s*2\.5rem calc\(2\.5rem \+ 200px\);/);
});

// Each internal page head, from where it opens to where it ends, and the
// expression its poster's class is built from.
const HEADS = [
  ['src/pages/products/[slug].astro', '<header class="product__head">', '</header>', 'poster', 'product.id'],
  ['src/pages/blog/[slug].astro', '<header class="post__head">', '</header>', 'poster', 'post.id'],
  ['src/pages/spexr.astro', '<header class="sl-wrap hero">', '</header>', 'PAGE_POSTERS.spexr', 'PAGE_POSTER_SEEDS.spexr'],
  ['src/pages/daos.astro', '<div class="hero">', '<!-- 01', 'PAGE_POSTERS.daos', 'PAGE_POSTER_SEEDS.daos'],
  ['src/pages/design-system.astro', '<header class="ds-head sl-wrap">', '</header>', 'PAGE_POSTERS.designSystem', 'PAGE_POSTER_SEEDS.designSystem'],
];

for (const [file, open, close, expr, seed] of HEADS) {
  test(`${file}: the head carries an empty, hidden poster with the page's seed`, () => {
    const src = read(file);
    const start = src.indexOf(open);
    assert.ok(start >= 0, `no ${open}`);
    const head = src.slice(start, src.indexOf(close, start));
    const poster = new RegExp(`<div class=\\{\`[\\w-]+ \\$\\{${expr.replace('.', '\\.')}\\}\`\\} data-sl-art-seed=\\{${seed.replace('.', '\\.')}\\} aria-hidden="true"></div>`);
    assert.match(head, poster);
  });
}

test('every fixed page poster is worn by exactly one page', () => {
  const used = HEADS.map(([, , , expr]) => expr).filter((e) => e.startsWith('PAGE_POSTERS.'));
  assert.deepEqual(used.map((e) => e.slice('PAGE_POSTERS.'.length)).sort(), Object.keys(PAGE_POSTERS).sort());
});

// One picture to a head (owner, 2026-11-11): the flat print over the
// photographic scene read as a patchwork.
test('a head that carries a CRT scene wears no poster', () => {
  for (const file of ['src/pages/blog/[...page].astro', 'src/pages/apparel/index.astro']) {
    const src = read(file);
    assert.match(src, /<CrtScene\b/, `${file} has no scene`);
    assert.doesNotMatch(src, /sl-art-poster|PAGE_POSTERS|posterSequence/, `${file} wears a poster over its scene`);
  }
  for (const [file] of HEADS) assert.doesNotMatch(read(file), /<CrtScene\b/, `${file} has a scene and a poster`);
});

test('products and posts take their poster from posterSequence', () => {
  assert.match(read('src/pages/products/[slug].astro'), /posterSequence\(products\.map\(\(p\) => p\.id\)\)/);
  assert.match(read('src/pages/blog/[slug].astro'), /posterSequence\(posts\.map\(\(p\) => p\.id\)\)/);
});

// The kit's cell is the box's width over 126, rounded down: a width that is
// not a multiple of 126 loses its remainder as an uneven margin.
test('every poster width is a whole multiple of 126px', () => {
  for (const [file] of HEADS) {
    const widths = [...read(file).matchAll(/poster[\w-]*\s*\{[^}]*?width:\s*(\d+)px/g)].map((m) => Number(m[1]));
    assert.ok(widths.length >= 2, `${file}: poster widths found`);
    for (const w of widths) assert.ok(w % 126 === 0 && w >= 126, `${file}: ${w}px`);
  }
});
