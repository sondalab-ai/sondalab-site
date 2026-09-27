# Sondalab site — method section redesign spec

> **What is this file.** The implementation contract for the redesigned
> "The method" section on the home page (`src/components/Method.astro`).
> Audience: the maintainer and any agent editing the site. Owner: Marcello
> Barile. Companions: `docs/specs/2026-08-24-sondalab-site-design.md` is the
> site-wide contract this one inherits from (stack, design-system tier, audit
> gate); `docs/specs/2026-08-29-crt-scenes-design.md` covers the scene art this
> section reuses. The approved mockup was `.audit/mock/method-dots.html`
> (throwaway, not committed).

## Why

The owner found the current section unconvincing for two reasons (2026-09-26):

- **The message.** It read as an internal note, and addressed the visitor as
  if they were part of Sondalab. Visitors consume the tools; the section
  describes how Sondalab builds them.
- **The form.** It was the third section in a row built from glass cards with
  large glass numerals, after the stance and the tools.

## Decisions (owner, 2026-09-26)

- **Copy in Sondalab's voice**, three promises each with one line of proof.
- **Layout: a process rail.** An accent line joins three nodes, one per
  promise, labelled Intent, Work, Check. No glass cards, no glass numerals, no
  goo on this section.
- **Imagery: the site's own scene art rendered as dots.** One small noir
  vignette per promise, made from crops of the existing dark scene renders.
- **Constant, subtle motion.** Dots gather from a scatter when the vignette
  scrolls into view, then keep floating gently around their place.

## Copy

| Element | Text |
|---|---|
| Eyebrow | `03` — The method (unchanged) |
| Headline | We run on our own tools first. |
| Lede | Sondalab is built by directing agents with the same tools we ship. **What reaches you has already carried our own work.** |
| 01 · Intent | **We write the intent first.** Every change starts as a written decision, before an agent touches a file. |
| 02 · Work | **The machines show their work.** Each step is visible while it runs and traceable afterwards, so nothing lands unexplained. |
| 03 · Check | **Drift doesn't ship.** A design audit and a content schema stop the build on any mismatch. This page passed both. |

## Layout

- Two columns from 48rem up: head (eyebrow, headline, lede) at 4fr, rail at
  8fr. Below 48rem, one column.
- The rail is an ordered list. A 2px vertical line runs from the first node's
  centre to the last one's, drawn per step so it never runs past the last node
  whatever the last item measures, fading from `--sl-accent-default` to 15% of
  it across the two segments. Each node is a 16px
  ring (2px `--sl-accent-default` border, `--sl-bg-canvas` fill, a 6px halo at
  14% accent). Node and line share one centre: both pseudo-elements set
  `box-sizing: border-box`, because the site's `* { box-sizing }` rule does not
  match pseudo-elements, and a 16px ring with a 2px border otherwise renders
  20px wide and sits 2px off the line.
- Each rail item: step number and label (mono, accent number, secondary
  label), the promise in the display face at `clamp(1.5rem, 1rem + 1.8vw,
  2.3rem)`, the proof in secondary text, and the vignette. From 72rem it sits
  to the right of the text at 280px; below 72rem it sits under the text, 240px
  from 48rem and 180px under that. (Beside the text at 48rem it squeezed the
  promise to 70px; measured.) Each node is level with its step label.
- The section keeps its background plate (`--bed`, `public/backdrops/method-*.svg`).

## Vignettes

| Promise | Source render | Crop (px, on the render scaled to 900px wide) |
|---|---|---|
| 01 Intent | `kinship/dark/02-mid` | x 450, y 50, size 330 (the man at the table under the lamp) |
| 02 Work | `kinship/dark/02-mid` | x 130, y 70, size 330 (the robot at the same table) |
| 03 Check | `uprising/dark/02-mid` | x 200, y 170, size 300 (the rank with raised hands before the fires) |

- The renders live in `.scenes-raw/`, which is git-ignored. The three crops are
  committed as greyscale images in `src/assets/method/` (`intent`, `work`,
  `check`), produced once by `scripts/make-method-crops.mjs` from the raw renders,
  so a clone builds without `.scenes-raw/`.
- The same crops serve both themes. In the dark theme the dots are light
  (`--sl-text-primary`) on the canvas; in the light theme the same token is
  ink, so the vignette prints as ink dots on paper.

## Rendering

- A 72×72 grid per vignette. Each crop is sampled once: luminance, stretched to
  the crop's own 2nd–99th percentile, passed through a smoothstep S-curve, and
  faded to zero over the outer 30% of a circle inscribed in the square. Cells
  below 0.06 draw nothing.
- A dot's radius follows its light (`0.5 × cell × L^0.6`, floor 0.35px), its
  alpha is `0.25 + 0.75 × L`. Colour is read from the tokens, not hard-coded,
  and re-read when `data-sl-theme` changes.
- Motion, in order:
  - **Assemble.** When a vignette is 40% in view for the first time, its dots
    move from random positions to their places over about 1.1s each, eased out,
    with a delay that grows from the centre outwards (up to ~0.6s).
  - **Float.** Afterwards each dot orbits its place, under half a cell
    (`0.45 × cell`), at its own phase, on periods of roughly 11 and 15 seconds.
  - **Shimmer.** Each dot's light breathes by ±7.5% on its own phase.
  - **Scanline.** A faint band of extra light crosses each vignette every 6
    seconds.
- One `requestAnimationFrame` loop drives all three vignettes. It runs only
  while at least one vignette is near the viewport and the page is visible,
  and stops otherwise.
- **No reduced-motion gate.** The site animates for everyone by the owner's
  decision of 2026-08-26 (see `scripts/motion-gate.mjs`, which fails the build
  on any `prefers-reduced-motion` query in `src/`). The float is kept under half
  a cell and the shimmer under ±7.5% so the constant motion stays ambient.
- The canvases are decorative (`aria-hidden="true"`); the promise text carries
  the meaning. Without JavaScript the vignettes are empty and the section
  still reads completely.
- `data-sl-theme="high-contrast"`: the vignettes are hidden, like the kit's
  effects families.

## Code shape

- `src/lib/dot-scene.ts`: pure functions (sample a crop into dots; compute a
  dot's position, radius and alpha at time `t`), unit-tested with `node --test`.
- `src/lib/dot-scene-runtime.ts`: the canvas, observers, theme and motion
  wiring, used by the component's `<script>`.
- `src/components/Method.astro`: markup, copy and styles. Its glass cards, goo
  field, glass numerals and their CSS go.

## Verification

- Gates: `npm test`, `npm run audit` (0 R-violations), `npm run kit-names`,
  `npm run motion-gate`, `npm run check`, `npm run build`.
- A puppeteer probe against a served build: the three canvases draw non-empty
  pixels in both themes; each node's centre matches the line's within 0.5px;
  the loop stops when the section is scrolled far out of view; promise and proof text is at least 4.5:1 in both themes; no horizontal scroll
  at 390px.
- Screenshots of the section at 1440, 768 and 390px in both themes.

## Out of scope

- New scene art, or the ComfyUI prompts in `.audit/mock/gen-dots.mjs`.
- The stance and tools sections, which keep their glass cards.
- The kit's ambient-aurora budget and card hover growth (open decisions from
  the kit 0.17 review).
