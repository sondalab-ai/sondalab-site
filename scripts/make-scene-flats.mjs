#!/usr/bin/env node
// Builds the flattened composites every visitor downloads, from whatever plates
// are currently in public/scenes/<scene>/.
//
// This is the script that makes "swap the artwork, change no code" true: drop
// new plates over the old files, run this, and the fallback picture is rebuilt
// with the same compositing rules the runtime uses — emissive planes added,
// occluders subtracted, background filled in underneath. The plane list and
// which plane is an occluder come from src/lib/scenes.json, the same file the
// site reads, so the two can never disagree.
//
// A scene with a `light` set gets a second composite, built with the paper rules
// instead of the emissive ones, because the two polarities are different
// pictures and not one picture at two brightnesses.
//
// Usage: node scripts/make-scene-flats.mjs [scene ...]
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/** Composite size. The plates are 2048x1152; the fallback does not need that. */
const W = 1600;
const H = 900;

/** The light theme, as the design system defines it. */
const THEME_CSS = 'node_modules/@sondalab/ui-kit/themes/light.css';

/**
 * The paper colours, read from the theme rather than copied.
 *
 * The compositing runs in a headless page with none of the site's CSS, so it
 * cannot resolve a token; these are the values it is handed. `wash` is the ink
 * every plane but the occluder is laid down in, held under full strength for the
 * same reason crt-scene.ts holds it — several planes of solid ink stacked on
 * paper reach the value of the type that has to be read over them.
 */
function paperInk() {
  const css = readFileSync(THEME_CSS, 'utf8');
  const token = (name) => {
    const found = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`));
    if (!found) {
      console.error(`${THEME_CSS} has no --${name} — the theme has been restructured`);
      process.exit(1);
    }
    return found[1];
  };
  const ground = token('sl-bg-canvas');
  const ink = token('sl-text-primary');
  return { ground, ink, wash: mix(ink, ground, 0.72) };
}

/** `a` over `b`, `k` of the way towards `a`. Both must be #rrggbb. */
function mix(a, b, k) {
  const parse = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const [x, y] = [parse(a), parse(b)];
  const out = x.map((v, i) => Math.round(v * k + y[i] * (1 - k)));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

const SCENES = JSON.parse(readFileSync('src/lib/scenes.json', 'utf8'));
const wanted = process.argv.slice(2);
const ids = wanted.length ? wanted : Object.keys(SCENES);

for (const id of ids) {
  if (!SCENES[id]) {
    console.error(`unknown scene: ${id}`);
    process.exit(2);
  }
}

/**
 * What to build. The dark set is required — it is the fallback for every visitor
 * without WebGPU on either theme. The light set is skipped when its plates are
 * not on disk yet, because the runtime falls back to the dark artwork in exactly
 * the same case and a hard failure here would block the whole pipeline on an
 * hour of GPU that has not been spent.
 */
const jobs = [];
const missing = [];
for (const id of ids) {
  for (const [variant, planes] of [
    ['dark', SCENES[id].layers],
    ['light', SCENES[id].light ?? []],
  ]) {
    if (!planes.length) continue;
    const absent = planes.map((l) => `public${l.src}`).filter((p) => !existsSync(p));
    if (absent.length) {
      if (variant === 'dark') missing.push(...absent);
      else console.log(`${id}/light  skipped — ${absent.length} plate(s) not rendered yet`);
      continue;
    }
    jobs.push({ id, variant, planes });
  }
}
if (missing.length) {
  console.error('missing plates:\n  ' + missing.join('\n  '));
  process.exit(1);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.setContent('<canvas id="c"></canvas>');
await page.addScriptTag({ path: 'scripts/scene-painters.js' });

mkdirSync('src/assets/scenes', { recursive: true });

const paper = paperInk();

for (const job of jobs) {
  const layers = job.planes.map((layer) => ({
    src: `data:image/webp;base64,${readFileSync(`public${layer.src}`).toString('base64')}`,
    occluder: layer.tone === 'occluder',
  }));

  const dataUrl = await page.evaluate(
    (l, w, h, q, ink) => window.flatten(l, w, h, q, ink),
    layers,
    W,
    H,
    0.8,
    job.variant === 'light' ? paper : null,
  );
  const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
  const out = `src/assets/scenes/${job.id}-flat${job.variant === 'light' ? '-light' : ''}.webp`;
  writeFileSync(out, buf);
  console.log(`${out}  ${(buf.length / 1024).toFixed(1)}KB`);
}

await browser.close();
