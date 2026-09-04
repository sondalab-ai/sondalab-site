# Light-theme scene plates — handoff

> **What this file is:** the remaining work on the CRT scenes' light-theme
> artwork, written for an agent picking it up in a fresh session with no memory
> of how it got here. Audience: whoever renders the plates and finishes the
> wiring. Owner: the site maintainer. Companion files — `docs/scene-art-prompts.md`
> is the artwork contract (the payloads live there and the generator parses
> them); `docs/specs/2026-08-29-crt-scenes-design.md` is the original scene
> design.
>
> Steps use checkbox (`- [ ]`) syntax. **Do not start at step 1 without reading
> "What is already done" — most of the code is written and committed.**

**Goal:** the light theme shows daylight solarpunk artwork instead of the night
plates, which on paper print as a tonal negative.

**State at handoff:** all the code and all 24 payloads are committed at
`eb3ab3d`, which is **one commit ahead of `origin/main` and unpushed**. No light
plate has been rendered. Every scene currently falls back to its night set on
the light theme, which is exactly the behaviour the site had before — nothing is
broken and nothing is half-shipped.

---

## Why this exists

The tube follows the theme. On dark it is a lit screen and the plates are added
together as emission. On light it is paper, and `src/lib/crt-shader.ts:91-97,157-162`
lays the picture down as **ink** — plate luminance becomes ink coverage.

A night scene put through that comes back as a **tonal negative**: the black sky
prints as bare paper, the fires and the machines print as black. It is not dim,
it is inverted, and no gain or exposure setting fixes it. Two things were tried
and rejected before this approach was chosen (see
`~/.claude/debug-decisions/-Users-marcello.barile-src-mine-ai-tools-sondalab-site/2026-09-04-1552-give-light-theme-its-own.md`):

- a `lightScale` knob — only changes how faded the negative is;
- `paper={false}`, keeping the tube a lit dark screen on the light theme — it
  works and looks good, but the maintainer chose real daylight artwork instead.

Alongside it, the twelve **dark** payloads were rewritten. Two complaints
survived the first render: the point of some scenes was not legible (`kinship`'s
people-and-machine-at-one-table worst of all) and the set read as unadventurous.
Both were in the wording, not the model. The five rules that came out of it are
in `docs/scene-art-prompts.md` under *What the first set got wrong*. **The dark
set therefore needs re-rendering too** — the files on disk are from the old
payloads.

---

## What is already done (committed, verified, do not redo)

- `src/lib/scenes.json` / `src/lib/scenes.ts` — optional `light: SceneLayer[]`
  and `lightAlt` alongside `layers`. Additive: a scene without them behaves as
  before.
- `src/lib/crt-scene.ts` — picks the set from `data-sl-theme` at first paint,
  lazily fetches the other polarity on the first theme change, caches both,
  remembers a variant that failed to load so a toggled theme does not re-request
  404s, and falls back to the dark set when the light plates are absent. `alt`
  follows theme *and* channel; `onScene` now passes `(id, alt)`.
- `src/components/CrtScene.astro` — optional `flatLight` prop, two `<Image>`s
  toggled by `[data-sl-theme]` under a `crt-scene--dual` class, one visually
  hidden accessible name for the pair. **Not yet passed by any page.**
- `scripts/make-scene-plates.mjs` — `--theme dark|light`, per-theme budgets,
  per-theme raw paths, forced inversion for light emissive plates.
- `scripts/make-scene-flats.mjs` + `scripts/scene-painters.js` — a paper
  compositing mode whose colours are read from
  `node_modules/@sondalab/ui-kit/themes/light.css` rather than copied; light
  sets whose plates are missing are skipped with a message, not an error.
- `scripts/make-scene-placeholders.mjs` — covers both polarities and `kinship`,
  with `--variant dark|light` so a test run cannot clobber real artwork.
- `docs/scene-art-prompts.md` — 24 payloads (12 revised dark, 12 new light),
  the light budget table, the authoring rules, and updated install/checklist
  sections.

Verified at `eb3ab3d`: `astro check` 0 errors, `npm run audit` 0 violations,
`npm run motion-gate` clean, `npm run build` 35 pages, `/apparel` contrast
unchanged (dark 12.62:1 / 7.93:1, light 10.64:1 / 5.06:1). The theme swap was
exercised end to end with light placeholders, which were then deleted.

---

## Global constraints

- **Language:** code, comments, commit messages, doc prose in English. Replies
  to the maintainer in Italian.
- **Colour:** every colour in an authored `<style>` block must resolve to a
  `--sl-*` token. `npm run audit` fails otherwise. The plates carry no colour at
  all — they are greyscale and tinted at runtime.
- **Never commit placeholder plates.** `npm run scenes:placeholders` overwrites
  real artwork; always pass `--variant light` while the dark set is finished
  work, and delete what it wrote before committing.
- `.scenes-raw/` (12 MB, gitignored) holds every untouched render, now under
  `.scenes-raw/<scene>/<theme>/<plate>.png`. It is the reason a re-level costs
  seconds instead of an hour. **Do not delete it.**
- The site never consults `prefers-reduced-motion`; `npm run motion-gate`
  enforces that.
- Do not rename plates without updating `src/lib/scenes.json` — the generator
  finds a plate's destination by matching the filename against that file.

---

## The work

### 1. Render — needs ComfyUI

ComfyUI runs on the maintainer's LAN box; the last known host was
`http://192.168.88.212:8188`, with the open Ideogram 4 weights installed. The
script verifies the model files against `/object_info` before starting and exits
if they are missing.

Budget roughly five minutes per plate. **Do not spend two hours in one go.**

- [ ] **Legibility gate first.** Render one `02-mid` per scene per theme — six
      plates, about thirty minutes:
      ```sh
      npm run scenes:plates -- --host http://192.168.88.212:8188 --plate 02-mid
      npm run scenes:plates -- --host http://192.168.88.212:8188 --plate 02-mid --theme light
      ```
      Then look at each one and answer, without having read the brief: *are the
      people and the machine doing the same thing?* If not, the payload is still
      wrong and no amount of levelling fixes it — fix the wording and re-render
      these six before going further. This is the check the first set failed.
- [ ] **The dark set**, against the revised payloads:
      `npm run scenes:plates -- --host <host> --resume`
- [ ] **The light set**: `npm run scenes:plates -- --host <host> --theme light --resume`
- [ ] Inspect the bottom-right corner of every plate at high exposure. The model
      signs its work — four of the first twelve carried a fabricated monogram.
      The script wipes that corner on emissive plates, but confirm it took.

`--resume` reuses any raw already on disk, so an interrupted run is cheap to
restart. ComfyUI serves HTTP from the process that runs the sampler and stops
answering mid-render; every request already retries with backoff.

### 2. Calibrate — no GPU

The light budgets in the brief (`70 / 120 / 255 / 140`) are a **first cut**. The
light path tonemaps in emission space, so a heavier ink load saturates rather
than deepens and local contrast is not monotonic in the budget: these are
measured on screen, not calculated.

- [ ] `npm run scenes:plates -- --theme light --from-raw --levels`, look at the
      result, adjust `BUDGET.light` in `scripts/make-scene-plates.mjs` and in the
      brief's table, repeat. Seconds per pass.
- [ ] Same for the dark set if the revised payloads moved its white points:
      `npm run scenes:plates -- --from-raw --levels`
- [ ] **Light gains are separate data.** The dark gains in `src/lib/scenes.json`
      (structure 1, depth 1, accent 0.35 / 0.3) do not transfer. Set the light
      ones from what the screen and the contrast probe say.

### 3. Finish the wiring — needs the plates

- [ ] `npm run scenes:flats` — it will now build `<scene>-flat-light.webp`
      instead of skipping.
- [ ] Pass the light composites to the tube. Two edits, both one line plus an
      import:
      - `src/pages/blog/[...page].astro` → `flatLight={uprisingFlatLight}`
      - `src/pages/apparel/index.astro` → `flatLight={cityFlatLight}`
- [ ] Re-shoot the blog screenshots if the repo keeps any — the band's starting
      scene has been random since `ce0ca33`, so they are no longer deterministic.

### 4. Verify

- [ ] `npm run check && npm run audit && npm run motion-gate && npm run build`
- [ ] `npm run contrast -- http://localhost:4321/apparel/ .ap-open__h .ap-open__lede`
      — floors are 3:1 (heading) and 4.5:1 (lede) and must hold on **both**
      themes. `city` is the constrained scene: it is the only one carrying text
      on its glass, so expect more than one round on it.
- [ ] Open `/blog/` and `/apparel/` in both themes in a real browser. The blog
      band changes channel every 14 s between `uprising` and `kinship`; toggling
      the theme must swap the artwork *and* the canvas `aria-label` within a
      second or two, and toggling back must restore it.
- [ ] Push, and confirm the deploy. `main` is currently one commit ahead of
      `origin/main`.

---

## Gotchas that cost time the first time round

- **Every element needs a `bbox`.** Of the first twelve payloads, the only two
  elements left un-boxed were the only two that landed wrong — `uprising`'s
  embers became a plume up the centre and `city`'s rain gathered on the left,
  the half that sits under the heading. Left free, the model centres.
- **Ideogram 4 accepts no negative prompt.** Every exclusion has to be phrased
  positively; the brief has a table saying where each one went.
- **The frame is not in the payload.** "The JSON prompt does not control output
  dimensions" — the size lives on the nodes, and this is why the first hand
  attempts came back tall and narrow.
- **Light plates are authored as ordinary daylight pictures**, on a *pure white*
  ground, and inverted by the script. Do not pre-invert and do not ask the model
  for an ink-density map: it will draw something that looks like a negative
  rather than an inverted picture. Occluders are the exception — they are asked
  for as black-on-white and flipped by the existing mean-luminance check.
- **On paper the accent plane is not the light source.** Sunlight is the absence
  of ink and cannot be drawn. The light `04` plates carry what is *ochre* —
  terracotta, banner cloth, dry husks, wet channel stone — because that plane is
  tinted with `--sl-accent-default`, a burnt ochre on the light theme.
- **PageSpeed sits in front of production** and both rewrites HTML and caches
  `/scenes/` files under their fixed filenames. After a deploy the old plates
  can persist; `x-original-content-length` on the origin proves what was
  actually served. Routing the plates through `astro:assets` would give them
  content hashes and remove the class of problem — noted, not done.

---

## Open follow-ups, not blocking

- [ ] The flat composites are built from the plates and know nothing about the
      runtime gains, so the static fallback is mixed differently from the live
      tube. Either accept it or fold the gains into `flatten()`.
- [ ] `uprising/01-far` carried seed 7 from a manual test while its siblings
      carried seed 1, because `--resume` reused that raw. Harmless, but the set
      is not seed-coherent.
- [ ] `### Checking a payload before spending a call` now sits under `## Route D`
      in the brief after the restructure. It is generic advice and reads fine
      where it is, but it belonged to Route C.
