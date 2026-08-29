/**
 * The plumbing behind every CRT surface on the site, with the content left out.
 *
 * The hero's terminal and the scene fields on /blog and /apparel differ only in
 * what they draw on a 2D canvas; the double-guarded boot, the texture upload,
 * the relayout, the theme observer and the run/stop policy are identical. They
 * were written once for the hero and are extracted here so a second surface does
 * not re-earn the traps documented in docs/webgpu-surfaces.md.
 *
 * A source knows nothing about the shader. It owns a canvas, redraws it when it
 * feels like it, and reports which polarity the tube should be in.
 */

/** What a surface needs from whatever is drawing its picture. */
export interface CrtSource {
  readonly canvas: HTMLCanvasElement;
  readonly width: number;
  readonly height: number;
  /** True when the canvas has changed since the last upload. */
  readonly dirty: boolean;
  /** True when the tube is a paper readout rather than a lit screen. */
  readonly lightPolarity: boolean;
  /** The colour the source fills its background with, as a hex string. */
  readonly screenBackground: string;
  /** Advance by `dt` seconds. */
  tick(dt: number): void;
  /** Repaint the canvas for absolute time `time`. */
  draw(time: number): void;
  /** Paint the deliberate stopped state left behind when the loop halts. */
  drawSignalLoss(): void;
  /** Re-read design-system tokens after a theme change. */
  refreshTokens(): void;
  /** Re-derive geometry for a new tube aspect. */
  resize(aspect: number, narrow: boolean): void;
}

export interface CrtSurfaceOptions {
  canvas: HTMLCanvasElement;
  /** Measured for the aspect, and given `data-crt="on"` once the GPU answers. */
  host: HTMLElement;
  /** The WGSL module to run. */
  shader: string;
  /** Frozen look constants for this surface; scenes and terminals differ. */
  look: Record<string, number>;
  /**
   * Built once the viewport class is known, because a source usually needs the
   * aspect to lay itself out and the canvas is still `display:none` here.
   */
  createSource(aspect: number, narrow: boolean): CrtSource | Promise<CrtSource>;
  /** Blur taps, narrow and wide. Fewer on a phone. */
  glowTaps?: [number, number];
  /**
   * Edge falloff, light and dark. A dark tube takes a deep one; on paper the
   * same amount reads as dirt and drops anything sitting on it below contrast.
   */
  vignette?: [number, number];
  /** Ran after the first frame is on screen, for decoration that needs the GPU path. */
  onReady?(source: CrtSource): void | Promise<void>;
}

export interface CrtSurfaceHandle {
  source: CrtSource;
  stop(): void;
}

const NARROW = '(max-width: 40rem)';

function rgb(value: string): [number, number, number] {
  let h = (value || '').trim().replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  // The shader writes its output already gamma-encoded, so the surround is
  // passed in the same space rather than linearised.
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * Bring a CRT surface up, or leave the page exactly as it is.
 *
 * Resolves to `null` on every path where the GPU does not answer — no WebGPU,
 * an adapter that refuses, a device that is lost. The caller does nothing in
 * that case: the server-rendered fallback is already on screen and stays.
 */
export async function mountCrtSurface(
  opts: CrtSurfaceOptions,
): Promise<CrtSurfaceHandle | null> {
  const { canvas, host, shader, look } = opts;
  const glowTaps = opts.glowTaps ?? [6, 12];
  const vignetteFor = (light: boolean) => (opts.vignette ?? [0.1, 0.35])[light ? 0 : 1];

  // `navigator.gpu` alone is not enough: the adapter can refuse, and the device
  // can be lost between the check and the call.
  if (!('gpu' in navigator) || !navigator.gpu) return null;

  const { clock, effect, frame, frameLoop, init, sampler, surface } = await import('vgpu');

  let gpu;
  try {
    gpu = await init();
  } catch {
    return null;
  }

  const root = document.documentElement;
  const isNarrow = () => window.matchMedia(NARROW).matches;

  // Measure the host, not the canvas: the canvas is still `display:none` at this
  // point, so its rect is 0x0 and the source would be sized for an absurdly
  // tall screen.
  const rect = host.getBoundingClientRect();
  const source = await opts.createSource(
    Math.max(0.6, rect.width / Math.max(rect.height, 1)),
    isNarrow(),
  );

  const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
  const surf = surface(gpu, canvas, { dpr: [1, dpr] });
  // Held in a mutable binding: a resize allocates a new one and rebinds it.
  let texture: any = gpu.device.createTexture({
    size: [source.width, source.height],
    format: 'rgba8unorm',
    usage: ['texture_binding', 'copy_dst', 'render_attachment'],
  });
  const samp = sampler(gpu, { minFilter: 'linear', magFilter: 'linear' });

  // There is no high-level texture-from-canvas helper; this is the core escape
  // hatch, and it accepts any CanvasImageSource.
  const rawDevice = (gpu.device as any).gpu ?? gpu.device;
  const rawQueue = rawDevice.queue?.gpu ?? rawDevice.queue;
  const upload = () =>
    rawQueue.copyExternalImageToTexture(
      { source: source.canvas },
      { texture: (texture as any).gpu ?? texture },
      [source.canvas.width, source.canvas.height],
    );

  const params: Record<string, unknown> = {
    ...look,
    // `resolution` is not auto-filled. Leaving it at zero collapses every
    // pixel's x coordinate; the symptom is horizontal bands, not a blank screen.
    resolution: [canvas.width || 1440, canvas.height || 820],
    time: 0,
    glowTaps: isNarrow() ? glowTaps[0] : glowTaps[1],
    polarity: source.lightPolarity ? 1 : 0,
    vignette: vignetteFor(source.lightPolarity),
    surround: rgb(getComputedStyle(root).getPropertyValue('--sl-bg-canvas')),
    screenBg: rgb(source.screenBackground),
  };

  const fx = effect(gpu, shader, { set: { params, term_tex: texture, term_samp: samp } });
  const t = clock(gpu);

  // Follow the theme toggle: every colour comes from a token, so a theme change
  // means re-reading them rather than keeping a second palette.
  new MutationObserver(() => {
    source.refreshTokens();
    params.polarity = source.lightPolarity ? 1 : 0;
    params.vignette = vignetteFor(source.lightPolarity);
    params.screenBg = rgb(source.screenBackground);
    params.surround = rgb(getComputedStyle(root).getPropertyValue('--sl-bg-canvas'));
  }).observe(root, { attributes: true, attributeFilter: ['data-sl-theme'] });

  let onScreen = true;
  let focused = document.visibilityState === 'visible' && document.hasFocus();
  let running = false;

  const showSignalLoss = () => {
    source.drawSignalLoss();
    upload();
    fx.set({ params });
    frame(gpu, (f) => f.pass(surf, fx));
  };

  let resizeTimer = 0;
  const relayout = () => {
    const r = host.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    const narrow = isNarrow();
    source.resize(Math.max(0.6, r.width / r.height), narrow);
    const next = gpu.device.createTexture({
      size: [source.width, source.height],
      format: 'rgba8unorm',
      usage: ['texture_binding', 'copy_dst', 'render_attachment'],
    });
    const previous = texture;
    texture = next;
    params.glowTaps = narrow ? glowTaps[0] : glowTaps[1];
    source.draw(0);
    upload();
    fx.set({ term_tex: texture });
    // A resize while stopped must redraw the stopped screen, not resume.
    if (!running) showSignalLoss();
    (previous as any).destroy?.();
  };
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(relayout, 180);
  });

  host.setAttribute('data-crt', 'on');
  source.draw(0);
  upload();
  // Present it. A surface that mounts below the fold never enters the loop until
  // it is scrolled to, and without this the visitor arrives at a canvas that has
  // never painted — an empty rectangle where the picture is.
  fx.set({ params });
  frame(gpu, (f) => f.pass(surf, fx));

  let lastT = 0;
  let loop: { stop(): void } | undefined;

  // Nobody should pay for a tube they cannot see. A fullscreen shader with a
  // couple of dozen texture taps per pixel is real GPU work, so the loop is
  // stopped outright — not merely skipped a frame at a time — when the surface
  // scrolls away or the tab loses focus, and the screen it leaves behind says so
  // rather than sitting on a frozen frame.
  const advance = () => {
    params.time = t.time;
    params.resolution = [canvas.width, canvas.height];
    const dt = Math.min((t.time as number) - lastT, 0.1);
    lastT = t.time as number;
    source.tick(dt);
    if (source.dirty) {
      source.draw(t.time as number);
      upload();
    }
    fx.set({ params });
  };

  const start = () => {
    if (running) return;
    running = true;
    // Re-anchor the clock, or the time spent stopped is consumed in one jump the
    // moment the surface comes back.
    lastT = t.time as number;
    loop = frameLoop(gpu, (f) => {
      advance();
      f.pass(surf, fx);
    });
  };

  const stop = () => {
    if (!running) return;
    running = false;
    loop?.stop();
    loop = undefined;
    showSignalLoss();
  };

  const sync = () => (onScreen && focused ? start() : stop());

  new IntersectionObserver(
    (entries) => {
      onScreen = entries.some((e) => e.isIntersecting);
      sync();
    },
    { threshold: 0 },
  ).observe(canvas);

  // `visibilitychange` alone misses a click into another window, so the window's
  // own blur and focus are listened for too.
  document.addEventListener('visibilitychange', () => {
    focused = document.visibilityState === 'visible' && document.hasFocus();
    sync();
  });
  window.addEventListener('blur', () => {
    focused = false;
    sync();
  });
  window.addEventListener('focus', () => {
    focused = true;
    sync();
  });

  await opts.onReady?.(source);

  // Starts the loop only if the surface is actually on screen and focused.
  sync();

  return { source, stop };
}
