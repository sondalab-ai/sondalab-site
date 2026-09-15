#!/usr/bin/env node
// Guard against selectors left behind by a @sondalab/ui-kit class rename.
//
// When the kit takes over a pattern this site already had, the migration is two
// edits in two places: the class in the markup, and every selector in the
// <style> block that targets it. #12 (ui-kit 0.10.0) did the first and missed
// the second in four files, and nothing failed — a selector that matches
// nothing is not an error, it is silence. The regression only showed up on
// screen: .interlude__punch lost its inverted-band colour and painted
// --sl-text-primary on a band whose ground IS --sl-text-primary, so the line
// was white on light in the dark theme and black on dark in the light one.
// .method/.products lost `position: relative; z-index: 1` on their content
// wrapper. Measured with contrast-probe, that one was latent rather than live —
// the backdrop bed resolves to nothing on those sections today, so contrast was
// identical before and after — but it is one backdrop away from painting over
// the copy, and it was equally invisible to every gate in the repo.
//
// So the retired names are listed here, and any selector still naming one fails
// the build. Selectors only, with two known blind spots: markup is not scanned,
// because the retired word can legitimately survive as a data value (Interlude's
// `data.variant === 'invert'` is the seed key, not the class), and neither are
// JS call sites — classList.add('wrap'), querySelector('.eyebrow') and friends —
// because the same quoted word is not reliably a class there. Both were swept by
// hand when this gate was written; a rename still has to check them.
//
// Retiring another name means adding it to RETIRED below, in the same commit as
// the rename.

import { readFileSync, globSync } from 'node:fs';

/** Kit-owned names this site used to spell without the prefix, and what replaced them. */
const RETIRED = {
  wrap: 'sl-wrap',
  section: 'sl-section',
  'section-index': 'sl-section__head',
  'section-index__no': 'sl-section__idx',
  eyebrow: 'sl-eyebrow',
  invert: 'sl-invert',
};

/** Strip block and line comments so prose about a retired name never trips the rule. */
function decomment(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const failures = [];

for (const file of globSync('src/**/*.{css,astro}').sort()) {
  const src = decomment(readFileSync(file, 'utf8'));

  for (const [line, text] of src.split('\n').entries()) {
    for (const [old, replacement] of Object.entries(RETIRED)) {
      // A class selector for `old`: the dot, the exact name, then anything that
      // cannot continue a class name. Keeps .sl-wrap and .hero__eyebrow out.
      if (new RegExp(`\\.${old}(?![\\w-])`).test(text)) {
        failures.push(
          `${file}:${line + 1}: .${old} is retired — the markup now says .${replacement}, so this selector matches nothing`,
        );
      }
    }
  }
}

if (failures.length) {
  console.error(`kit-names-gate: ${failures.length} stale selector(s)\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error('\nSee the header of scripts/kit-names-gate.mjs for why.');
  process.exit(1);
}
console.log(`kit-names-gate: no retired kit class names in src/ selectors`);
