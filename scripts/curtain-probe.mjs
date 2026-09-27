#!/usr/bin/env node
// Fails when an aurora's curtains are painted in their own ground's colour.
//
// The kit declares the curtain colour on the seated glow's ::before/::after,
// per PAGE theme: white light on ink, ink folds on paper. An inversion band
// flips its ground locally and the kit cannot see that, so inside the band the
// curtains can come out the colour of the band — present in the DOM, invisible
// on screen, and green on every CSS-text gate. On kit 0.17.0 the dark theme's
// stance band painted #DAE3E4 curtains on a #DAE3E4 band.
//
// So the curtain's first colour stop is compared against the band's own
// background, alpha ignored: a hue the ground cannot separate from itself at
// full strength carries nothing at 20-45%.
//
// Usage: node scripts/curtain-probe.mjs <url>   (e.g. http://localhost:4321/)
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const url = process.argv[2];
/** Below this, the curtain and its band are the same colour to a reader. */
const MIN_RATIO = 3;

if (!url) {
  console.error('usage: curtain-probe.mjs <url>');
  process.exit(2);
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
let failed = false;
for (const theme of ['dark', 'light']) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluateOnNewDocument((t) => localStorage.setItem('sl-theme', t), theme);
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('.sl-invert .sl-fx-aurora__glow[data-sl-fx-pillars]', { timeout: 10000 });
  const rows = await page.evaluate(() => {
    /** Resolve any CSS colour to 8-bit sRGB by painting it. */
    const ctx = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d');
    const rgb = (c) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)];
    };
    const opaque = (c) => c.replace(/\s*\/\s*[\d.]+\)/, ')').replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, 'rgb($1,$2,$3)');
    return [...document.querySelectorAll('.sl-invert .sl-fx-aurora__glow[data-sl-fx-pillars]')].map((glow) => {
      const band = glow.closest('.sl-invert');
      const stop = getComputedStyle(glow, '::before').backgroundImage.match(/(color\([^)]*\)|rgba?\([^)]*\)|oklch\([^)]*\))/);
      return { band: rgb(getComputedStyle(band).backgroundColor), curtain: stop ? rgb(opaque(stop[1])) : null };
    });
  });
  const lum = ([r, g, b]) => {
    const f = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  for (const [i, { band, curtain }] of rows.entries()) {
    if (!curtain) {
      console.log(`${theme} glow ${i}: no curtain gradient`);
      failed = true;
      continue;
    }
    const [hi, lo] = [lum(band), lum(curtain)].sort((a, b) => b - a);
    const ratio = (hi + 0.05) / (lo + 0.05);
    const ok = ratio >= MIN_RATIO;
    failed ||= !ok;
    console.log(`${theme} glow ${i}: curtain rgb(${curtain}) on band rgb(${band}) = ${ratio.toFixed(2)}:1 ${ok ? 'ok' : 'FAIL'}`);
  }
  await page.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
