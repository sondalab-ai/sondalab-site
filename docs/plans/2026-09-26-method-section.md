# Method section Implementation Plan

> **For agentic workers:** executed inline (superpowers:executing-plans). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace the method section's glass cards with a process rail, the approved copy and three scene-art dot vignettes that assemble and then float.

**Architecture:** Three pre-cropped greyscale images in `src/assets/method/`; pure sampling and per-frame maths in `src/lib/dot-scene.ts` (unit-tested); canvas, observers and theme wiring in `src/lib/dot-scene-runtime.ts`; markup, copy and styles in `src/components/Method.astro`.

**Tech Stack:** Astro 7, `@sondalab/ui-kit` 0.17 tokens, canvas 2D, `node --test`, `puppeteer-core`, macOS `sips` for the one-off crops.

**Spec:** `docs/specs/2026-09-26-method-section-design.md`

## Global Constraints

- Branch `feat/method-scenes` in `../sondalab-site-wt-kit017`, based on `chore/kit-0.17`.
- Colours from kit tokens only; `npm run audit` 0 R-violations.
- No `prefers-reduced-motion` query anywhere in `src/` (`npm run motion-gate`).
- Copy exactly as the spec's Copy table.
- Commits end with `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.

## Review Focus

1. Rail node vs line centre: within 0.5px (the mockup bug). Task 4 probe.
2. Theme switch at runtime: dots re-colour without reload. Task 4 probe toggles `data-sl-theme`.
3. Off-screen cost: the loop stops when all vignettes are far out of view. Task 4 probe counts frames.
4. A crop that is almost black: sampling still yields dots (percentile stretch), never divides by zero. Task 2 test.
5. High-contrast theme: vignettes hidden. Task 3 CSS, Task 4 probe.

---

### Task 1: The three crops

**Files:** Create `scripts/make-method-crops.mjs`, `src/assets/method/{intent,work,check}.png`; modify `package.json` (`"method:crops"`).

- [ ] Script: for each vignette, `sips -Z 900` the raw render from `.scenes-raw/<scene>/dark/02-mid.png` into a temp file, crop with the spec's x/y/size (`sips -c size size --cropOffset y x`), resize to 288, convert to greyscale PNG (`sips -m` Generic Gray profile), write to `src/assets/method/<name>.png`. Fails with a clear message if `.scenes-raw/` is missing.
- [ ] Run it; open the three PNGs and check each frames its subject (man at the lamp; robot at the table; raised-hands rank).
- [ ] Commit.

### Task 2: Pure dot maths (TDD)

**Files:** Create `src/lib/dot-scene.ts`, `scripts/dot-scene.test.mjs`.

**Produces:**
- `sampleDots(px: ArrayLike<number>, size: number, n: number, rand?: () => number): Dot[]` — `px` is RGBA; returns dots `{ x, y, L, sx, sy, delay, phase }` in unit coordinates.
- `dotFrame(d: Dot, t: number, width: number, n: number): { x: number; y: number; r: number; a: number } | null` — pixel position, radius, alpha at `t` seconds since assembly began; `null` when the dot draws nothing.

- [ ] Failing tests: all-black image → `[]`; all-white → no dot outside the inscribed circle, corners empty; a dark image (values 0–40) still yields dots whose max `L` ≈ 1; uniform image does not divide by zero; `dotFrame` at `t=0` sits at the scatter position, at `t=20` within `0.45 × cell` of its place; radius grows with `L`.
- [ ] Implement per the spec's Rendering section (stretch 2nd–99th percentile, smoothstep, 30% circular fade, 0.06 floor, radius `0.5·cell·L^0.6` floor 0.35, alpha `0.25 + 0.75·L`, assemble 1.1s eased-out with centre-out delay, float `0.45·cell`, shimmer ±7.5%, scanline every 6s).
- [ ] `npm test` green; commit.

### Task 3: Runtime and section

**Files:** Create `src/lib/dot-scene-runtime.ts`; rewrite `src/components/Method.astro`.

- [ ] Runtime `mountDotScenes(root: ParentNode)`: for each `canvas[data-dot-scene]`, load `data-src`, sample at 144px, start assembly at 40% visibility, one rAF loop while any vignette is within 200px of the viewport and the page is visible; colours read from `--sl-text-primary` via a 1px paint, re-read on `data-sl-theme` change.
- [ ] Method.astro: head + rail markup and copy per spec; `<canvas class="mscene" data-dot-scene data-src={img.src} aria-hidden="true">`; styles per the Layout section (both rail pseudo-elements `box-sizing: border-box`); `:root[data-sl-theme='high-contrast'] .mscene { display: none }`; remove cards, goo, numerals and their CSS; keep the bed.
- [ ] Gates: audit, kit-names, motion-gate, check, build; commit.

### Task 4: Probe and verification

**Files:** Create `scripts/method-probe.mjs`; modify `package.json` (`"method:probe"`).

- [ ] Probe against a served build: canvases have lit pixels in dark and light, and after toggling the theme at runtime; node centres within 0.5px of the line; frame counter stops advancing with the section scrolled 3000px away; text ≥ 4.5:1 (label-only method); high-contrast hides canvases; 390px no horizontal scroll.
- [ ] Screenshots at 1440/768/390 in both themes; commit.
