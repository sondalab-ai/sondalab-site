#!/usr/bin/env node
// No page scrolls sideways at any common width: a sweep of the main pages
// against a served build. Found by it first: the header's full nav overflowed
// every width from ~545 to ~800px.
// Usage: node scripts/layout-probe.mjs http://localhost:4321
import { createProbe } from './probe-kit.mjs';

const BASE = process.argv[2];
const probe = await createProbe(BASE, 'layout-probe.mjs');
const { browser, report } = probe;
const PAGES = ['/', '/blog/', '/blog/there-is-no-fix-for-prompt-injection/', '/apparel/', '/products/spexr/'];
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

await probe.done();
