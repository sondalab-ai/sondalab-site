#!/usr/bin/env node
// Visual-verification harness: screenshots the site in both themes using the
// system Chrome (no bundled Chromium). Usage: node scripts/shoot.mjs [url]
import puppeteer from 'puppeteer-core';

const URL = process.argv[2] || 'http://localhost:4321/';
const NAME = process.argv[3] || 'home';
const CHROME =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = '.audit';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars'],
});

for (const theme of ['dark', 'light']) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument((t) => {
    try { localStorage.setItem('sl-theme', t); } catch (e) {}
  }, theme);
  await page.goto(URL, { waitUntil: 'networkidle0' });
  // Force full layout/paint: scroll to bottom in steps, then back to top.
  await page.evaluate(async () => {
    const step = () => new Promise((r) => requestAnimationFrame(r));
    for (let y = 0; y <= document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await step();
    }
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 800)); // let the glow field paint
  await page.screenshot({ path: `${OUT}/${NAME}-${theme}.png` });
  const full = `${OUT}/${NAME}-${theme}-full.png`;
  await page.screenshot({ path: full, fullPage: true });
  console.log(`shot ${theme} → ${OUT}/${NAME}-${theme}.png (+ full)`);
  await page.close();
}

await browser.close();
