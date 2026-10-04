import { test } from 'node:test';
import assert from 'node:assert/strict';
import { composite, contrastStats, floorFor, inkFromPaints, luminance, ratio } from './contrast-math.mjs';

const near = (a, b, eps = 0.02) => assert.ok(Math.abs(a - b) <= eps, `${a} is not within ${eps} of ${b}`);
const fill = (rgb, n) => Array.from({ length: n }, () => [...rgb, 255]).flat();

test('opaque white on black is 21:1', () => {
  near(ratio(luminance([255, 255, 255]), luminance([0, 0, 0])), 21);
});

test('an opaque ink is recovered unchanged from its two paints', () => {
  assert.deepEqual(inkFromPaints([32, 28, 24], [32, 28, 24]), [32, 28, 24, 1]);
});

test('a translucent ink is recovered with its alpha', () => {
  // white at 60%: 153 over black, 255 over white
  const [r, g, b, a] = inkFromPaints([153, 153, 153], [255, 255, 255]);
  near(a, 0.6, 0.005);
  near(r, 255, 0.5);
  near(g, 255, 0.5);
  near(b, 255, 0.5);
});

test('the effective opacity of the element multiplies the alpha', () => {
  near(inkFromPaints([255, 255, 255], [255, 255, 255], 0.5)[3], 0.5, 1e-9);
});

test('compositing lays the ink over the ground per channel', () => {
  assert.deepEqual(composite([255, 255, 255, 0.6], [0, 0, 0]), [153, 153, 153]);
  assert.deepEqual(composite([10, 20, 30, 1], [200, 200, 200]), [10, 20, 30]);
});

// The regression: the probes painted the computed colour and kept only its RGB,
// so white at 60% on black measured 21:1. Composited it is the grey it paints.
test('translucent text is measured as composited, not as opaque', () => {
  const stats = contrastStats([255, 255, 255, 0.6], fill([0, 0, 0], 10));
  near(stats.opaque.worst, 21);
  near(stats.worst, ratio(luminance([153, 153, 153]), 0), 0.01);
  assert.ok(stats.worst < 8, `composited ${stats.worst} should be well under the opaque 21`);
});

test('the 5th percentile ignores a few stray pixels, the worst does not', () => {
  const pixels = [...fill([255, 255, 255], 99), ...fill([0, 0, 0], 1)];
  const stats = contrastStats([0, 0, 0, 1], pixels);
  near(stats.worst, 1);
  near(stats.p5, 21);
});

test('the WCAG floor is 3:1 for large or bold-large text, 4.5:1 otherwise', () => {
  assert.equal(floorFor(24, 400), 3);
  assert.equal(floorFor(19, 700), 3);
  assert.equal(floorFor(19, 600), 4.5);
  assert.equal(floorFor(16, 400), 4.5);
});
