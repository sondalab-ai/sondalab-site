#!/usr/bin/env node
// Measures the contrast of text that sits on a live surface, in both themes.
//
// A colour picked off a design-system token proves nothing once it is laid over
// a shader: the CRT's vignette, its glass reflections and the picture behind it
// all change the background under the words. So the background is *sampled*
// rather than assumed — the text is hidden, the region it occupied is
// photographed, and every pixel is compared against the text's own computed
// colour. The number reported is the worst pixel, not the average, because that
// is the one a reader actually struggles with.
//
// Usage: node scripts/contrast-probe.mjs <url> <selector> [<selector> ...]
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const [url, ...selectors] = process.argv.slice(2);

if (!url || selectors.length === 0) {
  console.error('usage: contrast-probe.mjs <url> <selector> [...]');
  process.exit(2);
}

/** WCAG relative luminance from 8-bit sRGB. */
function luminance(r, g, b) {
  const f = (v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function ratio(a, b) {
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars'],
});

let worstOverall = Infinity;

for (const theme of ['dark', 'light']) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument((t) => {
    try {
      localStorage.setItem('sl-theme', t);
    } catch {
      /* private mode; the default theme is fine for the measurement */
    }
  }, theme);
  await page.goto(url, { waitUntil: 'networkidle0' });
  // Let the surface come up and settle: a tube still fading in measures better
  // than the one the visitor ends up looking at.
  await new Promise((r) => setTimeout(r, 6000));

  console.log(`\n── ${theme} ──`);

  for (const selector of selectors) {
    const info = await page.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        color: cs.color,
        fontSize: parseFloat(cs.fontSize),
        weight: cs.fontWeight,
        rect: { x: r.x, y: r.y, width: r.width, height: r.height },
      };
    }, selector);

    if (!info || info.rect.width < 1 || info.rect.height < 1) {
      console.log(`  ${selector}: not found`);
      continue;
    }

    // Hide the text — visibility, not display, so the layout underneath does
    // not reflow and the region stays the one the words occupied.
    await page.evaluate((s) => {
      document.querySelector(s).style.visibility = 'hidden';
    }, selector);
    await new Promise((r) => setTimeout(r, 350));

    const shot = await page.screenshot({
      clip: {
        x: Math.max(0, info.rect.x),
        y: Math.max(0, info.rect.y),
        width: Math.min(1440, info.rect.width),
        height: Math.min(900, info.rect.height),
      },
      encoding: 'base64',
    });

    await page.evaluate((s) => {
      document.querySelector(s).style.visibility = '';
    }, selector);

    // Decode in the page: Chrome already has an image decoder, and this avoids
    // a Node-side image dependency for what is a handful of pixels.
    const pixels = await page.evaluate(async (b64) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      return Array.from(ctx.getImageData(0, 0, c.width, c.height).data);
    }, shot);

    const [tr, tg, tb] = info.color.match(/\d+/g).map(Number);
    const textL = luminance(tr, tg, tb);

    let worst = Infinity;
    let sum = 0;
    let n = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const l = luminance(pixels[i], pixels[i + 1], pixels[i + 2]);
      const c = ratio(textL, l);
      if (c < worst) worst = c;
      sum += c;
      n++;
    }

    // WCAG 1.4.3: 3:1 for large text (>= 24px, or >= 18.66px bold), else 4.5:1.
    const large = info.fontSize >= 24 || (info.fontSize >= 18.66 && Number(info.weight) >= 700);
    const floor = large ? 3 : 4.5;
    const pass = worst >= floor;
    worstOverall = Math.min(worstOverall, worst / floor);

    console.log(
      `  ${pass ? 'PASS' : 'FAIL'}  ${selector}\n` +
        `        worst ${worst.toFixed(2)}:1   mean ${(sum / n).toFixed(2)}:1   ` +
        `floor ${floor}:1 (${Math.round(info.fontSize)}px${large ? ', large' : ''})`,
    );
  }

  await page.close();
}

await browser.close();
console.log(worstOverall >= 1 ? '\nall targets clear their floor' : '\nat least one target is below its floor');
process.exit(worstOverall >= 1 ? 0 : 1);
