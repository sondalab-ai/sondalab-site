#!/usr/bin/env node
// Rendered-page checks for the stance section, against a served build.
// Usage: node scripts/stance-probe.mjs http://localhost:4321
import { createProbe, inkOf as inkAll, textContrast, sleep } from './probe-kit.mjs';

const probe = await createProbe(process.argv[2], 'stance-probe.mjs');
const { report } = probe;
const CANVAS = '#approach canvas.sscene';
const open = (theme, width = 1440) => probe.open(theme, width, '#approach .triptych');
const inkOf = (page) => inkAll(page, CANVAS);

for (const theme of ['dark', 'light']) {
  const page = await open(theme);
  (await inkOf(page)).forEach((v, i) => report(v.n > 1500, `${theme}: vignette ${i + 1} draws ${v.n} lit pixels`));
  // The stance band is paper in the dark theme and ink in the light one; the
  // dots must be the band's ink, not the page's.
  const inkVsBand = await page.$$eval(CANVAS, (cs) => cs.map((c) => [getComputedStyle(c).color, getComputedStyle(c.closest('.sl-invert')).color]));
  report(inkVsBand.every(([a, b]) => a === b), `${theme}: vignettes take the band's ink (${inkVsBand[0][0]})`);
  for (const sel of ['#approach .panel__verb', '#approach .panel__body', '#approach .panel__n']) {
    const r = await textContrast(page, sel);
    report(r >= 4.5, `${theme}: ${sel} p5 ${r.toFixed(2)}:1`);
  }
  await page.close();
}

{
  const page = await open('dark');
  const before = (await inkOf(page)).map((v) => v.mean);
  await page.evaluate(() => document.documentElement.setAttribute('data-sl-theme', 'light'));
  await sleep(400);
  const after = (await inkOf(page)).map((v) => v.mean);
  report(before.every((b, i) => after[i] > b + 0.3), `theme switch re-inks the dots without reload (mean ${before.map((v) => v.toFixed(2))} → ${after.map((v) => v.toFixed(2))})`);
  await page.evaluate(() => document.documentElement.setAttribute('data-sl-theme', 'high-contrast'));
  report(await page.$$eval(CANVAS, (cs) => cs.every((c) => getComputedStyle(c).display === 'none')), 'high contrast hides the vignettes');
  await page.close();
}

for (const width of [768, 1024]) {
  // Rows: each scene sits beside its words, at full size.
  const page = await open('dark', width);
  const w = await page.$$eval(CANVAS, (cs) => Math.min(...cs.map((c) => c.getBoundingClientRect().width)));
  report(w >= 280, `${width}px: smallest vignette ${Math.round(w)}px >= 280`);
  const beside = await page.$$eval('#approach .panel', (ps) => ps.every((p) => p.querySelector('canvas').getBoundingClientRect().right <= p.querySelector('.panel__verb').getBoundingClientRect().left));
  report(beside, `${width}px: each scene sits beside its words`);
  await page.close();
}

for (const width of [1280, 1440]) {
  const page = await open('dark', width);
  const rows = await page.$$eval('#approach .panel', (ps) => ps.map((p) => ['.panel__n', '.panel__verb', '.panel__body'].map((s) => Math.round(p.querySelector(s).getBoundingClientRect().y))));
  const aligned = rows.every((r) => r.every((y, k) => y === rows[0][k]));
  report(aligned, `${width}px: number, verb and body line up across the three panels (${rows.map((r) => r.join('/')).join(', ')})`);
  // A photo in dots stops reading below ~300px (docs/memory, halftone legibility).
  const w = await page.$$eval(CANVAS, (cs) => Math.min(...cs.map((c) => c.getBoundingClientRect().width)));
  report(w >= 280, `${width}px: smallest vignette ${Math.round(w)}px >= 280`);
  await page.close();
}

{
  const page = await open('dark', 390);
  const w = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  report(w[0] <= w[1], `390px: scrollWidth ${w[0]} <= ${w[1]}`);
  await page.close();
}

await probe.done();
