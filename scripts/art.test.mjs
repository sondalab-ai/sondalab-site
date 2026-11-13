import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

// The site's art. No page wears a kit poster or a kit horizon: the pictures
// are the inked prints in src/assets/art (owner, 2026-11-12). The footer ends
// on the wordmark as type. Read from the source, since CI runs the tests
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

test('the footer ends on the wordmark, as type, and gives the space back without it', () => {
  const footer = read('src/components/SiteFooter.astro');
  // Type in the brand face, not a canvas and not a script.
  assert.match(footer, /<div class="site-footer__mark" aria-hidden="true">sondalab<span>\.<\/span><\/div>/);
  assert.match(footer, /\.site-footer__mark\s*\{[^}]*font-family:\s*var\(--sl-font-brand\)/);
  assert.doesNotMatch(footer, /<canvas|<script|mountTraces/);
  // Its two colours are the page's: the ink, faint, and the accent.
  assert.match(footer, /\.site-footer__mark\s*\{[^}]*color:\s*color-mix\(in srgb, var\(--slc-text\) 9%, transparent\)/);
  assert.match(footer, /\.site-footer__mark span\s*\{[^}]*var\(--sl-accent-default\)/);
  assert.match(footer, /high-contrast'\]\) \.site-footer__mark \{ display: none; \}/);
  assert.match(footer, /forced-colors: active[\s\S]*\.site-footer__mark \{ display: none; \}/);
});
