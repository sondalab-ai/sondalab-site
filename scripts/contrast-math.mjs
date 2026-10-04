// The arithmetic the contrast probes share, kept free of puppeteer so it can be
// unit-tested in CI (which has no Chrome).
//
// A text colour is not always opaque: the kit's muted ink inside an inversion
// band is the band's foreground at 60%, and an ancestor's `opacity` dims a
// label just the same. Measuring such text as if it were opaque overstates its
// contrast, so the ink is composited over each sampled background pixel first,
// the way the browser blends it: per channel, in gamma-encoded sRGB.

/** WCAG relative luminance from 8-bit sRGB. */
export function luminance([r, g, b]) {
  const f = (v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** WCAG contrast ratio between two relative luminances. */
export function ratio(a, b) {
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Recovers an ink's sRGB bytes and alpha from the same colour painted once over
 * black and once over white (see `readTextInk`), then folds in the element's
 * effective opacity. Painting lets the browser parse whatever the computed
 * colour is (`oklch()`, `color(srgb …)`, a `color-mix()` result) without a
 * converter here.
 */
export function inkFromPaints(overBlack, overWhite, opacity = 1) {
  const alpha = 1 - (overWhite.reduce((s, w, i) => s + (w - overBlack[i]), 0) / 3) / 255;
  const a = Math.min(1, Math.max(0, alpha));
  const rgb = overBlack.map((v) => (a > 0 ? Math.min(255, v / a) : 0));
  return [...rgb, a * opacity];
}

/** `ink` ([r, g, b, a], a in 0..1) laid over an opaque `ground` ([r, g, b]). */
export function composite([r, g, b, a], [R, G, B]) {
  return [r * a + R * (1 - a), g * a + G * (1 - a), b * a + B * (1 - a)];
}

/**
 * Contrast of `ink` against every pixel of `pixels` (flat RGBA bytes, the text
 * hidden). Returns the worst pixel, the 5th percentile and the mean, each
 * twice: composited (the truth) and as if the ink were opaque (what the probes
 * measured before), so a sweep can say what the alpha changed.
 */
export function contrastStats(ink, pixels) {
  const opaque = luminance(ink);
  const real = [];
  const naive = [];
  for (let k = 0; k < pixels.length; k += 4) {
    const ground = [pixels[k], pixels[k + 1], pixels[k + 2]];
    const lg = luminance(ground);
    real.push(ratio(luminance(composite(ink, ground)), lg));
    naive.push(ratio(opaque, lg));
  }
  const summarise = (rs) => {
    if (rs.length === 0) return { worst: NaN, p5: NaN, mean: NaN };
    const sorted = [...rs].sort((x, y) => x - y);
    return {
      worst: sorted[0],
      p5: sorted[Math.floor(0.05 * (sorted.length - 1))],
      mean: rs.reduce((s, v) => s + v, 0) / rs.length,
    };
  };
  return { ...summarise(real), opaque: summarise(naive) };
}

/** WCAG 1.4.3 floor: 3:1 for large text (>= 24px, or >= 18.66px at 700+), else 4.5:1. */
export function floorFor(fontSize, weight) {
  const large = fontSize >= 24 || (fontSize >= 18.66 && Number(weight) >= 700);
  return large ? 3 : 4.5;
}

/**
 * Runs IN THE PAGE (pass it to `evaluate`): the element's glyph colour painted
 * over black and over white, and its effective opacity (its own and every
 * ancestor's). The glyph colour is `-webkit-text-fill-color`, which is what
 * actually paints and defaults to `color`. Self-contained on purpose: puppeteer
 * serialises the function's source, so it may reference nothing outside it.
 */
export function readTextInk(e) {
  const cs = getComputedStyle(e);
  const c = Object.assign(document.createElement('canvas'), { width: 2, height: 1 }).getContext('2d');
  c.fillStyle = '#000';
  c.fillRect(0, 0, 1, 1);
  c.fillStyle = '#fff';
  c.fillRect(1, 0, 1, 1);
  c.fillStyle = cs.webkitTextFillColor || cs.color;
  c.fillRect(0, 0, 2, 1);
  const d = c.getImageData(0, 0, 2, 1).data;
  let opacity = 1;
  for (let n = e; n && n.nodeType === 1; n = n.parentElement) opacity *= parseFloat(getComputedStyle(n).opacity);
  return { overBlack: [d[0], d[1], d[2]], overWhite: [d[4], d[5], d[6]], opacity };
}
