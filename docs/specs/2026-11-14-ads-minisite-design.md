# ADS minisite — design spec

> **What is this file.** The implementation contract for `/ads/` (a product
> landing page) and `/ads/docs/` (five documentation pages) on sondalab-site,
> and for the rule in the ADS repo that keeps those docs in sync with it.
> Owner: Marcello Barile. Companions:
> `docs/specs/2026-08-24-sondalab-site-design.md` (site-wide contract: stack,
> design-system tier, audit gate), `docs/specs/2026-10-14-spexr-minisite-design.md`
> and `src/pages/spexr.astro` (the structural reference for a product page).
> Source of every fact: `sondalab-ai/agentic-dev-system` (the "ADS repo").

## Why

ADS (`ads`) runs an AI agent team on GitHub issues from a Claude Code session:
tests first, layered review, low-risk changes land signed with a team key, the
rest wait for the human's typed `ok <code>`, and every change can be undone.
It has no public presence. The repo goes public soon; this site section is
where people first learn what it does and how to use it.

Two jobs, one section:

1. **Promote.** A visitor understands in one screen what ADS does, why it is
   safe to let it land code, and what it costs them to try.
2. **Document.** A user finds a working example for what they want to do,
   written simply, with what they say and what they see.

## Decisions (owner, 2026-11-14)

- **Lives in sondalab-site**, not a separate site.
- **Audience: public, as if the repo were public.** Install steps are written
  in full (`git clone` + `make install`). The repo link renders only while
  `repoPublic: true` in the product file; until then it is `false`.
- **Ships live now**, before the ADS repo is public and before `epic/ads-v1`
  reaches `main`. The landing hero and the getting-started page carry a
  visible notice: "ADS is in beta. The repository opens soon." The notice is
  driven by `repoPublic` (shown while `false`), so flipping the flag removes
  it and shows the repo link in one edit. *Builder's call (approved with the
  spec):* the install commands show `git clone <url>` with no branch, because
  the docs describe the release that goes public.
- **Landing plus 4–5 doc pages**, not one long page and not a full mirror of
  the repo guides.
- **Approach A: native Astro pages.** Content is written for the site.
  Rejected: B (import the repo guides at build time: build depends on a
  private repo, and the guides are reference text, not easy reading);
  C (Astro Starlight: its own styling fights `@sondalab/ui-kit` and the audit
  gate).
- **The ADS repo keeps the docs in sync.** An instruction in the ADS repo tells
  its agents to update these pages whenever a user-facing behaviour changes
  (see "Sync with the ADS repo").
- **Branding, design and tone: `@sondalab/ui-kit`** and
  `sondalab-ui/docs/design-language.md`, L5 editorial voice in particular:
  precise and technical, never marketing; active voice; a real figure or real
  output beats an adjective; structure only where it reflects something real.

## Goals

- A visitor can say, after the hero and the first section: "I tell Claude
  Code `fix #12`; a team writes tests, changes the code and reviews it; small
  safe changes land by themselves, signed; anything else waits for my
  `ok <code>`; I can undo any of it."
- Benefits are shown with real output (terminal transcripts), not claimed.
- Every doc page has at least two practical examples written as
  *situation → what you say → what you see → what happens*.
- Every number on the pages (budgets, size limits, time limits, code length,
  approval timeout) matches the ADS code at the synced commit.
- The pages pass `npx astro check`, `npm run audit` (0 R-violations) and
  `npm run build`, in light and dark themes, at phone width.

## Non-goals

- No search, no versioned docs, no i18n (English only, like the rest of the
  site except `/daos/`).
- No port of the internal design specs (`SPEC.md`, `docs/specs/*`) or of the
  GitHub ruleset guide beyond what a user needs.
- No new registered accent: ADS uses the `default` accent.
- No screenshots or video: ADS is a CLI inside Claude Code; transcripts carry
  the proof.
- No blog post and no changes to the home page beyond the product index row
  that the new product file creates.

## Anti-goals (failure even if it builds)

- Hype words or unmeasured claims ("autopilot", "10x", "effortless").
- Invented output: a transcript line that ADS cannot print.
- A number that disagrees with the ADS code.
- Hiding the limits: the approval guard is a text filter, not an OS sandbox.
- Fake social proof (stars, quotes, logos).

## Constraints

- Site stack and gates from the site-wide spec: Astro static output,
  `@sondalab/ui-kit` Tier A, `npm run audit` at 0 R-violations.
- Copy voice: design-language L5. Product identifiers in English and in code
  font (`ads`, `ok <code>`, `.ads/config.yaml`).
- Accessibility: the kit's contrast holds in both themes; transcripts are text
  (`<pre>`), not images; the docs sidebar is a `<nav>` with `aria-current`.
- Facts come from the ADS repo at one commit (see "Sync"). At the time of
  writing that is branch `epic/ads-v1`, commit `d7e7189`; the main branch does
  not have the session workflow yet.

## Information architecture

```
/ads/                       landing (promote)
/ads/docs/                  → redirects or links to getting-started
/ads/docs/getting-started/  1. Getting started
/ads/docs/everyday-use/     2. Everyday use (recipes)
/ads/docs/how-changes-land/ 3. How a change lands
/ads/docs/approvals-and-undo/ 4. Approvals, undo, pause and stop
/ads/docs/status-api/       5. Status API and other tools
/products/ads/              generic product card (from the product file), links to /ads/
```

### Landing `/ads/` — section order

Order follows the prior-art finding that trust must come before install for an
autonomous tool.

1. **Hero** (`PrintHero`, like `/spexr/`). Eyebrow `ADS · beta`. One concrete
   claim that names the mechanism, e.g. "Say `fix #12`. An agent team tests,
   changes and reviews it. You keep the last word." Lede of two sentences.
   Buttons: *Get started* → getting-started, *Read the docs* → everyday-use.
2. **A real session transcript** directly under the hero: the user's
   `fix #13`, the plan line, step lines (`#13  Step   round 1 · implementer
   done · 32 s`), an `End` line, then one `ads needs your approval: …` block
   ending in `To approve, reply:   ok <code>`. Text taken from ADS output
   formats (code, golden files, txtar tests), not written freehand.
3. **How it works, in four steps** (numbered, because it is a real sequence):
   tests first → the change → layered review → lands signed, or waits for you.
   Plus one line: every landed change can be undone with a signed revert.
4. **Benefit sections**, alternating `sl-invert` like `/spexr/`, each one
   claim and its proof:
   - *You talk, it works.* No new tool to learn: you speak to Claude Code.
     Proof: the "You say / What happens" table (short form).
   - *Risk decides who signs.* Proof: the risk → lands → signed-by table.
   - *Every step is signed in git.* Proof: signed events, team key vs your key.
   - *Stop, pause or undo at any time.* Proof: the three verbs, one line each.
   - *A budget per change.* Proof: rounds, seconds and tokens per risk.
5. **What it does not do** (honest limits): the approval guard is a text
   filter running as your user, not an OS sandbox; needs Claude Code; GitHub
   steps optional (`ads init --no-github`); beta.
6. **Install band** (inversion band, primary call to action): prerequisites in
   one line, then `git clone …`, `make install`, `ads init`, `ads doctor`.
7. **Use-case teaser**: three or four recipe titles from everyday-use, each a
   link.

### Docs pages — content

Each page: a one-paragraph "what this page answers", then content, then
"Next" link. Examples are recipes:
**situation** (named from the reader's need) → **you say** → **you see**
(abbreviated real transcript) → **what happens**.

1. **Getting started.** Prerequisites (Go version from `go.mod`, git 2.38+,
   OpenSSH, optional `gh`), install, `ads init` (what it asks, safe to re-run),
   `ads doctor`, your first change ("fix #12" on a small issue), update,
   uninstall.
2. **Everyday use.** Recipes, at minimum:
   - Fix a bug from an issue (`fix #12`).
   - Clear the labelled backlog (`work the queue`).
   - See what waits for you (`what is waiting for me?`, `what happened on #12?`).
   - Ask for one more round after a report (`change X`).
   - Make the team stricter on a folder (`be stricter on payment/`).
   - Follow only what matters (`follow only #13`, `follow only high risk`).
3. **How a change lands.** Risk = highest of declared, path rules, reviewer;
   agents cannot lower it. Risk table, default path rules, size limits,
   review layers per risk, the blocking rule (severity `major` + a failing
   test), the final look, raised risk, budgets. Example: "a 12-line fix in
   `src/` lands by itself; the same fix touching `package.json` waits for you".
4. **Approvals, undo, pause and stop.** The approval block and how to answer;
   the 10-minute window; a plain "ok" approves nothing; what the approval
   protects and what it does not. A table comparing undo / pause / stop
   (needs approval? loses work? can still land?). Examples for each.
5. **Status API and other tools.** `ads status --json`, `ads status N --json`,
   `ads status --follow --json`, the versioned schema, one `jq` example per
   command, output options (`--color`, `NO_COLOR`, `--ascii`).

## Components and data

- `src/content/products/ads.md`: product file. `form: CLI`, `status: beta`,
  `accent: default`, `repo: https://github.com/sondalab-ai/agentic-dev-system`,
  `repoPublic: false`, `fullPage: { href: /ads/, label: … }`.
- `src/lib/ads-page.ts`: landing copy and transcripts as data (like
  `spexr-page.ts`); `src/pages/ads.astro`: layout only.
- A new content collection `adsDocs` (`src/content/ads-docs/*.md`) with a Zod
  schema: `title`, `summary` (≤200), `order` (int), `sources` (non-empty list
  of ADS repo paths), `syncedFrom` (ADS commit SHA, 7–40 hex), `verified`
  (date). Wrong or missing values fail the build.
- `src/pages/ads/docs/[slug].astro` + a docs layout with a sidebar built from
  the collection, ordered by `order`, with previous/next links and a footer
  line "Synced with ADS `<syncedFrom>` on `<verified>`".
- A transcript component (`<pre>` on the ink surface, mono, with terminal role
  spans per `tui-patterns.md`), shared by landing and docs.

## Sync with the ADS repo

Goal: when ADS changes a user-facing behaviour, the site docs change with it.

1. **Instruction in the ADS repo.** A new root `AGENTS.md` (the repo has none;
   `docs/agents/AGENTS.ads.md` is the template `ads` installs into target
   repos and stays untouched) with a "Website docs" rule:
   - A change to user-facing behaviour, a command, a default value or a
     message that the docs show must update the matching page in
     `sondalab-ai/sondalab-site` under `src/content/ads-docs/` (and
     `src/lib/ads-page.ts` for the landing) in a paired PR.
   - The paired PR sets `syncedFrom` to the ADS commit and `verified` to the
     date, and links the ADS PR by full URL.
   - When the agent cannot open a PR in sondalab-site, it opens an issue
     there that names the pages and links the ADS PR by full URL.
   - `syncedFrom` is the ADS commit the page content was checked against
     (the branch head at writing time), not the last commit that touched its
     `sources`. The `AGENTS.md` PR changes no page's `sources`, so the first
     drift run is clean.
   - The mapping from ADS files to site pages is each page's `sources` list.
   - Numbers are copied from the code, not from the README.
2. **Drift check in the site.** `npm run ads-docs:drift -- --ads <path to ADS
   checkout>` lists, per page, the `sources` files changed in the ADS repo
   since that page's `syncedFrom`. Exit code 1 when any page drifted. Local
   tool only (the ADS repo is private until it goes public); a CI job is left
   for later.

## Testing

- `npx astro check`, `npm run audit`, `npm run build` green.
- Schema test: a doc page with a bad `syncedFrom` or empty `sources` fails the
  build (checked once by hand or with a fixture).
- Drift script: unit test with a temporary git repo (one page drifted, one not).
- Visual check: `node scripts/shoot.mjs` in both themes, plus phone width.
- Fact check: every number on the pages traced to an ADS source file and line
  in the PR description.

## Slices

1. **Product file + landing `/ads/`** with the transcript component.
2. **Docs collection, layout and the five pages.**
3. **Sync**: drift script in the site, `AGENTS.md` in the ADS repo (separate
   PR in that repo, into `epic/ads-v1`).

Each slice is one PR, independently reviewable.

## Left to the builder

- Exact copy wording within the L5 voice and the claims above.
- Which hero print and section marks to use (vary them from `/spexr/`).
- Whether `/ads/docs/` is a redirect or a short index page.
