#!/usr/bin/env node
// No page scrolls sideways at any common width: a sweep of the main pages
// against a served build. Found by it first: the header's full nav overflowed
// every width from ~545 to ~800px.
// Usage: node scripts/layout-probe.mjs http://localhost:4321
import { createProbe } from './probe-kit.mjs';
import { luminance, ratio } from './contrast-math.mjs';

const BASE = process.argv[2];
const probe = await createProbe(BASE, 'layout-probe.mjs');
const { browser, report } = probe;
const PAGES = ['/', '/blog/', '/blog/there-is-no-fix-for-prompt-injection/', '/apparel/', '/products/spexr/', '/products/daos/', '/products/ads/', '/daos/', '/ads/', '/ads/docs/', '/ads/docs/getting-started/', '/ads/docs/everyday-use/', '/ads/docs/how-changes-land/', '/ads/docs/approvals-and-undo/', '/ads/docs/status-api/', '/design-system/'];
const WIDTHS = [360, 390, 480, 560, 640, 720, 768, 820, 900, 1024, 1280, 1440];

for (const path of PAGES) {
  const page = await browser.newPage();
  const over = [];
  for (const width of WIDTHS) {
    await page.setViewport({ width, height: 800 });
    await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
    const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    if (sw > iw) over.push(`${width}px→${sw}`);
  }
  report(over.length === 0, `${path}: no horizontal scroll at ${WIDTHS.length} widths${over.length ? ` (overflows at ${over.join(', ')})` : ''}`);
  await page.close();
}

// The ink blocks (transcripts and docs examples) must stay readable in both
// themes, sl-invert bands included: the kit re-derives --slc-text in a band
// and once left a block's text and ground the same colour. Each colour is
// painted on a 1x1 canvas to read its sRGB bytes, whatever form the computed
// value takes (color-mix, oklch).
const INK_PAGES = ['/ads/', '/ads/docs/getting-started/', '/ads/docs/status-api/'];
for (const theme of ['light', 'dark']) {
  for (const path of INK_PAGES) {
    const page = await browser.newPage();
    await page.evaluateOnNewDocument((t) => localStorage.setItem('sl-theme', t), theme);
    await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
    const blocks = await page.evaluate(() => {
      const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
      const rgb = (css) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = css; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)]; };
      return [...document.querySelectorAll('pre.ink-pre, .ads-doc pre')].map((pre) => {
        const bg = rgb(getComputedStyle(pre).backgroundColor);
        const inks = [pre, ...pre.querySelectorAll('span')].map((e) => rgb(getComputedStyle(e).color));
        return { label: pre.getAttribute('aria-label') ?? pre.textContent.slice(0, 30), bg, inks };
      });
    });
    const low = [];
    for (const b of blocks) {
      const worst = Math.min(...b.inks.map((c) => ratio(luminance(c), luminance(b.bg))));
      if (!(worst >= 4.5)) low.push(`"${b.label}" ${worst.toFixed(2)}:1`);
    }
    report(blocks.length > 0 && low.length === 0, `${path} (${theme}): ${blocks.length} ink blocks at 4.5:1 or more${low.length ? ` (low: ${low.join('; ')})` : ''}`);
    await page.close();
  }
}

await probe.done();
