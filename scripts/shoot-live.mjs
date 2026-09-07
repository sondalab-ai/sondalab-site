// Photographs a page with the GPU tube actually running — the counterpart to
// shoot-fallback.mjs, which removes WebGPU on purpose to catch the state most
// visitors are in.
//
// Both are needed and neither substitutes for the other. The fallback shot shows
// the flat composite, which is built from the plates and knows nothing about the
// runtime gains or the shader's tonemap; judging brightness or vignette from it
// is how a plate set gets approved and then ships looking wrong. This one shows
// what is on the glass.
//
// Headless Chrome needs asking for WebGPU explicitly, hence the flags. The
// script reports whether the canvas actually came up, so a silent fall back to
// the flat image cannot be mistaken for a live shot.
//
// Usage:
//   node scripts/shoot-live.mjs http://localhost:4321/blog/ blog
//   node scripts/shoot-live.mjs http://localhost:4321/ home 3440 1000
import puppeteer from 'puppeteer-core';

const URL = process.argv[2];
const NAME = process.argv[3];
const WIDTH = Number(process.argv[4] ?? 1440);
const HEIGHT = Number(process.argv[5] ?? 900);

if (!URL || !NAME) {
  console.error('usage: shoot-live.mjs <url> <name> [width] [height]');
  process.exit(2);
}

/** Long enough for the plates to decode and the terminal to type a chapter in. */
const SETTLE_MS = 6000;

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: [
    '--no-sandbox',
    '--hide-scrollbars',
    '--enable-unsafe-webgpu',
    '--use-angle=metal',
    '--enable-features=Vulkan,WebGPU',
  ],
});

for (const theme of ['dark', 'light']) {
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument((t) => {
    try {
      localStorage.setItem('sl-theme', t);
    } catch {}
  }, theme);
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, SETTLE_MS));

  const live = await page.evaluate(
    () => Boolean(navigator.gpu) && Boolean(document.querySelector('canvas')),
  );
  const path = `.audit/${NAME}-live-${theme}.png`;
  await page.screenshot({ path });
  console.log(`live ${theme} → ${path}${live ? '' : '  (no GPU canvas — this is the fallback)'}`);
  await page.close();
}

await browser.close();
