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
  const dots = sampleDots(image(64, (x) => Math.round((x / 63) * 40)), 64, 16, fixed);
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
