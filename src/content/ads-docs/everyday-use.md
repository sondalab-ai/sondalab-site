---
title: Everyday use
summary: Recipes for the things you ask Claude Code every day, each with what you say, what you see and what happens.
order: 1
sources:
  - README.md
  - skills/ads-workflow/SKILL.md
  - internal/cli/status.go
  - internal/cli/work.go
  - internal/cli/trust.go
  - internal/flow/status.go
  - internal/flow/follow.go
  - internal/flow/ask.go
  - internal/flow/trustwords.go
  - internal/flow/trustrules.go
  - internal/report/report.go
  - internal/report/report_test.go
  - internal/report/view.go
  - internal/report/view_test.go
  - cmd/ads/testdata/script/session_approval.txtar
  - cmd/ads/testdata/script/trust_risk_rule.txtar
syncedFrom: 8d11a77
verified: 2026-11-15
---

This page answers: what do I say to Claude Code for the common jobs, and what comes back? After setup you never type an `ads` command yourself. Claude Code runs `ads` for you and shows its output as it is. Each recipe below starts with what it gets you.

## Fix an issue

You get a change with tests and a review, from one sentence.

**Situation.** Issue #12 says a fee is truncated, but not how it should round.

**You say**

```text
fix #12
```

**You see** one question, because the issue is unclear:

```text
Waiting for you: #12 ApplyFee truncates
Blocked      Round half up or half even?
Options      1. half up  2. half even  3. keep truncating
Recommended  half up
Answer       say what to do, for example "half up"
```

**What happens.** Claude Code runs `ads work 12` in the background. When the request is clear, the team writes the tests (none for a docs change), makes the change and reviews it, and you get a report that starts with `Landed`, `Ready for sign-off` or `Waiting for you`. Here it asks first. Answer in your own words, for example "half up": the team goes on from where it stopped. A plain description works as well as an issue number, for example "add a cover target to the Makefile".

## Work the queue

You clear the issues you labeled for the team, one at a time, without starting each one.

**Situation.** Three open issues carry the `ads` label.

**You say**

```text
work the queue
```

**You see** the report of each change, then what waits for you:

```text
Landed: #12 ApplyFee truncates instead of rounding            bug · risk low · 1.2M tokens · $0.21
…

Waiting for you:
  #13 "Add a cover target to the Makefile": waits for your sign-off
  #14 "Split loses the remainder": a question: Keep the remainder on the last share?
```

**What happens.** Claude Code runs `ads work --queue` in the background. It works the open issues labeled `ads`, then the follow-ups the team filed, one at a time. It ends with the list of what waits for you, and Claude Code takes each item with you, one at a time.

## What's waiting

You see in one list every change that needs you, and what ended last.

**Situation.** You come back after lunch and want to know what needs you.

**You say**

```text
what is waiting for me?
```

**You see**

```text
Waiting for you:
  #13 "Add a cover target to the Makefile": waits for your sign-off
  #14 "Split loses the remainder": needs one more budget (1.5M tokens)
Recent:
  #12 "ApplyFee truncates instead of rounding": landed 2026-11-14
```

**What happens.** Claude Code runs `ads status`. A change waits for a sign-off, an answer to a question, one more budget, or because you paused it. When nothing waits, the first line is `Nothing is waiting for you.` Ask "what happened on #12?" for the report of one change (`ads status 12`). When the Claude Code hook that records approvals is missing, the output says `approvals do not work here: run ads init in a terminal`.

## One more round

You correct a change in your own words before it lands, without writing code.

**Situation.** #13 is ready for sign-off, but you want the new Makefile target to be called `coverage`.

**You say**

```text
change the target name to coverage
```

**You see** the live lines of the new round, then a new report:

```text
#13  Step   round 2 · implementer done · 32 s
…
Ready for sign-off: #13 Add a cover target to the Makefile    feature · risk high · …
…
Sign-off     say "sign off #13"
```

**What happens.** After a report, "change X" means one more round with your words: Claude Code runs `ads work 13 --answer "change the target name to coverage"`. While the change is not landed, a comment on its pull request steers the next round too. After a change has landed, "change X" starts a new change that names the landed one.

## Stricter rules

You make a folder high risk, so from now on every change there waits for your sign-off. The rule lands only after your approval, signed with your key.

**Situation.** Your trunk has two files under `payment/`, and you want every change there to wait for you.

**You say**

```text
be stricter on payment/
```

**You see** the proposed rule in plain words, with the files it affects, then the approval question:

```text
Adds payment/** to the high-risk rule.
2 files on the trunk gain protection and go from low to high risk, for example payment/charge.go.
rev …

ads needs your approval: change the team rules

  Adds payment/** to the high-risk rule.
  2 files on the trunk gain protection and go from low to high risk, for example payment/charge.go.

To approve, reply:   ok 7c1e
```

**What happens.** Claude Code writes the new `.ads/config.yaml` to a file, proposes it with `ads trust propose`, and asks for your approval. ADS checks the files on the trunk and the files that open fixes change, with the old and the new rules, and says which ones gain or lose protection. A line that counts a file only an open fix has says `on the trunk or in open fixes`. After your `ok <code>`, `ads trust apply` lands the rule on the trunk, signed with your key. Other team rules go the same way, for example "let medium changes land by themselves only up to 200 lines". The question shows at most eight changes, each in one line of at most 160 characters; a larger change is refused with `the team-rule change is too large to approve: split it into smaller changes`. Signers and prompts change only from a terminal.

## Follow only

You keep the live lines to the changes you care about.

**Situation.** Two changes run at once, and you only care about the high-risk one.

**You say**

```text
follow only high risk
```

**You see** only the lines of #13, the high-risk change:

```text
#13  Plan   feature: Add a cover target to the Makefile
#13  Plan   risk high (forecast): Makefile matches a path rule, declared trivial
#13  Plan   test author, implementer, 6 review layers · at most 3 rounds · 8M tokens · 3600 s
…
#13  End    ready for sign-off · 123k tokens
no running change for 120 seconds
```

**What happens.** While the team works, Claude Code shows live lines: the plan of each running change, one line per step, and an `End` line when the change lands, waits for you, or stops. By default it follows every running change. "follow only high risk" runs `ads status --follow --risk high`, and "follow only #13" runs `ads status 13 --follow`. A change whose risk rises out of the filter, for example to critical, ends with `risk is now critical: no longer followed`.
