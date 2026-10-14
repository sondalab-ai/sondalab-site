# SPEXR minisite — design spec

> **What is this file.** The implementation contract for `/spexr/`, a
> long-form product page for SPEXR on sondalab.ai, and for the screenshot
> capture in the spexr repo that feeds it. Owner: Marcello Barile.
> Companions: `docs/specs/2026-08-24-sondalab-site-design.md` (site-wide
> contract: stack, design-system tier, audit gate); `/daos/`
> (`src/pages/daos.astro`) is the structural reference.

## Why

SPEXR is the flagship tile on the home index but has no page beyond the
generic `/products/spexr/` card. DAOS got a long-form page as a research note;
SPEXR needs the product-shaped equivalent: what it does, shown with real,
current screenshots. The screenshots in `spexr/docs/screenshots/` are from
the pre-alpha UI (last committed 2026-07-02) and none shows Darkfactory.

## Decisions (owner, 2026-10-14)

- **Product page, not a research note.** Like `/daos/` in shape, but each
  section sells one feature with a screenshot.
- **Features, in page order:** Specs, Darkfactory (core plus its schedule,
  session search and card browser), Experts, Memory, Smart search, then
  built-in Git and opencode alongside Claude.
- **Fresh screenshots, dark theme only**, taken autonomously.
- **English only.** The rest of the site is English; `/daos/` is the one
  four-language page and stays the exception.

## Part A — capture (spexr repo)

spexr must not be launched on a workstation: `tests/visual` and `tests/e2e`
refuse unless `GITHUB_ACTIONS=true`, because local launches once opened
enough windows to crash the machine. **The guard is not bypassed.** Captures
run on GitHub Actions only.

### A1. A separate marketing capture

- New workflow `.github/workflows/marketing-shots.yml`, triggered by the PR
  label `marketing-shots` (and `workflow_dispatch` once on `main`). Linux
  runner, xvfb, dark theme only. Uploads `marketing-shots-<attempt>`.
- Same harness (`tests/visual`), selected by `VISUAL_SET=marketing`. The
  parity run (`screenshots.yml`, the existing `SCENES`) is unchanged when the
  variable is unset.
- **2× pixels:** `--force-device-scale-factor` comes from `VISUAL_DPR`
  (default 1). Marketing runs at 2, giving 2880×1800 PNGs from the 1440×900
  content area. `diffShots` scales its CSS-px `VOLATILE` masks by the DPR so
  the stability check stays correct.

### A2. Real on-device model output

Darkfactory summaries, session search, smart search and commit messages all
need the local models, which CI never fetches (`resources/models/` is
git-ignored; `SPEXR_MODEL_DOWNLOAD` only gates the decision model).

- The marketing lane runs `pnpm --filter @spexr/theia-extensions fetch-model`
  (MiniLM, Qwen2.5-Coder-1.5B q4, kev; about 1.8 GB on disk) behind `actions/cache`
  keyed on the script's hash.
- Text shown in the screenshots is **real model output on the fixture**, not
  canned strings injected through a test seam. Output varies run to run; the
  owner picks from the artifacts.
- Waits: each model-dependent scene waits on its rendered text (card second
  line, search hits with descriptions, commit box filled), with a generous
  timeout, since Qwen runs on the runner's CPU.

### A3. A showcase fixture

A new fixture workspace, `tests/visual/fixtures/showcase/`, separate from the
parity fixture `probe-engine`. It is a small, plausible project:

- `docs/specs/`: 5–6 specs spread across the 7 steps (one shipped, one
  mid-Implement with plan checklist, one at Clarify, ...), each with a
  context folder.
- `docs/memory/`: a handful of notes across the 4 types, with `MEMORY.md`
  index. The view reads project memory only, so no user memory is seeded.
- `docs/agents/`: 3 experts added from the catalog; one active.
- Claude sessions: 8–10 transcripts across 2–3 projects via the existing
  `manifest.json` mechanism, some live (claude stub), one "needs you".
- One opencode session through an `opencode` stub on `run.bin` that answers
  `opencode db ...` and `opencode export <id>`.
- `$HOME/.spexr/schedules.json`: one plant schedule with dependent tasks.
- Card browser: a transcript link to a fixture page served on localhost by
  the capture.
- Git: a dirty working tree so the Source Control view shows staged changes
  and a generated commit message.

### A4. Scenes

| Scene | Shows |
|---|---|
| `mk-specs` | Spec view: stepper rows, workspace progression |
| `mk-spec-detail` | One spec open: plan checklist, Spec validation panel with a drift finding |
| `mk-darkfactory` | The wall: cards grouped by project, live states, summaries; schedule sidebar open |
| `mk-df-search` | Wall with a "Find a session" query and its hits |
| `mk-df-card` | One pinned card with the card browser on |
| `mk-experts` | Experts view with active expert and marketplace |
| `mk-memory` | Memory view (it lists project memory only; user memory has no view) |
| `mk-search` | Smart search with hits and their one-line descriptions |
| `mk-git` | Source Control with a model-written commit message |
| `mk-harness` | Crop of the wall: the project group holding a Claude and an opencode card |

The owner reviews the artifact; chosen PNGs are copied into the site (Part
B). Nothing is committed to `spexr/docs/screenshots` in this work.

## Part B — the page (sondalab-site)

- Route `src/pages/spexr.astro` at `/spexr/`. `src/content/products/spexr.md`
  gains `fullPage: { href: /spexr/, label: … }`, same as daos.
- Images in `src/assets/spexr/` (2880px PNG sources), rendered with
  `astro:assets` as responsive AVIF/WebP. Each shot links to its full-size
  file; no lightbox.
- Built from kit classes, as `/daos/` is (`sl-section`, `sl-wrap`,
  `sl-section__idx`, `sl-invert` bands). Accent `spexr`.

### Sections

1. **Hero:** tagline, one-paragraph lede, Download (releases) + GitHub
   buttons, the Darkfactory wall as the hero shot.
2. **01 Specs** — a spec becomes plan, tasks, diff, PR; drift detector.
3. **02 Darkfactory** — every session on one wall; schedule, session search,
   card browser as a sub-grid of three smaller shots.
4. **03 Experts** — personas that switch on with the workflow step.
5. **04 Memory** — two scopes, promote/demote. Modest copy.
6. **05 Smart search** — hybrid search, descriptions written on-device.
7. **06 Also in the box** — Git with local commit messages; opencode next
   to Claude.
8. **How it runs** — no hosted model API, spawns your local agent binary,
   on-device models, MIT, macOS/Windows/Linux, public beta. Download CTA.

### Copy rules

- Plain language, one claim per sentence, no numbers that are not verified
  against spexr source at writing time.
- Fix the stale line in `spexr.md`: opencode support ships today (spexr
  CHANGELOG), it is not "on the way".

## Out of scope

- Light-theme shots, video or animated captures.
- Updating spexr's README screenshots.
- Translations.

## Delivery and cost

One PR per repo (owner, 2026-10-14: a single PR for the spexr work):

| PR | Repo | Content |
|---|---|---|
| 1 | spexr | All of Part A: marketing set, DPR, workflow, model cache, showcase fixture, scenes; iterate on CI until shots read well |
| 2 | site | Part B page with the chosen shots, product link, copy fix |

Sonnet authors, one review pass per PR. PR 1 is the risk: each CI round is a
full build plus model fetch (first run ~25 min, cached runs ~15 min); budget
3–4 rounds. The site PR waits for the owner's pick of shots from PR 1.

## Verification

- spexr: parity `screenshots` run unchanged (label a PR, compare scene list);
  lint + typecheck for `tests/visual`.
- site: `astro check`, build, the audit/probe gate, a browser check at
  desktop and 390px width.
