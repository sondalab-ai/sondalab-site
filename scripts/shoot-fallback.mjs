// Photographs a page with WebGPU removed, which is the state most visitors are
// in and the one that breaks silently: its CSS is inert while the GPU path runs.
import puppeteer from 'puppeteer-core';
const URL = process.argv[2];
const NAME = process.argv[3];
const b = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new', args: ['--no-sandbox', '--hide-scrollbars'],
});
for (const theme of ['dark', 'light']) {
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await p.evaluateOnNewDocument((t) => {
    try { localStorage.setItem('sl-theme', t); } catch {}
    Object.defineProperty(navigator, 'gpu', { get: () => undefined, configurable: true });
  }, theme);
  await p.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 3000));
  await p.screenshot({ path: `.audit/${NAME}-fallback-${theme}.png` });
  console.log(`fallback ${theme} → .audit/${NAME}-fallback-${theme}.png`);
  await p.close();
}
await b.close();
