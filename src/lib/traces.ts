/**
 * The trace band: a few rows of signal traces, each hiding the ones behind
 * it, drawn on 2px cells through the kit's Bayer matrix in the page's own
 * ink, with one trace in the accent. No picture, no paper, no colour of its
 * own: it reads the two colours from the canvas (`color` is the ink,
 * `outline-color` the accent) and redraws on a resize and a theme change.
 * The site's footer ends on it (SiteFooter.astro).
 */
const B8 = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];
const bayer = (i: number, j: number) => (B8[(j & 7) * 8 + (i & 7)] + 0.5) / 64;
/** The cell, in CSS px: the kit's art cell. */
const CELL = 2;
/** Rows of cells between two traces. */
const GAP = 6;

const hash = (i: number, j: number) => {
  let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263)) ^ 0x5bd1e995;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const smooth = (t: number) => t * t * (3 - 2 * t);
/** Smooth value noise along x, one stream per `row`. */
function noise(x: number, row: number): number {
  const i = Math.floor(x), f = smooth(x - i);
  return hash(i, row) * (1 - f) + hash(i + 1, row) * f;
}
/** Three octaves, 0..1. */
const fbm = (x: number, row: number) => (noise(x, row) * 4 + noise(x * 2.1, row + 101) * 2 + noise(x * 4.3, row + 211)) / 7;

/**
 * One band, as cells: 0 clear, 1 ink, 2 accent. Pure, so a test can read it.
 * Rows are drawn front first, and a cell shows only above everything already
 * drawn, so a trace hides the ones behind it. The far rows thin out through
 * the matrix; the middle row is the accent, solid, with a thin body under it.
 */
export function traceCells(cols: number, rows: number, seed: number): Uint8Array {
  const cells = new Uint8Array(cols * rows);
  const top = Math.round(rows * 0.42), count = Math.max(3, Math.floor((rows - top - 4) / GAP)), held = Math.round(count * 0.5);
  const yOf = (x: number, r: number) => {
    const swell = 0.35 + 0.65 * fbm(x * 0.012 + 40, seed + 900);
    // A peak saturates under the band's top edge, so no trace is cut by it.
    const lift = rows * 0.34 * swell * Math.pow(fbm(x * 0.05, seed + r * 7), 2.4) * 2.6, cap = top - 4;
    return top + r * GAP - cap * (1 - Math.exp(-lift / cap)) - (noise(x * 0.5, seed + r * 7 + 400) - 0.5) * 1.2;
  };
  const horizon = new Float32Array(cols).fill(rows + 1);
  const put = (x: number, y: number, v: number) => { if (y >= 0 && y < rows) cells[y * cols + x] = v; };
  for (let r = count - 1; r >= 0; r--) {
    const accent = r === held, depth = 0.3 + 0.7 * (r / (count - 1));
    const line = Float32Array.from({ length: cols + 1 }, (_, x) => yOf(x, r));
    for (let x = 0; x < cols; x++) {
      const a = Math.round(line[x]), b = Math.round(line[x + 1]);
      if (accent) {
        const base = Math.min(top + r * GAP + 1, Math.floor(horizon[x]) - 1);
        for (let y = a + 2; y <= base; y++) if (0.2 > bayer(x, y)) put(x, y, 2);
      }
      for (let y = Math.min(a, b); y <= Math.max(a, b); y++) {
        if (y >= horizon[x]) continue;
        if (accent) { put(x, y, 2); put(x, y + 1, 2); } else if (depth > bayer(x, y)) put(x, y, 1);
      }
    }
    for (let x = 0; x < cols; x++) horizon[x] = Math.min(horizon[x], line[x], line[x + 1]);
  }
  return cells;
}

function draw(canvas: HTMLCanvasElement, seed: number): void {
  const cols = Math.ceil(canvas.clientWidth / CELL), rows = Math.ceil(canvas.clientHeight / CELL);
  const g = cols && rows ? canvas.getContext('2d') : null;
  if (!g) return;
  canvas.width = cols;
  canvas.height = rows;
  const style = getComputedStyle(canvas), cells = traceCells(cols, rows, seed);
  for (const [value, colour] of [[1, style.color], [2, style.outlineColor]] as const) {
    g.fillStyle = colour;
    for (let k = 0; k < cells.length; k++) if (cells[k] === value) g.fillRect(k % cols, Math.floor(k / cols), 1, 1);
  }
}

/**
 * Draws the band on a canvas and keeps it drawn: on a resize of the canvas
 * and on a theme change, which changes the two colours it reads.
 */
export function mountTraces(canvas: HTMLCanvasElement, seed: number): void {
  const paint = () => draw(canvas, seed);
  paint();
  new ResizeObserver(paint).observe(canvas);
  new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['data-sl-theme'] });
}
