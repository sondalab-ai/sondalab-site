#!/usr/bin/env node
// Builds the flattened composite every visitor downloads, from whatever plates
// are currently in public/scenes/<scene>/.
//
// This is the script that makes "swap the artwork, change no code" true: drop
// new plates over the old files, run this, and the fallback picture is rebuilt
// with the same compositing rules the runtime uses — emissive planes added,
// occluders subtracted, background filled in underneath. The plane list and
// which plane is an occluder come from src/lib/scenes.json, the same file the
// site reads, so the two can never disagree.
//
// Usage: node scripts/make-scene-flats.mjs [scene ...]
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/** Composite size. The plates are 2048x1152; the fallback does not need that. */
const W = 1600;
const H = 900;

const SCENES = JSON.parse(readFileSync('src/lib/scenes.json', 'utf8'));
const wanted = process.argv.slice(2);
const ids = wanted.length ? wanted : Object.keys(SCENES);

const missing = [];
for (const id of ids) {
  if (!SCENES[id]) {
    console.error(`unknown scene: ${id}`);
    process.exit(2);
  }
  for (const layer of SCENES[id].layers) {
    const path = `public${layer.src}`;
    if (!existsSync(path)) missing.push(path);
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

for (const id of ids) {
  const layers = SCENES[id].layers.map((layer) => ({
    src: `data:image/webp;base64,${readFileSync(`public${layer.src}`).toString('base64')}`,
    occluder: layer.tone === 'occluder',
  }));

  const dataUrl = await page.evaluate(
    (l, w, h, q) => window.flatten(l, w, h, q),
    layers,
    W,
    H,
    0.8,
  );
  const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
  writeFileSync(`src/assets/scenes/${id}-flat.webp`, buf);
  console.log(`src/assets/scenes/${id}-flat.webp  ${(buf.length / 1024).toFixed(1)}KB`);
}

await browser.close();
