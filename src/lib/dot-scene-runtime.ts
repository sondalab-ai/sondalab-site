import { sampleDots, dotFrame, type Dot } from './dot-scene';

/** Grid cells per side, and the resolution each picture is sampled at. */
const GRID = 72;
const SAMPLE = 144;

interface Scene {
  canvas: HTMLCanvasElement;
  dots: Dot[];
  /** When it began to assemble (performance.now()), or null before it was seen. */
  t0: number | null;
  /** The dot colour as sRGB bytes: the canvas's own inherited text colour. */
  ink: string;
}

/** Resolves any CSS colour, oklch or color-mix included, to sRGB bytes. */
function paint(value: string): string {
  const c = document.createElement('canvas').getContext('2d')!;
  c.fillStyle = value;
  c.fillRect(0, 0, 1, 1);
  const [r, g, b] = c.getImageData(0, 0, 1, 1).data;
  return `${r},${g},${b}`;
}

async function load(canvas: HTMLCanvasElement): Promise<Scene> {
  const img = new Image();
  img.src = canvas.dataset.src!;
  await img.decode();
  const g = Object.assign(document.createElement('canvas'), { width: SAMPLE, height: SAMPLE }).getContext('2d')!;
  g.drawImage(img, 0, 0, SAMPLE, SAMPLE);
  return { canvas, dots: sampleDots(g.getImageData(0, 0, SAMPLE, SAMPLE).data, SAMPLE, GRID), t0: null, ink: paint(getComputedStyle(canvas).color) };
}

/**
 * Brings every `canvas[data-dot-scene]` under `root` to life: each samples its
 * picture once, assembles the first time it is 40% in view, then floats. One
 * animation loop serves them all and runs only while one of them is within
 * 200px of the viewport and the page is visible. The dot colour is the
 * canvas's inherited text colour, re-read when the theme changes.
 */
export async function mountDotScenes(root: ParentNode = document): Promise<void> {
  const canvases = [...root.querySelectorAll<HTMLCanvasElement>('canvas[data-dot-scene]')];
  if (canvases.length === 0) return;
  // A picture that fails to load leaves its vignette empty, not the others.
  const scenes = (await Promise.allSettled(canvases.map(load)))
    .filter((r): r is PromiseFulfilledResult<Scene> => r.status === 'fulfilled')
    .map((r) => r.value);
  if (scenes.length === 0) return;
  const near = new Set<Scene>();
  const html = document.documentElement;
  // Each canvas takes the text colour where it sits, so a vignette on an
  // inversion band prints in the band's ink rather than the page's.
  new MutationObserver(() => {
    for (const s of scenes) s.ink = paint(getComputedStyle(s.canvas).color);
  }).observe(html, { attributes: true, attributeFilter: ['data-sl-theme'] });

  let raf = 0;
  const frame = (now: number) => {
    for (const s of near) draw(s, now);
    raf = near.size > 0 && document.visibilityState === 'visible' ? requestAnimationFrame(frame) : 0;
  };
  const wake = () => {
    if (!raf && near.size > 0 && document.visibilityState === 'visible') raf = requestAnimationFrame(frame);
  };
  document.addEventListener('visibilitychange', wake);

  const byCanvas = new Map(scenes.map((s) => [s.canvas, s]));
  const nearWatch = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const s = byCanvas.get(e.target as HTMLCanvasElement)!;
        if (e.isIntersecting) near.add(s);
        else near.delete(s);
      }
      wake();
    },
    { rootMargin: '200px' },
  );
  const seenWatch = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const s = byCanvas.get(e.target as HTMLCanvasElement)!;
        if (e.isIntersecting && s.t0 === null) s.t0 = performance.now();
      }
    },
    { threshold: 0.4 },
  );
  for (const s of scenes) {
    nearWatch.observe(s.canvas);
    seenWatch.observe(s.canvas);
  }
}

function draw(s: Scene, now: number): void {
  const { canvas } = s;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  if (canvas.width !== Math.round(w * dpr)) canvas.width = canvas.height = Math.round(w * dpr);
  const g = canvas.getContext('2d')!;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, w);
  const t = s.t0 === null ? 0 : (now - s.t0) / 1000;
  // One colour per canvas; each dot varies only its alpha.
  g.fillStyle = `rgb(${s.ink})`;
  for (const d of s.dots) {
    const f = dotFrame(d, t, w, GRID);
    g.globalAlpha = f.a;
    g.beginPath();
    g.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
}
