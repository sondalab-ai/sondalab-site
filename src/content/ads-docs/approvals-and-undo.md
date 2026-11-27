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
  - internal/flow/trustrules.go
  - internal/flow/trustlist_test.go
  - internal/flow/answer.go
  - internal/cli/ask.go
  - internal/cli/diff.go
  - internal/flow/memoryheld.go
  - internal/flow/memoryheld_test.go
  - internal/flow/work.go
  - internal/flow/stranger.go
  - internal/cli/audit.go
  - internal/flow/work_test.go
  - internal/flow/github.go
  - internal/flow/status.go
  - internal/config/config.go
  - internal/report/report.go
  - internal/report/report_test.go
  - cmd/ads/testdata/script/session_approval.txtar
  - cmd/ads/testdata/script/signoff_flow.txtar
  - cmd/ads/testdata/script/work_stranger.txtar
  - internal/flow/trustexempt.go
  - internal/trust/exempt.go
  - internal/flow/signoff.go
  - internal/flow/memoryforget.go
  - internal/flow/memoryreset.go
  - internal/hooks/guard.go
syncedFrom: 3a3279c7ae4c2caf1e407b4641d1e1eba726a399
verified: 2026-11-27
---

This page answers: what needs my approval, how do I give it, and what is the difference between undo, pause and stop? These actions wait for you: a sign-off, an undo, a stop, one more budget, a change of the team rules or of the team notes, a learned note that the team holds for you, forgetting or resetting learned notes, and work on an issue that an account without write access opened. A pause does not, because it loses nothing. Neither does dropping a waiting note or dismissing a reviewer flag on your computer ([Team notes](/ads/docs/team-notes/)).

A fix of an issue that `ads sweep` filed needs your sign-off from risk `medium` up, even after a clean run. Its text is untrusted, so its fix files no follow-up issues ([How a change lands](/ads/docs/how-changes-land/#sweep-issues)).

## The approval block

When an action needs you, Claude Code shows one block. Every block ends with the same short tail: `ads needs your approval:` and what ADS asks to do, one indented line with its cost or effect, a blank line, and last the line to reply with. A sign-off, a team-rule change, a note question or an issue from another account shows every detail in full above the tail. A budget, stop or undo question is the 4 lines of the tail alone, except an undo whose runbook path does not fit on the effect line: the path then goes on its own line above the tail.

**Situation.** #13 adds a target to the `Makefile`, which a path rule makes high risk. The report says `Ready for sign-off`.

**You say** nothing. Claude Code shows the report, runs `ads diff 13` to show the changed files and open the code in a new window, then asks for your sign-off at once (`ads ask signoff 13`) in the same turn. Saying "sign off #13" still works.

**You see**

```text
  Risk: high
  Tests: 1 frozen test failed before the change and passes now, checks pass
  Spent: 123k tokens
  Changed files:
    - cover_cdr0013_test.go (+18 −0)
    - Makefile (+4 −0)
  Head: 3f9c0a7b12de

ads needs your approval: sign off and land #13 "Add a cover target to the Makefile"
  Lands 2 changed files at risk high.

To approve, reply:   ok 4f2a
```

**What happens.** Reply with that line alone: `ok 4f2a`. Then the change is signed with your key and lands. The code is 4 random hex characters, new for each question, and appears only on the last line. The `Tests` line says `checks pass` only when the checks pass at the risk of the change. When they fail only where the trunk fails too, it says `checks fail on base too`.

To change the code instead of signing it off, say "change X". The team runs one more round, and then you get a new report and a new sign-off question. Until that round has run, the sign-off waits: `a change request waits: run ads work first, then sign off the new code`.

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
  Landed on 2026-11-14.

To approve, reply:   ok 9e1b
```

**What happens.** After your `ok <code>`, ADS creates a revert of #12 with your reason, "it broke the login", and runs it. The revert is reviewed, by the correctness layer by default, and takes #12 off the trunk with a signed commit. The history of #12 stays in git. When later changes build on #12, the effect line says so, for example `Landed on 2026-11-14. 1 later change that builds on it stays.` Afterwards `what is waiting for me?` lists it under `Recent` as `undone`.

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

**What happens.** The team stops after its current step. Nothing is lost, and no approval is needed. The current step can still land the change. "work on #12", "fix #12" or "resume #12" goes on where it paused. While it is paused, `what is waiting for me?` shows the paused report in full when it is the decision that has waited longest. Otherwise it shows one line under `Also waiting, oldest first:`, `#12 "ApplyFee truncates instead of rounding": paused, say "work on #12" to go on`. When nothing runs, the answer is `nothing to pause for #12`.

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

One stop needs no approval: the answer `stop` to the question that a request typed `docs` asks before any work starts ([How a change lands](/ads/docs/how-changes-land/#docs-changes)). No change exists yet, so nothing is lost.

## Fix it by hand after a stop

After a stop, Claude Code can make the fix by hand, but only after your explicit yes in the chat. That yes is a plain answer, not an `ok <code>`. Claude Code makes the fix on a new branch from the trunk, with a name outside `ads/`, pushes only that branch, and opens its pull request into the trunk. It never pushes to the trunk and never merges the pull request: you review it and merge it. It never starts a hand fix while the change is not stopped.

## One more budget

When a change uses up its budget, it stops with a question. Spending more needs your approval.

```text
ads needs your approval: spend one more budget on #12 "ApplyFee truncates instead of rounding"
  One more budget: 1.5M tokens. Spent on this change so far: 1.5M tokens. Risk: low.

To approve, reply:   ok 5a03
```

`Spent on this change so far` counts every attempt of the change. After your `ok <code>`, the team goes on with one more budget of the same size. [How a change lands](/ads/docs/how-changes-land/) lists the budgets.

## Stop or budget for a change without an issue

A change that you started from a plain description has no issue number. For its stop and budget questions, Claude Code asks with the change id, for example `ads ask stop CDR-0042` or `ads ask budget CDR-0042`. It finds the id with `ads cdr list`, and asks you when it cannot tell which change is yours. Claude Code shows a question only when the `ads ask` command holds none of `| ; & < > $ ( )`, a backtick or a line break, and a description often holds one. The approval holds for that change only. After your `ok <code>`, Claude Code runs the stop or the budget answer with the description, as before.

## A change of the team rules

A change of the team rules shows what it does in plain words, so you see what you give up before you approve. For a path rule, ADS checks the files on the trunk and the files that open fixes change, with the old and the new rules. A change of `checks.sensitive_paths` alone shows the same effect, with the rules unchanged. A file that stays under `checks.sensitive_paths` is critical whatever the rules say, so it never counts. The list counts as a set: a change that only reorders or repeats its globs changes no risk, so it shows no effect. An open fix whose head is not in this clone is not counted, and the question says so. The files that lose protection come before the files that gain it.

**Situation.** Someone asks to make the default high-risk rule low risk.

**You see**

```text
  Changes the high-risk rule from high to low risk.
  2 files on the trunk lose protection and go from high to low risk, for example go.mod.
  New files that match these globs can get a lower risk.

ads needs your approval: change the team rules
  Makes the team-rule changes listed above.

To approve, reply:   ok 3d8f
```

**What happens.** Approve only if you mean it: after your `ok <code>`, a change to those files can land by itself. The third line warns that a future file can get a lower risk too, even when no file on the trunk does today. It also shows when you drop a glob from `checks.sensitive_paths`. If the files that change risk are not the same when `ads trust apply` lands the rule (a new one on the trunk or in an open fix, or one gone), the approval no longer holds: `the state changed after the approval: ask again`. A new file that changes no risk keeps it. This holds for a change of `checks.sensitive_paths` too. [Everyday use](/ads/docs/everyday-use/#stricter-rules) shows a change that adds protection. A change that turns learning on shows `Warning: this repository is public. Anyone can read the notes the team learns.` unless `gh` says that the repository is private. A config with no `memory` block has memory on, so adding `memory: {roles: []}` shows as turning memory off.

## A hand-made commit to a trust file

A commit to a trust file that `ads trust apply` did not sign breaks the trust chain of the trunk: the commands that read the trunk stop, and `ads audit verify` reports `changes <file> without a valid trust change`.

On your machine the git hooks stop most of these before they land. A commit, a move or a push of the trunk that brings such a commit is refused with `hand commit <id> changes <file>`, and the refusal names `ads trust`. The same goes for an amended or cherry-picked trust commit, because its signature no longer matches. A `git pull` that would merge a trust change from the remote is refused too, because the merge puts that change off the main line of the trunk: run `git merge --abort`, then `git pull --rebase`. A hand-made commit can still reach the trunk another way, for example on GitHub. Then repair it as follows.

A later signed commit that restores the file does not repair it. Run `ads trust propose --exempt <commit> -m "<reason>"` with the full id of the hand-made commit. It builds one unsigned commit that restores the trust files of that commit to their content before it, names the commit in an `ADS-Trust-Exempt` trailer, and prints its `rev`.

**You see**, after `ads ask trust <rev>`, the commit id, its subject, author and commit date, and the trust files it changed, as their own item. After your `ok <code>`, `ads trust apply <rev> -m "<reason>"` lands it signed with your key, and the trust chain skips that one commit.

**What happens.** In the session, only an exemption that restores `.ads/config.yaml` or the team notes can be asked. A restore of a file under `.ads/prompts/` lands only from a terminal with `ads trust apply`. ADS refuses the exemption when the hand-made commit changed `.ads/allowed_signers`, when another commit also breaks the chain, or when the files are not restored. One commit is exempted once. From the hand-made commit up to the exemption the trust files were never signed, so a change whose base lies in that range does not verify. Never sign an exemption by hand: one that the chain refuses breaks the chain for good.

## A learned note

When the team learns a note from a fix that touches a guard, the fix lands and the note waits for you. The report ends with `Next: ads ask memory-keep <CDR id>`, and the session asks at once:

```text
  Warning: from now on, the assessor and every reviewer read this note
  in each fix. It can change what they accept.
  …
  The fix has already landed. If you do not approve, the note is
  dropped and the fix stays.

ads needs your approval: let the agents remember 1 note from fix #12 (CDR-0042)
  The assessor and every reviewer read this note in each fix from now on.

To approve, reply:   ok 1c9a
```

After your `ok <code>`, `ads memory keep` lands the note, signed with your key. A note waits 7 days after its fix landed. The question warns that the repository is public, and that anyone can read the note, unless `gh` says that it is private. [Team notes](/ads/docs/team-notes/#a-held-learning) has the whole question, the reasons and how to drop a note.

## An issue from another account

ADS trusts the text of your `gh` login and of the accounts with write, maintain or admin permission on the repository. The text of any other account is untrusted. `ads work` drops the comments of such an account, so they never reach the agents. An issue that such an account opened waits for your approval.

**Situation.** #21 was opened by `eve`, who has no write access to the repository.

**You say**

```text
fix #21
```

**You see**

```text
  Opened by: "eve", an account without write access
  Its text reaches the agents as untrusted text.
  Follow-ups of this change are not filed.
  Comments of accounts without write access stay hidden from the agents.

  Untrusted text of the body, first lines:
  Line 1: "ApplyRefund returns the amount without the fee."
  Line 2: "The fee should be refunded too."
  Body size: 79 characters in 2 lines, 0 lines not shown
  Text digest: 83ed926aba131cadf701b560bd266b4b2c3716d5e084577d78f94995d55fa53a
  Full text: the cat line shows it with control characters escaped,
  and the shasum line prints the text digest of its exact bytes:
  cd "…/ads/outsider"
  cat 83ed926aba131cadf701b560bd266b4b2c3716d5e084577d78f94995d55fa53a.shown.txt
  shasum -a 256 83ed926aba131cadf701b560bd266b4b2c3716d5e084577d78f94995d55fa53a.txt

ads needs your approval: work on acme/ledger#21 "Refunds keep the fee"
  Lets the team work on this issue as untrusted text.

To approve, reply:   ok 7b2e
```

**What happens.** Claude Code runs `ads work 21`, which refuses: `#21 was opened by "eve", an account without write access, so it waits for ads ask outsider 21`. Claude Code then runs `ads ask outsider 21`, and you see the block. The question shows the first 3 non-blank lines of the body, each clipped at 60 characters. A clipped line ends with the count of characters it hides. Read the whole text in the `.shown.txt` file: its control characters are escaped. The `.txt` file holds the exact bytes, only for `shasum -a 256`, which prints the digest the question shows. Both files sit in your user config directory, under `ads/outsider/`, next to the approval key. A later run of ads removes them once they are older than 10 minutes.

After your `ok <code>`, Claude Code runs `ads work 21` again, and the team works on it. The approved run reads the text again from GitHub, never from the files. The text stays untrusted, and the fix files no follow-up issues. It lands by the same risk rules as any other change.

- The approval is bound to the author and to a digest of the title and the body. If the title or the body changed after you approved, the run says `the state changed after the approval: ask again`.
- The approval holds for one run. When the team reads the issue again, for example after your answer to its question, it asks again.
- The signed log records the approval on the change it admits. `ads audit show` shows it as `issue of "eve", an account without write access: approved in session at <time>`.
- When ADS cannot check the account, for example because GitHub fails or the issue is in another repository than the remote, it treats the account as one without write access. The question then says `an account whose write access ads could not check`.
- From a terminal, outside Claude Code, `ads work 21` runs with a warning and no approval: `its text reaches the agents as untrusted text`. Without a terminal on stdin, for example in a script, it is refused: `run it from a terminal or approve it in the session (ads ask outsider 21)`.
- `ads ask outsider` on an issue that an account with write access opened says `it needs no approval`.
