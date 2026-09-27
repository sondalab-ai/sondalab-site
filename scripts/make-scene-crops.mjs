#!/usr/bin/env node
// Cuts the dot-scene vignettes (the stance and the method) out of the dark
// scene renders.
//
// The renders live in .scenes-raw/, which is git-ignored, so the crops are
// committed and this script only needs re-running when a crop changes. The
// coordinates are on the render scaled to 900px wide, the scale the crops were
// chosen at (docs/specs/2026-09-26-method-section-design.md § Vignettes, and
// docs/specs/2026-09-27-stance-section-design.md).
// macOS only: it drives `sips`, like the rest of the art tooling assumes a Mac.
//
// Usage: node scripts/make-scene-crops.mjs [rawDir]   (default: .scenes-raw)
import { existsSync, mkdirSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const RAW = process.argv[2] ?? '.scenes-raw';
const SIZE = 288;
const GRAY = '/System/Library/ColorSync/Profiles/Generic Gray Gamma 2.2 Profile.icc';

/** output → [render, x, y, size] */
const CROPS = {
  'method/intent': ['kinship/dark/02-mid.png', 450, 50, 330],
  'method/work': ['kinship/dark/02-mid.png', 130, 70, 330],
  'method/check': ['uprising/dark/02-mid.png', 200, 170, 300],
  'stance/see': ['city/dark/02-mid.png', 514, 0, 386],
  'stance/steer': ['uprising/dark/01-far.png', 343, 0, 240],
  'stance/own': ['kinship/dark/01-far.png', 296, 103, 296],
};

if (!existsSync(RAW)) {
  console.error(`no ${RAW}/: pass the directory holding the raw scene renders`);
  process.exit(2);
}
const tmp = mkdtempSync(join(tmpdir(), 'method-crops-'));
const sips = (...args) => execFileSync('sips', args, { stdio: 'pipe' });

for (const [name, [render, x, y, s]] of Object.entries(CROPS)) {
  const work = join(tmp, `${name.replace('/', '-')}.png`);
  const out = join('src/assets', `${name}.png`);
  mkdirSync(dirname(out), { recursive: true });
  sips('-Z', '900', join(RAW, render), '--out', work);
  sips('-c', String(s), String(s), '--cropOffset', String(y), String(x), work, '--out', work);
  sips('-Z', String(SIZE), work, '--out', work);
  sips('-m', GRAY, '-s', 'format', 'png', work, '--out', out);
  console.log(`${out} ← ${render} (${x}, ${y}, ${s})`);
}
