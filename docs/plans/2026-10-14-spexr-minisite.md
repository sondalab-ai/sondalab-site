# SPEXR minisite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take fresh, dark-theme, 2× marketing screenshots of SPEXR on CI and publish them on a new `/spexr/` product page on sondalab.ai.

**Architecture:** Part A adds a second capture set to spexr's existing Playwright + Electron harness (`tests/visual`). It has its own showcase fixture, its own test file and config, and its own workflow that fetches the local models so the AI text in the shots is real. Part B is an Astro page in sondalab-site, built from kit classes like `/daos/`, that renders the chosen PNGs through `astro:assets`.

**Tech Stack:** spexr: Playwright `_electron`, Theia/Electron, GitHub Actions (xvfb), Node 22.17. Site: Astro, `@sondalab/ui-kit`, `astro:assets`.

**Spec:** `docs/specs/2026-10-14-spexr-minisite-design.md` (sondalab-site)

## Global Constraints

- **Never launch spexr on a workstation.** Do not set `GITHUB_ACTIONS=true` locally and do not loosen the guards in `tests/visual/playwright.config.ts`, `run.mjs` or `app.ts`. All capture verification happens on CI.
- **Leave the parity capture alone.** `screenshots.yml` and `capture.visual.ts` must behave the same with `VISUAL_SET` unset and `VISUAL_DPR` unset.
- **Dark theme only** for marketing shots.
- **2× pixels:** the 1440×900 content area becomes 2880×1800 PNGs.
- **No canned AI text.** Summaries, descriptions and commit messages come from the real local models on the fixture.
- **One PR per repo:** spexr PR (all of Part A), then the site PR (Part B).
- **English only** on `/spexr/`.
- **Site copy:** plain language, one claim per sentence, and every number verified against spexr source at writing time.
- **Workspace isolation:** spexr work happens in a git worktree of the spexr repo on branch `feat/marketing-shots`; site work happens in this worktree (`worktree-spexr-minisite`).
- spexr commit trailer: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Window clipped at 2×.** A 1440×900 CSS window at scale factor 2 needs a 2880×1800 screen. The workflow's xvfb screen must be at least 3000×2000, or the PNGs come out cropped. Task 6 pins this with a size assertion in the test.
2. **Models present but not found.** The models are fetched into `packages/theia-extensions/resources/models`, but the webpack bundle may resolve a different package dir. Task 5 sets `SPEXR_MODELS_DIR` explicitly and fails the run if the first Darkfactory card never gets a second summary line.
3. **Slow CPU inference timing out mid-run.** Qwen on a 4-core runner is slow. Every model-dependent wait has its own long timeout and records the time it took in `meta.json`. A scene that times out is still captured and reported, not fatal, so one slow model does not cost the other shots.
4. **"Needs you" not showing.** It needs a live `claude` process in the project's cwd and a transcript modified within 10 minutes. The test calls `touchShowcase()` right before the Darkfactory scenes and asserts that the needs-you tile exists.
5. **Parity regressions from shared helpers.** The exported helpers in `prepare.ts` and the mask change in `scenes.ts` keep the parity output identical at DPR 1. Task 1 verifies this with a `screenshots`-labelled run on the PR.

---

## Part A — spexr (`feat/marketing-shots`)

Set-up, once:

```bash
cd /Users/marcello.barile/src/mine/ai-tools/spexr
git fetch origin && git worktree add ../spexr-wt-marketing -b feat/marketing-shots origin/main
cd ../spexr-wt-marketing && pnpm install --frozen-lockfile
```

All Part A paths are relative to that worktree. `tests/visual` has no unit-test runner; its gates are `pnpm --filter @spexr/visual lint` and `pnpm --filter @spexr/visual typecheck`, plus CI. The tasks below say so instead of inventing unit tests.

### Task 1: DPR and env plumbing in the harness

**Files:**
- Modify: `tests/visual/app.ts` (`LaunchOptions`, `launch()` args/env)
- Modify: `tests/visual/scenes.ts` (`diffShots` masks)
- Modify: `tests/visual/prepare.ts` (export `writeHome`, `writeClaudeStub`, `seedSettings`, `git`, `AUTHOR`; add params with parity defaults)

**Interfaces:**
- Produces: `launch({ run, swiftshader, logFile, dpr?: number, env?: Record<string,string> })`. `dpr` defaults to 1. `env` is merged last.
- Produces: `writeHome(run: { home: string; bin: string }, prompt?: string)`, `writeClaudeStub(bin: string)`, `seedSettings(configDir: string, theme: Theme, overrides?: Record<string, unknown>)`, `git(run: { home: string }, cwd: string, date: string | null, args: string[])`, `AUTHOR`.

- [ ] **Step 1: `app.ts`.** Add the two options and use them:

```ts
export interface LaunchOptions {
  readonly run: PreparedRun;
  readonly swiftshader: boolean;
  readonly logFile: string;
  /** `--force-device-scale-factor`; the parity capture keeps 1, the marketing capture uses 2. */
  readonly dpr?: number;
  /** Merged over the launch environment last, e.g. SPEXR_MODELS_DIR for the marketing capture. */
  readonly env?: Readonly<Record<string, string>>;
}
```

Change `launch`'s signature to `launch({ run, swiftshader, logFile, dpr = 1, env: extraEnv = {} }: LaunchOptions)`. Change `PreparedRun` usage to the structural type `Pick<PreparedRun, "workspace" | "home" | "bin" | "configDir" | "userData" | "ackDir">` so a showcase run fits. After the existing `Object.assign(env, {...})`, add `Object.assign(env, extraEnv);`. Replace `"--force-device-scale-factor=1",` with ``` `--force-device-scale-factor=${dpr}`, ```.

- [ ] **Step 2: `scenes.ts` `diffShots`.** The masks are CSS px, but the PNG is device px. Scale them inside the evaluate:

```ts
      const dpr = window.devicePixelRatio || 1;
      const masks = volatile.flatMap((sel) =>
        [...document.querySelectorAll(sel)].map((el) => {
          const r = el.getBoundingClientRect();
          return { left: r.left * dpr, right: r.right * dpr, top: r.top * dpr, bottom: r.bottom * dpr };
        }),
      );
```

This replaces the existing `const masks = ...` line. At DPR 1 the numbers are unchanged.

- [ ] **Step 3: `prepare.ts` exports.** Make the following exported, with no behaviour change for the parity path:
  - `AUTHOR`, `git`, `writeClaudeStub`.
  - `writeHome(run: Pick<PreparedRun, "home" | "bin">, prompt = "~/probe-engine on main › ")`, which uses `prompt` in place of the local const.
  - `seedSettings(configDir, theme, overrides: Record<string, unknown> = {})`, which builds `settings` as now and then does `Object.assign(settings, overrides)` before writing.

- [ ] **Step 4: Gates**

Run: `pnpm --filter @spexr/visual typecheck && pnpm --filter @spexr/visual lint`
Expected: both exit 0.

- [ ] **Step 5: Commit**

```bash
git add tests/visual/app.ts tests/visual/scenes.ts tests/visual/prepare.ts
git commit -m "test(visual): device scale factor, extra env and shared fixture helpers

The marketing capture needs 2x pixels and its own environment; the parity
capture keeps scale 1 and identical output.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2: The showcase workspace files

A small, believable TypeScript project, **ledgerline**: a CLI that imports bank CSV exports and reconciles them against a ledger. It is invented for the fixture and contains nothing copied from real projects.

**Files (all under `tests/visual/fixtures/showcase/`):**
- Create: `package.json`, `README.md`, `TODO.md`, `tsconfig.json`
- Create: `src/import/csv.ts`, `src/import/dates.ts`, `src/import/csv.test.ts`, `src/reconcile/match.ts`, `src/reconcile/match.test.ts`, `src/ledger/store.ts`, `src/cli.ts`
- Create: `docs/specs/0001-csv-import.md` … `0006-export-report.md`
- Create: `docs/specs/.context/<slug>/…` (per the table below)
- Create: `docs/memory/*.md`, `docs/memory/MEMORY.md`
- Create: `docs/agents/design.md`, `docs/agents/review.md`, `docs/agents/software-engineering.md`
- Create: `.spexr/settings.json`

**Interfaces:**
- Produces: the directory `tests/visual/fixtures/showcase/`, which Task 4 copies verbatim. It also produces `SHOWCASE_LINKED = ["src/import/csv.ts", "src/import/dates.ts"]`, referenced by spec 0003.

- [ ] **Step 1: Source files.** Write about 40–120 lines each of plausible, compiling TypeScript.
  - `csv.ts`: `parseStatement(text: string): Row[]`, using `parseDate` from `dates.ts`.
  - `dates.ts`: `parseDate(raw: string, locale: "en-GB" | "en-US"): Date`.
  - `match.ts`: `reconcile(rows: Row[], ledger: Entry[]): Match[]`, with amount ± 1 cent tolerance and a 3-day date window.
  - `store.ts`: a JSON-file ledger.
  - `cli.ts`: `ledgerline import <file>` and `ledgerline reconcile`.
  - Tests use `node:test`.

  `package.json`: `{"name":"ledgerline","version":"0.4.0","private":true,"type":"module","scripts":{"test":"node --test"}}`.

- [ ] **Step 2: Specs.** The frontmatter is the custom `key: value` parser, not YAML. It must start with `---\n`, and `slug` must equal the filename stem. Each spec has `## Goal`, `## Non-goals`, and `## Acceptance Criteria` with `- **AC-n** <verifiable sentence>` (at least 6 words, with a verb), and no TBD/TODO.

| File | status | workflowStep | `.context/<slug>/` contents | Shows as |
|---|---|---|---|---|
| `0001-csv-import.md` | shipped | — | `notes.md` | done (all 7 ticked) |
| `0002-date-locales.md` | validated | — | `notes.md` | Ship |
| `0003-reconcile-window.md` | in-progress | plan | `_plan.md` (5 tasks, 2 done), `clarifications.md`, `_drift.json` (1 warn, 1 block) | Implement |
| `0004-duplicate-detection.md` | draft | — | `clarifications.md`, `research.md` | Plan |
| `0005-multi-currency.md` | draft | — | `research.md` | Clarify |
| `0006-export-report.md` | draft | — | (empty dir with `.gitkeep`) | Context |

Spec 0003 body links the code it implies as backticked paths: `` `src/reconcile/match.ts` ``, `` `src/import/dates.ts` ``.

`_plan.md` for 0003:

```md
---
specSlug: 0003-reconcile-window
generatedAt: 2026-10-10T09:00:00Z
---

- [x] T1 (AC-1): Widen the date window to three days on either side
- [x] T2 (AC-2): Keep the one-cent tolerance on amounts
- [ ] T3 (AC-3): Prefer the closest date when two rows match one entry
- [ ] T4 (AC-4): Report unmatched rows with the reason they failed
- [ ] T5 (AC-4): Cover the month-end boundary in match.test.ts
```

`_drift.json` for 0003:

```json
{"specSlug":"0003-reconcile-window","checkedAt":"2026-10-12T15:20:00Z","impliedFiles":["src/reconcile/match.ts","src/import/dates.ts"],"findings":[
 {"criterionId":"AC-3","severity":"block","message":"match.ts takes the first candidate, not the closest date.","suggestion":"Sort candidates by absolute day distance before picking."},
 {"criterionId":"AC-4","severity":"warn","message":"Unmatched rows are dropped without a reason.","suggestion":"Return them with a reason field and print it in the CLI."}]}
```

- [ ] **Step 3: Memory.** Write five notes with frontmatter `name`, `description`, `type`, covering all four types (user, feedback, project, reference), for example:
  - "amounts-are-integer-cents" (project)
  - "bank-exports-use-local-dates" (project)
  - "prefer-node-test" (feedback)
  - "owner-reviews-on-mondays" (user)
  - "bank-csv-formats" (reference)

  Then write `MEMORY.md` with lines in the form `- [name](file.md) — description`.

- [ ] **Step 4: Experts and active expert.** Write three files in `docs/agents/`, with frontmatter `id`/`name`/`icon` copied from the matching entries in `packages/agent/src/experts/catalog.ts`. Each body is a one-paragraph prompt. `.spexr/settings.json`: `{"spexr.experts.activeId":"software-engineering"}`.

- [ ] **Step 5: TODO.md.** Four open items and one done item, in the `- [ ] text` format, about the project.

- [ ] **Step 6: Gate.** Lint must not flag any spec except the deliberate 0003 drift. Run the spec package's own linter against the fixture:

```bash
node -e 'const {lintSpec}=require("./packages/spec/lib/spec-lint.js");const fs=require("fs");for(const f of fs.readdirSync("tests/visual/fixtures/showcase/docs/specs").filter(f=>/^\d{4}-.*\.md$/.test(f))){const r=lintSpec(fs.readFileSync("tests/visual/fixtures/showcase/docs/specs/"+f,"utf8"),f);console.log(f,JSON.stringify(r.findings?.filter(x=>x.severity!=="info")))}'
```

First check the export name and signature in `packages/spec/src/spec-lint.ts` (around :145) and build the package if `lib/` is missing (`pnpm --filter @spexr/spec build`). Expected: an empty findings array for every file.

- [ ] **Step 7: Commit**

```bash
git add tests/visual/fixtures/showcase
git commit -m "test(visual): showcase fixture workspace for marketing captures

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 3: Showcase sessions, schedule and opencode stub

**Files:**
- Modify: `tests/visual/fixtures/claude-sessions/generate.mjs`. Export `Session`, `patch`, `uuid`, and run the parity generation only when the file is executed directly.
- Create: `tests/visual/fixtures/showcase-sessions/generate.mjs`, `manifest.json`, the generated `*.jsonl`, `opencode/sessions.json`, `opencode/<id>.json`
- Create: `tests/visual/fixtures/bin/opencode`

**Interfaces:**
- Produces: `fixtures/showcase-sessions/manifest.json` rows. Each row is `{ file, project: "ws" | "atlas" | "notes", sessionId, name, ageMinutes, live, harness: "claude" | "opencode" }`.
- Produces: `{{WS}}`, `{{ATLAS}}`, `{{NOTES}}` placeholders in transcripts and opencode JSON.

- [ ] **Step 1: Make the parity generator importable.** At the bottom of `claude-sessions/generate.mjs`, wrap the existing top-level generation calls:

```js
export { Session, patch, uuid };
if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
```

Move the existing top-level calls into `function main() { … }` and add `pathToFileURL` to the `node:url` import.

Run: `node tests/visual/fixtures/claude-sessions/generate.mjs && git diff --stat tests/visual/fixtures/claude-sessions`
Expected: no changes to any `.jsonl`.

- [ ] **Step 2: Showcase generator.** `showcase-sessions/generate.mjs` imports `{ Session, patch }` from `../claude-sessions/generate.mjs` and writes these sessions. All content is invented, and each session has 6–25 tool calls with prompts and replies a reader would believe.

| file | project | name | ageMinutes | live | ends with |
|---|---|---|---|---|---|
| `reconcile-window.jsonl` | ws | Reconcile window | 0 | yes | assistant text that mentions `http://localhost:4317/report` (card browser link), then an unresolved `AskUserQuestion` tool_use → **needs you** |
| `date-locales.jsonl` | ws | Date locales | 95 | no | assistant text with `https://github.com/ledgerline/ledgerline/pull/42` |
| `csv-import.jsonl` | ws | CSV import | 1440 | no | final summary text |
| `atlas-rate-limits.jsonl` | atlas | Rate limits | 0 | yes | unresolved `Bash` tool_use with `permissionMode: "acceptEdits"` → working |
| `atlas-openapi.jsonl` | atlas | OpenAPI cleanup | 300 | no | final text |
| `notes-search.jsonl` | notes | Search index | 45 | no | final text |
| `notes-tags.jsonl` | notes | Tag editor | 2880 | no | final text |

Plus one opencode session in `ws`: "Fixture refresh", 30 minutes old, written as `opencode/<id>.json` in the export shape `{"info":{...},"messages":[{"info":{"role":"user"},"parts":[{"type":"text","text":"…"}]}, …]}`, and listed in `opencode/sessions.json` as rows `{id, directory:"{{WS}}", parent_id:null, title, agent:"build", model:"…", time_created, time_updated}` (epoch ms).

Run: `node tests/visual/fixtures/showcase-sessions/generate.mjs` twice. Expected: the second run leaves `git status` clean (deterministic).

- [ ] **Step 3: opencode stub** (`fixtures/bin/opencode`, mode 755). It answers the two calls the harness makes (`te/common/harness/opencode-harness.ts:22-24,150-174,249`) from files that `prepareShowcase` writes to `$HOME/.local/share/opencode-fixture/`:

```sh
#!/bin/sh
# tests/visual fixture: not opencode. Answers the two queries spexr's opencode harness makes.
data="$HOME/.local/share/opencode-fixture"
case "$1" in
  db) cat "$data/sessions.json" ;;
  export) cat "$data/$2.json" ;;
  *) printf 'opencode (visual fixture stub)\n'; while :; do sleep 3600; done ;;
esac
```

Check the exact argv in `opencode-harness.ts` (whether it passes `--format json` before the SQL and whether it expects a bare array). Adjust the `case` to match, and quote the line numbers in a comment.

- [ ] **Step 4: Commit**

```bash
git add tests/visual/fixtures/claude-sessions/generate.mjs tests/visual/fixtures/showcase-sessions tests/visual/fixtures/bin/opencode
git commit -m "test(visual): showcase sessions, opencode stub

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 4: `prepareShowcase`

**Files:**
- Create: `tests/visual/showcase.ts`

**Interfaces:**
- Consumes: `writeHome`, `writeClaudeStub`, `seedSettings`, `git`, `AUTHOR` from Task 1, and the fixtures from Tasks 2 and 3.
- Produces:

```ts
export interface ShowcaseRun {
  readonly root: string; readonly workspace: string; readonly atlas: string; readonly notes: string;
  readonly home: string; readonly bin: string; readonly configDir: string; readonly userData: string; readonly ackDir: string;
  readonly www: string;
}
export function prepareShowcase(root: string): ShowcaseRun;
export function touchShowcase(run: ShowcaseRun, now?: number): void;
export function showcaseLiveDirs(run: ShowcaseRun): string[];
```

- [ ] **Step 1: Write `showcase.ts`.** In order:
  1. `fs.rmSync(root)`. Make the dirs: `ws/ledgerline`, `ws/atlas-api`, `ws/field-notes`, `home`, `bin`, `theia`, `ud`, `ack`, `www`.
  2. `writeHome(run, "~/ledgerline on reconcile-window › ")` and `writeClaudeStub(run.bin)`. Copy `fixtures/bin/opencode` to `run.bin` (mode 755).
  3. **Git for ledgerline.**
     - Run `git init` with the initial branch set to `main`.
     - Copy the fixture.
     - Make three commits at fixed dates. Two carry a `Spec: 0001-csv-import` / `Spec: 0002-date-locales` trailer, and all are by `AUTHOR`.
     - Check out branch `reconcile-window`.
     - Modify `src/reconcile/match.ts` (add a `closestDate` helper) and `git add` it, so a staged change exists for the commit-message scene.
     - Leave `src/reconcile/match.test.ts` modified but unstaged.
     - Add `.spexr/` to `.git/info/exclude`, not `docs/`. Specs and memory are tracked here.
  4. `atlas-api` and `field-notes`: each gets a `package.json` and one `README.md`, plus `git init` and one commit.
  5. **Transcripts.**
     - For each manifest row with harness `claude`, substitute the placeholders `{{WS}}`, `{{ATLAS}}`, `{{NOTES}}` with the realpaths.
     - Write each to `home/.claude/projects/<realpath with [^a-zA-Z0-9] → "-">/<sessionId>.jsonl`.
     - Write `home/.spexr/session-names.json`.
     - Write `home/.spexr/project-names.json`: `{ "<ws realpath>": "ledgerline", "<atlas>": "atlas-api", "<notes>": "field-notes" }`.
  6. **opencode data.** Write the substituted `sessions.json` and `<id>.json` into `home/.local/share/opencode-fixture/`.
  7. **Schedule.** Write `home/.spexr/schedules.json` with one schedule, "Ship reconcile window", containing three tasks (`spec` → `impl` → `review`) on the ledgerline realpath. Use the example shape from the spec research: `version:1`, `runs:{}`, `impl.loop` with `maxIterations: 5` and `check: "node --test"`.
  8. `seedSettings(run.configDir, "dark", { "spexr.search.aiDescriptions.enabled": true, "files.exclude": { "**/.git": true, ".spexr": true } })`.
  9. `fs.copyFileSync` the fixture's `www/report.html` (create it in this task: a static page titled "ledgerline — reconcile report", with a small table of matched and unmatched rows) into `run.www`.
  10. `touchShowcase(run)`: set each transcript's mtime to now minus `ageMinutes`.

  `showcaseLiveDirs` returns the realpaths of the projects that have a live row (ws, atlas).

- [ ] **Step 2: Gates**

Run: `pnpm --filter @spexr/visual typecheck && pnpm --filter @spexr/visual lint`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add tests/visual/showcase.ts tests/visual/fixtures/showcase/www
git commit -m "test(visual): prepare the showcase run (repos, sessions, schedule, settings)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 5: The marketing capture

**Files:**
- Create: `tests/visual/marketing.visual.ts`, `tests/visual/marketing.config.ts`
- Modify: `tests/visual/run.mjs` (pick the config by `VISUAL_SET`), `tests/visual/package.json` (script `capture:marketing`)
- Modify: `tests/visual/tsconfig.json` only if `include` needs it (it already includes `*.ts`)

**Interfaces:**
- Consumes: `launch`, `sizeWindow`, `waitForReady`, `closeApp`, `CONTENT` (`app.ts`); `runCommand`, `captureStable`, `captureCrop`, `parkPointer` (`scenes.ts`); `startLiveStubs` (`stubs.ts`); `prepareShowcase`, `touchShowcase`, `showcaseLiveDirs` (Task 4).
- Produces: `tests/visual/out/marketing/mk-*.png` plus `meta.json`, whose entries are `{ scene, file, stable, waitedMs, note? }`.

- [ ] **Step 1: `marketing.config.ts`.** Copy `playwright.config.ts`, including its `GITHUB_ACTIONS` guard and comment. Set `testMatch: "marketing.visual.ts"`, drop `globalTeardown`, and set `timeout: 60 * 60_000`.

- [ ] **Step 2: `run.mjs`.** After the guard, choose the config:

```js
const config = process.env.VISUAL_SET === "marketing" ? "marketing.config.ts" : "playwright.config.ts";
```

Pass `path.join(HERE, config)`. Add `"capture:marketing": "VISUAL_SET=marketing node run.mjs"` to `package.json`.

- [ ] **Step 3: Find the selectors before writing the scenes.** Run these, and record each root class in a `SEL` const with a `file:line` comment:

```bash
grep -n "className=\"spexr-darkfactory\|class.*darkfactory-wall\|addClass(" packages/theia-extensions/src/browser/darkfactory/darkfactory-wall-widget.tsx | head
grep -n "Summarizing\|className=" packages/theia-extensions/src/browser/darkfactory/agent-tile.tsx | head -40
grep -n "Find a session\|placeholder" packages/theia-extensions/src/browser/darkfactory/darkfactory-wall-widget.tsx
grep -n "addClass\|className=\"spexr-experts\|spexr-memory" packages/theia-extensions/src/browser/views/*.tsx | head
grep -n "className=\|placeholder" packages/theia-extensions/src/browser/search/smart-search-widget.tsx | head -30
grep -n "spexr-scm-input" packages/theia-extensions/src/browser/scm/spexr-scm-commit-widget.tsx
```

- [ ] **Step 4: `marketing.visual.ts`.** It is one test, `marketing dark`, with this skeleton (fill `SEL` from Step 3):

```ts
import { test } from "@playwright/test";
import fs from "fs";
import http from "http";
import path from "path";
import { CONTENT, closeApp, launch, sizeWindow, waitForReady } from "./app";
import { captureCrop, captureStable, parkPointer, runCommand } from "./scenes";
import { startLiveStubs } from "./stubs";
import { prepareShowcase, showcaseLiveDirs, touchShowcase } from "./showcase";

const OUT = path.join(__dirname, "out", "marketing");
const DPR = Number(process.env.VISUAL_DPR ?? "2");
const MODELS_DIR = path.resolve(__dirname, "../../packages/theia-extensions/resources/models");
const RUN_ROOT = path.join(process.env.RUNNER_TEMP ?? path.join(__dirname, ".run"), "spexr-marketing");
const SLOW = 15 * 60_000; // CPU inference on the runner

interface Shot { scene: string; file: string; stable: boolean; waitedMs: number; note?: string }

test("marketing dark", async () => {
  test.setTimeout(60 * 60_000);
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const shots: Shot[] = [];
  const save = () => fs.writeFileSync(path.join(OUT, "meta.json"), JSON.stringify({ dpr: DPR, shots }, null, 2));

  const run = prepareShowcase(RUN_ROOT);
  const www = http.createServer((_req, res) => {
    res.writeHead(200, { "content-type": "text/html" });
    res.end(fs.readFileSync(path.join(run.www, "report.html")));
  }).listen(4317);
  const stubs = startLiveStubs(run as never, showcaseLiveDirs(run));
  const { app, page } = await launch({
    run, swiftshader: false, logFile: path.join(OUT, "backend.log"), dpr: DPR,
    env: { SPEXR_MODELS_DIR: MODELS_DIR },
  });
  try {
    await sizeWindow(app);
    await waitForReady(page);
    await sizeWindow(app);
    const inner = await page.evaluate(() => `${innerWidth}x${innerHeight}@${devicePixelRatio}`);
    if (inner !== `${CONTENT.width}x${CONTENT.height}@${DPR}`) throw new Error(`window is ${inner}; the screen is too small for ${DPR}x`);

    /** Wait for `ready`, then capture; a timeout is recorded, not thrown, so the other scenes still run. */
    const shoot = async (scene: string, ready: () => Promise<unknown>, timeout = 60_000) => {
      const t0 = Date.now();
      let note: string | undefined;
      await Promise.race([ready(), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), timeout))])
        .catch((e) => { note = `not ready: ${String(e)}`; });
      await parkPointer(page);
      const file = path.join(OUT, `${scene}.png`);
      const r = await captureStable(page, file);
      shots.push({ scene, file: path.basename(file), stable: r.stable, waitedMs: Date.now() - t0, note });
      save();
    };
    // … scenes, Step 5
  } finally {
    await closeApp(app);
    stubs.stop();
    www.close();
    save();
  }
});
```

`startLiveStubs` is typed for `PreparedRun`. Narrow its parameter to `Pick<PreparedRun, "root">` in `stubs.ts` instead of the `as never` cast shown above.

- [ ] **Step 5: Scenes, in this order.** For each one, open the view with `runCommand(page, "<palette label>")`, but only if its root selector is not visible. `View: Toggle …` closes an open view.

| Scene | Steps | `ready` | Timeout |
|---|---|---|---|
| `mk-search` | `View: Toggle Search` | smart-search status/progress gone, then type `where do bank dates get parsed` into the smart-search input, then hits have description text | `SLOW` |
| `mk-specs` | `View: Toggle Active Spec` | 6 `.spexr-spec-list__item` | 60s |
| `mk-spec-detail` | click Open on 0003; `View: Toggle Spec Validation` (label from the `spexr.view.spec-lint.toggle` contribution) | `.spexr-plan-checklist__item` count 5 and a lint/drift finding visible | 60s |
| `mk-darkfactory` | `touchShowcase(run)`; `View: Toggle Darkfactory` | ≥8 tiles; no "Summarizing…"; ≥1 tile with an overview second line; needs-you tile present | `SLOW` |
| `mk-harness` | none (same state) | — | `captureCrop` on the `ws` project group's bounding box |
| `mk-df-search` | fill "Find a session — describe it" with `the one about month-end dates` | ≥1 result row | `SLOW` |
| `mk-df-card` | click the "Reconcile window" tile; click its "Browser" switch | webview `src` contains `localhost:4317` and has loaded | 120s |
| `mk-experts` | `View: Toggle Experts` | "Software engineering" row shows active | 60s |
| `mk-memory` | `View: Toggle Memory` | 5 note rows | 60s |
| `mk-git` | `View: Toggle Source Control`; click `.spexr-scm-input__generate` | commit textarea value non-empty | `SLOW` |

The table orders `mk-search` first so indexing overlaps app start. After `mk-darkfactory`, assert `shots.at(-1).note === undefined`, and if it isn't, write `meta.modelsMissing = true` (Review Focus 2). For `mk-harness`, call `captureCrop(page, file, [rect])` with the CSS rect of the project group element. The crop is device-px, because Playwright's `clip` is in CSS px and scales with DPR.

- [ ] **Step 6: Gates**

Run: `pnpm --filter @spexr/visual typecheck && pnpm --filter @spexr/visual lint`
Expected: exit 0. Also confirm the guard: `cd tests/visual && npx playwright test -c marketing.config.ts` exits with "runs only on a GitHub Actions runner" and nothing launches.

- [ ] **Step 7: Commit**

```bash
git add tests/visual/marketing.visual.ts tests/visual/marketing.config.ts tests/visual/run.mjs tests/visual/package.json tests/visual/stubs.ts
git commit -m "test(visual): marketing capture, ten dark scenes at 2x

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 6: The workflow

**Files:**
- Create: `.github/workflows/marketing-shots.yml`

- [ ] **Step 1: Write it.** Base it on the Linux job of `screenshots.yml`, with the same checkout, node, pnpm, apt and rebuild steps. The differences:

```yaml
name: Marketing shots
# Dark-theme, 2x screenshots of the showcase fixture for sondalab.ai/spexr.
# Not a test. Label a PR `marketing-shots`, or dispatch from main.
on:
  workflow_dispatch:
  pull_request:
    types: [labeled, synchronize]
permissions:
  contents: read
jobs:
  capture:
    if: >-
      github.event_name == 'workflow_dispatch' ||
      (github.event.action == 'labeled' && github.event.label.name == 'marketing-shots') ||
      (github.event.action == 'synchronize' && contains(github.event.pull_request.labels.*.name, 'marketing-shots'))
    runs-on: ubuntu-24.04
    timeout-minutes: 75
    concurrency:
      group: marketing-shots-${{ github.event.pull_request.number || github.ref }}
      cancel-in-progress: true
    steps:
      # … checkout / node / pnpm / apt / install / rebuild, as screenshots.yml
      - name: Cache local models
        uses: actions/cache@v4
        with:
          path: packages/theia-extensions/resources/models
          key: spexr-models-${{ hashFiles('packages/theia-extensions/scripts/fetch-search-model.mjs') }}
      - name: Fetch local models
        run: pnpm --filter @spexr/theia-extensions fetch-model
      - name: Build (dev)
        run: pnpm build:dev
      # 2880x1800 device px must fit: the screen is larger than the window at 2x.
      - name: Capture
        run: |
          xvfb-run --auto-servernum --server-args="-screen 0 3200x2000x24" \
            pnpm --filter @spexr/visual capture:marketing
        env:
          VISUAL_DPR: "2"
      - name: Upload
        if: ${{ !cancelled() }}
        uses: actions/upload-artifact@v4
        with:
          name: marketing-shots-${{ github.run_attempt }}
          path: tests/visual/out/marketing/
          retention-days: 30
```

First confirm that `fetch-search-model.mjs` skips files that already exist, so a cache hit makes the fetch step a no-op. If it re-downloads, guard the step with `if: steps.<cache-id>.outputs.cache-hit != 'true'`.

- [ ] **Step 2: Validate syntax**

Run: `npx --yes @action-validator/cli .github/workflows/marketing-shots.yml` (or `actionlint` if installed)
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/marketing-shots.yml
git commit -m "ci: marketing-shots workflow (models cached, dark, 2x)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 7: CI rounds and the owner's pick

- [ ] **Step 1: Open the PR.** Push, then run `gh pr create` with the title `test(visual): marketing captures for sondalab.ai/spexr`. The body lists the scenes, the guard statement and the parity check, and ends with the Claude Code attribution line. Add both labels: `gh pr edit <n> --add-label marketing-shots --add-label screenshots`.
- [ ] **Step 2: Parity check.** When the `screenshots` run finishes, download it and confirm that its scene list and image sizes match the last `screenshots` artifact on main. Then remove the `screenshots` label.
- [ ] **Step 3: Review the marketing artifact.** `gh run download <id> -n marketing-shots-<attempt> -D <scratchpad>/shots-r<k>`. Read every PNG and `meta.json`. Check that each image is 2880×1800, that no scene has a `note`, and that the AI text reads well. Fix what is wrong (fixture content, waits, selectors), push, and wait for the next round. **Budget: 4 rounds.** If round 4 still fails, stop and report to the owner.
- [ ] **Step 4: Owner pick.** Publish a private artifact page showing the final PNGs, then ask the owner which shots go on the page and which one is the hero.
- [ ] **Step 5: Merge** once CI is green and the owner approves. Squash-merge, then remove the spexr worktree and its local branch.

---

## Part B — sondalab-site (`worktree-spexr-minisite`)

### Task 8: Assets and product link

**Files:**
- Create: `src/assets/spexr/*.png` (the owner's picks, renamed to `specs.png`, `spec-detail.png`, `darkfactory.png`, `df-search.png`, `df-card.png`, `harness.png`, `experts.png`, `memory.png`, `search.png`, `git.png`)
- Modify: `src/content/products/spexr.md`

- [ ] **Step 1:** Copy the picked PNGs from the downloaded artifact. Losslessly compress them with `npx --yes oxipng -o 3` if available. They are sources; Astro emits AVIF/WebP.
- [ ] **Step 2:** In `spexr.md`, add the following and replace the stale sentence "with multi-harness support (OpenCode) on the way" with "and runs opencode sessions alongside Claude's":

```yaml
fullPage:
  href: /spexr/
  label: See SPEXR in action
```

- [ ] **Step 3:** Run `npm run check`. Expected: 0 errors.
- [ ] **Step 4:** Commit: `feat(spexr): screenshots and a link to the full page`.

### Task 9: The `/spexr/` page

**Files:**
- Create: `src/pages/spexr.astro`
- Test: `scripts/spexr-page.test.mjs` (built-HTML assertions, `node --test` like the other `scripts/*.test.mjs`)

**Interfaces:**
- Consumes: `Base` layout, `accentVars('spexr')` from `src/lib/accents.ts` (repaint the same way `products/[slug].astro:34-48,178+` does), `Image` from `astro:assets`, and the images from Task 8.

- [ ] **Step 1: Write the failing test.** It reads `dist/spexr/index.html` after a build:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../dist/spexr/index.html', import.meta.url), 'utf8');

test('every feature section is present, in order', () => {
  const ids = [...html.matchAll(/<section[^>]+id="([a-z-]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids, ['specs', 'darkfactory', 'experts', 'memory', 'search', 'also', 'runs']);
});

test('every screenshot has alt text and a full-size link', () => {
  const imgs = [...html.matchAll(/<img[^>]*>/g)].map((m) => m[0]);
  assert.ok(imgs.length >= 10);
  for (const img of imgs) assert.match(img, /alt="[^"]{12,}"/);
  assert.equal((html.match(/class="shot__full"/g) ?? []).length, imgs.length);
});

test('download goes to the releases page', () => {
  assert.match(html, /href="https:\/\/github\.com\/sondalab-ai\/spexr-ide\/releases"/);
});
```

Run: `npm run build && node --test scripts/spexr-page.test.mjs`. Expected: FAIL (no such file).

- [ ] **Step 2: Write the page.** Follow `daos.astro`'s structure (`Base`, `sl-wrap`, `sl-section`, `sl-section__head` with `sl-section__idx`, `sl-eyebrow`, `big-h2`, `sl-prose`, alternating `sl-invert` bands) with the `spexr` accent repaint. Each screenshot is:

```astro
<figure class="shot">
  <a class="shot__full" href={img.src} aria-label={`Open full size: ${alt}`}>
    <Image src={img} alt={alt} widths={[720, 1440, 2880]} sizes="(min-width: 1200px) 1100px, 100vw" />
  </a>
  <figcaption class="sl-prose">{caption}</figcaption>
</figure>
```

  Sections and copy. Verify each number against spexr source before shipping (7 steps: `packages/spec/src/workflow.ts`; 7 experts: `packages/agent/src/experts/catalog.ts`):
  - **Hero:**
    - h1: SPEXR.
    - Sub: "The spec-based IDE where agents do the work and you keep command."
    - Lede: "SPEXR puts the agent session at the centre and keeps every change tied to a written spec. It runs the agent you already have installed, and its own AI features run on your machine."
    - Buttons: Download (releases) and GitHub.
    - Hero image: `darkfactory.png`.
  - **`#specs` 01 Specs:**
    - h2: "Every change starts as a spec."
    - Copy: a spec moves through seven steps, from Specify to Ship. Its context goes to the agent when you hand it over. A drift check flags code that no longer matches what the spec asks.
    - Shots: `specs.png`, `spec-detail.png`.
  - **`#darkfactory` 02 Darkfactory:**
    - h2: "Every agent session on one wall."
    - Copy: live state, a summary written on your machine, and one click to resume. Plus the schedule, finding a session by describing it, and a browser per card.
    - Shots: `darkfactory.png` (large); `df-search.png`, `df-card.png` in a two-up grid. The schedule is visible in the wall shot; caption it there.
  - **`#experts` 03 Experts:**
    - h2: "The right expert for each step."
    - Copy: seven built-in personas. The matching one switches on when a spec moves to a new step.
    - Shot: `experts.png`.
  - **`#memory` 04 Memory:**
    - h2: "What the agent learns, it keeps."
    - Copy: notes for you and for the project, as plain Markdown. Move a note between the two.
    - Shot: `memory.png`.
  - **`#search` 05 Smart search:**
    - h2: "Search by meaning, offline."
    - Copy: keyword and meaning-based search together, and a one-line description of each file written on your machine.
    - Shot: `search.png`.
  - **`#also` 06 Also in the box:** two cards.
    - Git built in, with commit messages the local model writes from the diff. Shot: `git.png`.
    - opencode next to Claude. Shot: `harness.png`.
  - **`#runs` How it runs:**
    - A list: no hosted model API, it starts your local agent binary; on-device models; MIT; macOS, Windows, Linux; public beta.
    - Download CTA.

  `<Base title="SPEXR — the spec-based IDE" description="An IDE where the agent session is the main surface and every change traces back to a spec. See it in action.">`.

- [ ] **Step 3: Run the test**

Run: `npm run build && node --test scripts/spexr-page.test.mjs`
Expected: PASS.

- [ ] **Step 4: Site gates, in parallel where possible:** `npm run check`, `npm test`, `npm run kit-names`, `npm run audit`, `npm run motion-gate`. Expected: all pass. A failure is compared against `main` before it is dismissed.

- [ ] **Step 5: Contrast and layout.** Run `node scripts/contrast-probe.mjs --page /spexr/ --widths 1440,390` (check the flag names in the script header first). Then check in the browser (`npm run preview`, Claude in Chrome) at 1440 px and 390 px: no horizontal scroll, captions readable, images sharp. Text over images is not allowed. Captions sit below the images, so the light-theme `--sl-text-muted` 3.49:1 problem does not arise. Use `--sl-text-secondary` for captions anyway.

- [ ] **Step 6: Commit**

```bash
git add src/pages/spexr.astro scripts/spexr-page.test.mjs
git commit -m "feat(spexr): /spexr/ product page with fresh screenshots

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 10: Site PR

- [ ] **Step 1:** Push `worktree-spexr-minisite` and run `gh pr create` with the title `feat(spexr): /spexr/ product page`. The body says what changed, which spexr PR the shots come from (full URL) and the gates run, and ends with the attribution line.
- [ ] **Step 2:** After green CI and owner approval, squash-merge. Remove this worktree and its branch. Record a memory: the spexr shots come from `marketing-shots.yml`, and re-taking them means relabelling a spexr PR or dispatching from main.
