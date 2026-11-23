import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { docHref, neighbours, orderDocs } from '../src/lib/ads-docs.ts';

const doc = (id, order) => ({ id, title: id, order });

test('orderDocs sorts the pages by order', () => {
  const sorted = orderDocs([doc('c', 2), doc('a', 0), doc('b', 1)]);
  assert.deepEqual(sorted.map((d) => d.order), [0, 1, 2]);
});

test('orderDocs refuses two pages with the same order', () => {
  assert.throws(() => orderDocs([doc('a', 0), doc('b', 1), doc('c', 1)]), /duplicate order 1/);
});

test('neighbours gives the previous and the next page, null at the ends', () => {
  const docs = orderDocs([doc('a', 0), doc('b', 1), doc('c', 2)]);
  assert.deepEqual(neighbours(docs, 'a'), { prev: null, next: docs[1] });
  assert.deepEqual(neighbours(docs, 'b'), { prev: docs[0], next: docs[2] });
  assert.deepEqual(neighbours(docs, 'c'), { prev: docs[1], next: null });
  assert.deepEqual(neighbours(docs, 'nope'), { prev: null, next: null });
});

test('docHref is the page path with the trailing slash', () => {
  assert.equal(docHref('status-api'), '/ads/docs/status-api/');
});

// ---- the seven pages ------------------------------------------------------
// Read from the source, since CI runs the tests before the build.

const DIR = new URL('../src/content/ads-docs/', import.meta.url);
const IDS = ['getting-started', 'everyday-use', 'how-changes-land', 'approvals-and-undo', 'find-work', 'status-api', 'team-notes'];

/** A page split into its frontmatter fields (the few the tests read) and its body. */
function page(id) {
  const text = readFileSync(new URL(`${id}.md`, DIR), 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  assert.ok(m, `${id}.md has no frontmatter`);
  const [, head, body] = m;
  const order = Number(head.match(/^order: (\d+)$/m)?.[1]);
  const sources = [...head.matchAll(/^ {2}- (.+)$/gm)].map((s) => s[1].trim());
  return { id, order, sources, body };
}

const pages = () => IDS.map(page);

test('the seven pages exist with orders 0 to 6, in reading order', () => {
  const files = readdirSync(DIR).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''));
  assert.deepEqual(files.sort(), [...IDS].sort());
  assert.deepEqual(orderDocs(pages().map((p) => ({ id: p.id, title: p.id, order: p.order }))).map((p) => p.id), IDS);
  assert.deepEqual(pages().map((p) => p.order), [0, 1, 2, 3, 4, 5, 6]);
});

test('every source of every page exists in the ADS checkout', { skip: !process.env.ADS_REPO_DIR && 'ADS_REPO_DIR is not set' }, () => {
  const root = resolve(process.env.ADS_REPO_DIR);
  for (const p of pages()) {
    assert.ok(p.sources.length > 0, `${p.id}: no sources`);
    for (const s of p.sources) assert.ok(existsSync(join(root, s)), `${p.id}: ${s} is not in ${root}`);
  }
});

// nginx redirects a path without the trailing slash (astro.config.mjs).
test('every internal link ends with a slash', () => {
  for (const p of pages()) {
    const links = [...p.body.matchAll(/\]\((\/[^)\s]*)\)/g), ...p.body.matchAll(/href="(\/[^"]*)"/g)].map((l) => l[1]);
    for (const l of links) assert.ok(l.split('#')[0].endsWith('/'), `${p.id}: ${l}`);
  }
});

// The /ads/ landing links to these recipes (src/lib/ads-page.ts ADS_RECIPES).
// The slug is the one Astro gives a heading: lowercase, only a-z, 0-9,
// spaces and hyphens kept, spaces as hyphens.
test('everyday use has the recipe headings the landing links to', () => {
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ /g, '-');
  const ids = [...page('everyday-use').body.matchAll(/^## (.+)$/gm)].map((h) => slug(h[1]));
  for (const id of ['fix-an-issue', 'work-the-queue', 'whats-waiting', 'one-more-round', 'stricter-rules', 'follow-only']) {
    assert.ok(ids.includes(id), `no heading with id ${id} in ${ids.join(', ')}`);
  }
});

test('every page has at least two example blocks', () => {
  for (const p of pages()) {
    const fences = p.body.match(/^```/gm) ?? [];
    assert.ok(fences.length % 2 === 0 && fences.length / 2 >= 2, `${p.id}: ${fences.length / 2} example blocks`);
  }
});

// Every number on the pages was checked against ADS 29fbba3; a new one must
// be checked too. 1.5M reads as 1.5M and 8M as 8M, so a token budget is
// checked whole. Dates and timestamps are example values, not claims, and
// are left out.
const VERIFIED = new Set([
  '0', // exit code 0 (docs/guides/setup.md:131); counts of 0 in pinned output (init_rerun.txtar:66, report_test.go landedGolden); FORCE_COLOR 0 (README.md:120); ads sweep exits 0 (ADS 6846133 internal/cli/root.go run); sweep budget usd 0 (internal/config/config.go:218); 0 9 of the crontab line (docs/guides/setup.md:160)
  '1', // exit code 1 (setup.md:131); 1 round, 1 review layer, 1 frozen test, 1 warn in pinned output; schema_version 1 (docs/guides/api.md); SONDALAB_ASCII=1 (README.md:121); option 1; ads sweep exits 1 (internal/cli/sweep.go newSweepCmd, internal/cli/root.go run); Filed #1 (cmd/ads/testdata/script/sweep_file.txtar:41)
  '2', // exit code 2 (setup.md:131); 2 new tests (report_test.go landedGolden); option 2; round 2 of an example; 2 files gain protection (trust_risk_rule.txtar:22); ads doctor overdue after 2 days daily (internal/cli/doctor.go:239); 2 issues filed with 8 open: room = min(maxFiled, maxOpen-open) (internal/sweep/file.go:133 Plan) with the defaults of internal/config/config.go:217
  '3', // internal/config/config.go:517 Rounds: 3; option 3; the patch of Go 1.27.3; 3 files lose protection (internal/flow/trustlist_test.go:71); max_findings_per_category 3 (internal/config/config.go:217); calc.go:3 (sweep_dry_run.txtar:25)
  '4', // internal/approve/approve.go:63 the code is 4 hex characters; +4 lines and seq 4 in examples (api.md:36); Read 4 files (sweep_dry_run.txtar:23)
  '6', // internal/config/config.go:569-573 high and critical have 6 review layers (store.ReviewLayers)
  '8', // UTF-8 (README.md:121); 8 days weekly (internal/cli/doctor.go:241); 8 open sweep issues in the cap example (internal/sweep/file.go:133 Plan)
  '10', // internal/approve/approve.go:31 TTL = 10 * time.Minute; max_open 10 (internal/config/config.go:217)
  '12', // example: issue #12 (README.md table, report_test.go landedGolden); the 12-line fix of how-changes-land; the 12 hex characters of the sweep label (internal/onboard/sweepjob.go:40)
  '13', // example: issue #13 (internal/report/view_test.go)
  '14', // example: issue #14
  '16', // README.md:120 the 16 ANSI colours of the terminal theme; the 16 hex characters of the sweep fingerprint (internal/sweep/file.go:30)
  '18', // example: +18 lines of a test file in the sign-off block (slice 1 ADS_APPROVAL)
  '20', // internal/config/config.go:587 trivial 20 lines
  '32', // example: implementer 32 s (internal/report/view_test.go:52)
  '74', // example: test author 74 s (internal/report/view_test.go:51)
  '120', // internal/flow/follow.go:495 "no running change for 120 seconds"
  '5', // internal/flow/run.go:17 runProgressEvery = 5 * time.Minute (killed run loses at most about 5 minutes); max_filed 5 (internal/config/config.go:217)
  '130', // internal/cli/signal.go:63 exit 128 + SIGINT (2); ads sweep too (internal/cli/sweep.go:41 interruptible)
  '143', // internal/cli/signal.go:63 exit 128 + SIGTERM (15); ads sweep too (internal/cli/sweep.go:41 interruptible)
  '160', // internal/flow/ask.go:515 summaryRunes = 160
  '200', // internal/config/config.go:587 low 200 lines; max_open at most 200 (internal/config/schema/config.schema.json:155)
  '400', // internal/config/config.go:587 medium 400 lines
  '1200000', // example: tokens of the status document in docs/guides/api.md:23
  '3600', // internal/config/config.go:517 Seconds: 3600
  '0.21', // example: $0.21 in internal/report/report_test.go landedGolden
  '0.48', // example: usd of the status document in docs/guides/api.md:23
  '1.27', // go.mod:3 go 1.27.3
  '2.38', // scripts/install.sh:38 git 2.38 or newer
  '2.46', // README.md:14 git 2.46 or newer is better
  '123k', // example: 123k tokens (internal/report/view_test.go:65)
  '1M', // internal/config/config.go:524 trivial 1M tokens
  '1.2M', // example: 1.2M tokens in internal/report/report_test.go landedGolden
  '1.5M', // internal/config/config.go:524 low 1.5M tokens
  '3M', // internal/config/config.go:525 medium 3M tokens
  '8M', // internal/config/config.go:525 high and critical 8M tokens
  // ads sweep, checked against ADS 6846133.
  '1k', // example: 1k tokens (cmd/ads/testdata/script/sweep_dry_run.txtar:24)
  '40', // internal/config/config.go:217 MaxFiles: 40; example calc.go:40 (sweep_dry_run.txtar:26)
  '50', // internal/config/schema/config.schema.json:154 max_filed maximum 50
  '4M', // internal/config/config.go:218 sweep Tokens: 4_000_000
  '900', // internal/config/config.go:218 sweep Seconds: 900
  '1000', // internal/flow/sweep.go:80 maxSweepIssues = 1000
  '09', // internal/cli/sweep.go:179 --at default 09:00
  '00', // internal/cli/sweep.go:179 --at default 09:00
  '9', // docs/guides/setup.md:160 the crontab line 0 9 * * *
  '07', // example: --at 07:30 (docs/guides/setup.md:139, sweep_schedule.txtar:82)
  '30', // example: --at 07:30 (docs/guides/setup.md:139, sweep_schedule.txtar:82)
  '2.50', // README.md:16 gh 2.50 or newer; ads doctor GitHub CLI version (internal/onboard/ghversion.go:15-16 ghMinMinor, ghVersionFix)
  // Numbers already on the pages that the list missed, checked against ADS b64742e.
  '1.00', // internal/config/config.go:791 AssessBudget USD: 1.00 (the assessor's $1.00 per call)
  '000', // internal/config/config.go:791 AssessBudget Tokens: 200_000, written 200,000 (the regex reads 200 and 000)
  '21', // example: issue #21 of the outsider question on approvals-and-undo
  '60', // internal/flow/stranger.go:159 shownRunes = 60
  '79', // example: the 79 characters of the two-line body in the outsider question (internal/flow/stranger.go:198 Body size)
  '256', // internal/flow/stranger.go:206 shasum -a 256
  // Team notes, checked against ADS b64742e. 2 (internal/memory/flag.go:22 MaxFlagsPerResult), 3
  // (internal/memory/learning.go:21 MaxLearnings; internal/flow/memorydrift.go:20 DriftSessionBudget),
  // 4 (internal/memory/flag.go:23 MaxFlagsPerFix), 5 (internal/memory/mxm.go:21 MxMLimit) and 8
  // (internal/flow/trustnotes.go:13 maxNoteItems, internal/flow/memoryheld.go:27 maxKeepItems,
  // internal/cli/memory.go:138 forget) are in the list above; 16 KiB is internal/memory/filter.go:36.
  '7', // internal/store/learned.go:30 MemoryWindow = 7 * 24 * time.Hour
  '64', // internal/memory/filter.go:35 MaxNotes = 64
  '140', // internal/memory/filter.go:30 MaxNoteRunes = 140
  '100', // internal/flow/memoryreminder.go:34 maxIssueLines = 100
  '0042', // example: CDR-0042 (docs/guides/api.md learnings_waiting entry, docs/guides/setup.md)
  // Sguardo retro epic, checked against ADS 154c220.
  '300', // internal/cli/doctorchecks.go:27 doctorCheckTimeout = 300 (ads doctor trunk checks)
  '1250', // example: seconds spent in the budget question (internal/flow/budget.go:226 "%.0f of %d seconds")
  '0002', // example: refs/ads/attempts/CDR-0002/A1 of the Branch line (internal/report/view_test.go:233)
]);

test('the pages state no number that was not verified', () => {
  for (const p of pages()) {
    const text = p.body.replace(/\d{4}-\d{2}-\d{2}(T[\d:.]+Z)?/g, '');
    for (const [n] of text.matchAll(/\b\d+(\.\d+)?[kM]?\b/g)) assert.ok(VERIFIED.has(n), `${p.id}: unverified number ${n}`);
  }
});

// The built-in budgets, cell by cell (ADS internal/config/config.go:517-525).
test('how a change lands holds the built-in budgets', () => {
  const body = page('how-changes-land').body;
  for (const row of [
    '| trivial | 3 | 3600 | 1M |',
    '| low | 3 | 3600 | 1.5M |',
    '| medium | 3 | 3600 | 3M |',
    '| high | 3 | 3600 | 8M |',
    '| critical | 3 | 3600 | 8M |',
  ]) assert.ok(body.includes(row), `missing budget row ${row}`);
});

test('how a change lands shows the 12-line fix example', () => {
  assert.match(page('how-changes-land').body, /12-line fix in `src\/` lands by itself[\s\S]*`package\.json` waits for you/);
});

test('the undo, pause and stop table has its three questions', () => {
  assert.match(page('approvals-and-undo').body, /^\|[^\n]*\| Needs approval \| Loses work \| Can still land \|$/m);
});

// Trivial, low and medium can land by themselves (ADS internal/flow/landing.go
// landingAt), and the team key signs only once ads init set it up and trusted
// it (internal/flow/landing.go signerOf).
test('the pages never say only low risk lands by itself', () => {
  for (const p of pages()) assert.doesNotMatch(p.body, /anything riskier|low[- ]risk change lands by itself|only low risk|low risk lands/i, p.id);
});

test('every page that says the team key signs says when', () => {
  for (const p of pages()) {
    if (/team key/i.test(p.body)) assert.match(p.body, /once `ads init` has set up the team key/i, p.id);
  }
});

test('the pages use no hype words', () => {
  for (const p of pages()) assert.doesNotMatch(p.body, /seamless|powerful|effortless|autopilot|10x|blazing/i, p.id);
});

// A <pre> that scrolls sideways must take the keyboard focus. Shiki gives
// every block tabindex="0" (astro.config.mjs); the built page proves it.
const BUILT = new URL('../dist/ads/docs/everyday-use/index.html', import.meta.url);
test('every example block of a built docs page is keyboard-focusable', { skip: !existsSync(BUILT) && 'no build in dist/' }, () => {
  const pres = readFileSync(BUILT, 'utf8').match(/<pre\b[^>]*>/g) ?? [];
  assert.ok(pres.length >= 2, 'no example blocks in the built page');
  for (const pre of pres) assert.match(pre, /tabindex="0"/, pre);
});
