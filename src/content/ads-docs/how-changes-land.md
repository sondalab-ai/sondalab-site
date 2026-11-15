---
title: How a change lands
summary: How ADS sets the risk of a change, which changes land by themselves, and the checks, review layers and budgets on the way.
order: 2
sources:
  - README.md
  - docs/guides/setup.md
  - internal/config/config.go
  - internal/flow/landing.go
  - internal/flow/answer.go
  - internal/flow/attempt.go
  - internal/flow/view.go
  - internal/report/report.go
  - internal/report/view.go
  - internal/report/view_test.go
  - internal/risk/risk.go
  - internal/stage/validate.go
syncedFrom: cbfde23f9e6a6423d9b8bc8489d49df96820e9a7
verified: 2026-11-15
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
| medium | by itself, when every check passes, the run had no dispute and no stall, and the team key is set up; otherwise it waits for your sign-off | team key, or you |
| high, critical | waits for your sign-off | your key |

</div>

The team key signs only once `ads init` has set up the team key and listed it as trusted in `.ads/allowed_signers`. Until then `ads work` does not start, so no change runs or lands.

A report that starts with `Ready for sign-off` waits for you. After your `ok <code>`, the change is signed with your key. If the change moved in the meantime, the sign-off stops and the team gives a new report.

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

## Docs changes

A change of type `docs` has no test author: a test of a docs change passes before and after it, so it proves nothing. The plan names no test author, and the report's Proof line says so:

```text
…
#14  Plan   implementer, 1 review layer · at most 3 rounds · 1M tokens · 3600 s
…
Proof        docs only, no test · checks pass
```

A docs change may touch only documentation: `*.md`, `*.mdx`, `*.markdown`, `*.rst` and `*.adoc` files. If its diff changes any other file, its risk becomes at least `high`, so it waits for your sign-off, and its Proof line no longer says `docs only`. The report's `Risk` line names the file and the rule, for example `Risk         high: scripts/build.sh is not a docs file, and a docs change may only change docs, declared low`.

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

Tokens count every kind, cache reads included. The seconds count only the time while a stage runs: the time between two runs, a wait for your answer and a pause between runs are not counted. Ctrl-C on `ads work` ends the running stage cleanly, and a run that was killed counts up to the last thing it recorded, at most about 5 minutes back. There is no dollar limit by default. When a change uses up its budget, it stops with a question, for example `The change used its token budget for low risk (1.5M of 1.5M tokens). Spend one more budget?` One more budget needs your approval. To set your own budgets, change the team rules, for example "raise the budget for medium changes".

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
