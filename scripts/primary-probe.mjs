#!/usr/bin/env node
// Label contrast of each product page's primary button, at rest, hovered and
// pressed, as glass (the effects layer built) and opaque (data-sl-fx="off",
// the kill switch), in both themes, against a served build.
//
// The primary takes the product's --slc-accent-fill (ui-kit 0.32) and the kit
// derives its label, hover and press from it on the control. On glass the kit
// re-picks the label from the pane's composite, so the two modes differ.
// A page without a public repo has no primary; the same button is put in
// before the effects layer mounts, so every product's fill is measured, and
// its rows are marked "injected".
//
// The label's own text node is measured: the button's range also spans the
// glass layers mount() puts inside it. Captures stay inside the viewport,
// because the aside is sticky and a beyond-viewport capture re-lays it out.
// Gates on the 5th percentile, failing closed (contrast-math.mjs).
//
// Usage: node scripts/primary-probe.mjs http://localhost:4321
import { readdirSync } from 'node:fs';
import { belowFloor, contrastStats, inkFromPaints, readTextInk } from './contrast-math.mjs';
import { createProbe, decodePng, sleep } from './probe-kit.mjs';

const BASE = process.argv[2];
const probe = await createProbe(BASE, 'primary-probe.mjs');
const { browser, report } = probe;
const PRODUCTS = readdirSync('src/content/products').filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, '')).sort();
const SEL = '.product__aside .sl-btn--primary';
const FLOOR = 4.5;

const hex = (c) => `#${c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

/** Opens a product page in `theme`, opaque or glass, with a primary in its aside. */
async function open(product, theme, opaque) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluateOnNewDocument((t, off) => {
    localStorage.setItem('sl-theme', t);
    // 'interactive': the tree exists and the module that calls mount() has
    // not run. On <body>, since mount() writes data-sl-fx="on" on <html>.
    document.addEventListener('readystatechange', () => {
      if (document.readyState !== 'interactive') return;
      if (off) document.body.setAttribute('data-sl-fx', 'off');
      if (document.querySelector('.product__aside .sl-btn--primary')) return;
      const a = document.createElement('a');
      a.className = 'sl-btn sl-btn--primary sl-fx-glass sl-fx-glass--pane sl-fx-press sl-fx-aurora sl-fx-aurora--rim';
      a.href = '#';
      a.textContent = 'Source on GitHub';
      a.dataset.injected = '';
      document.querySelector('.product__aside')?.append(a);
    });
  }, theme, opaque);
  await page.goto(`${BASE}/products/${product}/`, { waitUntil: 'load' });
  await sleep(2500);
  return page;
}

/** The label's contrast in the state the pointer has put the button in. */
async function measure(page, el) {
  const paints = await el.evaluate(readTextInk);
  const ink = inkFromPaints(paints.overBlack, paints.overWhite, paints.opacity);
  await el.evaluate((e) => { e.style.webkitTextFillColor = 'transparent'; });
  await sleep(120);
  const clip = await el.evaluate((e) => {
    const t = [...e.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
    const r = document.createRange();
    r.selectNodeContents(t);
    const b = r.getBoundingClientRect();
    return { x: b.x + scrollX, y: b.y + scrollY, width: b.width, height: b.height };
  });
  const shot = await page.screenshot({ clip, encoding: 'base64', captureBeyondViewport: false });
  await el.evaluate((e) => { e.style.webkitTextFillColor = ''; });
  return { ink: hex(ink), stats: contrastStats(ink, await decodePng(page, shot)) };
}

const rows = [];
for (const product of PRODUCTS) {
  for (const theme of ['dark', 'light']) {
    for (const opaque of [false, true]) {
      const page = await open(product, theme, opaque);
      const el = await page.$(SEL);
      await el.evaluate((e) => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await sleep(1200);
      const injected = await el.evaluate((e) => 'injected' in e.dataset);
      const center = await el.evaluate((e) => { const b = e.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; });
      await page.mouse.move(5, 5);
      await sleep(900);
      const rest = await measure(page, el);
      // Hover lets the ink sweep (about a second) settle; press holds the button.
      await page.mouse.move(...center);
      await sleep(1600);
      const hover = await measure(page, el);
      await page.mouse.down();
      await sleep(600);
      const press = await measure(page, el);
      await page.mouse.up();
      await page.close();
      const mode = opaque ? 'opaque' : 'glass';
      const name = `${product}${injected ? ' (injected)' : ''}`;
      rows.push({ name, theme, mode, rest, hover, press });
      for (const [state, m] of Object.entries({ rest, hover, press })) {
        report(!belowFloor(m.stats, FLOOR), `${name} ${theme} ${mode} ${state}: label ${m.ink} p5 ${m.stats.p5.toFixed(2)}:1`);
      }
    }
  }
}

const cell = (m) => `${m.stats.p5.toFixed(2)}${belowFloor(m.stats, FLOOR) ? ' (below)' : ''}`;
console.log('\n| Product | Theme | Mode | Rest | Hover | Press | Label |\n|---|---|---|---|---|---|---|');
for (const r of rows) console.log(`| ${r.name} | ${r.theme} | ${r.mode} | ${cell(r.rest)} | ${cell(r.hover)} | ${cell(r.press)} | ${r.rest.ink} |`);
await probe.done();
