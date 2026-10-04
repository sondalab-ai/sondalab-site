import { test } from 'node:test';
import assert from 'node:assert/strict';
import { belowFloor, composite, contrastStats, floorFor, inkFromPaints, luminance, ratio } from './contrast-math.mjs';

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

test('the bold-large boundary is 18.66px at weight 700', () => {
  assert.equal(floorFor(18.66, 700), 3);
  assert.equal(floorFor(18.65, 700), 4.5);
  assert.equal(floorFor(18.66, 699), 4.5);
  assert.equal(floorFor(23.99, 400), 4.5);
});

// Fail closed: nothing sampled gives NaN, and `NaN < floor` is false, which
// is how an unmeasurable element used to pass the sweep silently.
test('an element with no pixels sampled is below its floor', () => {
  const stats = contrastStats([0, 0, 0, 1], []);
  assert.ok(Number.isNaN(stats.p5));
  assert.equal(belowFloor(stats, 4.5), true);
});

test('the gate passes at the floor and fails just under it', () => {
  assert.equal(belowFloor({ p5: 4.5 }, 4.5), false);
  assert.equal(belowFloor({ p5: 4.49 }, 4.5), true);
});

test('a translucent coloured ink composites per channel', () => {
  // the light theme's accent text at 50% over the light canvas
  const ink = inkFromPaints([79, 39, 0], [207, 167, 128]);
  near(ink[3], 0.498, 0.005);
  const painted = composite(ink, [234, 230, 226]);
  // what was painted over black, plus the ground's share
  const expected = [79 + 0.502 * 234, 39 + 0.502 * 230, 0 + 0.502 * 226];
  painted.forEach((v, i) => near(v, expected[i], 1.5));
  const stats = contrastStats(ink, fill([234, 230, 226], 4));
  near(stats.worst, ratio(luminance(painted), luminance([234, 230, 226])), 0.01);
  assert.ok(stats.worst < stats.opaque.worst, 'the composited ratio is lower than the opaque one');
});

test('the ink alpha and the element opacity multiply', () => {
  // white at 60% inside an element at 50% opacity paints as white at 30%
  const ink = inkFromPaints([153, 153, 153], [255, 255, 255], 0.5);
  near(ink[3], 0.3, 0.005);
  const stats = contrastStats(ink, fill([0, 0, 0], 4));
  near(stats.worst, ratio(luminance([76.5, 76.5, 76.5]), 0), 0.02);
});
