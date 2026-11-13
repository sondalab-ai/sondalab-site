import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MARK_GLYPHS, markClass } from '../src/lib/marks.ts';
import { SPEXR_SECTIONS } from '../src/lib/spexr-page.ts';

// Every section head's eyebrow wears the kit's glyph, and no two neighbouring
// heads on a page wear the same one (owner, 2026-10-27: "a bit of variation on
// the art symbols"). Read from the source, since CI runs the tests before the
// build. The home page is not listed: since 2026-11-12 its sections have no
// numbered heads, so it has no marks to vary.
const PAGES = {
  daos: ['src/pages/daos.astro'],
  apparel: ['src/pages/apparel/index.astro'],
};
/** How many section heads each page has, so a head the regex misses fails. */
const HEADS = { daos: 9, apparel: 2 };
/** The kit's stylesheet: a glyph must be a modifier it defines, not one this
 *  repo believes in. */
const KIT_CSS = readFileSync(new URL('../node_modules/@sondalab/ui-kit/components.css', import.meta.url), 'utf8');
const kitHas = (g) => g === 'quarter' || KIT_CSS.includes(`.sl-eyebrow--mark-${g}::before`);

/** The eyebrow class attribute of each `sl-section__head`, in source order. */
function headEyebrows(file) {
  const src = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  const heads = [...src.matchAll(/class="sl-section__head[^"]*"[\s\S]*?class="(sl-eyebrow[^"]*)"/g)];
  return heads.map((m) => m[1]);
}

/** The glyph an eyebrow class names: its modifier, or 'quarter' for the bare mark. */
function glyphOf(cls) {
  assert.match(cls, /(^|\s)sl-eyebrow--mark(\s|$)/, `no mark on "${cls}"`);
  return cls.match(/sl-eyebrow--mark-(\w+)/)?.[1] ?? 'quarter';
}

function assertNeighboursDiffer(page, glyphs) {
  for (let i = 1; i < glyphs.length; i++) {
    assert.notEqual(glyphs[i], glyphs[i - 1], `${page}: heads ${i} and ${i + 1} both wear "${glyphs[i]}"`);
  }
}

for (const [page, files] of Object.entries(PAGES)) {
  test(`${page}: every section head carries a mark, and neighbours differ`, () => {
    const glyphs = files.flatMap(headEyebrows).map(glyphOf);
    assert.equal(glyphs.length, HEADS[page], `${page}: section heads found`);
    for (const g of glyphs) assert.ok(kitHas(g), `${page}: the kit has no glyph ${g}`);
    assertNeighboursDiffer(page, glyphs);
  });
}

// The spexr page renders its heads in a loop through markClass, plus the
// closing "How it runs" head at the next index.
test('spexr: every section head takes its glyph from markClass', () => {
  const src = readFileSync(new URL('../src/pages/spexr.astro', import.meta.url), 'utf8');
  const heads = [...src.matchAll(/class="sl-section__head[^"]*"[\s\S]*?<p class=\{([^}]+)\}/g)].map((m) => m[1]);
  assert.deepEqual(heads, ['markClass(i)', 'markClass(SPEXR_SECTIONS.length)']);
});

test('markClass cycles every glyph without repeating a neighbour', () => {
  const run = Array.from({ length: SPEXR_SECTIONS.length + 1 }, (_, i) => glyphOf(markClass(i)));
  assertNeighboursDiffer('spexr', run);
  const cycle = MARK_GLYPHS.map((_, i) => glyphOf(markClass(i)));
  assert.equal(new Set(cycle).size, MARK_GLYPHS.length);
  for (const g of cycle) assert.ok(kitHas(g), `markClass: the kit has no glyph ${g}`);
  assert.equal(markClass(MARK_GLYPHS.length), markClass(0));
});
