# Sondalab site — CRT hero terminal: design & build spec

> **What is this file.** The record of what was built for the hero of the
> Sondalab public website (`sondalab.eu`): a WebGPU CRT terminal that types the
> site's claim and streams the operator novellas. Audience: the maintainer and
> any agent editing the site. Owner: Marcello Barile. Companions:
> `docs/specs/2026-08-24-sondalab-site-design.md` is the site-wide contract this
> inherits from (stack, design-system tier, audit gate); the novella text is
> `src/lib/novellas.ts`; the design system lives in `sondalab-ai/sondalab-ui`,
> consumed here as `@sondalab/ui-kit`.
>
> This spec was written **after** the work, from a prototype the owner approved
> visually. It describes what exists, not what was planned.

**Status.** `Delivered` = merged to `main` and live. This feature is
**PoC implemented (not delivered)**: complete on `feat/crt-hero`, not merged.

## What it is

The hero is a cathode-ray tube. A curved, refracting glass faceplate sits over a
phosphor screen that types the site's own copy — eyebrow, claim, tagline — once,
and then streams one chapter of the operator novella at a time: type it, hold
ten seconds, wipe it, move to the next of six, forever.

## How the text gets into a shader

The terminal's content is drawn on an offscreen 2D canvas
(`src/lib/crt-terminal.ts`) and uploaded to a texture with
`copyExternalImageToTexture`, re-uploaded only when a character is revealed
rather than every frame. The shader (`src/lib/crt-shader.ts`) samples that image
and turns it into a tube. The text layer knows nothing about the screen
simulation: font, wrapping and colour are ordinary JavaScript.

## Load-bearing decisions

- **The fallback is the default state, not a branch.** The server renders
  today's hero — HTML copy plus the Canvas2D `GlowField` — and the tube appears
  only after `init()` resolves, at which point `TerminalField` sets
  `data-crt="on"` on `.hero`. Missing `navigator.gpu` and a refusing adapter
  both leave the page exactly as it is now. Verified both ways; see below.
- **Colour comes from tokens, read at runtime.** `scripts/audit.mjs` runs
  `sl-audit` over `<style>` blocks only, so a literal colour in a shader or in
  the text layer would pass the gate while breaking the design-system contract.
  Every hue is read with `getComputedStyle` from `--sl-accent-default`,
  `--sl-accent-depth`, `--sl-text-primary` and `--sl-bg-canvas`, and re-read on
  theme change via a `MutationObserver` on `data-sl-theme`.
- **The tube is dark in both themes; only the surround follows the canvas.** A
  lit phosphor screen is a dark object in a bright room. So the light theme does
  not recolour the screen — it recolours what surrounds it. The consequence is
  that the tube's ink cannot be `--sl-text-primary`, which is near-black in the
  light theme: it is **whichever neutral token is the light one**
  (`--sl-text-primary` on dark, `--sl-bg-canvas` on light), with the secondary
  and muted tints derived by dimming that one colour towards the tube's black.
- **The calls to action stay real HTML.** The prototype painted
  `[ See what we wire ]` into the terminal; that shipped as a real `<a>` instead.
  A button drawn inside a shader is not focusable, not indexable, and not
  readable by a screen reader. The claim, eyebrow and tagline remain in the DOM
  and are hidden with `clip-path: inset(50%)` when the tube is live —
  `display: none` and `visibility: hidden` would drop the page's headline out of
  the accessibility tree.
- **No `prefers-reduced-motion` gate**, per the standing decision recorded in
  `scripts/motion-gate.mjs`.
- **The loop is stopped, not throttled, when nobody is watching.** A fullscreen
  shader with a couple of dozen texture taps per pixel is real GPU work, so
  `FrameLoopHandle.stop()` is called outright when the hero leaves the viewport
  (`IntersectionObserver`) or the tab loses focus (`visibilitychange`, `blur`).
  Before stopping it renders one last frame carrying a static **SIGNAL LOSS**
  screen, which the canvas then keeps showing for free — a deliberate state
  rather than a frozen frame. Measured with a `requestAnimationFrame` counter:
  240 callbacks per 2 s with the hero in view, 120 scrolled away, 240 again on
  return. The residual 120 is `GlowField`'s own loop, still ticking but no
  longer painting.
- **`GlowField` stops painting when it is not on screen.** It was repainting a
  full-canvas blur every frame while sitting under `display: none` behind the
  tube — a larger waste than the thing this change set out to fix. Canvas2D
  paints per 2 s went from 120 to 0 in that state.
- **Device pixel ratio capped at 1.25**, matching `GlowField.astro:26`.
- **`vgpu@0.3.1` pinned exactly.** First published 2026-05-26, twenty releases in
  roughly three months; a minor bump on a 0.x moving this fast needs the full
  visual check, so it does not float.
- **No WGSL bundler plugin.** The shader is an inline template string, so
  `astro.config.mjs` is untouched and the build surface is unchanged.

## Cost, measured

- **Eager JavaScript on the home page: +7.3 KB gzipped** (3.6 KB → 10.9 KB).
  That is `TerminalField`'s own script: the text layer and the shader source.
- **`vgpu` is a separate 42.8 KB gzipped chunk, loaded conditionally.** The
  import sits behind the `navigator.gpu` guard and Astro emits no
  `modulepreload` for it, so a browser without WebGPU never fetches it.
- **60 fps** at 1440x900 and at 375x812 with device pixel ratio 2, on Apple
  Silicon. Untested on integrated graphics and on Windows.

## Verified

`npm run build`, `npm run check`, `npm run audit`, `npm run motion-gate` all
exit 0. Screenshots at 1440 and 375 in both themes with zero horizontal overflow
on the document. Fallback verified twice: with `navigator.gpu` forced
`undefined`, and with `requestAdapter()` forced to return `null` so `init()`
rejects — in both cases `data-crt` stays unset, `GlowField` stays visible, the
claim stays visible, and no uncaught error reaches the console.

`scripts/shoot.mjs` gained a `SHOOT_SETTLE` environment variable: its 800 ms
wait was tuned for the glow field and is far too short for a hero that types its
own header. Use `SHOOT_SETTLE=17000` for the home page.

## Known compromises

- The tracking-error band occasionally smears a line of prose the visitor is
  reading. It is the effect that was asked for, and it is tunable in `LOOK`
  (`trackingAmount`).
- At 375 the terminal drops to 46 columns and the `tail -f` path truncates at
  the tube's edge. That reads as a terminal rather than as a defect, but it is a
  choice, not an accident.
- The claim is monospace and smaller than the display serif it replaces. A
  terminal cannot carry oversized serif type and stay a terminal. If the claim
  must be large, the route is to keep it in HTML above the canvas and give the
  tube only the log.

## Out of scope

- The rest of the page. Only `src/components/Hero.astro` changes, plus the two
  new library modules and the new component.
- Any design-system change: no `@sondalab/ui-kit` bump, no new registered accent.
