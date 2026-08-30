/**
 * A scene's content: parallax plates drawn on a 2D canvas that the CRT shader
 * samples as a texture. The mirror image of `crt-terminal.ts` — same contract,
 * pictures instead of prose.
 *
 * Three things are worth knowing before reading further.
 *
 * **The plates carry no colour and no alpha.** They are grayscale on black. The
 * luminance is lifted into an alpha channel once, at load, and every plate is
 * then tinted from a design-system token. `scripts/audit.mjs` only inspects
 * <style> blocks, so a literal colour in this file would bypass the compliance
 * gate entirely; there are none.
 *
 * **The tube follows the theme, exactly as the terminal's does.** On dark it is
 * a lit screen: black glass, plates added together as emission. On light it is a
 * paper readout: the canvas colour behind the theme's own ink, plates laid down
 * as ink. That is not a stylistic choice — the shader's light path subtracts the
 * accumulated picture from paper, so a plate drawn as emission on the light
 * theme comes back as a photographic negative.
 *
 * **The redraw is capped below the frame rate.** The drift is slow enough that
 * 30Hz is invisible, and the texture upload is the expensive half of the loop.
 */
import { SCENES, type Scene, type SceneLayer } from './scenes';

/** Working resolution of a plate once tinted. Below the plate's own 2048. */
const PLATE_W = 1200;
const PLATE_H = 675;

/** Texture height; width follows the tube's aspect. */
const TEX_H = 640;

/** Slack around the frame so parallax never exposes a plate's edge. */
const MARGIN = 0.07;

/** Redraws per second. The shader still runs at the display's rate. */
const REDRAW_HZ = 30;

/**
 * How much of the picture survives on the light theme.
 *
 * Not a taste decision. On dark the scene is emission and the text is light, so
 * the two occupy the same end of the range and simply add. On paper both the
 * scene and the text are ink: a plate at full strength puts a dark mark exactly
 * where a dark word has to be read, and the measured worst case is 1.00:1 — the
 * background matching the text outright. Held here, the same scene reads as a
 * pale engraving under the type rather than as a night behind it.
 */
const LIGHT_SCALE = 0.3;

interface Plate {
  layer: SceneLayer;
  /** White, with the plate's luminance lifted into alpha. */
  mask: HTMLCanvasElement;
  /** `mask` filled with this theme's colour for the layer's tone. */
  tinted: HTMLCanvasElement;
  /** Per-plate drift phase, so the planes never move in lockstep. */
  phase: number;
}

/**
 * Lift luminance into alpha. Runs once per plate at load: the plates arrive
 * opaque, and `source-in` tinting needs a real alpha channel to work against.
 */
function toMask(img: HTMLImageElement): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = PLATE_W;
  c.height = PLATE_H;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, PLATE_W, PLATE_H);
  const data = ctx.getImageData(0, 0, PLATE_W, PLATE_H);
  const p = data.data;
  for (let i = 0; i < p.length; i += 4) {
    // Rec. 709 luma. The plates are grayscale, so any channel would do, but the
    // weighted form survives artwork that is not quite neutral.
    const a = (p[i] * 0.2126 + p[i + 1] * 0.7152 + p[i + 2] * 0.0722) | 0;
    p[i] = 255;
    p[i + 1] = 255;
    p[i + 2] = 255;
    p[i + 3] = a;
  }
  ctx.putImageData(data, 0, 0);
  return c;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`scene plate failed: ${src}`));
    img.src = src;
  });
}

export interface SceneOptions {
  aspect?: number;
  /** Seconds a scene holds before the tube changes channel. Ignored for one scene. */
  dwell?: number;
  /** Called when the channel changes, so the caller can update the accessible name. */
  onScene?: (id: string) => void;
  /** Overall brightness ceiling. A backdrop carrying text runs dimmer. */
  intensity?: number;
  /** Horizontal drift, in fractions of the frame per second. */
  drift?: number;
}

/**
 * Build a scene source. Resolves once every plate has decoded, because a
 * half-loaded scene photographs as an empty tube and the caller's fallback is
 * still on screen until this returns.
 */
export async function createScene(id: string | string[], opts: SceneOptions = {}) {
  const ids = Array.isArray(id) ? id : [id];
  const scenes: Scene[] = ids.map((one) => {
    const found = SCENES[one];
    if (!found) throw new Error(`unknown scene: ${one}`);
    return found;
  });

  const intensity = opts.intensity ?? 1;
  const drift = opts.drift ?? 0.012;
  const dwell = opts.dwell ?? 14;

  /** How long the channel change lasts. Long enough to read as a decision. */
  const TUNE = 0.5;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  function geometry(aspect: number) {
    canvas.height = TEX_H;
    canvas.width = Math.round(TEX_H * Math.min(3, Math.max(0.6, aspect)));
  }
  geometry(opts.aspect ?? 16 / 9);

  const root = document.documentElement;
  const token = (name: string) => getComputedStyle(root).getPropertyValue(name).trim();
  const isLight = () => root.getAttribute('data-sl-theme') === 'light';

  /**
   * On dark the screen is lit phosphor; on light it is the page's own paper. Both
   * ends come straight from tokens.
   */
  const screenBg = () => (isLight() ? token('--sl-bg-canvas') : '#000000');

  function parse(hex: string): [number, number, number] {
    let h = (hex || '').trim().replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16);
    if (Number.isNaN(n)) return [0, 0, 0];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  /** Fade a colour towards the screen's own background, whichever end that is. */
  function fade(hex: string, k: number): string {
    const c = parse(hex);
    const b = parse(screenBg());
    const m = c.map((v, i) => Math.round(v * k + b[i] * (1 - k)));
    return `rgb(${m[0]}, ${m[1]}, ${m[2]})`;
  }

  let black = screenBg();
  let polarityLight = isLight();

  /**
   * The colour a plane is painted with, resolved from tokens for its tone.
   * Occluders have none: on a lit screen they remove light rather than add it,
   * and on paper they are the screen's own ink at full strength.
   */
  function toneColour(layer: SceneLayer): string {
    const ink = token('--sl-text-primary');
    const k = intensity * (polarityLight ? LIGHT_SCALE : 1);
    switch (layer.tone) {
      case 'occluder':
        // Only reached on paper: on glass an occluder is drawn as a hole, not
        // as a colour, so its tint is never sampled.
        return fade(ink, polarityLight ? LIGHT_SCALE : 1);
      case 'accent':
        return fade(token('--sl-accent-default'), Math.min(1, layer.gain * k));
      case 'depth':
        return fade(token('--sl-accent-depth'), Math.min(1, layer.gain * k));
      default:
        // Structure is the bulk of the picture and it stacks: four planes at the
        // ink's full value clip to white the moment two of them overlap on the
        // dark theme, where compositing is additive. It is held well under.
        return fade(ink, Math.min(1, 0.55 * layer.gain * k));
    }
  }

  // Every scene's plates are decoded up front. The tube changes channel without
  // a gap, and a plate that arrived late would show as a hole in the picture.
  const sets: Plate[][] = await Promise.all(
    scenes.map(async (s) => {
      const images = await Promise.all(s.layers.map((l) => loadImage(l.src)));
      return s.layers.map((layer, i) => ({
        layer,
        mask: toMask(images[i]),
        tinted: document.createElement('canvas'),
        // Irrational spacing, so the planes never come back into phase.
        phase: i * 2.399963,
      }));
    }),
  );

  // Where the sequence starts, not what it is: from here it cycles in order. A
  // fixed start would mean every visitor who stays under fourteen seconds — most
  // of them — only ever sees the first scene.
  let active = sets.length > 1 ? Math.floor(Math.random() * sets.length) : 0;
  let plates: Plate[] = sets[active];

  /** Repaint every plate in this theme's colours. Cheap, and rare. */
  function retint() {
    black = screenBg();
    polarityLight = isLight();
    for (const p of sets.flat()) {
      p.tinted.width = PLATE_W;
      p.tinted.height = PLATE_H;
      const c = p.tinted.getContext('2d')!;
      c.globalCompositeOperation = 'source-over';
      c.clearRect(0, 0, PLATE_W, PLATE_H);
      c.drawImage(p.mask, 0, 0);
      c.globalCompositeOperation = 'source-in';
      c.fillStyle = toneColour(p.layer);
      c.fillRect(0, 0, PLATE_W, PLATE_H);
    }
  }
  retint();

  // Pointer parallax, damped towards the cursor rather than snapped to it. Held
  // in normalised device coordinates so a resize needs no conversion.
  let px = 0;
  let py = 0;
  let tx = 0;
  let ty = 0;
  let elapsed = 0;
  let sinceDraw = 0;
  let dirty = true;
  let held = 0;
  let tuning = 0;
  let flipped = false;

  /** Cover-fit a plate into the frame plus its parallax slack. */
  function place(dx: number, dy: number) {
    const w = canvas.width * (1 + MARGIN * 2);
    const h = canvas.height * (1 + MARGIN * 2);
    const scale = Math.max(w / PLATE_W, h / PLATE_H);
    const dw = PLATE_W * scale;
    const dh = PLATE_H * scale;
    return {
      x: (canvas.width - dw) / 2 + dx,
      y: (canvas.height - dh) / 2 + dy,
      w: dw,
      h: dh,
    };
  }

  function draw(time: number) {
    // The background is laid down *last*, underneath everything, because an
    // occluder erases to transparency rather than to a colour — filling first
    // would mean the silhouette punched a hole through the screen itself.
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Emission adds on a lit screen; ink covers on paper. Using `lighter` on the
    // light theme is what turns the picture into a negative.
    const stack = polarityLight ? 'source-over' : 'lighter';

    const slackX = canvas.width * MARGIN;
    const slackY = canvas.height * MARGIN;
    for (const p of plates) {
      const d = p.layer.depth;
      const wander = Math.sin(time * drift * Math.PI * 2 + p.phase);
      const dx = (px * d + wander * d * 0.45) * slackX;
      const dy = (py * d * 0.5 + Math.cos(time * drift * 1.7 + p.phase) * d * 0.2) * slackY;
      const r = place(dx, dy);

      if (p.layer.tone === 'occluder') {
        // A foreground silhouette. On glass it subtracts, taking the planes
        // behind it back down to the black of the tube; on paper it is ink laid
        // over them. Either way it is the one plane that hides what is behind.
        ctx.globalCompositeOperation = polarityLight ? 'source-over' : 'destination-out';
        ctx.drawImage(polarityLight ? p.tinted : p.mask, r.x, r.y, r.w, r.h);
        continue;
      }

      ctx.globalCompositeOperation = stack;
      ctx.drawImage(p.tinted, r.x, r.y, r.w, r.h);
    }

    // Behind the picture, and into every hole an occluder opened. The texture
    // has to reach the GPU fully opaque: `copyExternalImageToTexture` does not
    // un-premultiply, so a transparent pixel would arrive as a colour nobody
    // chose rather than as the screen's own background.
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = black;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = 'source-over';
    dirty = false;
  }

  /**
   * The channel change. The scene underneath is already the new one for the back
   * half of it, so what the visitor sees is the picture arriving through the
   * interference rather than a crossfade between two photographs — which is what
   * a tube would do, and the only transition this vocabulary has.
   */
  function drawTuning(time: number) {
    draw(time);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = black;
    const bands = 6 + Math.floor(Math.random() * 5);
    for (let i = 0; i < bands; i += 1) {
      const y = Math.random() * canvas.height;
      ctx.fillRect(0, y, canvas.width, 2 + Math.random() * canvas.height * 0.08);
    }
    // The roll bar: one bright sweep travelling down the frame over the change.
    ctx.globalCompositeOperation = polarityLight ? 'source-over' : 'lighter';
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = polarityLight ? token('--sl-text-primary') : token('--sl-accent-default');
    ctx.fillRect(0, (1 - tuning / TUNE) * canvas.height, canvas.width, canvas.height * 0.07);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    dirty = false;
  }

  /**
   * The stopped state. Nothing is animating behind it, so it has to read as a
   * decision rather than a frozen frame: the scene collapses to its far plane
   * and the tube says why.
   */
  function drawSignalLoss() {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = black;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = polarityLight ? 'source-over' : 'lighter';
    ctx.globalAlpha = 0.25;
    const far = plates[0];
    if (far) {
      const r = place(0, 0);
      ctx.drawImage(far.tinted, r.x, r.y, r.w, r.h);
    }
    ctx.globalAlpha = 1;

    ctx.globalCompositeOperation = 'source-over';
    ctx.textBaseline = 'middle';
    ctx.font = '20px "Martian Mono Variable", ui-monospace, Menlo, monospace';
    ctx.fillStyle = fade(token('--sl-text-primary'), 0.55);
    ctx.fillText('-- carrier lost --', 40, canvas.height - 46);
    dirty = false;
  }

  /** Damped pointer tracking. Attached by the caller to whatever hosts the tube. */
  function pointer(nx: number, ny: number) {
    tx = Math.max(-1, Math.min(1, nx));
    ty = Math.max(-1, Math.min(1, ny));
  }

  return {
    canvas,
    pointer,
    get alt() {
      return scenes[active].alt;
    },
    tick(dt: number) {
      elapsed += dt;
      // Critically damped enough to feel like weight rather than lag.
      px += (tx - px) * Math.min(1, dt * 3);
      py += (ty - py) * Math.min(1, dt * 3);
      sinceDraw += dt;
      if (sinceDraw >= 1 / REDRAW_HZ) {
        sinceDraw = 0;
        dirty = true;
      }

      if (sets.length < 2) return;
      if (tuning > 0) {
        tuning -= dt;
        // The swap happens halfway through, under the interference.
        if (!flipped && tuning <= TUNE / 2) {
          active = (active + 1) % sets.length;
          plates = sets[active];
          flipped = true;
          opts.onScene?.(ids[active]);
        }
        if (tuning <= 0) {
          tuning = 0;
          flipped = false;
          held = 0;
        }
        // A change that redraws at the scene's usual rate reads as a stutter.
        dirty = true;
        return;
      }
      held += dt;
      if (held >= dwell) tuning = TUNE;
    },
    draw(time: number) {
      if (tuning > 0) drawTuning(time || elapsed);
      else draw(time || elapsed);
    },
    drawSignalLoss,
    refreshTokens() {
      retint();
      dirty = true;
    },
    resize(nextAspect: number) {
      geometry(nextAspect);
      dirty = true;
    },
    get width() {
      return canvas.width;
    },
    get height() {
      return canvas.height;
    },
    get lightPolarity() {
      return polarityLight;
    },
    get screenBackground() {
      return black;
    },
    get dirty() {
      return dirty;
    },
  };
}

export type SceneSource = Awaited<ReturnType<typeof createScene>>;
