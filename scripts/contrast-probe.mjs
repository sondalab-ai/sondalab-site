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
//     Named targets on one page. Gates on the WORST pixel, the one a reader
//     actually struggles with.
//
//   node scripts/contrast-probe.mjs <baseUrl> --all [<path> ...]
//     Every text element on every page reachable from `/` (or on the paths
//     given), at 1440px, both themes. Gates on the 5th percentile of each
//     element's pixels and prints the worst beside it: across hundreds of
//     line boxes the worst pixel is a stray hairline or a photo's edge as
//     often as it is the ground. A failure is measured a second time after a
//     pause, since an ambient glitch burst can land on a sample, and only one
//     that fails twice is reported. Each line also prints what the old,
//     opaque reading gave; failures it would have passed are marked NEW.
//     Glass text (the numerals cut out of their pane, and the light copy
//     seated behind them) is a picture with a screen-reader copy and is not
//     measured; nor are glitch shards or visually hidden boxes. A disabled
//     control (`:disabled`, `aria-disabled="true"`) is skipped as WCAG 1.4.3
//     exempts it: an inactive control is meant to read as one.
import puppeteer from 'puppeteer-core';
import { contrastStats, floorFor, inkFromPaints, readTextInk } from './contrast-math.mjs';
import { decodePng, sleep } from './probe-kit.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const THEMES = ['dark', 'light'];
const W = 1440;
const H = 900;
const [url, ...rest] = process.argv.slice(2);
// The sweep hides every glyph at once with this sheet, for one photograph per view.
const HIDE_ID = 'contrast-probe-hide';
const HIDE_CSS = '*, *::before, *::after { -webkit-text-fill-color: transparent !important; text-decoration-color: transparent !important; caret-color: transparent !important; }';

if (!url || rest.length === 0) {
  console.error('usage: contrast-probe.mjs <url> <selector> [...]\n       contrast-probe.mjs <baseUrl> --all [<path> ...]');
  process.exit(2);
}

const launch = () => puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars'],
});
const browser = await launch();

async function openPage(target, theme, on = browser) {
  const page = await on.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument((t) => {
    try {
      localStorage.setItem('sl-theme', t);
    } catch {
      /* private mode; the default theme is fine for the measurement */
    }
  }, theme);
  await page.goto(target, { waitUntil: 'networkidle0', timeout: 60000 });
  return page;
}

const ok = rest[0] === '--all' ? await sweep(url.replace(/\/$/, ''), rest.slice(1)) : await targets(url, rest);
await browser.close();
process.exit(ok ? 0 : 1);

/** Named selectors on one page, worst pixel. */
async function targets(target, selectors) {
  let worstOverall = Infinity;
  for (const theme of THEMES) {
    const page = await openPage(target, theme);
    // Let the surface come up and settle: a tube still fading in measures
    // better than the one the visitor ends up looking at.
    await sleep(6000);
    console.log(`\n── ${theme} ──`);

    for (const selector of selectors) {
      const el = await page.$(selector);
      const info = el && (await el.evaluate((e) => {
        const r = e.getBoundingClientRect();
        const cs = getComputedStyle(e);
        return { fontSize: parseFloat(cs.fontSize), weight: cs.fontWeight, rect: { x: r.x, y: r.y, width: r.width, height: r.height } };
      }));
      if (!info || info.rect.width < 1 || info.rect.height < 1) {
        console.log(`  ${selector}: not found`);
        continue;
      }
      const paints = await el.evaluate(readTextInk);
      const ink = inkFromPaints(paints.overBlack, paints.overWhite, paints.opacity);

      // Hide the glyphs only: the box stays, and so does any ground derived
      // from currentColor, which `color: transparent` would have changed.
      await el.evaluate((e) => {
        e.style.webkitTextFillColor = 'transparent';
        e.style.textDecorationColor = 'transparent';
      });
      await sleep(350);
      const shot = await page.screenshot({
        clip: {
          x: Math.max(0, info.rect.x),
          y: Math.max(0, info.rect.y),
          width: Math.min(W, info.rect.width),
          height: Math.min(H, info.rect.height),
        },
        encoding: 'base64',
      });
      await el.evaluate((e) => {
        e.style.webkitTextFillColor = '';
        e.style.textDecorationColor = '';
      });

      const s = contrastStats(ink, await decodePng(page, shot));
      const floor = floorFor(info.fontSize, info.weight);
      const pass = s.worst >= floor;
      worstOverall = Math.min(worstOverall, s.worst / floor);
      console.log(
        `  ${pass ? 'PASS' : 'FAIL'}  ${selector}\n` +
          `        worst ${s.worst.toFixed(2)}:1   mean ${s.mean.toFixed(2)}:1   ` +
          `floor ${floor}:1 (${Math.round(info.fontSize)}px${floor === 3 ? ', large' : ''})` +
          (ink[3] < 0.999 ? `   ink alpha ${ink[3].toFixed(2)}, read opaque ${s.opaque.worst.toFixed(2)}:1` : ''),
      );
    }
    await page.close();
  }
  console.log(worstOverall >= 1 ? '\nall targets clear their floor' : '\nat least one target is below its floor');
  return worstOverall >= 1;
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
 * line boxes in viewport pixels. A candidate is an element with a text node of
 * its own, keyed by its index in document order; `done` lists keys already
 * measured.
 */
function candidatesInView(done) {
  const SKIP = '.sl-fx-glitch__shards, .sl-fx-glass--text, .sl-fx-glass__glow, .sr-only, [aria-disabled="true"], :disabled, script, style, noscript, template, svg, select, option, textarea';
  const skipDone = new Set(done);
  const out = [];
  const all = document.body.querySelectorAll('*');
  for (let i = 0; i < all.length; i++) {
    const e = all[i];
    const key = String(i);
    if (skipDone.has(key) || e.closest(SKIP)) continue;
    const texts = [...e.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim());
    if (!texts.length) continue;
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
    out.push({
      key,
      label: `${e.tagName.toLowerCase()}${[...e.classList].map((c) => `.${c}`).join('')}`,
      text: texts.map((t) => t.textContent.trim()).join(' ').replace(/\s+/g, ' ').slice(0, 48),
      fontSize: parseFloat(cs.fontSize),
      weight: cs.fontWeight,
      scrollY,
      rects: rects.map((b) => ({ x: Math.floor(b.left), y: Math.floor(b.top), w: Math.ceil(b.width), h: Math.ceil(b.height) })),
    });
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
async function sweepPage(page) {
  const done = [];
  const results = [];
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; ; y += 640) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
    // Reveals arm on scroll and stagger in over about a second.
    await sleep(1400);
    const items = await page.evaluate(candidatesInView, done);
    // Invisible ink is not text a reader sees (a reveal not yet run, a glass
    // letterform); it is skipped rather than reported at 1:1.
    for (const m of (await measureView(page, items)).filter((x) => x.ink[3] >= 0.02)) {
      done.push(m.key);
      results.push(m);
    }
    if (y + H >= height) break;
  }
  return results;
}

/** Measures `r` again with it scrolled to the same place in a fresh frame. */
async function remeasure(page, r, others) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), r.scrollY);
  await sleep(2200);
  const view = (await page.evaluate(candidatesInView, others)).filter((v) => v.key === r.key);
  return view.length ? (await measureView(page, view))[0] : r;
}

async function sweep(base, paths) {
  const pages = paths.length ? paths : await crawl(base);
  console.log(`contrast sweep: ${pages.length} page(s) × ${THEMES.length} themes at ${W}px; gate = p5 of each element's pixels`);
  let measured = 0;
  const failures = [];
  const run = async (own, { theme, path }) => {
    const page = await openPage(`${base}${path}`, theme, own);
    await sleep(2500);
    const results = await sweepPage(page);
    measured += results.length;
    const keys = results.map((x) => x.key);
    for (const r of results.filter((x) => x.stats.p5 < x.floor)) {
      const again = await remeasure(page, r, keys.filter((k) => k !== r.key));
      if (again.stats.p5 < again.floor) failures.push({ theme, path, ...again });
    }
    await page.close();
  };
  const queue = THEMES.flatMap((theme) => pages.map((path) => ({ theme, path })));
  // One browser per worker: tabs sharing a headless browser stall each
  // other's screenshots, since only the front one is given frames.
  await Promise.all(Array.from({ length: 4 }, async () => {
    const own = await launch();
    while (queue.length) await run(own, queue.shift());
    await own.close();
  }));

  failures.sort((a, b) => a.path.localeCompare(b.path) || a.theme.localeCompare(b.theme) || a.label.localeCompare(b.label));
  for (const f of failures) {
    const fresh = f.stats.opaque.p5 >= f.floor;
    console.log(
      `FAIL${fresh ? ' NEW' : '    '} ${f.path} [${f.theme}] ${f.label} "${f.text}"\n` +
        `         p5 ${f.stats.p5.toFixed(2)}:1  worst ${f.stats.worst.toFixed(2)}:1  floor ${f.floor}:1 (${Math.round(f.fontSize)}px)` +
        `  ink alpha ${f.ink[3].toFixed(2)}  read opaque p5 ${f.stats.opaque.p5.toFixed(2)}:1`,
    );
  }
  const fresh = failures.filter((f) => f.stats.opaque.p5 >= f.floor).length;
  console.log(`\n${measured} text elements measured; ${failures.length} below their floor (${fresh} of them pass when read as opaque)`);
  return failures.length === 0;
}
