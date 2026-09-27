#!/usr/bin/env node
// Builds the backdrop plates the glass refracts, from the design system's own
// theme files.
//
// WHY A FILE AT ALL. Each section paints its bed as `--bed: url(...)`, one
// plate per theme, generated from ONE recipe here so the dark and light beds
// cannot drift apart.
//
// The colours are READ from the kit's theme CSS, never copied. sl-audit reads
// CSS only and would not see a literal in this file; the design language would
// still be broken by one.
//
// Usage: node scripts/make-backdrops.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const KIT = 'node_modules/@sondalab/ui-kit/themes';
const OUT = 'public/backdrops';

/** The plate's own pixels. It is stretched over the anchor's box, so this is
 *  resolution rather than aspect: the blooms are soft and the rules are the
 *  only thing with an edge. */
const W = 1600;
const H = 1200;

/** Read one token's value out of a theme stylesheet. */
function tokens(theme) {
  const css = readFileSync(`${KIT}/${theme}.css`, 'utf8');
  return (name) => {
    const m = new RegExp(`--sl-${name}:\\s*([^;]+);`).exec(css);
    if (!m) throw new Error(`theme ${theme} declares no --sl-${name}`);
    return m[1].trim();
  };
}

/** One soft bloom, as a radial gradient stop pair. */
function bloom(id, colour, alpha) {
  alpha = Number(alpha.toFixed(3));
  return `<radialGradient id="${id}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${colour}" stop-opacity="${alpha}"/>
      <stop offset="70%" stop-color="${colour}" stop-opacity="0"/>
    </radialGradient>`;
}

/** A bed: a ground, three blooms in the brand pair, and — where the surface
 *  asks for them — the ruled measure that gives the blur an edge to bend.
 *  The geometry mirrors the CSS in the component, percentage for percentage. */
function bed({ ground, accent, depth, rule, ruled, intensity = 1 }) {
  const rules = ruled
    ? `<pattern id="rules" width="72" height="${H}" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="1" height="${H}" fill="${rule}" fill-opacity="0.08"/>
    </pattern>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff" stop-opacity="0"/>
      <stop offset="22%" stop-color="#fff" stop-opacity="1"/>
      <stop offset="78%" stop-color="#fff" stop-opacity="1"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <mask id="fadeMask"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>`
    : '';
  const ruleLayer = ruled
    ? `<rect width="${W}" height="${H}" fill="url(#rules)" mask="url(#fadeMask)"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
  <defs>
    ${bloom('b1', accent, 0.34 * intensity)}
    ${bloom('b2', depth, 0.3 * intensity)}
    ${bloom('b3', accent, 0.18 * intensity)}
    ${rules}
  </defs>
  <rect width="${W}" height="${H}" fill="${ground}"/>
  <ellipse cx="16%" cy="20%" rx="58%" ry="52%" fill="url(#b1)"/>
  <ellipse cx="88%" cy="36%" rx="48%" ry="58%" fill="url(#b2)"/>
  <ellipse cx="54%" cy="98%" rx="66%" ry="48%" fill="url(#b3)"/>
  ${ruleLayer}
</svg>
`;
}

mkdirSync(OUT, { recursive: true });
for (const theme of ['dark', 'light']) {
  const t = tokens(theme);
  const plates = {
    // The tools sit on the page's own ground, and quieter: the rows are a
    // list to read, not a statement.
    products: bed({ ground: t('bg-canvas'), accent: t('accent-default'), depth: t('accent-depth'), rule: t('text-primary'), ruled: false, intensity: 0.45 }),
    // The method's substance is TRANSLUCENT, so this plate is read through it
    // rather than beside it. Ruled, because a goo mass laid over pure gradients
    // shows nothing moving through — the rules are what make the drift legible.
    method: bed({ ground: t('bg-canvas'), accent: t('accent-depth'), depth: t('accent-default'), rule: t('text-primary'), ruled: true, intensity: 0.7 }),
  };
  for (const [name, svg] of Object.entries(plates)) {
    writeFileSync(`${OUT}/${name}-${theme}.svg`, svg);
    console.log(`${OUT}/${name}-${theme}.svg`);
  }
}
