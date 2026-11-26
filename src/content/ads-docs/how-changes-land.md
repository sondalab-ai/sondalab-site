---
title: How a change lands
summary: How ADS sets the risk of a change, which changes land by themselves, and the checks, review layers and budgets on the way.
order: 2
sources:
  - README.md
  - docs/guides/setup.md
  - internal/config/config.go
  - internal/cli/diff.go
  - internal/cli/diffwindow.go
  - internal/flow/github.go
  - internal/flow/run.go
  - internal/flow/integrate.go
  - internal/flow/report.go
  - internal/flow/landing.go
  - internal/flow/answer.go
  - internal/flow/attempt.go
  - internal/flow/view.go
  - internal/report/report.go
  - internal/report/view.go
  - internal/report/view_test.go
  - internal/risk/risk.go
  - internal/stage/validate.go
  - internal/stage/assess.go
  - internal/agent/exec.go
  - internal/agent/claude.go
  - internal/agent/kinds/kinds.go
  - internal/flow/stranger.go
  - internal/flow/learning.go
  - internal/stage/learn.go
  - internal/stage/memory.go
  - internal/flow/budget.go
  - internal/flow/environment.go
  - internal/check/check.go
  - internal/onboard/stack.go
  - internal/stage/tests.go
  - internal/agent/prompts/assessor.md
syncedFrom: 88d9830617563c8fe52596554dff59cf89318854
verified: 2026-11-26
---

This page answers: will this change land by itself, or wait for me, and why? The answer depends on the risk of the change, its size, and what the review found. The rules below are the defaults that `ads init` writes, or that apply when `.ads/config.yaml` sets none.

## The risk of a change

The risk is the highest of three:

- the risk the team declares for the request;
- the path rules in `.ads/config.yaml`, for the files the change touches;
- the risk a reviewer raises.

Agents cannot lower the risk below the path rules. The risk decides who signs the change:

<div class="table-wrap">

| Risk | Lands | Signed by |
|---|---|---|
| trivial, low | by itself, when every check passes and the team key is set up | team key |
| medium | by itself, when every check passes, the run had no dispute and no stall, and the team key is set up; otherwise it waits for your sign-off. A fix of a sweep issue always waits. | team key, or you |
| high, critical | waits for your sign-off | your key |

</div>

The team key signs only once `ads init` has set up the team key and listed it as trusted in `.ads/allowed_signers`. Until then `ads work` does not start, so no change runs or lands.

A report that starts with `Ready for sign-off` waits for you. Its `Sign-off` line says `read the code with ads diff 13, then approve` (the issue number, or the change id when there is no issue). Claude Code runs `ads diff 13` for you, then asks for your approval in the same turn. `ads diff` is read-only and pushes nothing. In a Claude Code session it lists the changed files, then opens the code: in the tool git names in `diff.guitool` when that is set, else in the ADS viewer in a new Terminal window (Ghostty when the session runs in Ghostty). In a terminal it opens `diff.tool` or `diff.guitool`, else the ADS viewer in place.

After your `ok <code>`, the change is signed with your key. If the change moved in the meantime, the sign-off stops and the team gives a new report.

Each `ads work` on a change that waits for your sign-off runs the checks again on the current trunk. The report then shows the notes the team learned, so you see them before you sign off. If the trunk moved and the change now conflicts with it, or a check fails, the change goes back to the team instead of showing ready.

When the code of a change stays on your machine until your sign-off (high risk, or a CI file), ADS opens its pull request as a draft. The pull request text says that the code stays on this machine, and how to read it: run `ads diff 13` in the clone that ran ADS. When GitHub refuses a draft, ADS opens a normal pull request instead.

## Path rules

A change to one of these files is `high` risk:

- dependency manifests and lock files, such as `package.json`, `go.mod` or `Cargo.lock`;
- CI configuration and build files, such as `.github/**` or a `Makefile`;
- `**/auth/**`, `**/crypto/**` and `**/migrations/**`;
- the files that steer agents: `.claude/**`, `CLAUDE.md`, `AGENTS.md`, `.mcp.json`, and others.

A change to `.claude/**`, `.mcp.json`, `CLAUDE.md`, `**/CLAUDE.md`, `AGENTS.md`, `.github/workflows/**`, `.github/actions/**`, `.gitmodules` or `.gitattributes` is `critical`.

## Size limits

Even within its risk, a change lands by itself only when it is small. The limit counts added plus deleted lines, without the frozen tests:

- `trivial`: at most 20 changed lines;
- `low`: at most 200;
- `medium`: at most 400.

A binary file, or a change to a file outside what the request allows, also makes the change wait for your sign-off.

## Checks

The checks are the commands under `checks` in `.ads/config.yaml`. `ads init` writes them for the stack it finds in the root files of the repository (`go.mod`, `Cargo.toml`, `package.json` with its lock file, `pyproject.toml`, `uv.lock`, `poetry.lock`). It reads those files and runs nothing. A Go module gets the Go checks. A pnpm repository with Vitest in its root `package.json` gets the check `pnpm exec vitest run` and `checks.setup: "pnpm install --frozen-lockfile --prefer-offline"`. npm, yarn, Jest, Rust and Python with pytest get their own commands. The `Stack` line of `ads init` names what it found. A repository with no known stack gets no check command, and `ads work` refuses to start until the config names one: `No check command in .ads/config.yaml`.

`checks.setup` is an optional command that prepares a checkout, for example `pnpm install --frozen-lockfile`. ADS runs it once in each checkout it makes before the checks run there: the change, the copy of the base, the copy for the tests and the copy for a reviewer's reproducer. It runs with the same tools, temporary home and `checks.timeout_seconds` as the checks, so a package manager starts with an empty cache each time and needs network access. With `sandbox.driver: container` the checks have no network, so an install that needs a registry fails there. `setup` is a reserved check name.

A check that fails the same way on the base, before the change, is accepted only up to `medium` risk. From `high` up it blocks the round. The report then says `checks fail on base too`, not `checks pass`.

A check that cannot run proves nothing about the code: a missing tool, packages that are not installed, no test files, or a failed `checks.setup`. The fix then stops with one question about the environment, instead of one more round:

```text
Waiting for you: #12 ApplyFee truncates instead of rounding
Blocked      The check "test" could not run; the output says: "No test files found, …
Options      1. stop  2. fix the environment, then retry
Recommended  fix the environment, then retry
Answer       say what to do, for example "fix the environment, then retry"
```

Fix the environment, then answer `fix the environment, then retry`: ADS runs the checks again on the same code, with no new round and no budget spent. To give up, stop the change.

## Tests of a change

The test author writes new test files that carry the change tag in their name, for example `split_cdr0007_test.go`, or `split.cdr0007.test.ts` in the usual JavaScript and TypeScript form.

A test file must load in the test runner. A file with a syntax error, or one that imports a module that does not exist, proves nothing about the code. With a plain `vitest run` test runner, ADS adds the Vitest JSON report to the frozen run to see this. It refuses such a file before it freezes the tests and asks you, with the file and the error in the question. A test of a `feature` change may import a new module of the change. Set `checks.oracle: exit` to judge the run by its exit code only. Go tests get the same rule from the compiler.

When a frozen test file cannot load later, ADS runs it again on the frozen tests without the change. If it loads there, the change broke it, and the implementer gets another round. If it fails there too, no round can fix it, and ADS asks after the first round:

```text
Waiting for you: #11 Share link escapes HTML
Blocked      Could not load the frozen test "apps/api/src/share.cdr0004.test.ts": "Transform failed…
Options      1. rewrite the tests  2. stop
Recommended  rewrite the tests
Answer       say what to do, for example "rewrite the tests"
```

Answer with how the tests must be written. ADS ends this try and starts a fresh one: a new test author gets your answer and the error, and its tests are frozen again. A frozen test is never edited.

For a change of type `refactor`, `chore` or `docs`, each acceptance criterion names what stays the same, for example "MONOREPO_ROOT still resolves to the same path", and the new text goes in the intent. So a comment-only change in a code file is a `chore`, and its tests check that the code still behaves the same, never the text of the comment. A repository that keeps its own `.ads/prompts/assessor.md` or `.ads/prompts/test_author.md` does not get these rules.

## Review layers

Each layer is a separate reviewer. The more risk, the more layers:

<div class="table-wrap">

| Risk | Layers |
|---|---|
| trivial | correctness |
| low | correctness, scope |
| medium | correctness, scope, acceptance |
| high, critical | correctness, scope, acceptance, security, concurrency, api |

</div>

A finding blocks the change only from severity `major`, and only with a reproducer: a test that fails on the change. A finding without both does not block the change.

## Team notes in a change

When `memory.roles` in `.ads/config.yaml` names them, the assessor and the review layers read the team notes and the learned notes. The default is `[assessor, reviewer]`, so memory is on when the config has no `memory` block. `memory: {roles: []}` turns it off, and then no agent reads a note. The final look and the environment layer never get notes. Whatever the config says, ADS removes `.ads/memory/` from every agent and check checkout, and refuses a change that puts a file there.

With `memory.learn` on (the default) and a role in `memory.roles`, the implementer may propose up to 3 learnings, and the review layers judge them after the review passes. The learnings that every judging layer kept land with the fix, in the same commit, appended to `.ads/memory/learned.md`. The size limits leave that file out. A learning that touches a guard, comes from untrusted request text, belongs to a high-risk fix, or makes a check less strict is held: it does not land with the fix, and once the fix has landed it waits for your `ok <code>`. The guard words also match spaced letters such as "t e s t", and a learning in a script other than Latin is held too. A kept learning lands with no question, so in a public repository anyone can read it: the first time ADS adds a note to `.ads/memory/learned.md`, it says so. The report lists them under `Learned`:

```text
Learned      kept: "Fee rounding in billing/ rounds half to even."
```

An undo removes the learned lines of the fix it undoes. [Team notes](/ads/docs/team-notes/) has the rules.

## Docs changes

A change of type `docs` has no test author: a test of a docs change passes before and after it, so it proves nothing. The plan names no test author, and the report's Proof line says so:

```text
…
#14  Plan   implementer, 1 review layer · at most 3 rounds · 1M tokens · 3600 s
…
Proof        docs only, no test · checks pass
```

A docs change may touch only documentation: `*.md`, `*.mdx`, `*.markdown`, `*.rst` and `*.adoc` files. When a request typed `docs` has a file in its scope that is not documentation, for example a comment fix in a `.py` file, or a glob such as `docs/**` that can hold code, ADS asks one question before any work starts:

```text
Waiting for you: #14 Fix the comment of MONOREPO_ROOT
Blocked      The request is typed docs, but its scope holds files that are not docs: scripts/…
Options      1. chore  2. keep docs (high risk)  3. stop
Recommended  chore
Answer       say what to do, for example "chore"
```

- `chore`: the change gets the risk that the rules give its diff, and its normal tests.
- `keep docs (high risk)`: the change stays a docs change and waits for your sign-off.
- `stop`: no change exists yet, so nothing is lost and no approval is needed. The issue then stays out of the queue until you change its title or body, or answer the question again. Remove its `ads` label to drop it for good.

Only these answers count. Any other answer asks again, and the question then names the accepted answers.

If the diff of a docs change changes any other file, its risk becomes at least `high`, so it waits for your sign-off, and its Proof line no longer says `docs only`. The report's `Risk` line names the file and the rule, for example `Risk         high: scripts/build.sh is not a docs file, and a docs change may only change docs, declared low`.

## The final look

Before a change lands by itself, one more reviewer sees only the request and the final diff. A problem it confirms sends the change back for one more round. If it finds a problem again, the team asks you, with three options:

```text
Waiting for you: #12 ApplyFee truncates instead of rounding
Blocked      The final review found a problem again: "…".
Options      1. say how to fix it  2. explain why the finding is wrong  3. stop
Recommended  say how to fix it
Answer       say what to do, for example "say how to fix it"
```

## Raised risk

A reviewer can raise the risk. The change then follows the rules of the higher risk, and the report says so on its `Risk` line, for example `Risk         high: security review raised it, declared low`. A change you expected to land by itself can then wait for your sign-off.

## Sweep issues

An issue that `ads sweep` filed holds text that a model wrote after it read trunk code (see [Find work](/ads/docs/find-work/)). Anyone who lands code can plant text there, so ADS treats that text as untrusted. ADS knows a sweep issue by the marker in its body, not by its label, whoever filed it.

- Its fix lands by itself only at risk `trivial` or `low`.
- From `medium` up, its fix always waits for your `ok <code>`, even after a clean run with no dispute and no stall.
- Its fix files no follow-up issues, so text planted in the code never turns into more issues.

The `Why` line of the report says why the fix waits:

```text
Why          found by the sweep, risk medium
Sign-off     read the code with ads diff 12, then approve
```

When a reviewer raised the risk, the line reads `found by the sweep, a reviewer raised the risk to <risk>`.

## Issues from other accounts

The text of an account without write access on the repository is untrusted. `ads work` drops its comments, so they never reach the agents. An issue that such an account opened needs your `ok <code>` before the team reads it ([Approvals, undo, pause and stop](/ads/docs/approvals-and-undo/#an-issue-from-another-account)). Its fix files no follow-up issues. It lands by the same risk rules as any other change.

## Budgets

Each change has a budget, so a stuck run stops and asks you before it spends more. By default:

<div class="table-wrap">

| Risk | Rounds | Seconds | Tokens |
|---|---|---|---|
| trivial | 3 | 3600 | 1M |
| low | 3 | 3600 | 1.5M |
| medium | 3 | 3600 | 3M |
| high | 3 | 3600 | 8M |
| critical | 3 | 3600 | 8M |

</div>

Tokens count every kind, cache reads included. The seconds count only the time while a stage runs: the time between two runs, a wait for your answer and a pause between runs are not counted. Ctrl-C on `ads work` ends the running stage cleanly, and a run that was killed counts up to the last thing it recorded, at most about 5 minutes back. A change has no dollar limit by default. The assessor has a dollar limit of $1.00 per call. A `claude` agent gets the dollar limit of its call as `--max-budget-usd`, together with the adapter's `max_budget_usd`: the smaller one applies. A call that reaches it fails, and its cost still counts. When a change uses up its budget, it stops with a question that shows what the attempt spent against each limit, for example `The attempt used its token budget for low risk. Spent on this attempt: 1.5M of 1.5M tokens, 2 of 3 rounds, 1250 of 3600 seconds. Spend one more budget?` ADS recommends `spend one more budget` only the first time. It recommends `stop` once a budget was granted, or when the last two rounds made no progress (see below). One more budget needs your approval. To set your own budgets, change the team rules, for example "raise the budget for medium changes".

When the last two failed rounds made the same change and the checks gave the same results, the change makes no progress. ADS then stops before another round, asks one question and offers no extra budget:

```text
Waiting for you: #12 ApplyFee truncates instead of rounding
Blocked      The last two rounds made the same change and the check "test" failed the same way: …
Options      1. say how to fix it  2. stop
Recommended  stop
Answer       say what to do, for example "stop"
```

When ADS knows the cause, the question names it, for example a check that fails on the base too at a risk that does not accept that. To try again, answer `say how to fix it` with what the implementer must do differently. A change in the diff or in any check result never triggers this question.

A budget can count only what the agents report. An `exec` agent must report each amount that the budget of its call limits, or ADS refuses its answer:

- With a token limit, its `cost` reports at least one of `tokens_in`, `tokens_out`, `tokens_cache_write` and `tokens_cache_read`. Every budget in the table above has one, and so does the assessor.
- With a dollar limit, its `cost` reports `usd`. The assessor always has one, so an `exec` assessor always reports `usd`.
- A field that is `null` counts as missing. A reported `0` is accepted.

The error names what is missing, for example `exec adapter: the cost has no usd and no tokens, but the budget limits them`. A `claude` agent fails the same way when its call has a dollar limit and Claude Code reports no cost: `claude adapter: output has no total_cost_usd, but the budget limits usd`.

An `exec` adapter can declare in its `facts` block which amounts its agent reports, for example `facts: {cost: [tokens]}`. `cost` lists `tokens`, `usd`, both, or none (`[]`). An amount that the list leaves out is declared as not reported. Without `cost`, ADS checks each answer against the budget of its call, as above.

- After each call, an answer that leaves out an amount the list promises fails, also when no budget limits it. The error then ends in `or the adapter facts promise them`, for example `exec adapter: the cost has no usd, but the budget limits them or the adapter facts promise them`.
- When the config loads, ADS refuses a budget that limits an amount the list leaves out, because each call would fail after its spend. For example `adapters.codex: facts.cost says the agent does not report usd, but budgets.high.usd limits usd for the implementer: add usd to facts.cost`.
- A limit that the config does not set is marked `(built in)`, for example `budgets.default.tokens (built in)`. For the `escalate_to` adapter of the implementer, the error says `for the implementer (escalate_to of <implementer adapter>)`.
- Every budget in the table has a token limit, and so does the sweep, so a role adapter with a `cost` list must list `tokens`. The assessor budget limits both amounts, $1.00 and 200,000 tokens per call, so an `exec` assessor with a `cost` list must list `tokens` and `usd`. Its error names `the assessor budget ($1.00 per call)` or `the assessor budget (200,000 tokens per call)`.
- A trunk config that already has such a budget still reads, so a team-rule change can repair it. `ads doctor` shows the error as an `Adapter costs` warning ([Getting started](/ads/docs/getting-started/#check-ads-doctor)).

## Example: the same fix, two outcomes

A 12-line fix in `src/` lands by itself; the same fix touching `package.json` waits for you.

**Situation.** Issue #12 asks to round a fee. The team declares it `low`.

**You say**

```text
fix #12
```

**You see**, when the fix changes 12 lines in `src/` only:

```text
#12  Step   risk low: as declared
…
#12  End    landed · …
```

**You see**, when the same fix also adds a dependency to `package.json`:

```text
#12  Step   risk high: package.json matches a path rule
…
#12  End    ready for sign-off · …
```

**What happens.** In the first case the risk stays `low`, 12 lines is within the limit of 200, and the change lands by itself once every check and the final look pass. In the second, `package.json` is a dependency manifest, so a path rule makes the change `high`: six review layers check it, and it waits for your `ok <code>` (see [Approvals, undo, pause and stop](/ads/docs/approvals-and-undo/)).
