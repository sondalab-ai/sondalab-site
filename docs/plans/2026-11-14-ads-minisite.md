# ADS minisite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `/ads/` (landing) and `/ads/docs/*` (five pages) to sondalab-site, plus a drift check and an ADS-repo rule that keep the docs in sync.

**Architecture:** Landing copy is typed data in `src/lib/ads-page.ts`, rendered by `src/pages/ads.astro` (the `/spexr/` pattern). Docs are a Zod-validated content collection `adsDocs` rendered by one dynamic route with a sidebar layout. A Node script compares each page's `syncedFrom` commit with the ADS repo history.

**Tech Stack:** Astro 7 (static, `trailingSlash: 'always'`), `@sondalab/ui-kit` 0.45 Tier A, Zod via `astro:schema`, `node --test` for `scripts/*.test.mjs`.

**Spec:** `docs/specs/2026-11-14-ads-minisite-design.md`

**Worktree:** `/Users/marcello.barile/src/mine/ai-tools/sondalab-site-ads`, branch `feat/ads-minisite`. Task 7 runs in a worktree of the ADS repo off `epic/ads-v1`.

## Global Constraints

- Gates after every task: `npm test`, `npx astro check`, `npm run audit` (0 R-violations), `npm run build`.
- Copy voice: design-language L5 — precise, active voice, real output over adjectives, no "seamless/powerful/autopilot/10x/effortless".
- English only. Identifiers in `<code>`: `ads`, `ok <code>`, `.ads/config.yaml`.
- Facts from ADS repo branch `epic/ads-v1` at commit `d7e7189`. Numbers copied from code, not README:
  - budget: 3 rounds, 3600 seconds; tokens trivial 1M, low 1.5M, medium 3M, high 8M, critical 8M (`internal/config/config.go:504-513`)
  - size limits: trivial 20, low 200, medium 400 changed lines (`internal/config/config.go:574`)
  - approval window 10 minutes (`internal/approve/approve.go:31`); code is 4 hex characters
- Transcript text comes from ADS output code or tests: live lines `internal/report/view.go` (`FollowStep`, `followLine`), approval block `internal/flow/ask.go`, scripts in `cmd/ads/testdata/script/*.txtar`. No freehand lines.
- Every internal link ends with `/`.
- No new accent: ADS uses `default`.
- Repo notice text, exact: `ADS is in beta. The repository opens soon.`
- Repo URL: `https://github.com/sondalab-ai/agentic-dev-system`; `repoPublic: false`.

## Review Focus

1. Phone width (390px): wide tables and long transcript lines scroll inside their own box; the page never scrolls sideways. → Task 2 and Task 4 verification run `npm run layout:probe` at 390.
2. Flipping `repoPublic` to `true` removes the notice and shows the repo link on landing and getting-started. → Task 1 test `repoState`.
3. A docs link without the trailing slash causes a redirect on nginx. → Task 5 test `every internal link ends with a slash`.
4. A number in the copy that nobody checked against the code. → Task 1 and Task 5 number allowlist tests.
5. Drift script given a `syncedFrom` commit missing from the ADS checkout: clear error, exit 2, not a false "clean". → Task 6 test.

---

## Slice 1 — PR "feat(ads): add the ADS landing page"

### Task 1: Landing data and transcript component

**Files:**
- Create: `src/lib/ads-page.ts`
- Create: `src/components/Transcript.astro`
- Test: `scripts/ads-page.test.mjs`

**Interfaces:**
- Produces:
  - `export const ADS_REPO = 'https://github.com/sondalab-ai/agentic-dev-system'`
  - `export const ADS_NOTICE = 'ADS is in beta. The repository opens soon.'`
  - `export function repoState(repoPublic: boolean): { notice: string | null; repoHref: string | null }` — `false` → `{ notice: ADS_NOTICE, repoHref: null }`; `true` → `{ notice: null, repoHref: ADS_REPO }`.
  - `export interface TranscriptLine { readonly text: string; readonly role?: 'prompt' | 'ok' | 'warn' | 'err' | 'dim' | 'accent' }`
  - `export const ADS_HERO: { eyebrow: string; h1: string; lede: string }`
  - `export const ADS_SESSION: readonly TranscriptLine[]` — user's `fix #13`, plan line, ≥2 step lines, an `End` line.
  - `export const ADS_APPROVAL: readonly TranscriptLine[]` — `ads needs your approval: …`, indented facts, last line `To approve, reply:   ok <code>` with a sample 4-hex code.
  - `export const ADS_STEPS: readonly { title: string; body: string }[]` — exactly 4, order: tests first, the change, layered review, lands or waits.
  - `export const ADS_BENEFITS: readonly { id: string; kicker: string; h2: string; body: readonly string[]; table?: { head: readonly string[]; rows: readonly (readonly string[])[] } }[]` — ids in order `talk`, `risk`, `signed`, `control`, `budget`.
  - `export const ADS_LIMITS: readonly string[]`
  - `export const ADS_INSTALL: readonly TranscriptLine[]` — `git clone <ADS_REPO>.git`, `cd agentic-dev-system`, `make install`, `ads init`, `ads doctor`.
  - `export const ADS_RECIPES: readonly { title: string; href: string }[]` — 3–4 links of the form `/ads/docs/everyday-use/#fix-an-issue` (the anchor comes after the trailing slash; anchors are the Task 5 heading ids).
  - `Transcript.astro` props: `{ lines: readonly TranscriptLine[]; label: string }` — renders `<figure><pre aria-label={label}>` on the ink surface, mono, one `<span class="t-<role>">` per role line, `overflow-x: auto` on the `<pre>`.

- [ ] **Step 1: Write the failing tests** in `scripts/ads-page.test.mjs`:
  - `repoState(false)` deep-equals `{ notice: 'ADS is in beta. The repository opens soon.', repoHref: null }`; `repoState(true)` deep-equals `{ notice: null, repoHref: 'https://github.com/sondalab-ai/agentic-dev-system' }`.
  - `ADS_BENEFITS.map(b => b.id)` deep-equals `['talk','risk','signed','control','budget']`; `ADS_STEPS.length === 4`.
  - last line of `ADS_APPROVAL` matches `/^To approve, reply:\s+ok [0-9a-f]{4}$/`.
  - `ADS_INSTALL` texts include `make install`, `ads init`, `ads doctor` in that order.
  - Every `href` in `ADS_RECIPES` starts with `/ads/docs/` and its path part ends with `/`.
  - Number allowlist: collect `\b\d+(\.\d+)?\b` from `JSON.stringify` of hero, steps, benefits, limits; assert the set ⊆ an allowlist declared in the test, each entry commented with its source (`config.go:504`, `approve.go:31`, or `example`).
  - Banned words: copy does not match `/seamless|powerful|effortless|autopilot|10x|blazing/i`.
- [ ] **Step 2: Run** `node --test scripts/ads-page.test.mjs` — expect FAIL (module not found).
- [ ] **Step 3: Implement `src/lib/ads-page.ts`** with the exports above. Read the three transcript sources listed in Global Constraints and copy their formats; read `README.md` "Work in Claude Code" and "How a change lands" for the table content, then check each number against code. Header doc comment names commit `d7e7189` and the source files, like `spexr-page.ts`.
- [ ] **Step 4: Implement `src/components/Transcript.astro`.** Colours only from kit role tokens (`--slc-*` / terminal roles per `sondalab-ui/docs/tui-patterns.md`); no hex.
- [ ] **Step 5: Run** `node --test scripts/ads-page.test.mjs` and `npm run audit` — expect PASS, 0 R-violations.
- [ ] **Step 6: Commit** `feat(ads): add landing copy and the transcript block`.

### Task 2: Product file and `/ads/` page

**Files:**
- Create: `src/content/products/ads.md`
- Create: `src/pages/ads.astro`

**Interfaces:**
- Consumes: everything from Task 1; `markClass(i)` from `src/lib/marks.ts`; `Base` layout props `{ title, description }`.

- [ ] **Step 1: Write `src/content/products/ads.md`.** Frontmatter: `name: ads`, `tagline` (≤90 chars), `status: beta`, `accent: default`, `form: CLI`, `order: 7`, `repo: https://github.com/sondalab-ai/agentic-dev-system`, `repoPublic: false`, `fullPage: { href: /ads/, label: See how ADS works }`, `summary` (one sentence, `<strong>` allowed as in siblings). Body: three short paragraphs in the voice of `claude-loadout.md`.
- [ ] **Step 2: Write `src/pages/ads.astro`.** Section order from the spec: hero (eyebrow, h1, lede, and the notice from `repoState(entry.data.repoPublic)` where `entry = await getEntry('products', 'ads')`), buttons *Get started* → `/ads/docs/getting-started/`, *Read the docs* → `/ads/docs/everyday-use/`; beside the hero text the kit poster `sl-art-poster` in its own column with a `data-sl-art-seed` and `mountArt()` from the kit's `art.js`, the way existing pages mount art (grep `mountArt` in `src/`); no image asset, no art behind the heading → `Transcript` of `ADS_SESSION` and `ADS_APPROVAL` → numbered `ADS_STEPS` → `ADS_BENEFITS` sections alternating `sl-invert`, heads with `sl-section__idx` + `markClass(i)` → limits → install band (`sl-invert`, `Transcript` of `ADS_INSTALL`, notice again when not public) → recipes list. Copy the accent-repaint `<style>` pattern from `spexr.astro` only if needed for `default` (it is not: skip it).
- [ ] **Step 3: Run gates** `npm test && npx astro check && npm run audit && npm run build` — expect all green; `dist/ads/index.html` and `dist/products/ads/index.html` exist.
- [ ] **Step 4: Visual check.** `npm run preview`, then `node scripts/shoot.mjs` (both themes) and `npm run layout:probe` at 390px for `/ads/`. Expect: no horizontal page scroll, transcripts scroll in their box, notice visible.
- [ ] **Step 5: Commit** `feat(ads): add the ADS landing page and product entry`. Open PR to `main`.

## Slice 2 — PR "feat(ads): add the ADS docs"

### Task 3: Docs collection and ordering helper

**Files:**
- Modify: `src/content.config.ts` (add collection, export it)
- Create: `src/lib/ads-docs.ts`
- Test: `scripts/ads-docs.test.mjs`

**Interfaces:**
- Produces:
  - Collection `adsDocs`, loader `glob({ pattern: '**/*.md', base: './src/content/ads-docs' })`, schema: `title: z.string()`, `summary: z.string().max(200)`, `order: z.number().int().nonnegative()`, `sources: z.array(z.string().min(1)).nonempty()`, `syncedFrom: z.string().regex(/^[0-9a-f]{7,40}$/)`, `verified: z.coerce.date()`.
  - `export interface DocRef { id: string; title: string; order: number }`
  - `export function orderDocs<T extends DocRef>(docs: readonly T[]): T[]` — sort by `order`; throw `Error('ads docs: duplicate order N')` on a duplicate.
  - `export function neighbours<T extends DocRef>(docs: readonly T[], id: string): { prev: T | null; next: T | null }`
  - `export function docHref(id: string): string` → `/ads/docs/${id}/`

- [ ] **Step 1: Write failing tests:** `orderDocs` sorts `[{order:2},{order:0},{order:1}]` to 0,1,2; duplicate order throws `/duplicate order 1/`; `neighbours` of first has `prev: null`, of last `next: null`; `docHref('status-api') === '/ads/docs/status-api/'`.
- [ ] **Step 2: Run** `node --test scripts/ads-docs.test.mjs` — expect FAIL.
- [ ] **Step 3: Implement** `src/lib/ads-docs.ts` and the collection.
- [ ] **Step 4: Run** the test — expect PASS.
- [ ] **Step 5: Commit** `feat(ads): add the docs collection`.

### Task 4: Docs layout and routes

**Files:**
- Create: `src/layouts/AdsDocs.astro`
- Create: `src/pages/ads/docs/[slug].astro`
- Create: `src/pages/ads/docs/index.astro`

**Interfaces:**
- Consumes: `orderDocs`, `neighbours`, `docHref` (Task 3); `repoState`, `ADS_NOTICE` (Task 1).
- `AdsDocs.astro` props: `{ title: string; summary: string; currentId: string; docs: readonly DocRef[]; syncedFrom: string; verified: Date }`.

- [ ] **Step 1: Write the layout.** Two columns ≥ 60rem (sidebar `<nav aria-label="ADS docs">`, current link `aria-current="page"`), one column below with the nav above the content. Content column styles rendered Markdown: tables in a scroll wrapper (`overflow-x: auto`), `pre` like `Transcript`. Footer line: `Synced with ADS <code>{syncedFrom.slice(0,7)}</code> on {verified, YYYY-MM-DD}`, then prev/next links.
- [ ] **Step 2: Write `[slug].astro`** with `getStaticPaths` over `orderDocs(getCollection('adsDocs'))`; the `getting-started` page shows the notice from `repoState` when the product file's `repoPublic` is false.
- [ ] **Step 3: Write `index.astro`**: short page — h1 "ADS documentation", one line each per doc (title + summary + link), through the same layout's sidebar.
- [ ] **Step 4: Add one placeholder page** `src/content/ads-docs/getting-started.md` (frontmatter valid, body one heading) so the build has a route; Task 5 replaces it.
- [ ] **Step 5: Run gates**; then a schema check by hand: set `syncedFrom: xyz` in the placeholder, `npm run build` must fail on the schema; revert.
- [ ] **Step 6: Commit** `feat(ads): add the docs layout and routes`.

### Task 5: The five doc pages

**Files:**
- Create/replace: `src/content/ads-docs/{getting-started,everyday-use,how-changes-land,approvals-and-undo,status-api}.md` (orders 0–4)
- Modify: `scripts/ads-docs.test.mjs`

- [ ] **Step 1: Add failing tests:**
  - the five files exist with orders 0–4 and ids in that order;
  - every `sources` path exists in the ADS checkout given by env `ADS_REPO_DIR` (skip the test when unset);
  - `every internal link ends with a slash`: each Markdown link `](/…)` path part (before `#`) ends with `/`;
  - number allowlist over all doc bodies, same style as Task 1 (comment each entry with its source);
  - `everyday-use.md` has `##` headings with ids `fix-an-issue`, `work-the-queue`, `whats-waiting`, `one-more-round`, `stricter-rules`, `follow-only` (Astro slugs headings itself, so pick heading text that slugs to these ids: "Fix an issue", "Work the queue", "What's waiting", "One more round", "Stricter rules", "Follow only"; the test reads the rendered ids from `dist/ads/docs/everyday-use/index.html` after a build, or slugs the headings with `github-slugger`, which Astro uses);
  - each page has ≥2 example blocks (fenced code blocks).
- [ ] **Step 2: Run** — expect FAIL.
- [ ] **Step 3: Write the pages** per the spec's "Docs pages — content". Each: one-paragraph "what this page answers"; recipes as **Situation / You say / You see** (fenced `text` block, real format) **/ What happens**; `sources` lists the ADS files used (`README.md`, `docs/guides/setup.md`, `docs/guides/api.md`, `internal/config/config.go`, `internal/approve/approve.go`, …); `syncedFrom: d7e7189`; `verified: 2026-11-14`. `approvals-and-undo` contains the undo/pause/stop table with columns *Needs approval*, *Loses work*, *Can still land*. `how-changes-land` contains the example "a 12-line fix in `src/` lands by itself; the same fix touching `package.json` waits for you" (12 < 200 low limit; `package.json` is a dependency manifest → high).
- [ ] **Step 4: Run** `ADS_REPO_DIR=../agentic-dev-system npm test`, then all gates — expect PASS.
- [ ] **Step 5: Visual check** as Task 2 Step 4 for every docs page (390px included).
- [ ] **Step 6: Commit** `feat(ads): write the five ADS doc pages`. Open PR to `main`.

## Slice 3 — sync

### Task 6: Drift check (site PR "feat(ads): add the docs drift check")

**Files:**
- Create: `scripts/ads-docs-drift.mjs`
- Test: `scripts/ads-docs-drift.test.mjs`
- Modify: `package.json` (script `"ads-docs:drift": "node scripts/ads-docs-drift.mjs"`)

**Interfaces:**
- `export function readDocs(dir: string): { id: string; sources: string[]; syncedFrom: string }[]` — parses frontmatter of `*.md` (simple YAML subset: scalar keys and a `sources:` list).
- `export function drift(docs, adsDir: string): { id: string; changed: string[] }[]` — per doc, `git -C adsDir diff --name-only <syncedFrom> HEAD -- <sources…>`; returns only docs with changes. Throws `Error('ads docs: commit <sha> of <id> is not in <adsDir>')` when `git cat-file -e <sha>^{commit}` fails.
- CLI: `--ads <dir>` required (usage + exit 2 without it); prints `<id>: <file>` lines; exit 0 clean, 1 drifted, 2 on error.

- [ ] **Step 1: Write failing tests** with a temp git repo (`mkdtempSync`, `git init`, two commits): doc A's source changed after its `syncedFrom` → reported with that file; doc B unchanged → absent; doc C with an unknown sha → `drift` throws `/is not in/`; CLI without `--ads` exits 2.
- [ ] **Step 2: Run** `node --test scripts/ads-docs-drift.test.mjs` — expect FAIL.
- [ ] **Step 3: Implement** with `execFileSync('git', …)` (no shell).
- [ ] **Step 4: Run** tests, then `npm run ads-docs:drift -- --ads ../agentic-dev-system` — expect exit 0 against `epic/ads-v1` head if no source changed since `d7e7189`; otherwise the listed files are real drift to fix before the PR.
- [ ] **Step 5: Commit** and open PR to `main`.

### Task 7: Sync rule in the ADS repo (ADS PR into `epic/ads-v1`)

**Files:**
- Create: `AGENTS.md` at the ADS repo root (do not touch `docs/agents/AGENTS.ads.md`).

- [ ] **Step 1: Write `AGENTS.md`** in strict STE, with one section "Website docs":
  - The ADS docs live in `sondalab-ai/sondalab-site`: `src/content/ads-docs/*.md` and `src/lib/ads-page.ts`.
  - A change to user-facing behaviour, a command, a default value, or a message that those pages show requires a paired PR in `sondalab-ai/sondalab-site` that updates the matching pages.
  - Find the matching pages through each page's `sources` list.
  - Set `syncedFrom` to the ADS commit you checked the pages against and `verified` to today's date.
  - Copy numbers from the code, not from `README.md`.
  - Link the ADS PR by full URL in the site PR, and the site PR in the ADS PR.
  - When you cannot open a PR in sondalab-site, open an issue there that names the pages and links the ADS PR by full URL.
  - Run `npm run ads-docs:drift -- --ads <ADS checkout>` in sondalab-site before you open the site PR. It must exit 0.
- [ ] **Step 2: Check** `make lint` passes in the ADS repo (Markdown is not linted there; confirm no test asserts the root file list, e.g. grep tests for `AGENTS.md`).
- [ ] **Step 3: Commit** `docs(agents): keep the website docs in sync`, open PR into `epic/ads-v1`.
