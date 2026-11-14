---
title: Approvals, undo, pause and stop
summary: How you approve an action with ok and its code, what the approval protects and what it does not, and how undo, pause and stop differ.
order: 3
sources:
  - README.md
  - skills/ads-workflow/SKILL.md
  - internal/approve/approve.go
  - internal/flow/ask.go
  - internal/flow/ask_test.go
  - internal/flow/answer.go
  - internal/flow/work.go
  - internal/flow/work_test.go
  - internal/flow/github.go
  - internal/flow/status.go
  - internal/config/config.go
  - internal/report/report.go
  - internal/report/report_test.go
  - cmd/ads/testdata/script/session_approval.txtar
  - cmd/ads/testdata/script/signoff_flow.txtar
syncedFrom: d7e7189
verified: 2026-11-14
---

This page answers: what needs my approval, how do I give it, and what is the difference between undo, pause and stop? Five actions wait for you: a sign-off, an undo, a stop, one more budget, and a change of the team rules. A pause does not, because it loses nothing.

## The approval block

When an action needs you, Claude Code shows one block: `ads needs your approval:` and what it is about, the facts on indented lines, and last the line to reply with.

**Situation.** #13 adds a target to the `Makefile`, which a path rule makes high risk. The report says `Ready for sign-off`.

**You say**

```text
sign off #13
```

**You see**

```text
ads needs your approval: sign off and land #13 "Add a cover target to the Makefile"

  Risk: high
  Tests: 1 frozen test failed before the change and passes now, checks pass
  Spent: 123k tokens
  Changed files:
    - cover_cdr0013_test.go (+18 −0)
    - Makefile (+4 −0)
  Head: 3f9c0a7b12de

To approve, reply:   ok 4f2a
```

**What happens.** Reply with that line alone: `ok 4f2a`. Then the change is signed with your key and lands. The code is 4 random hex characters, new for each question, and appears only on the last line.

## How to answer

- Reply `ok <code>` within 10 minutes. After that the question expires: ask again.
- A plain "ok" with no code approves nothing. A reply with anything besides `ok` and the code approves nothing either.
- The fifth wrong code drops the question: ask again.
- If the change moved after you approved, the action does not happen, and Claude Code says so.

## What the approval protects, and what it does not

ADS stores a hash of the code, not the code, so reading its files cannot approve anything. The hash is keyed with a key of your machine, kept in your user config directory (`ads/approval.key`).

The limits:

- Claude Code's transcript of the session holds the code in plain text.
- The guard that keeps the session away from the store, the key and the transcript is a text filter that runs as your own user. It stops mistakes and casual prompt injection. It does not stop a model that sets out to get around it. A real boundary needs an OS sandbox, which `ads` does not ship yet.

## Undo, pause and stop

<div class="table-wrap">

| Action | You say | Needs approval | Loses work | Can still land |
|---|---|---|---|---|
| undo | `undo #12` | yes | no: a signed revert takes the change off the trunk, and its history stays | it has landed; the revert is reviewed before it lands |
| pause | `pause #12` | no | no: the pull request, the branch, the tests and the budget used stay | yes: the step that runs when you pause can still land it |
| stop | `stop #12` | yes | yes: the work ends, the pull request is closed and its branch deleted | no |

</div>

Only a stop keeps a change from landing. When you only want the team to wait, pause.

## Undo a landed change

You take a landed change back without touching git yourself.

**Situation.** #12 landed this morning, and now the login fails.

**You say**

```text
undo #12, it broke the login
```

**You see**

```text
ads needs your approval: undo #12 "ApplyFee truncates instead of rounding"

  Landed: 2026-11-14

To approve, reply:   ok 9e1b
```

**What happens.** After your `ok <code>`, ADS creates a revert of #12 with your reason, "it broke the login", and runs it. The revert is reviewed, by the correctness layer by default, and takes #12 off the trunk with a signed commit. The history of #12 stays in git. When later changes build on #12, the block adds a line `Later changes that build on it stay: …`. Afterwards `what is waiting for me?` lists it under `Recent` as `undone`.

## Pause a change

You stop the team for now and keep everything it did.

**Situation.** #12 is in its first round, and you want to look at the issue again before the team spends more.

**You say**

```text
pause #12
```

**You see**

```text
Paused: #12 ApplyFee truncates instead of rounding            risk low · …
…
Resume       say "work on #12"
```

**What happens.** The team stops after its current step. Nothing is lost, and no approval is needed. The current step can still land the change. "work on #12", "fix #12" or "resume #12" goes on where it paused. While it is paused, `what is waiting for me?` shows `#12 "ApplyFee truncates instead of rounding": paused, say "work on #12" to go on`. When nothing runs, the answer is `nothing to pause for #12`.

## Stop a change

You make sure a change does not land.

**Situation.** #14 turned out to be a duplicate of another issue.

**You say**

```text
stop #14
```

**You see** the approval block, then the end:

```text
ads needs your approval: stop the work on #14 "Prevent duplicates"

  The team stops, and the pull request of the change is closed.

To approve, reply:   ok 2c7d

Stopped: #14 Prevent duplicates
```

**What happens.** After your `ok <code>`, the team stops, its pull request is closed and the branch of the change is deleted. The signed history of the change stays in git.

## One more budget

When a change uses up its budget, it stops with a question. Spending more needs your approval.

```text
ads needs your approval: spend one more budget on #12 "ApplyFee truncates instead of rounding"

  Risk: low
  One more budget: 1.5M tokens
  Spent so far: 1.5M tokens

To approve, reply:   ok 5a03
```

After your `ok <code>`, the team goes on with one more budget of the same size. [How a change lands](/ads/docs/how-changes-land/) lists the budgets.
