#!/usr/bin/env node
// Measures the contrast of text that sits on a live surface, in both themes.
//
// A colour picked off a design-system token proves nothing once it is laid over
// a shader: the CRT's vignette, its glass reflections and the picture behind it
// all change the background under the words. So the background is *sampled*
// rather than assumed — the text is hidden, the region it occupied is
// photographed, and every pixel is compared against the text's own colour,
// composited over that pixel with the colour's alpha and the element's
// effective opacity (contrast-math.mjs). Read as opaque, a translucent ink
// (the kit's 60% muted text in an inversion band) measured as its full
// foreground and passed when it did not.
//
// Two modes:
//
//   node scripts/contrast-probe.mjs <url> <selector> [<selector> ...]
//     Named targets on one page, 1440px. Measures a Range over the element's
//     contents (a `::before` dash beside the words is not their ground) and
//     gates on the WORST pixel, the one a reader actually struggles with.
//
//   node scripts/contrast-probe.mjs <baseUrl> --all [<path> ...]
//       [--widths 1440,390] [--gpu on,off]
//     Every text element on every page reachable from `/` (or on the paths
//     given), both themes, at each width, with WebGPU on (the CRT surfaces)
//     and off (the fallback most visitors get). Gates on the 5th percentile of
//     each element's pixels and prints the worst beside it: across hundreds
//     of line boxes the worst pixel is a stray hairline or a photo's edge as
//     often as it is the ground. An element that cannot be measured fails.
//     A failure is measured a second time after a pause, since an ambient
//     glitch burst can land on a sample; one that passes the second time is
//     printed as a warning, one that fails twice as a failure. Failures the
//     old, opaque reading would have passed are marked NEW.
//     Not measured, and counted per reason: glass text (numerals cut out of
//     their pane, with a screen-reader copy), glitch shards, visually hidden
//     boxes, disabled controls (WCAG 1.4.3 exempts them), form controls, and
//     text never wholly in view and uncovered (a carousel's off-screen items).
//     A sticky element is measured where it first comes into view.
//     `npm run contrast:all -- <baseUrl>` runs the full matrix.
import puppeteer from 'puppeteer-core';
import { belowFloor, contrastStats, floorFor, inkFromPaints, readTextInk } from './contrast-math.mjs';
import { decodePng, sleep } from './probe-kit.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const THEMES = ['dark', 'light'];
const GPU_FLAGS = ['--enable-unsafe-webgpu', '--use-angle=metal', '--enable-features=Vulkan,WebGPU'];
// The sweep hides every glyph at once with this sheet, for one photograph per view.
const HIDE_ID = 'contrast-probe-hide';
const HIDE_CSS = '*, *::before, *::after { -webkit-text-fill-color: transparent !important; text-decoration-color: transparent !important; caret-color: transparent !important; }';

const argv = process.argv.slice(2);
const url = argv.find((a) => /^https?:/.test(a));
const flag = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : fallback;
};
const flagValues = new Set(['--widths', '--gpu'].flatMap((f) => (argv.includes(f) ? [flag(f)] : [])));
const positional = argv.filter((a) => a !== url && !a.startsWith('--') && !flagValues.has(a));
const sweepMode = argv.includes('--all');

if (!url || (!sweepMode && positional.length === 0)) {
  console.error('usage: contrast-probe.mjs <url> <selector> [...]\n       contrast-probe.mjs <baseUrl> --all [<path> ...] [--widths 1440,390] [--gpu on,off]');
  process.exit(2);
}

const launch = (gpu = true) => puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars', ...(gpu ? GPU_FLAGS : [])],
});
const browser = await launch();

const heightFor = (width) => (width > 500 ? 900 : 844);

async function openPage(target, { theme, width = 1440, gpu = true }, on = browser) {
  const page = await on.newPage();
  await page.setViewport({ width, height: heightFor(width), deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument((t, withGpu) => {
    try {
      localStorage.setItem('sl-theme', t);
    } catch {
      /* private mode; the default theme is fine for the measurement */
    }
    // Without WebGPU the site renders its fallback surfaces (the flat hero,
    // the static scenes), which is what most visitors see.
    if (!withGpu) Object.defineProperty(navigator, 'gpu', { get: () => undefined, configurable: true });
  }, theme, gpu);
  await page.goto(target, { waitUntil: 'networkidle0', timeout: 60000 });
  return page;
}

const ok = sweepMode ? await sweep(url.replace(/\/$/, ''), positional) : await targets(url, positional);
await browser.close();
process.exit(ok ? 0 : 1);

/** Named selectors on one page, worst pixel of a Range over each one's contents. */
async function targets(target, selectors) {
  let pass = true;
  for (const theme of THEMES) {
    const page = await openPage(target, { theme });
    // Let the surface come up and settle: a tube still fading in measures
    // better than the one the visitor ends up looking at.
    await sleep(6000);
    console.log(`\n── ${theme} ──`);

    for (const selector of selectors) {
      const el = await page.$(selector);
      if (!el) {
        console.log(`  FAIL  ${selector}: not found`);
        pass = false;
        continue;
      }
      await el.evaluate((e) => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await sleep(600);
      const info = await el.evaluate((e) => {
        const cs = getComputedStyle(e);
        const r = document.createRange();
        r.selectNodeContents(e);
        const b = r.getBoundingClientRect();
        return { fontSize: parseFloat(cs.fontSize), weight: cs.fontWeight, clip: { x: b.x + scrollX, y: b.y + scrollY, width: b.width, height: b.height } };
      });
      const paints = await el.evaluate(readTextInk);
      const ink = inkFromPaints(paints.overBlack, paints.overWhite, paints.opacity);

      // Hide the glyphs only: the box stays, and so does any ground derived
      // from currentColor, which `color: transparent` would have changed.
      await el.evaluate((e) => {
        e.style.webkitTextFillColor = 'transparent';
        e.style.textDecorationColor = 'transparent';
      });
      await sleep(350);
      const usable = info.clip.width >= 1 && info.clip.height >= 1;
      const shot = usable && (await page.screenshot({ clip: info.clip, encoding: 'base64', captureBeyondViewport: false }));
      await el.evaluate((e) => {
        e.style.webkitTextFillColor = '';
        e.style.textDecorationColor = '';
      });

      const s = contrastStats(ink, shot ? await decodePng(page, shot) : []);
      const floor = floorFor(info.fontSize, info.weight);
      const fails = !(s.worst >= floor);
      pass &&= !fails;
      console.log(
        `  ${fails ? 'FAIL' : 'PASS'}  ${selector}\n` +
          `        worst ${s.worst.toFixed(2)}:1   mean ${s.mean.toFixed(2)}:1   ` +
          `floor ${floor}:1 (${Math.round(info.fontSize)}px${floor === 3 ? ', large' : ''})` +
          (ink[3] < 0.999 ? `   ink alpha ${ink[3].toFixed(2)}, read opaque ${s.opaque.worst.toFixed(2)}:1` : ''),
      );
    }
    await page.close();
  }
  console.log(pass ? '\nall targets clear their floor' : '\nat least one target is below its floor');
  return pass;
}

/** Every same-origin page reachable from `/` by its links. */
async function crawl(base) {
  const origin = new URL(base).origin;
  const seen = new Set(['/']);
  const queue = ['/'];
  const page = await browser.newPage();
  while (queue.length) {
    const path = queue.shift();
    await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' });
    for (const href of await page.$$eval('a[href]', (as) => as.map((a) => a.href))) {
      const u = new URL(href);
      if (u.origin !== origin || !u.pathname.endsWith('/') || seen.has(u.pathname)) continue;
      seen.add(u.pathname);
      queue.push(u.pathname);
    }
  }
  await page.close();
  return [...seen].sort();
}

/**
 * Runs IN THE PAGE: the text elements wholly in view and uncovered, with their
 * line boxes in viewport pixels, and the ones that are never measured, keyed
 * by reason. A candidate is an element with a text node of its own, keyed by
 * its index in document order; `done` lists keys already measured.
 */
function candidatesInView(done) {
  const REASONS = [
    ['glitch shard', '.sl-fx-glitch__shards'],
    ['glass text', '.sl-fx-glass--text, .sl-fx-glass__glow'],
    ['visually hidden', '.sr-only'],
    ['disabled control', '[aria-disabled="true"], :disabled'],
    ['form control', 'select, option, textarea'],
  ];
  const NOT_RENDERED = 'script, style, noscript, template, svg';
  const skipDone = new Set(done);
  const items = [];
  const skipped = {};
  const all = document.body.querySelectorAll('*');
  for (let i = 0; i < all.length; i++) {
    const e = all[i];
    const key = String(i);
    if (skipDone.has(key) || e.closest(NOT_RENDERED)) continue;
    const texts = [...e.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim());
    if (!texts.length) continue;
    const reason = REASONS.find(([, sel]) => e.closest(sel));
    if (reason) {
      (skipped[reason[0]] ||= []).push(key);
      continue;
    }
    const cs = getComputedStyle(e);
    if (cs.visibility !== 'visible') continue;
    const rects = [];
    for (const t of texts) {
      const r = document.createRange();
      r.selectNodeContents(t);
      for (const b of r.getClientRects()) if (b.width >= 4 && b.height >= 4) rects.push(b);
    }
    if (!rects.length) continue;
    const uncovered = rects.every((b) => {
      if (b.left < 0 || b.top < 0 || b.right > innerWidth || b.bottom > innerHeight) return false;
      const pts = [[b.left + 1, b.top + 1], [b.right - 1, b.top + 1], [b.left + 1, b.bottom - 1], [b.right - 1, b.bottom - 1], [(b.left + b.right) / 2, (b.top + b.bottom) / 2]];
      return pts.every(([x, y]) => {
        const hit = document.elementFromPoint(x, y);
        return hit && (e.contains(hit) || hit.contains(e));
      });
    });
    if (!uncovered) continue;
    items.push({
      key,
      label: `${e.tagName.toLowerCase()}${[...e.classList].map((c) => `.${c}`).join('')}`,
      text: texts.map((t) => t.textContent.trim()).join(' ').replace(/\s+/g, ' ').slice(0, 48),
      fontSize: parseFloat(cs.fontSize),
      weight: cs.fontWeight,
      scrollY,
      rects: rects.map((b) => ({ x: Math.floor(b.left), y: Math.floor(b.top), w: Math.ceil(b.width), h: Math.ceil(b.height) })),
    });
  }
  return { items, skipped };
}

/** Runs IN THE PAGE: the keys of every rendered element with a text node of its own. */
function textKeys() {
  const out = [];
  const all = document.body.querySelectorAll('*');
  for (let i = 0; i < all.length; i++) {
    const e = all[i];
    if (e.closest('script, style, noscript, template, svg')) continue;
    if ([...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && e.getClientRects().length) out.push(String(i));
  }
  return out;
}

/** Reads each item's ink, then photographs the viewport once with every glyph hidden. */
async function measureView(page, items) {
  if (!items.length) return [];
  const inks = await page.evaluate((keys, read) => {
    const all = document.body.querySelectorAll('*');
    const fn = new Function(`return (${read})`)();
    return keys.map((k) => fn(all[Number(k)]));
  }, items.map((it) => it.key), readTextInk.toString());
  await page.evaluate((id, css) => {
    const s = Object.assign(document.createElement('style'), { id, textContent: css });
    document.head.append(s);
  }, HIDE_ID, HIDE_CSS);
  await sleep(150);
  const shot = await page.screenshot({ encoding: 'base64' });
  await page.evaluate((id) => document.getElementById(id)?.remove(), HIDE_ID);
  // Sample in the page: only the line boxes come back, not the whole frame.
  const samples = await page.evaluate(async (b64, rectsPer) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = Object.assign(document.createElement('canvas'), { width: img.width, height: img.height }).getContext('2d');
    c.drawImage(img, 0, 0);
    return rectsPer.map((rects) => rects.flatMap((r) => {
      const w = Math.min(r.w, img.width - r.x);
      const h = Math.min(r.h, img.height - r.y);
      return w > 0 && h > 0 ? Array.from(c.getImageData(r.x, r.y, w, h).data) : [];
    }));
  }, shot, items.map((it) => it.rects));
  return items.map((it, i) => {
    const ink = inkFromPaints(inks[i].overBlack, inks[i].overWhite, inks[i].opacity);
    return { ...it, ink, stats: contrastStats(ink, samples[i]), floor: floorFor(it.fontSize, it.weight) };
  });
}

/** Scrolls one page top to bottom, measuring each text element once. */
async function sweepPage(page, height) {
  const done = [];
  const results = [];
  const skipped = {};
  const invisible = new Set();
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; ; y += Math.round(height * 0.7)) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
    // Reveals arm on scroll and stagger in over about a second.
    await sleep(1400);
    const view = await page.evaluate(candidatesInView, done);
    for (const [reason, keys] of Object.entries(view.skipped)) for (const k of keys) (skipped[reason] ||= new Set()).add(k);
    // Invisible ink is not text a reader sees (a reveal not yet run); it is
    // left for a later view, and counted if no view ever shows it.
    for (const m of await measureView(page, view.items)) {
      if (m.ink[3] < 0.02) {
        invisible.add(m.key);
        continue;
      }
      invisible.delete(m.key);
      done.push(m.key);
      results.push(m);
    }
    if (y + height >= total) break;
  }
  const accounted = new Set([...done, ...Object.values(skipped).flatMap((s) => [...s]), ...invisible]);
  const never = (await page.evaluate(textKeys)).filter((k) => !accounted.has(k));
  const counts = Object.fromEntries(Object.entries(skipped).map(([r, s]) => [r, s.size]));
  if (invisible.size) counts['invisible ink'] = invisible.size;
  if (never.length) counts['never wholly in view'] = never.length;
  return { results, counts };
}

/**
 * Measures `r` again with it scrolled to the same place in a fresh frame. A
 * frame where its ink is invisible (a glitch burst hides the intact text while
 * its shards show) is no measurement: up to three tries, then the first stands.
 */
async function remeasure(page, r, others) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), r.scrollY);
  for (let tries = 0; tries < 3; tries++) {
    await sleep(2200);
    const view = (await page.evaluate(candidatesInView, others)).items.filter((v) => v.key === r.key);
    if (!view.length) return r;
    const [m] = await measureView(page, view);
    if (m.ink[3] >= 0.02) return m;
  }
  return r;
}

/** A ratio for printing; an unmeasurable one has none. */
function fmt(n) {
  return Number.isFinite(n) ? n.toFixed(2) : 'n/a';
}

/** One configuration (width × WebGPU) over every page, both themes. */
async function sweepConfig(base, pages, { width, gpu }) {
  const height = heightFor(width);
  console.log(`\n══ ${width}px, WebGPU ${gpu ? 'on' : 'off'}: ${pages.length} page(s) × ${THEMES.length} themes; gate = p5 of each element's pixels ══`);
  let measured = 0;
  const failures = [];
  const warnings = [];
  const skips = {};
  const run = async (own, { theme, path }) => {
    const page = await openPage(`${base}${path}`, { theme, width, gpu }, own);
    await sleep(2500);
    const { results, counts } = await sweepPage(page, height);
    measured += results.length;
    for (const [r, n] of Object.entries(counts)) skips[r] = (skips[r] || 0) + n;
    const keys = results.map((x) => x.key);
    for (const r of results.filter((x) => belowFloor(x.stats, x.floor))) {
      const again = await remeasure(page, r, keys.filter((k) => k !== r.key));
      (belowFloor(again.stats, again.floor) ? failures : warnings).push({ theme, path, first: r, ...again });
    }
    await page.close();
  };
  const queue = THEMES.flatMap((theme) => pages.map((path) => ({ theme, path })));
  // One browser per worker: tabs sharing a headless browser stall each
  // other's screenshots, since only the front one is given frames.
  await Promise.all(Array.from({ length: 4 }, async () => {
    const own = await launch(gpu);
    while (queue.length) await run(own, queue.shift());
    await own.close();
  }));

  const order = (a, b) => a.path.localeCompare(b.path) || a.theme.localeCompare(b.theme) || a.label.localeCompare(b.label);
  for (const f of failures.sort(order)) {
    const fresh = !belowFloor(f.stats.opaque, f.floor);
    console.log(
      `FAIL${fresh ? ' NEW' : '    '} ${f.path} [${f.theme}] ${f.label} "${f.text}"\n` +
        `         p5 ${fmt(f.stats.p5)}:1  worst ${fmt(f.stats.worst)}:1  floor ${f.floor}:1 (${Math.round(f.fontSize)}px)` +
        (Number.isFinite(f.stats.p5) ? `  ink alpha ${f.ink[3].toFixed(2)}  read opaque p5 ${fmt(f.stats.opaque.p5)}:1` : '  unmeasurable: no pixels sampled'),
    );
  }
  for (const w of warnings.sort(order)) {
    console.log(`WARN     ${w.path} [${w.theme}] ${w.label} "${w.text}": p5 ${fmt(w.first.stats.p5)}:1 first, ${fmt(w.stats.p5)}:1 on the second measure (floor ${w.floor}:1)`);
  }
  const fresh = failures.filter((f) => !belowFloor(f.stats.opaque, f.floor)).length;
  const skipLine = Object.entries(skips).map(([r, n]) => `${r} ${n}`).join(', ') || 'none';
  console.log(`${measured} text elements measured; ${failures.length} below their floor (${fresh} of them pass when read as opaque); ${warnings.length} passed on a second measure`);
  console.log(`not measured: ${skipLine}`);
  return failures.length;
}

async function sweep(base, paths) {
  const pages = paths.length ? paths : await crawl(base);
  const widths = flag('--widths', '1440').split(',').map(Number);
  const gpus = flag('--gpu', 'on').split(',').map((g) => g === 'on');
  let failed = 0;
  for (const width of widths) for (const gpu of gpus) failed += await sweepConfig(base, pages, { width, gpu });
  console.log(`\n${failed ? `${failed} failure(s)` : 'every measured element clears its floor'} across ${widths.length * gpus.length} configuration(s)`);
  return failed === 0;
}
