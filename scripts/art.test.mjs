import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

// The site's art. No page wears a kit poster or a kit horizon: the pictures
// are the inked prints in src/assets/art (owner, 2026-11-12). The footer ends
// on a still life drawn in the page's ink. Read from the source, since CI runs the tests
// before the build.

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

test('the footer ends on the still life, in one ink, and gives the space back without it', () => {
  const footer = read('src/components/SiteFooter.astro');
  // A mask painted in the page's own text colour: no canvas, no script, no colour of its own.
  assert.match(footer, /<div class="site-footer__still" style=\{`--still:url\(\$\{still\.src\}\)`\} aria-hidden="true"><\/div>/);
  assert.match(footer, /\.site-footer__still\s*\{[^}]*background:\s*color-mix\(in srgb, var\(--slc-text\) 42%, transparent\);[^}]*mask:\s*var\(--still\)/);
  assert.doesNotMatch(footer, /<canvas|<script|mountTraces/);
  assert.match(footer, /high-contrast'\]\) \.site-footer__still \{ display: none; \}/);
  assert.match(footer, /forced-colors: active[\s\S]*\.site-footer__still \{ display: none; \}/);
});
