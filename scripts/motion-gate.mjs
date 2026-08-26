#!/usr/bin/env node
// Guard on a deliberate decision: this site never consults
// prefers-reduced-motion.
//
// It used to. Every animation hung off `@media (prefers-reduced-motion:
// no-preference)`, and the JS drivers bailed on the same query. That reads as
// an accessibility win but the signal is ambiguous in practice: Windows reports
// `reduce` whenever "animation effects" is off, which is the default under
// "adjust for best performance". The result was a whole class of visitors —
// verified on a Windows 11 / Chrome 151 machine — getting a site with no
// glitch, no hero cue and no scroll reveals, with nothing on screen to suggest
// anything was missing.
//
// The call (marcello, 2026-08-26) is that the glitch is brand rather than
// decoration and runs for everyone. This script fails the build if a
// prefers-reduced-motion gate is reintroduced anywhere in src/, so the change
// has to be an explicit decision rather than a habit.
//
// Reversing the decision means deleting this file, not editing around it.

import { readFileSync, globSync } from 'node:fs';

const QUERY = 'prefers-reduced-motion';
const failures = [];

/** Strip block and line comments so prose about the rule never trips the rule. */
function decomment(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

for (const file of globSync('src/**/*.{css,astro,ts,js}').sort()) {
  const src = decomment(readFileSync(file, 'utf8'));

  for (const [line, text] of src.split('\n').entries()) {
    if (new RegExp(`@media[^{]*${QUERY}`).test(text)) {
      failures.push(`${file}:${line + 1}: @media (${QUERY}) gate — this site animates for everyone`);
    }
    if (new RegExp(`matchMedia\\([^)]*${QUERY}`).test(text)) {
      failures.push(`${file}:${line + 1}: matchMedia('${QUERY}') gate — this site animates for everyone`);
    }
  }
}

// @sondalab/ui-kit zeroes the duration tokens under the same query, so removing
// our gates is not enough on its own: site.css restores them, and that restore
// only works if it lands after the DS rule in the bundle.
const RESTORE = /:root\s*{[^}]*--sl-motion-fast\s*:\s*120ms/;
if (!RESTORE.test(readFileSync('src/styles/site.css', 'utf8'))) {
  failures.push(
    `src/styles/site.css: missing the unconditional --sl-motion-* restore; without it every transition still snaps to 0ms wherever the OS reports ${QUERY}`,
  );
}

// Built output, when present: the restore must win the cascade over the DS rule.
for (const css of globSync('dist/**/*.css')) {
  const built = readFileSync(css, 'utf8');
  const zeroed = built.indexOf(`${QUERY}:reduce){:root{--sl-motion-fast`);
  if (zeroed === -1) continue;
  const restored = built.lastIndexOf('--sl-motion-fast');
  if (restored < zeroed) {
    failures.push(
      `${css}: the DS ${QUERY} rule outranks the site restore — check the stylesheet import order in src/layouts/Base.astro`,
    );
  }
}

if (failures.length) {
  console.error(`motion-gate: ${failures.length} failure(s)\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error('\nSee the header of scripts/motion-gate.mjs for why.');
  process.exit(1);
}
console.log(`motion-gate: no ${QUERY} gates in src/`);
