#!/usr/bin/env node
// Draws stand-in artwork for the CRT scenes so the pipeline can be built and
// verified before the real layers exist.
//
// The output is deliberately crude — blocks, capsules, hatching — but it is the
// right *shape*: grayscale on black, one file per depth plane, at the dimensions
// and inside the luminance budget the finished art has to hit. Swapping the
// files changes no code.
//
// It covers both polarities. The light set is not drawn differently — these are
// stand-ins and nobody is meant to look at them — but it is written to the paths
// the light plates will occupy, which is what makes the theme swap testable
// before an hour of GPU has been spent.
//
// Chrome does the drawing because it is already a dependency (puppeteer-core
// drives scripts/shoot.mjs) and it encodes WebP; Node has no canvas of its own.
// The painters live in scripts/scene-painters.js and are injected as a real
// script file, so nothing here executes a string.
//
// Usage:
//   node scripts/make-scene-placeholders.mjs
//   node scripts/make-scene-placeholders.mjs --variant light
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/** Layer size: wider than any tube, so parallax has somewhere to slide. */
const W = 2048;
const H = 1152;

/**
 * How to draw each plane, in the order the scene lists them.
 *
 * Only the drawing lives here. The filenames, the order, the depths and which
 * plane is an occluder come from src/lib/scenes.json — the same file the site
 * reads — so a plate renamed there does not silently keep an orphan stand-in on
 * disk.
 */
const PAINTERS = {
  // Street level, looking down a road at what is burning. Shares no painter with
  // `city`: two scenes built from the same generators read as one picture with a
  // different seed, which is exactly what happened the first time.
  uprising: [
    { painter: 'fireGlow', a: { seed: 7, value: 0.3, haze: 0.07 } },
    { painter: 'barricade', a: { seed: 21, value: 0.34, slabs: 30, machines: 11 } },
    { painter: 'crowd', a: { seed: 44, value: 0.95, count: 150 } },
    { painter: 'sparks', a: { seed: 91, value: 0.8, count: 220, streak: false } },
  ],
  // A rooftop over a dense skyline. Vertical where `uprising` is horizontal, and
  // seen from above where `uprising` is seen from the street.
  city: [
    { painter: 'farSkyline', a: { seed: 3, value: 0.18, haze: 0.14 } },
    { painter: 'midTowers', a: { seed: 15, value: 0.34 } },
    { painter: 'nearEdge', a: { seed: 62, value: 0.95, spikes: 26 } },
    { painter: 'sparks', a: { seed: 88, value: 0.34, count: 420, streak: true } },
  ],
  // An interior. There is no interior painter and there does not need to be —
  // the stand-in only has to be the right shape, the right value and in the
  // right file.
  kinship: [
    { painter: 'fireGlow', a: { seed: 33, value: 0.24, haze: 0.1 } },
    { painter: 'barricade', a: { seed: 51, value: 0.32, slabs: 12, machines: 4 } },
    { painter: 'nearEdge', a: { seed: 77, value: 0.95, spikes: 8 } },
    { painter: 'sparks', a: { seed: 12, value: 0.7, count: 90, streak: false } },
  ],
};

const SCENES = JSON.parse(readFileSync('src/lib/scenes.json', 'utf8'));

// Without a filter this overwrites every plate, real artwork included. That is
// the point of the script, but it is worth being able to say "only the set that
// does not exist yet" while the other one is finished work.
const at = process.argv.indexOf('--variant');
const ONLY = at === -1 ? null : process.argv[at + 1];
if (ONLY && ONLY !== 'dark' && ONLY !== 'light') {
  console.error(`unknown variant: ${ONLY} (dark | light)`);
  process.exit(2);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.setContent('<canvas id="c"></canvas>');
await page.addScriptTag({ path: 'scripts/scene-painters.js' });

const decode = (dataUrl) => Buffer.from(dataUrl.split(',')[1], 'base64');

for (const [scene, painters] of Object.entries(PAINTERS)) {
  const variants = [
    ['dark', SCENES[scene]?.layers ?? []],
    ['light', SCENES[scene]?.light ?? []],
  ];

  for (const [variant, planes] of variants) {
    if (ONLY && variant !== ONLY) continue;
    for (const [i, plane] of planes.entries()) {
      const spec = painters[i];
      if (!spec) {
        console.error(`${scene}/${variant} plane ${i} has no painter — add one to PAINTERS`);
        process.exit(1);
      }
      // A different seed per polarity, so a swap that silently kept the old set
      // is visible on screen rather than merely plausible.
      const a = { ...spec.a, seed: spec.a.seed + (variant === 'light' ? 500 : 0) };
      const dataUrl = await page.evaluate(
        (p, w, h, args, q) => window.paintLayer(p, w, h, args, q),
        spec.painter,
        W,
        H,
        a,
        0.9,
      );
      const buf = decode(dataUrl);
      const path = `public${plane.src}`;
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, buf);
      console.log(`${path}  ${(buf.length / 1024).toFixed(1)}KB`);
    }
  }
}

console.log('\nnow run: node scripts/make-scene-flats.mjs');

await browser.close();
