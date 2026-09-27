// Shared helpers for the rendered-page probes (method-probe, stance-probe):
// one headless Chrome, pass/fail reporting, and the measurements the probes
// share. Not a test framework; each probe stays a plain script.
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Starts a probe against `base` (a served build). Returns the browser, a
 * `report(ok, msg)` that prints and remembers failures, and `done()` which
 * closes the browser and exits 0 or 1.
 */
export async function createProbe(base, name) {
  if (!base) {
    console.error(`usage: ${name} <baseUrl>`);
    process.exit(2);
  }
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--hide-scrollbars'] });
  let failed = false;
  return {
    browser,
    report(ok, msg) {
      failed ||= !ok;
      console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`);
    },
    /** Opens `/` in `theme` at `width`, scrolls `anchor` into view and lets it settle. */
    async open(theme, width, anchor) {
      const page = await browser.newPage();
      await page.setViewport({ width, height: 900 });
      await page.evaluateOnNewDocument((t) => localStorage.setItem('sl-theme', t), theme);
      await page.goto(`${base}/`, { waitUntil: 'load' });
      await page.$eval(anchor, (e) => e.scrollIntoView({ block: 'center' }));
      await sleep(3000);
      return page;
    },
    async done() {
      await browser.close();
      process.exit(failed ? 1 : 0);
    },
  };
}

/** Lit pixel count and mean luminance of the lit pixels, per canvas matching `selector`. */
export const inkOf = (page, selector) => page.$$eval(selector, (cs) => cs.map((c) => {
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let n = 0, sum = 0;
  for (let k = 0; k < d.length; k += 4) if (d[k + 3] > 40) { n++; sum += (0.2126 * d[k] + 0.7152 * d[k + 1] + 0.0722 * d[k + 2]) / 255; }
  return { n, mean: n ? sum / n : 0 };
}));

/** Every canvas matching `selector`, as data URLs, to tell whether they moved. */
export const snapshot = (page, selector) => page.$$eval(selector, (cs) => cs.map((c) => c.toDataURL()).join('|'));

/**
 * 5th-percentile contrast of `selector`'s own text against what is behind it:
 * hides only the text, samples the text's own box, and adds the scroll offset
 * because puppeteer clips in document coordinates.
 */
export async function textContrast(page, selector) {
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
