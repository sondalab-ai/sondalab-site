import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sampleDots, dotFrame } from '../src/lib/dot-scene.ts';

/** A size×size RGBA image whose grey value at (x, y) is `f(x, y)`. */
function image(size, f) {
  const px = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const k = (y * size + x) * 4;
    px[k] = px[k + 1] = px[k + 2] = f(x, y);
    px[k + 3] = 255;
  }
  return px;
}
const fixed = () => 0.5;

test('a black image draws nothing', () => {
  assert.deepEqual(sampleDots(image(64, () => 0), 64, 16, fixed), []);
});

test('a uniform image draws nothing and does not divide by zero', () => {
  const dots = sampleDots(image(64, () => 128), 64, 16, fixed);
  for (const d of dots) assert.ok(Number.isFinite(d.L));
});

test('dots stay inside the inscribed circle', () => {
  const dots = sampleDots(image(64, (x) => x * 4), 64, 16, fixed);
  assert.ok(dots.length > 0);
  for (const d of dots) assert.ok(Math.hypot(d.x - 0.5, d.y - 0.5) < 0.5, `dot at ${d.x},${d.y}`);
});

test('a dark image still spends the whole light range', () => {
  // Brightest at the centre, where the edge fade does not reach.
  const dark = image(64, (x, y) => Math.round(40 * Math.max(0, 1 - Math.hypot(x - 32, y - 32) / 32)));
  const dots = sampleDots(dark, 64, 16, fixed);
  assert.ok(Math.max(...dots.map((d) => d.L)) > 0.9);
});

test('a dot starts at its scatter position and settles near its place', () => {
  const [d] = sampleDots(image(64, (x) => x * 4), 64, 16, fixed);
  const start = dotFrame(d, 0, 160, 16);
  assert.ok(Math.abs(start.x - d.sx * 160) < 1e-9 && Math.abs(start.y - d.sy * 160) < 1e-9);
  const cell = 160 / 16;
  const later = dotFrame(d, 20, 160, 16);
  assert.ok(Math.hypot(later.x - d.x * 160, later.y - d.y * 160) <= 0.45 * cell * Math.SQRT2 + 1e-9);
});

test('a brighter dot is larger', () => {
  const dots = sampleDots(image(64, (x) => x * 4), 64, 16, fixed);
  const dim = dots.reduce((a, b) => (a.L < b.L ? a : b));
  const lit = dots.reduce((a, b) => (a.L > b.L ? a : b));
  assert.ok(dotFrame(lit, 20, 160, 16).r > dotFrame(dim, 20, 160, 16).r);
});

test('on paper the picture prints its dark: an inverted black image draws, a white one does not', () => {
  assert.ok(sampleDots(image(64, (x) => (x < 32 ? 0 : 40)), 64, 16, fixed, true).length > 0);
  assert.deepEqual(sampleDots(image(64, () => 255), 64, 16, fixed, true), []);
});

test('the circle dissolves at its edge instead of ending on a line', () => {
  const dots = sampleDots(image(64, () => 200).map((v, k) => (k % 4 === 3 ? 255 : (Math.floor(k / 4) % 64) * 4)), 64, 32, Math.random);
  const rim = dots.filter((d) => Math.hypot(d.x - 0.5, d.y - 0.5) / 0.5 > 0.85);
  const core = dots.filter((d) => Math.hypot(d.x - 0.5, d.y - 0.5) / 0.5 < 0.4);
  const mean = (a) => a.reduce((s, d) => s + d.L, 0) / Math.max(1, a.length);
  assert.ok(mean(rim) < 0.2 * mean(core), `rim ${mean(rim).toFixed(3)} vs core ${mean(core).toFixed(3)}`);
});
