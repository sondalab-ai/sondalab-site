#!/usr/bin/env node
// Rendered-page checks for the method section, against a served build.
// Usage: node scripts/method-probe.mjs http://localhost:4392
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.argv[2];
if (!BASE) {
  console.error('usage: method-probe.mjs <baseUrl>');
  process.exit(2);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--hide-scrollbars'] });
let failed = false;
const report = (ok, msg) => { failed ||= !ok; console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`); };

async function open(theme, width = 1440) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900 });
  await page.evaluateOnNewDocument((t) => localStorage.setItem('sl-theme', t), theme);
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.$eval('#method .rail', (e) => e.scrollIntoView({ block: 'center' }));
  await sleep(3000);
  return page;
}

/** Lit pixel count and mean luminance of the lit pixels, per vignette. */
const inkOf = (page) => page.$$eval('#method canvas.mscene', (cs) => cs.map((c) => {
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let n = 0, sum = 0;
  for (let k = 0; k < d.length; k += 4) if (d[k + 3] > 40) { n++; sum += (0.2126 * d[k] + 0.7152 * d[k + 1] + 0.0722 * d[k + 2]) / 255; }
  return { n, mean: n ? sum / n : 0 };
}));
const snapshot = (page) => page.$$eval('#method canvas.mscene', (cs) => cs.map((c) => c.toDataURL()).join('|'));

/** 5th-percentile contrast of `selector`'s own text against what is behind it. */
async function textContrast(page, selector) {
  const el = await page.$(selector);
  await el.scrollIntoView();
  await sleep(200);
  const ink = await el.evaluate((e) => {
    const c = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d');
    c.fillStyle = getComputedStyle(e).color;
    c.fillRect(0, 0, 1, 1);
    const rgb = [...c.getImageData(0, 0, 1, 1).data.slice(0, 3)];
    e.style.color = 'transparent';
    return rgb;
  });
  const clip = await el.evaluate((e) => {
    const r = document.createRange();
    r.selectNodeContents(e);
    const b = r.getBoundingClientRect();
    return { x: b.x + scrollX, y: b.y + scrollY, width: b.width, height: b.height };
  });
  const shot = await page.screenshot({ clip, encoding: 'base64' });
  await el.evaluate((e) => { e.style.color = ''; });
  const px = await page.evaluate(async (s) => {
    const i = new Image();
    i.src = `data:image/png;base64,${s}`;
    await i.decode();
    const c = Object.assign(document.createElement('canvas'), { width: i.width, height: i.height }).getContext('2d');
    c.drawImage(i, 0, 0);
    return Array.from(c.getImageData(0, 0, i.width, i.height).data);
  }, shot);
  const lum = ([r, g, b]) => {
    const f = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const li = lum(ink);
  const ratios = [];
  for (let k = 0; k < px.length; k += 4) {
    const l = lum([px[k], px[k + 1], px[k + 2]]);
    ratios.push((Math.max(l, li) + 0.05) / (Math.min(l, li) + 0.05));
  }
  ratios.sort((a, b) => a - b);
  return ratios[Math.floor(0.05 * (ratios.length - 1))];
}

for (const theme of ['dark', 'light']) {
  const page = await open(theme);
  const ink = await inkOf(page);
  ink.forEach((v, i) => report(v.n > 500, `${theme}: vignette ${i + 1} draws ${v.n} lit pixels`));
  const geo = await page.$$eval('#method .rail__step', (lis) => {
    const rail = document.querySelector('#method .rail');
    const lb = getComputedStyle(rail, '::before');
    const lineX = rail.getBoundingClientRect().x + parseFloat(lb.left) + parseFloat(lb.width) / 2;
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

await browser.close();
process.exit(failed ? 1 : 0);
