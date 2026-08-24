#!/usr/bin/env node
// Design-system compliance gate for the site's own styles.
//
// Collects every authored style (site.css + the <style> blocks inside .astro
// components) into one file and runs @sondalab/ui-kit's sl-audit against it as
// the `default` product on the Page substrate. A colour that does not resolve
// to a DS token or a registered accent fails the build (--fail-on R).
//
// Per-product accent hexes injected as inline `style="--row-accent-…"` live in
// HTML attributes, not in these <style> blocks, so they are intentionally out
// of scope here — they are registry data, not authored colour.

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  globSync,
} from 'node:fs';
import { execFileSync } from 'node:child_process';

const OUT = '.audit/css';
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const files = globSync('src/**/*.{css,astro}').sort();
let css = '';
for (const f of files) {
  const text = readFileSync(f, 'utf8');
  if (f.endsWith('.css')) {
    css += `\n/* ${f} */\n${text}\n`;
    continue;
  }
  const blocks = text.match(/<style[^>]*>[\s\S]*?<\/style>/g) || [];
  for (const b of blocks) {
    css += `\n/* ${f} */\n${b.replace(/<\/?style[^>]*>/g, '')}\n`;
  }
}
writeFileSync(`${OUT}/site.css`, css);

const audit = 'node_modules/@sondalab/ui-kit/agent/sl-audit.mjs';
execFileSync(
  'node',
  [
    audit,
    '--surface',
    `${OUT}/**/*.css`,
    '--product',
    'default',
    '--substrate',
    'Page',
    '--fail-on',
    'R',
  ],
  { stdio: 'inherit' },
);
