#!/usr/bin/env node
// Rendered-page checks for the DAOS page (/daos/), against a served build: it
// reads without JavaScript, picks the browser's language, remembers a pick,
// swaps every run, keeps the switch still, and the hero underline clears the
// next line in every language.
// Usage: node scripts/daos-probe.mjs http://localhost:4321
import { createProbe, sleep } from './probe-kit.mjs';
import { DAOS_I18N, DAOS_LANGS, DAOS_LANG_KEY } from '../src/lib/daos-i18n.ts';

const BASE = process.argv[2];
const probe = await createProbe(BASE, 'daos-probe.mjs');
const { browser, report } = probe;
const URL = `${BASE}/daos/`;

/** Opens /daos/ with the browser reporting `languages`, optionally with a remembered pick. */
async function open({ languages = ['en-US', 'en'], stored = null, js = true, width = 1440 } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900 });
  await page.setJavaScriptEnabled(js);
  await page.evaluateOnNewDocument((langs, key, value) => {
    Object.defineProperty(navigator, 'languages', { get: () => langs });
    Object.defineProperty(navigator, 'language', { get: () => langs[0] });
    if (value) localStorage.setItem(key, value);
  }, languages, DAOS_LANG_KEY, stored);
  await page.goto(URL, { waitUntil: 'load' });
  await sleep(300);
  return page;
}

const state = (page) => page.evaluate((key) => ({
  lang: document.documentElement.lang,
  pressed: [...document.querySelectorAll('[data-daos-lang][aria-pressed="true"]')].map((b) => b.dataset.daosLang),
  stored: (() => { try { return localStorage.getItem(key); } catch { return 'blocked'; } })(),
}), DAOS_LANG_KEY);

/** How many runs differ from `lang`'s dictionary, both sides through the same serialiser. */
const mismatches = (page, lang) => page.evaluate((dict) => {
  const t = document.createElement('template');
  return [...document.querySelectorAll('[data-i18n]')].filter((n) => {
    t.innerHTML = dict[n.dataset.i18n] ?? '∅';
    return t.innerHTML !== n.innerHTML;
  }).map((n) => n.dataset.i18n);
}, DAOS_I18N[lang]);

{
  const page = await open({ js: false, languages: ['it-IT'] });
  const r = await page.evaluate(() => ({
    empty: [...document.querySelectorAll('[data-i18n]')].filter((n) => !n.textContent.trim()).length,
    runs: document.querySelectorAll('[data-i18n]').length,
    hidden: [...document.querySelectorAll('.case, .vrow, .canon')].filter((n) => getComputedStyle(n).opacity !== '1').length,
    lang: document.documentElement.lang,
  }));
  report(r.runs > 100 && r.empty === 0, `no JS: ${r.runs} runs, all with English text`);
  report(r.hidden === 0, `no JS: every reveal target is visible (${r.hidden} hidden)`);
  report(r.lang === 'en' && (await mismatches(page, 'en')).length === 0, 'no JS: the page is the English dictionary, lang="en"');
  await page.close();
}

{
  const page = await open();
  const s = await state(page);
  report(s.lang === 'en' && s.pressed.join() === 'en', `English browser: lang ${s.lang}, pressed ${s.pressed}`);
  report(s.stored === null, 'nothing is remembered until the visitor picks');
  await page.close();
}

for (const [languages, want] of [[['it-IT', 'en'], 'it'], [['fr-FR', 'es-MX'], 'es'], [['de'], 'de'], [['pt-BR', 'ja'], 'en']]) {
  const page = await open({ languages });
  const s = await state(page);
  const off = await mismatches(page, want);
  report(s.lang === want && s.pressed.join() === want && off.length === 0, `browser ${languages.join(',')} → ${want} (lang ${s.lang}, ${off.length} runs off${off.length ? `: ${off.slice(0, 3)}` : ''})`);
  await page.close();
}

{
  const page = await open({ languages: ['it-IT'] });
  const sw = () => page.$eval('.daos-lang', (e) => { const r = e.getBoundingClientRect(); return `${r.x},${r.y},${r.width},${r.height}`; });
  const at = await sw();
  const moved = [];
  for (const lang of DAOS_LANGS) {
    await page.click(`[data-daos-lang="${lang}"]`);
    await sleep(50);
    const s = await state(page);
    const off = await mismatches(page, lang);
    report(s.lang === lang && s.stored === lang && off.length === 0, `click ${lang}: lang ${s.lang}, remembered ${s.stored}, ${off.length} runs off`);
    if ((await sw()) !== at) moved.push(lang);
  }
  report(moved.length === 0, `the switch does not move across languages${moved.length ? ` (moved on ${moved})` : ''}`);
  await page.close();
}

{
  const page = await open({ languages: ['it-IT'], stored: 'de' });
  report((await state(page)).lang === 'de', 'a remembered pick wins over the browser on the next visit');
  await page.close();
}

// The underline is drawn below the baseline at the kit's solid display leading
// (line-height 1), so it has to end above the next line's capitals:
// gap = next baseline - cap height - (baseline + offset + thickness).
for (const width of [1440, 390]) {
  for (const lang of DAOS_LANGS) {
    const page = await open({ stored: lang, width });
    const g = await page.$eval('.hero h1', (h1) => {
      const id = h1.querySelector('.id');
      const cs = getComputedStyle(id);
      const hs = getComputedStyle(h1);
      const mark = Object.assign(document.createElement('span'), { style: 'display:inline-block;width:0;height:0;vertical-align:baseline' });
      id.append(mark);
      const baseline = mark.getBoundingClientRect().bottom;
      mark.remove();
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.font = `${hs.fontWeight} ${hs.fontSize} ${hs.fontFamily}`;
      const cap = ctx.measureText('H').actualBoundingBoxAscent;
      const lh = parseFloat(hs.lineHeight);
      const under = parseFloat(cs.textUnderlineOffset) + parseFloat(cs.textDecorationThickness);
      return { gap: lh - cap - under, solid: Math.abs(lh - parseFloat(hs.fontSize)) < 0.5, baseline };
    });
    report(g.solid && g.gap > 0, `${width}px ${lang}: underline clears the next line by ${g.gap.toFixed(1)}px at line-height 1`);
    await page.close();
  }
}

// layout-probe sweeps the page in English only, and German runs longest. A
// word wider than its cell spills without growing the document, so every box
// in the page is checked too; the code blocks scroll and the pinned values
// ellipsize by design, so only boxes that let content overflow visibly count.
const WIDTHS = [360, 390, 480, 560, 640, 720, 768, 820, 900, 1024, 1280, 1440];
for (const lang of DAOS_LANGS) {
  const page = await open({ stored: lang, width: WIDTHS[0] });
  const bad = [];
  for (const width of WIDTHS) {
    await page.setViewport({ width, height: 900 });
    await sleep(80);
    const r = await page.evaluate(() => {
      const spill = [...document.querySelectorAll('.daos *')].filter((e) => {
        const cs = getComputedStyle(e);
        return cs.display !== 'inline' && cs.overflowX === 'visible' && e.scrollWidth > e.clientWidth + 1;
      }).map((e) => e.className || e.tagName);
      return { sw: document.documentElement.scrollWidth, iw: innerWidth, spill };
    });
    if (r.sw > r.iw || r.spill.length) bad.push(`${width}px→${r.sw > r.iw ? `scroll ${r.sw}` : ''}${r.spill.length ? ` spill ${r.spill.slice(0, 2).join(', ')}` : ''}`);
  }
  report(bad.length === 0, `${lang}: no horizontal scroll and no spilling box at ${WIDTHS.length} widths${bad.length ? ` (${bad.join('; ')})` : ''}`);
  await page.close();
}

await probe.done();
