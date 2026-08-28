# Adding a WebGPU surface to another page

> **What is this file.** The reusable pattern behind the hero's CRT terminal,
> written so a second WebGPU surface on another page does not have to rediscover
> it. Audience: the maintainer and any agent extending the site. Owner: Marcello
> Barile. Companions: `docs/specs/2026-08-28-crt-hero-design.md` records what the
> hero specifically is; the working code is `src/components/TerminalField.astro`,
> `src/lib/crt-terminal.ts` and `src/lib/crt-shader.ts`.

Everything below was learned by building the hero. The traps are listed because
each one cost a debugging cycle, not because they are obvious.

## The shape

1. **An Astro component owning a `<canvas>`**, hidden by default.
2. **A plain-TypeScript module for the content**, drawn on a 2D canvas and
   uploaded as a texture. It knows nothing about the shader.
3. **A shader module exporting an inline WGSL template string.** No bundler
   plugin: `@vgpu/wgsl`'s Vite loader exists, but a template string keeps
   `astro.config.mjs` untouched and the build surface unchanged.
4. **The page's normal markup underneath**, which is what a visitor gets until
   the GPU actually answers.

## The fallback is the default state

Render the ordinary page server-side. Mount nothing. Only after `init()`
resolves, set an attribute (`data-crt="on"`) that CSS keys off. Guard twice:

```ts
if (!('gpu' in navigator) || !navigator.gpu) return;
let gpu;
try { gpu = await init(); } catch { return; }
```

`navigator.gpu` alone is not enough — the adapter can refuse, and the device can
be lost. Test both: force `navigator.gpu` to `undefined`, and separately force
`requestAdapter()` to return `null`.

**Keep the enhancement purely additive.** The hero's CSS is insertions only
against `main`, checked with `git diff main --stat`. An earlier edit replaced a
slice of the stylesheet and took `.hero__claim`, `.hero__tagline`,
`.hero__actions` and `.hero__ghost` with it — the fallback was broken for two
commits without showing, because those rules are unused while the GPU path runs.

## Colour has to come from tokens at runtime

`scripts/audit.mjs` runs `sl-audit` over `<style>` blocks only. A literal colour
in a shader or in a canvas-drawing module **passes the gate while breaking the
design-system contract**. Read every hue with `getComputedStyle` from
`--sl-accent-default`, `--sl-accent-depth`, `--sl-text-primary`,
`--sl-bg-canvas`, and re-read on theme change:

```ts
new MutationObserver(() => refresh())
  .observe(document.documentElement, { attributes: true, attributeFilter: ['data-sl-theme'] });
```

Two things this immediately raises:

- **Which neutral is the light one flips with the theme.** `--sl-text-primary`
  is near-white on dark and near-black on light. If your surface is dark in both
  themes, its ink is *not* `--sl-text-primary`; pick whichever token is light in
  the current theme.
- **Derive tints, don't invent them.** Fade towards the surface's own
  background rather than towards black, or the mid tones drift off-palette.

## Getting content into a shader

There is no high-level texture-from-canvas helper. Use the core escape hatch:

```ts
const texture = gpu.device.createTexture({
  size: [c.width, c.height], format: 'rgba8unorm',
  usage: ['texture_binding', 'copy_dst', 'render_attachment'],
});
const rawDevice = (gpu.device as any).gpu ?? gpu.device;
const rawQueue = rawDevice.queue?.gpu ?? rawDevice.queue;
rawQueue.copyExternalImageToTexture(
  { source: c }, { texture: (texture as any).gpu ?? texture }, [c.width, c.height],
);
```

Bind it with `effect.set({ name_tex: texture, name_samp: sampler })`; the WGSL
side is `@group(0) @binding(1) var name_tex: texture_2d<f32>;`. Re-upload only
when the source actually changed, not every frame.

**`resolution` is not auto-filled.** Pass it explicitly every frame from
`canvas.width/height`. Leaving it at zero makes `aspect` zero, which collapses
every pixel's x coordinate — the symptom is horizontal bands, not a blank screen.

## Stop the loop, don't throttle it

`frameLoop` returns a `FrameLoopHandle` with `stop()`. Use it when the surface
leaves the viewport (`IntersectionObserver`) **and** when the tab loses focus
(`visibilitychange` *and* `blur`/`focus` — the first alone misses a click into
another window). Render one last frame carrying a deliberate stopped-state
screen; the canvas keeps showing it for nothing.

Re-anchor your clock on restart, or the time spent stopped is consumed in a
single jump when the surface comes back.

Verify with a `requestAnimationFrame` counter rather than by eye:

```js
window.__raf = 0;
const o = window.requestAnimationFrame.bind(window);
window.requestAnimationFrame = (cb) => o((t) => { window.__raf++; return cb(t); });
```

The hero measures 240 callbacks per 2 s in view, 120 away, 240 on return. The
same counter is what revealed `GlowField` repainting a full-canvas blur while
sitting under `display: none`.

## Resizing

If the texture matches the surface's aspect, a resize that does not re-derive it
stretches the glyphs. And when the grid is character-based, **rows are a
function of columns**: `rows = cols × (cellW / cellH) ÷ aspect`. Fixing the
column count starves a wide screen of rows — the hero's novella once got a
single line this way. Solve for columns from a target row count instead.

Carry progress across a resize as a **fraction**, never a raw character count:
re-wrapping changes the totals, so a raw count jumps the reader.

## Traps that cost a cycle each

- **Astro scopes component CSS to its own template.** `.hero[data-crt='on']
  .glow-field` never matched, because `.glow-field` is rendered by
  `GlowField.astro`. Whichever half of the selector belongs to another component
  needs `:global()`.
- **A `display: none` element measures 0×0.** Measuring the canvas before
  revealing it produced a texture sized for an absurdly tall screen. Measure the
  container.
- **`.glitch` owns `::before` and `::after`** (it renders `attr(data-text)`
  there), so a glitching element cannot also use them for decoration. The hero's
  brackets live in the text instead.
- **Declaration order in the component script.** A `let` used by a closure
  defined above it throws `Cannot access '...' before initialization` only at
  runtime, and only on the GPU path.

## Accessibility and indexing

Interactive controls stay real HTML on top of the canvas. A button painted
inside a shader is not focusable, not indexable and not readable by a screen
reader. Text the shader draws should still exist in the DOM: hide it with
`clip-path: inset(50%)`, never `display: none` or `visibility: hidden`, both of
which drop it from the accessibility tree.

**Measure contrast for anything sitting on the surface**, in both themes, with
the real rendered background — the shader's vignette and reflections change it.
Sample the region with the element hidden, then compute the ratio; the hero's
calls to action measured 1.06:1 on the light theme before this was checked.

## Verification checklist

`npm run build`, `npm run check`, `npm run audit`, `npm run motion-gate`, then
screenshots at 375 and 1440 in both themes with zero horizontal overflow, plus
the fallback captured separately. Use `SHOOT_SETTLE=17000 node scripts/shoot.mjs`
for surfaces that animate themselves into place.

State two numbers plainly: the gzipped JavaScript delta, split into what every
visitor downloads and what only WebGPU visitors do, and the frame rate on the
smallest viewport you support. The hero's figures are Apple Silicon only;
integrated graphics and Windows remain unmeasured.
