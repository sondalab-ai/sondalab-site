/**
 * The method section's vignettes: a greyscale picture resampled into a grid of
 * dots whose size follows the light. Pure maths only; the canvas, observers and
 * theme live in dot-scene-runtime.ts.
 */

export interface Dot {
  /** Place, in unit coordinates of the square. */
  x: number;
  y: number;
  /** Light, 0..1, after the stretch, the S-curve and the edge fade. */
  L: number;
  /** Where the dot starts before it assembles, in unit coordinates. */
  sx: number;
  sy: number;
  /** Seconds before this dot starts moving to its place. */
  delay: number;
  /** Its own phase for the float and the shimmer. */
  phase: number;
}

/** Cells below this light draw nothing. */
const FLOOR = 0.03;
/** How long one dot takes to reach its place, in seconds. */
const ASSEMBLE = 1.1;
/** Seconds between two passes of the scanline. */
const SCAN_PERIOD = 6;

/**
 * Samples an RGBA picture (`size` px square) on an `n`×`n` grid. The picture's
 * own 2nd..99th percentile becomes the full light range, so a dark render still
 * spends every dot size; a smoothstep separates faces and hands from the
 * ground; the outer half of the inscribed circle dissolves (dots shrink and
 * thin out at random) so the vignette has no hard contour. `invert` prints the
 * picture's dark instead of its light, for ink on a light ground: a noir
 * render drawn light-for-ink reads as a negative. `rand` seeds the scatter,
 * the phases and the edge's dither.
 */
export function sampleDots(
  px: ArrayLike<number>,
  size: number,
  n: number,
  rand: () => number = Math.random,
  invert = false,
): Dot[] {
  const lum0 = (k: number) => (0.2126 * px[k] + 0.7152 * px[k + 1] + 0.0722 * px[k + 2]) / 255;
  const lum = invert ? (k: number) => (1 - lum0(k)) ** 1.8 : lum0;
  const all: number[] = [];
  for (let k = 0; k < size * size * 4; k += 4) all.push(lum(k));
  all.sort((a, b) => a - b);
  const lo = all[Math.floor(all.length * 0.02)];
  const hi = Math.max(lo + 0.05, all[Math.floor(all.length * 0.99)]);

  const dots: Dot[] = [];
  const cell = size / n;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) / n;
      const y = (j + 0.5) / n;
      const edge = Math.hypot(x - 0.5, y - 0.5) / 0.5;
      if (edge >= 1) continue;
      const k = (Math.floor((j + 0.5) * cell) * size + Math.floor((i + 0.5) * cell)) * 4;
      const lin = Math.min(1, Math.max(0, (lum(k) - lo) / (hi - lo)));
      const f = Math.min(1, (1 - edge) / 0.5);
      const fade = f * f * (3 - 2 * f);
      const L = lin * lin * (3 - 2 * lin) * fade;
      if (L < FLOOR || rand() > fade ** 0.6) continue;
      dots.push({
        x,
        y,
        L,
        sx: rand(),
        sy: rand(),
        delay: rand() * 0.35 + Math.hypot(x - 0.5, y - 0.5) * 0.5,
        phase: rand() * Math.PI * 2,
      });
    }
  }
  return dots;
}

/**
 * Where dot `d` is and how it looks `t` seconds after its vignette began to
 * assemble, on a `width`-px square with an `n`-cell grid. It eases from its
 * scatter to its place, then floats on its own orbit under half a cell, its
 * light breathes by ±7.5%, and a faint scanline crosses every 6 seconds.
 */
export function dotFrame(
  d: Dot,
  t: number,
  width: number,
  n: number,
): { x: number; y: number; r: number; a: number } {
  const cell = width / n;
  const k = Math.min(1, Math.max(0, (t - d.delay) / ASSEMBLE));
  const e = 1 - (1 - k) ** 3;
  const drift = 0.15 * cell * e;
  const x = (d.sx + (d.x - d.sx) * e) * width + drift * Math.sin(t * 0.55 + d.phase);
  const y = (d.sy + (d.y - d.sy) * e) * width + drift * Math.cos(t * 0.43 + d.phase * 1.7);
  const shimmer = 1 + 0.075 * Math.sin(t * 1.6 + d.phase);
  const scan = ((t % SCAN_PERIOD) / SCAN_PERIOD) * 1.4 - 0.2;
  const band = Math.max(0, 1 - Math.abs(d.y - scan) * 14) * 0.5;
  const L = Math.min(1, d.L * shimmer + band * d.L);
  const r = 0.56 * cell * Math.sqrt(L) * (0.4 + 0.6 * e);
  return { x, y, r, a: 1 };
}
