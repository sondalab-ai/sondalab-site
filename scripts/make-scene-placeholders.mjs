#!/usr/bin/env node
// Draws stand-in artwork for the CRT scenes so the pipeline can be built and
// verified before the real layers exist.
//
// The output is deliberately crude — blocks, capsules, hatching — but it is the
// right *shape*: grayscale on black, one file per depth plane, at the dimensions
// and inside the luminance budget the finished art has to hit. Swapping the
// files changes no code.
//
// Chrome does the drawing because it is already a dependency (puppeteer-core
// drives scripts/shoot.mjs) and it encodes WebP; Node has no canvas of its own.
// The painters live in scripts/scene-painters.js and are injected as a real
// script file, so nothing here executes a string.
//
// Usage: node scripts/make-scene-placeholders.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/** Layer size: wider than any tube, so parallax has somewhere to slide. */
const W = 2048;
const H = 1152;

/**
 * Value is the luminance budget for the plane; `depth` is recorded here only so
 * the placeholders read the way the finished planes will. The list the site
 * actually uses — order, depth, tone, gain — lives in src/lib/scenes.json, and
 * the flattened composite is built from it by scripts/make-scene-flats.mjs.
 */
const SCENES = {
  // Street level, looking down a road at what is burning. Shares no painter with
  // `city`: two scenes built from the same generators read as one picture with a
  // different seed, which is exactly what happened the first time.
  uprising: [
    { name: '01-far', painter: 'fireGlow', depth: 0.06, a: { seed: 7, value: 0.3, haze: 0.07 } },
    { name: '02-mid', painter: 'barricade', depth: 0.22, a: { seed: 21, value: 0.34, slabs: 30, machines: 11 } },
    { name: '03-crowd', painter: 'crowd', depth: 0.55, a: { seed: 44, value: 0.95, count: 150 } },
    { name: '04-embers', painter: 'sparks', depth: 0.85, a: { seed: 91, value: 0.8, count: 220, streak: false } },
  ],
  // A rooftop over a dense skyline. Vertical where `uprising` is horizontal, and
  // seen from above where `uprising` is seen from the street.
  city: [
    { name: '01-far', painter: 'farSkyline', depth: 0.05, a: { seed: 3, value: 0.18, haze: 0.14 } },
    { name: '02-mid', painter: 'midTowers', depth: 0.2, a: { seed: 15, value: 0.34 } },
    { name: '03-near', painter: 'nearEdge', depth: 0.6, a: { seed: 62, value: 0.95, spikes: 26 } },
    { name: '04-rain', painter: 'sparks', depth: 0.9, a: { seed: 88, value: 0.34, count: 420, streak: true } },
  ],
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.setContent('<canvas id="c"></canvas>');
await page.addScriptTag({ path: 'scripts/scene-painters.js' });

const decode = (dataUrl) => Buffer.from(dataUrl.split(',')[1], 'base64');

for (const [scene, layers] of Object.entries(SCENES)) {
  const dir = `public/scenes/${scene}`;
  mkdirSync(dir, { recursive: true });

  for (const layer of layers) {
    const dataUrl = await page.evaluate(
      (p, w, h, a, q) => window.paintLayer(p, w, h, a, q),
      layer.painter,
      W,
      H,
      layer.a,
      0.9,
    );
    const buf = decode(dataUrl);
    writeFileSync(`${dir}/${layer.name}.webp`, buf);
    console.log(`${dir}/${layer.name}.webp  ${(buf.length / 1024).toFixed(1)}KB`);
  }
}

console.log('\nnow run: node scripts/make-scene-flats.mjs');

await browser.close();
