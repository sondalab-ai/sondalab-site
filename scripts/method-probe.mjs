#!/usr/bin/env node
// Rendered-page checks for the method section, against a served build.
// Usage: node scripts/method-probe.mjs http://localhost:4392
import { createProbe, inkOf as inkAll, snapshot as snapAll, textContrast, sleep } from './probe-kit.mjs';

const BASE = process.argv[2];
const probe = await createProbe(BASE, 'method-probe.mjs');
const { browser, report } = probe;
const open = (theme, width = 1440) => probe.open(theme, width, '#method .rail');
const inkOf = (page) => inkAll(page, '#method canvas.mscene');
const snapshot = (page) => snapAll(page, '#method canvas.mscene');

for (const theme of ['dark', 'light']) {
  const page = await open(theme);
  const ink = await inkOf(page);
  ink.forEach((v, i) => report(v.n > 500, `${theme}: vignette ${i + 1} draws ${v.n} lit pixels`));
  const geo = await page.$$eval('#method .rail__step', (lis) => {
    // The line is drawn per step (::after); every segment shares one x.
    const first = lis[0];
    const lb = getComputedStyle(first, '::after');
    const lineX = first.getBoundingClientRect().x + parseFloat(lb.left) + parseFloat(lb.width) / 2;
    return lis.map((li) => {
      const nb = getComputedStyle(li, '::before');
      const l = li.getBoundingClientRect();
      const lab = li.querySelector('.rail__n').getBoundingClientRect();
      return { dx: l.x + parseFloat(nb.left) + parseFloat(nb.width) / 2 - lineX, dy: l.y + parseFloat(nb.top) + parseFloat(nb.height) / 2 - (lab.y + lab.height / 2) };
    });
  });
  geo.forEach((g, i) => report(Math.abs(g.dx) <= 0.5 && Math.abs(g.dy) <= 0.5, `${theme}: node ${i + 1} on the line (dx ${g.dx.toFixed(2)}) and level with its label (dy ${g.dy.toFixed(2)})`));
  for (const sel of ['#method .rail__claim', '#method .rail__proof', '#method .rail__label']) {
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
  report(before.every((b, i) => after[i] < b - 0.3), `theme switch re-colours the dots without reload (mean ${before.map((v) => v.toFixed(2))} → ${after.map((v) => v.toFixed(2))})`);

  const a = await snapshot(page);
  await sleep(400);
  report(a !== (await snapshot(page)), 'in view: the vignettes keep moving');
  await page.evaluate(() => scrollTo(0, 0));
  await sleep(600);
  const c = await snapshot(page);
  await sleep(600);
  report(c === (await snapshot(page)), 'far out of view: the loop rests');

  await page.evaluate(() => document.documentElement.setAttribute('data-sl-theme', 'high-contrast'));
  const hidden = await page.$$eval('#method canvas.mscene', (cs) => cs.every((c) => getComputedStyle(c).display === 'none'));
  report(hidden, 'high contrast hides the vignettes');
  await page.close();
}

{
  // The rail runs from the first node to the last and no further.
  const page = await open('dark');
  const ends = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('#method .rail__step')].map((li) => {
      const nb = getComputedStyle(li, '::before');
      return li.getBoundingClientRect().y + parseFloat(nb.top) + parseFloat(nb.height) / 2;
    });
    const segs = [...document.querySelectorAll('#method .rail__step')].map((li) => {
      const a = getComputedStyle(li, '::after');
      if (a.content === 'none' || a.display === 'none') return null;
      const top = li.getBoundingClientRect().y + parseFloat(a.top);
      return [top, top + parseFloat(a.height)];
    }).filter(Boolean);
    const rail = document.querySelector('#method .rail');
    const rb = getComputedStyle(rail, '::before');
    const railLine = rb.content !== 'none' ? [rail.getBoundingClientRect().y + parseFloat(rb.top), rail.getBoundingClientRect().y + parseFloat(rb.top) + parseFloat(rb.height)] : null;
    const all = railLine ? [railLine] : segs;
    return { first: nodes[0], last: nodes[nodes.length - 1], top: Math.min(...all.map((s) => s[0])), bottom: Math.max(...all.map((s) => s[1])) };
  });
  report(Math.abs(ends.top - ends.first) <= 1 && Math.abs(ends.bottom - ends.last) <= 1, `rail spans node 1 to node 3 (line ${ends.top.toFixed(0)}–${ends.bottom.toFixed(0)}, nodes ${ends.first.toFixed(0)}–${ends.last.toFixed(0)})`);
  await page.close();
}

{
  // One image failing must not blank the other two.
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setRequestInterception(true);
  page.on('request', (r) => (r.url().includes('/work.') ? r.abort() : r.continue()));
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.$eval('#method .rail', (e) => e.scrollIntoView({ block: 'center' }));
  await sleep(3000);
  const lit = (await inkOf(page)).map((v) => v.n);
  report(lit[0] > 500 && lit[2] > 500, `a failed image leaves the others drawing (${lit.join(', ')} lit pixels)`);
  await page.close();
}

for (const width of [768, 900, 1024, 1280]) {
  const page = await open('dark', width);
  const w = await page.$$eval('#method .rail__text', (ts) => Math.min(...ts.map((e) => e.getBoundingClientRect().width)));
  report(w >= 260, `${width}px: narrowest promise text column ${Math.round(w)}px >= 260`);
  await page.close();
}

{
  const page = await open('dark', 390);
  const w = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  report(w[0] <= w[1], `390px: scrollWidth ${w[0]} <= ${w[1]}`);
  await page.close();
}

await probe.done();
