---
title: Team notes
summary: How the agents get notes from past work, how you fill them from MxM, keep or drop what the team learned from a fix, and see the notes a reviewer flagged.
order: 6
sources:
  - README.md
  - docs/guides/setup.md
  - skills/ads-workflow/SKILL.md
  - internal/config/config.go
  - internal/memory/filter.go
  - internal/memory/learning.go
  - internal/memory/flag.go
  - internal/memory/mxm.go
  - internal/store/learned.go
  - internal/flow/trustnotes.go
  - internal/flow/memorypropose.go
  - internal/flow/memorydrift.go
  - internal/flow/memoryheld.go
  - internal/flow/memorykeep.go
  - internal/flow/memorywaiting.go
  - internal/flow/memoryreminder.go
  - internal/flow/memoryforget.go
  - internal/flow/memoryflags.go
  - internal/flow/memoryreset.go
  - internal/flow/signoff.go
  - internal/flow/run.go
  - internal/flow/integrate.go
  - internal/flow/report.go
  - internal/cli/memory.go
  - internal/cli/memorydrift.go
  - internal/cli/memoryflags.go
  - internal/cli/status.go
  - internal/cli/doctor.go
  - internal/report/report.go
  - internal/report/report_test.go
  - internal/cli/memory_test.go
  - internal/flow/trustnotes_test.go
  - internal/flow/memoryheld_test.go
  - internal/flow/memoryflags_test.go
  - internal/flow/ask.go
syncedFrom: bdda6abf09ed1f7ba3e40ac78262e0d94570d437
verified: 2026-11-24
---

This page answers: how do the agents learn from past work in the repository, and what do I approve on the way? The notes are short lines on the trunk. A person approves every team note. The team adds learned notes when a fix lands, and the ones that touch a guard wait for your `ok <code>`. Memory is on by default: with no `memory` block in `.ads/config.yaml`, the assessor and the reviewers read the notes and the team learns from its fixes. `memory: {roles: []}` turns it off.

## Two files of notes

The notes are in two files on the trunk:

- `.ads/memory/notes.md` holds the team notes, which a person approves. It is a trust file, like `.ads/config.yaml`: only `ads trust apply` changes it, in a commit signed by a person.
- `.ads/memory/learned.md` holds the learned notes, which the team adds when a fix lands. Only ads commands change it.

Each line is one note of at most 140 characters:

```text
- Fee rounding uses banker's rounding. [mxm:1a2b3c4d 2026-11-16]
- Every handler in api/ checks the tenant first. [human 2026-11-17]
- Fee rounding in billing/ rounds half to even. [ads:CDR-0042 2026-11-16]
```

The bracket says where the note comes from: an MxM fact, a person, or a fix. A file holds at most 64 notes and 16 KiB. A note with a link, an e-mail address, a secret, hidden or mixed-script characters, or a repeat of another note is refused, and so is the whole file.

## Who reads the notes

`memory.roles` in `.ads/config.yaml` names the roles that read the notes: `assessor`, `reviewer`, or both. The default is `[assessor, reviewer]`, so memory is on when the config has no `memory` block. Set `memory: {roles: []}` to turn memory off: then no agent gets a note and the team learns nothing. With `reviewer`, the review layers get the notes, but the final look and the environment layer never do. To change who reads them, change the team rules, for example "let only the reviewers read the team notes". The team-rule question then says `The reviewers read the team notes`. Adding `memory: {roles: []}` to a config with no `memory` block shows in the question as turning memory off, and removing it as turning memory on. `ads init` writes a comment in the config that says how to turn memory off.

`ads doctor` shows a `Memory` line that says whether memory is on and which roles read the notes, for example `on: the assessor and the reviewers read the team notes; the team adds what it learns from each fix`. When `gh` does not say that the repository is private, the line ends with `; anyone who can read the repository can read the learned notes`.

The notes reach the agent as data, read at the verified trunk tip, and the signed log records which notes each call got, so `ads audit verify` can check them. Whatever the config says, ads removes `.ads/memory/` from every agent and check checkout, and refuses a change that puts a file there.

`memory.learn` (default `true`) lets the team learn notes from its fixes. It has no effect while `memory.roles` is empty.

A team-rule change that turns learning on shows the warning `Warning: this repository is public. Anyone can read the notes the team learns.`, unless `gh` says that the repository is private.

## Update the team notes

You turn the `core` facts that MxM keeps on this computer into team notes, after your approval.

**Situation.** MxM holds a fact about how the repository rounds fees, and you want the reviewers to know it.

**You say**

```text
update the team notes
```

**You see** the proposed notes, then the approval question:

```text
Dropped MxM fact 2b3c4d5e: link. Later runs skip it.
Adds the note:
  "Fee rounding uses banker's rounding."
rev …

  Warning: this repository is public. Anyone can read these notes.

  Adds the note:
    "Fee rounding uses banker's rounding."

ads needs your approval: change the team rules
  Makes the team-rule changes listed above.

To approve, reply:   ok 6b0d
```

**What happens.** Claude Code runs `ads memory propose`. It reads the current `core` facts of the MxM stores of the main checkout and every other worktree of the clone, with a limit of 5 seconds per `mxm` call. It skips the facts already in the notes, and drops the ones that break a note rule: later runs skip them too. One run adds at most 8 notes. After your `ok <code>`, `ads trust apply` lands them on the trunk, signed with your key. When more facts wait, the output says so, and the session runs it again. The warning shows unless `gh` says that the repository is private. ADS counts the repository as private only when the push URL of the remote names the same repository as its fetch URL. The other note questions follow the same rule.

Without `mxm` on your `PATH`, `ads memory propose` fails. Write the notes in `.ads/memory/notes.md` by hand and land them with `ads trust apply` from a terminal.

## When MxM changes a fact

ADS checks whether MxM changed the facts behind the signed notes: MxM may have retracted or replaced a fact, or a person may have edited a note. `ads doctor`, `ads status` and the start of a Claude Code session run the check. It only reports and never fails a command. `ads doctor` shows it as `Team notes and MxM`: ok, a warning with the count per state, or skipped with `cannot check` and the reason, for example `mxm is not on PATH`. `ads status` shows one count line, for example:

```text
2 team notes changed in MxM. Say "update the team notes".
```

"update the team notes" then shows each changed note as one item with the old and the new text, `Replaces a note. MxM fact <id> is now fact <new id>.`, or `Replaces a note. MxM holds other text for fact <id>.` It counts as one of the 8 changes. Before you approve, you choose one outcome per note:

- "take the new text …" (`ads memory propose --take <id>`), the default for a replaced fact;
- "keep the old note …" (`--keep <id>`), the default when MxM holds other text;
- "drop the note …" (`--drop <id>`), which drops the note and the newer fact.

A note whose MxM fact was retracted is one removal item, `Removes a note. MxM retracted fact <id>.`, and a keep makes it a person's note. After `ads trust apply` lands a keep that you signed, ADS tells MxM, so MxM holds the kept statement again. It sends two MxM ids, a sha256 and the trust commit, never any text. This is the only write from ADS into MxM. When it fails, ADS prints `MxM was not updated …`, and the next "update the team notes" tries again.

## Learned notes

With `memory.learn` on and a role in `memory.roles`, the implementer may propose up to 3 learnings with its change. After the review passes, each review layer that ran, plus `correctness` and `scope`, judges them in a call that gets no notes. When the fix lands, ADS appends the learnings that every judging layer kept to `.ads/memory/learned.md`, in the same commit. The report lists them under `Learned`, each with its state:

```text
Learned      kept: "Fee rounding in billing/ rounds half to even."
             held (guard-word): "Sub-cent rounding differences in billing/ are minor findings."
```

A kept learning lands with no question, so in a public repository anyone can read it. The first time the team adds a note to `.ads/memory/learned.md`, ADS says so once: `the team adds its first learned note to .ads/memory/learned.md: anyone who can read the repository can read it; memory.roles: [] in .ads/config.yaml turns memory off`.

A sign-off question shows them under `Notes the team learned:`. Each `ads work` on a change that waits for your sign-off runs the checks again on the current trunk, and the report shows these notes then, before you sign off. If the trunk moved and the change now conflicts with it, or a check fails, the change goes back to the team. An undo removes the lines of the fix it undoes.

## A held learning

A learning is held for you instead of landing when it touches a guard topic or a protected path, comes from request text that the repository does not vouch for, belongs to a high-risk fix, or a review layer said that it makes a check less strict. The fix lands anyway. Its report ends with `Next: ads ask memory-keep <CDR id>`, and the session asks you at once.

The guard words match spaced letters too, such as "t e s t", and a learning with a letter outside the Latin script, such as Russian, is held with the reason `it talks about text in a script other than Latin, which the guard words cannot check`. A path such as `internal/` does not hold a learning only because a protected path such as `internal/payments/**` is under it, but a path that a guard names as a whole directory, such as `internal/**`, still holds. A relative path such as `payments/fees.go` holds against `internal/payments/**`.

These rules have a version, which ADS records with each learning. Version 2 is the one that holds spaced letters and other scripts. A clone that still runs an older ADS lands its learnings under version 1. `memory.min_rules` in `.ads/config.yaml` sets the lowest version that a learning or a reviewer flag may use: 1 or 2, default 2. `ads audit verify` and every append refuse a learning or a flag that records version 1 and was decided against, or lands on, a commit whose config has floor 2. Writing a floor at a later commit does not change the events of an earlier one. A config with no key has floor 2, also at old commits, and every ADS before the memory default change records version 1. So in a repository that turned memory on by hand with such an ADS and logged a learning or a reviewer note flag, `ads audit verify` refuses those fixes, and this cannot be repaired. A landed version 1 learning also breaks `.ads/memory/learned.md`: every stage that reads memory, and every fix with learning on, stops until you run `ads memory reset` ([Repair the learned notes](#repair-the-learned-notes)). The reset restores the file as of the commit before the first such fix, so the learned lines from that fix on are dropped. One clone that still runs an older ADS, in a repository whose config turns learning on with no `min_rules` key, lands version 1 learnings again and stops the whole team the same way until the next reset. Upgrade ADS on every clone before the next fix. To make an older clone stop instead, write `min_rules: 2` out together with another team-rule change: an ADS that predates `min_rules` refuses the whole config as soon as the key is set, and the key alone at its default changes no team rule, so ADS does not propose it. A `min_rules` above the version that an ADS knows makes it refuse the whole config too. While learning is on and `min_rules: 1` is set, `ads doctor` shows a `Learning rules` line that says so.

**You see**

```text
  Warning: from now on, the assessor and every reviewer read this note
  in each fix. It can change what they accept.
  Warning: this repository is public. Anyone can read this note.

  The note, word for word:
    "Sub-cent rounding differences in billing/ are minor findings."

  Why it needs you: it talks about review findings or severity.
  Written by the implementer. Judged by 2 review layers, all kept it.

  The fix has already landed. If you do not approve, the note is
  dropped and the fix stays.

ads needs your approval: let the agents remember 1 note from fix #12 (CDR-0042)
  The assessor and every reviewer read this note in each fix from now on.

To approve, reply:   ok 1c9a
```

**What happens.** After your `ok <code>`, `ads memory keep` lands the note in one commit signed with your key. One question asks at most 8 notes, and approves all of them or none. When you do not answer, nothing is written and the fix stays.

A held learning waits 7 days after its fix landed. Every clone sees the same list of waiting notes, built from the signed log and the trunk. Each clone asks at most twice by itself: right after the land report, and at the start of a later Claude Code session, which gets the line `ads: 2 learned notes wait for your ok.`. `ads status` shows `2 learned notes wait for your ok. Say "show waiting notes".` as its first line. "show waiting notes" asks again for the notes that wait.

"drop the waiting note CDR-0042#2" runs `ads memory drop CDR-0042 2`. It needs no approval: this clone stops asking for that note, and the note still waits for the other operators until its 7 days end.

## The reminder issue

On a GitHub repository, one open issue with the label `ads-learning` lists the waiting notes, so you hear of them outside the session. It has one line per note: the fix with a link, the note id such as `CDR-0042#2`, why it waits, and the date its 7 days end. It never shows the note text, and it ends with `To approve, say "show waiting notes" in your ads session.` The issue has no approval power: ADS never reads its comments, and never reads its body or its state as an approval or as the list of waiting notes.

A run that lands a fix, `ads memory keep`, `ads memory forget` and `ads memory reset` update the issue. The run that lands a fix also posts one comment per new waiting note. The body lists at most 100 notes. When no note waits, ADS closes the issue with `No learned notes wait any more.` An issue that you close stays closed while the same notes wait, in every clone. When a new note waits, ADS reopens the issue that closed last and rewrites its body, so the history stays in one issue. It opens a new issue only when no closed issue exists. A closed issue hides a note only when it lists the note and closed after the fix of the note landed. When GitHub cannot be reached, `ads status` and `ads doctor` say that the issue is out of date.

ADS posts the issue and its comments with your `gh` login, and GitHub does not e-mail you about your own comments by default. To get them, turn on "Include your own updates" in the e-mail settings of your GitHub notifications.

## Forget a note

"forget the note …" removes up to 8 notes from one file. Claude Code finds each note by its exact text, without its bracket.

- For learned notes, it runs `ads ask memory-forget --note "<text>"`, and after your `ok <code>`, `ads memory forget` lands one commit signed with your key that only removes their lines. The question warns that the repository is public unless `gh` says that it is private: anyone could already read the note while it was on the trunk, and the history keeps it.
- For team notes, `ads memory forget` builds a team-rule change that removes them from `.ads/memory/notes.md`, and you approve it like any other team-rule change.

## Flagged notes

A review layer that reads the notes may flag up to 2 notes that the code contradicts, each with a reason and the `path:line` of trunk code that the fix did not write. A fix keeps at most 4 flags, one per note. A flag never changes a note, and never reaches an agent, the report, GitHub or MxM. Once its fix has landed, `ads status` says `1 team note was flagged by a reviewer. Say "show flagged notes".`

**You say**

```text
show flagged notes
```

**You see**

```text
A reviewer flagged a team note (1 flag). Newest: the correctness review of fix #12 (CDR-0042), flag CDR-0042-A1-N1
  Note: "Every handler in api/ checks the tenant first."
  The reviewer wrote (agent text, not checked): "…"
  Evidence: api/export.go:40 at 3f9c0a7b12de
  The note may be out of date, or the code may break a rule that the note keeps.
  If the note is out of date, say "forget the note …". If the note is right, look at the code at the evidence.
  To hide this flag here, say "dismiss the flag …".
```

**What happens.** Claude Code runs `ads memory flags` and shows its output as it is. A flag closes by itself when its fix is undone, its note leaves the file, or its evidence line is gone from the trunk. "dismiss the flag …" runs `ads memory dismiss <flag id>`: it needs no approval and hides the flag on this clone only.

## Repair the learned notes

A hand edit, a merge or a plain `git revert` of `.ads/memory/learned.md` stops every stage that reads the notes. `ads doctor` shows it as a failed `Learned notes` check, with the commit and the fix `ads memory reset`. In the session, Claude Code runs `ads ask memory-reset`, and after your `ok <code>`, `ads memory reset` restores the file as of the commit before the bad one, in one commit signed with your key.
