#!/usr/bin/env node
// Rendered-page checks for a transmission's reading furniture: standfirst,
// sources in the margin, and the read-next ending. Against a served build.
// Usage: node scripts/post-probe.mjs http://localhost:4321
import { createProbe, textContrast, sleep } from './probe-kit.mjs';

const BASE = process.argv[2];
const probe = await createProbe(BASE, 'post-probe.mjs');
const { browser, report } = probe;
// Three sources, one link whose text wraps, and none at all.
const WITH = '/blog/there-is-no-fix-for-prompt-injection/';
const WRAPS = '/blog/the-clock-ran-out-in-brussels/';
const NONE = '/blog/legibility-is-a-feature/';

async function open(path, width = 1440, theme = 'dark') {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900 });
  await page.evaluateOnNewDocument((t) => localStorage.setItem('sl-theme', t), theme);
  await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
  await sleep(400);
  return page;
}

const cited = (page) => page.$$eval('.post__body a[href^="http"]:not([href*="sondalab.eu"])', (as) => as.map((a) => ({ href: a.href, n: getComputedStyle(a, '::after').content.replace(/"/g, ''), top: a.getBoundingClientRect().top })));
const notes = (page) => page.$$eval('.post__sources li', (ls) => ls.map((l) => { const r = l.getBoundingClientRect(); return { href: l.querySelector('a').href, n: l.querySelector('.post__source-n').textContent.trim(), top: r.top, left: r.left }; }));

for (const path of [WITH, WRAPS]) {
  const page = await open(path);
  const standfirst = await page.$eval('.post__standfirst', (e) => e.textContent.trim()).catch(() => '');
  report(standfirst.length > 40, `${path}: standfirst shows the summary (${standfirst.slice(0, 40)}…)`);
  const [links, list] = [await cited(page), await notes(page)];
  report(links.length > 0 && links.length === list.length, `${path}: ${links.length} cited links, ${list.length} sources`);
  // A computed `content` reports `counter(src)`, not its value, so the numbers
  // are checked through order: the nth numbered link is the nth source.
  report(links.length > 0 && links.every((l, i) => l.n.startsWith('counter(src)') && list[i]?.n === String(i + 1) && list[i].href === l.href), `${path}: each numbered link is the source with its number`);
  const proseRight = await page.$eval('.post__body', (e) => e.getBoundingClientRect().right);
  report(list.every((s) => s.left > proseRight), `1440 ${path}: sources sit in the margin`);
  report(list.every((s, i) => s.top >= links[i].top - 6), `1440 ${path}: each source is level with or below its link (${list.map((s, i) => Math.round(s.top - links[i].top)).join(', ')}px)`);
  report(list.every((s, i) => i === 0 || s.top > list[i - 1].top), `1440 ${path}: sources do not overlap`);
  await page.close();
}

{
  const page = await open(WITH, 390);
  const [bodyBottom, list] = [await page.$eval('.post__body', (e) => e.getBoundingClientRect().bottom), await notes(page)];
  report(list.every((s) => s.top > bodyBottom), '390: sources follow the post');
  const w = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  report(w[0] <= w[1], `390: scrollWidth ${w[0]} <= ${w[1]}`);
  await page.close();
}

{
  const page = await open(NONE);
  report((await page.$('.post__sources')) === null, `${NONE}: no sources block when a post cites nothing`);
  await page.close();
}

for (const theme of ['dark', 'light']) {
  const page = await open(WITH, 1440, theme);
  for (const sel of ['.post__standfirst', '.post__source a', '.post__source-host', '.post__next-summary']) {
    const r = await textContrast(page, sel);
    report(r >= 4.5, `${theme}: ${sel} p5 ${r.toFixed(2)}:1`);
  }
  await page.close();
}

{
  const page = await open(WITH);
  const next = await page.$eval('.post__next', (a) => ({ href: a.getAttribute('href'), title: a.querySelector('.post__next-title .sl-fx-glitch__text').textContent.trim() })).catch(() => null);
  report(!!next && next.href.startsWith('/blog/') && next.title.length > 5, `read next: ${next?.title}`);
  report((await page.$('.post__nav-link--next')) === null, 'the older link is folded into read next');
  await page.close();
  const oldest = await open('/blog/the-states-versus-the-order/');
  const n = await oldest.$eval('.post__next', (a) => a.getAttribute('href')).catch(() => null);
  report(!!n, `the oldest transmission still has a read next (${n})`);
  await oldest.close();
}

await probe.done();
