import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ADS_APPROVAL,
  ADS_BENEFITS,
  ADS_FIRST_RUN,
  ADS_HERO,
  ADS_INSTALL,
  ADS_LIMITS,
  ADS_PREREQS,
  ADS_RECIPES,
  ADS_SESSION,
  ADS_STEPS,
  repoState,
} from '../src/lib/ads-page.ts';

const COPY = JSON.stringify([ADS_HERO, ADS_STEPS, ADS_BENEFITS, ADS_LIMITS, ADS_PREREQS, ADS_FIRST_RUN]);

test('the repo notice shows until the repository is public, then the link does', () => {
  assert.deepEqual(repoState(false), { notice: 'ADS is in beta. The repository opens soon.', repoHref: null });
  assert.deepEqual(repoState(true), { notice: null, repoHref: 'https://github.com/sondalab-ai/agentic-dev-system' });
});

test('the benefit sections come in the agreed order, after four steps', () => {
  assert.deepEqual(ADS_BENEFITS.map((b) => b.id), ['talk', 'risk', 'signed', 'control', 'budget']);
  assert.equal(ADS_STEPS.length, 4);
});

test('the session shows the request, the plan, the steps and the end', () => {
  const texts = ADS_SESSION.map((l) => l.text);
  assert.match(texts[0], /fix #13$/);
  assert.ok(texts.some((t) => t.startsWith('#13  Plan   ')));
  assert.ok(texts.filter((t) => t.startsWith('#13  Step   ')).length >= 2);
  assert.match(texts.at(-1), /^#13  End    /);
});

test('the approval block ends on the reply line with a 4-hex code', () => {
  assert.match(ADS_APPROVAL[0].text, /^ads needs your approval: /);
  assert.match(ADS_APPROVAL.at(-1).text, /^To approve, reply:\s+ok [0-9a-f]{4}$/);
});

test('install runs make install, then ads init, then ads doctor', () => {
  const texts = ADS_INSTALL.map((l) => l.text);
  const at = (s) => texts.findIndex((t) => t.includes(s));
  assert.ok(at('make install') >= 0 && at('make install') < at('ads init') && at('ads init') < at('ads doctor'), texts.join('\n'));
});

test('every recipe link is a docs path with the trailing slash', () => {
  assert.ok(ADS_RECIPES.length >= 3 && ADS_RECIPES.length <= 4);
  for (const { href } of ADS_RECIPES) {
    assert.ok(href.startsWith('/ads/docs/'), href);
    assert.ok(href.split('#')[0].endsWith('/'), href);
  }
});

// Every number on the page was checked against the ADS code at d7e7189; a new
// one must be checked too, so the test lists the ones that were.
const VERIFIED = new Set([
  '1', // internal/config/config.go:511 trivial 1M tokens, and low 1.5M (the regex stops at the dot)
  '3', // internal/config/config.go:504 Rounds: 3
  '10', // internal/approve/approve.go:31 TTL = 10 * time.Minute
  '12', // example: issue #12, as in the ADS README table
  '13', // example: issue #13, as in internal/report/view_test.go
  '20', // internal/config/config.go:574 trivial 20 lines
  '200', // internal/config/config.go:574 low 200 lines
  '400', // internal/config/config.go:574 medium 400 lines
  '2.38', // scripts/install.sh:38 git 2.38 or newer
  '3600', // internal/config/config.go:504 Seconds: 3600
]);

test('the copy states no number that was not verified', () => {
  const found = new Set([...COPY.matchAll(/\b\d+(\.\d+)?\b/g)].map((m) => m[0]));
  for (const n of found) assert.ok(VERIFIED.has(n), `unverified number ${n}`);
});

// The number regex reads 1.5M as 1 and 3M as nothing, so the budget table is
// checked cell by cell (internal/config/config.go:504, 511-512).
test('the budget table holds the built-in budgets', () => {
  const budget = ADS_BENEFITS.find((b) => b.id === 'budget');
  assert.deepEqual(budget.table.head, ['Risk', 'Rounds', 'Seconds', 'Tokens']);
  assert.deepEqual(budget.table.rows, [
    ['trivial', '3', '3600', '1M'],
    ['low', '3', '3600', '1.5M'],
    ['medium', '3', '3600', '3M'],
    ['high', '3', '3600', '8M'],
    ['critical', '3', '3600', '8M'],
  ]);
});

// Trivial, low and medium can land by themselves (ADS internal/flow/landing.go
// landingAt); copy that says only low risk does contradicts the landing table.
test('the copy never says only low risk lands by itself', () => {
  const all = JSON.stringify([ADS_HERO, ADS_STEPS, ADS_BENEFITS]);
  assert.doesNotMatch(all, /anything riskier|low[- ]risk change lands by itself|low risk lands/i);
  assert.match(ADS_HERO.lede, /small change of trivial, low or medium risk[^.]*can land by itself/);
  assert.match(ADS_HERO.lede, /high and critical[^.]*`ok <code>`/);
});

// A change lands by itself only within its size limit, and a medium one only
// with no dispute and no stall (ADS internal/flow/landing.go Landing,
// landingAt): step 4 says both conditions.
test('step 4 states the size limit and the medium condition', () => {
  assert.match(ADS_STEPS[3].body, /within its size limit/);
  assert.match(ADS_STEPS[3].body, /medium one only when the run had no dispute and no stall/);
});

// ads init writes the fake adapter for every role (ADS docs/guides/setup.md),
// so the install band says what a first change needs.
test('the install band says to set the agents before the first change', () => {
  assert.match(ADS_FIRST_RUN, /`fake` adapter/);
  assert.match(ADS_FIRST_RUN, /use the claude agents for every role/);
});

// ads work refuses to start without a trusted team key (ADS
// internal/cli/work.go workFlow), so the agents' steps are never signed with
// the operator's key: the copy says when ads work starts, and never that your
// key signs agent steps.
test('the landing says ads work needs the team key, and your key signs only your actions', () => {
  const signed = ADS_BENEFITS.find((b) => b.id === 'signed');
  assert.match(signed.body.join(' '), /`ads work` starts only once `ads init` has set up the team key/);
  assert.deepEqual(signed.table.rows.find((r) => r[0].startsWith('the agent team'))?.[1], 'team key');
  const all = JSON.stringify([ADS_HERO, ADS_STEPS, ADS_BENEFITS, ADS_LIMITS]);
  assert.doesNotMatch(all, /your key (signs )?(those|before that)|until then your key|your key signs[^.]*(agent|tests|review|what the agents)/i);
});
test('the copy uses no hype words', () => {
  const all = JSON.stringify([COPY, ADS_SESSION, ADS_APPROVAL, ADS_INSTALL, ADS_RECIPES]);
  assert.doesNotMatch(all, /seamless|powerful|effortless|autopilot|10x|blazing/i);
});

// At ADS d7e7189 a folder path rule ("be stricter on payment/") is refused as
// too large to approve (internal/flow/ask.go checkItems): the landing shows a
// team-rule change that ADS accepts.
test('the landing shows no team-rule example that ADS refuses', () => {
  const all = JSON.stringify([ADS_HERO, ADS_STEPS, ADS_BENEFITS, ADS_LIMITS, ADS_RECIPES]);
  assert.doesNotMatch(all, /payment\//);
});

// The landing and the docs state the same budgets and size limits, read from
// the docs page that the drift check ties to ADS internal/config/config.go.
test('the landing budgets and size limits equal how-changes-land', () => {
  const doc = readFileSync(new URL('../src/content/ads-docs/how-changes-land.md', import.meta.url), 'utf8');
  const budget = ADS_BENEFITS.find((b) => b.id === 'budget');
  for (const row of budget.table.rows) assert.ok(doc.includes(`| ${row.join(' | ')} |`), `docs miss budget row ${row.join(', ')}`);
  const docLimits = Object.fromEntries([...doc.matchAll(/^- `(trivial|low|medium)`: at most (\d+)/gm)].map((m) => [m[1], m[2]]));
  const risk = ADS_BENEFITS.find((b) => b.id === 'risk').body.join(' ');
  const m = risk.match(/(\d+) changed lines for trivial, (\d+) for low, (\d+) for medium/);
  assert.ok(m, 'the landing states no size limits');
  assert.deepEqual({ trivial: m[1], low: m[2], medium: m[3] }, docLimits);
});
