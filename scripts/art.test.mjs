import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { traceCells } from '../src/lib/traces.ts';

// The site's art (owner, 2026-11-11). The heads carry no picture: a poster
// beside a head read as clip art, and over a CRT scene as a patchwork. The
// one new piece is the footer's band of signal traces, in the page's own ink
// and accent. Read from the source, since CI runs the tests before the build.

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const walk = (dir) => readdirSync(new URL(`../${dir}`, import.meta.url), { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]));

test('no page or component wears a kit poster or a kit horizon', () => {
  // The design-system page draws the kit's own specimens from its catalog;
  // those are documentation of the kit, not the site's art.
  for (const file of walk('src').filter((f) => /\.(astro|ts|css)$/.test(f))) {
    assert.doesNotMatch(read(file), /sl-art-poster|sl-art-horizon(?!\[)|data-sl-art-seed|mountArt/, `${file} wears a kit picture`);
  }
});

test('the footer ends on the trace band, new on every visit, with its content above it', () => {
  const footer = read('src/components/SiteFooter.astro');
  assert.match(footer, /<canvas class="site-footer__band" data-foot-band aria-hidden="true"><\/canvas>/);
  assert.match(footer, /mountTraces\(band, 1 \+ Math\.floor\(Math\.random\(\) \* 99999\)\)/);
  // The band is 150px tall: the footer's bottom padding clears all of it.
  assert.match(footer, /\.site-footer__band\s*\{[^}]*height:\s*150px/);
  assert.match(footer, /padding-block:\s*2\.5rem calc\(2\.5rem \+ 150px\);/);
  // Its two colours are the page's: the ink, dimmed, and the accent.
  assert.match(footer, /\.site-footer__band\s*\{[^}]*color:\s*color-mix\(in srgb, var\(--slc-text\) 50%, transparent\);[^}]*outline-color:\s*var\(--slc-accent-text\)/);
  assert.match(footer, /high-contrast'\]\) \.site-footer__band \{ display: none; \}/);
  assert.match(footer, /forced-colors: active[\s\S]*\.site-footer__band \{ display: none; \}/);
});

test('the trace module holds no colour: it reads the ink and the accent from the canvas', () => {
  const code = read('src/lib/traces.ts').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert.deepEqual(code.match(/#(?:[0-9a-fA-F]{3,8})\b|\b(?:rgba?|hsla?|oklch|oklab|color-mix)\(/g) ?? [], []);
  assert.match(code, /style\.color/);
  assert.match(code, /style\.outlineColor/);
  assert.doesNotMatch(code, /requestAnimationFrame|setInterval|setTimeout/, 'the band never animates');
});

test('a band is the same for one seed and differs between seeds', () => {
  const a = traceCells(720, 75, 7), b = traceCells(720, 75, 7), c = traceCells(720, 75, 8);
  assert.deepEqual(a, b);
  const d = a.reduce((n, v, k) => n + (v !== c[k]), 0);
  assert.ok(d > a.length * 0.02, `seeds 7 and 8 differ in ${d} cells`);
});

test('a band holds ink and one accent trace, and leaves most of its box clear', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const cols = 720, rows = 75, cells = traceCells(cols, rows, seed);
    const count = (v) => cells.reduce((n, x) => n + (x === v), 0);
    assert.ok(count(1) > 0 && count(2) > 0, `seed ${seed}: no ink or no accent`);
    assert.ok(count(0) > cells.length * 0.8, `seed ${seed}: the band fills its box`);
    // The accent trace runs the whole width; a nearer trace may hide it in places.
    let seen = 0;
    for (let x = 0; x < cols; x++) {
      let hit = false;
      for (let y = 0; y < rows && !hit; y++) hit = cells[y * cols + x] === 2;
      if (hit) seen++;
    }
    assert.ok(seen > cols * 0.6, `seed ${seed}: the accent shows in ${seen} of ${cols} columns`);
    // No peak reaches the band's top edge, where it would be cut.
    assert.ok(cells.subarray(0, cols * 3).every((v) => v === 0), `seed ${seed}: a cell in the top three rows`);
  }
});
