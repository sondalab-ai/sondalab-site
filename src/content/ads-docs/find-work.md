---
title: Find work
summary: How sweeper agents read the trunk and file what they find as issues, how a sweep dedupes and caps them, and how to run it on a schedule.
order: 4
sources:
  - README.md
  - docs/guides/setup.md
  - docs/specs/2026-11-15-ads-sweep-design.md
  - skills/ads-workflow/SKILL.md
  - internal/cli/sweep.go
  - internal/cli/doctor.go
  - internal/config/config.go
  - internal/config/schema/config.schema.json
  - internal/flow/sweep.go
  - internal/flow/landing.go
  - internal/flow/github.go
  - internal/flow/work.go
  - internal/sweep/file.go
  - internal/sweep/files.go
  - internal/sweep/finding.go
  - internal/onboard/sweepjob.go
  - internal/cli/root.go
  - scripts/uninstall.sh
  - cmd/ads/testdata/script/sweep_dry_run.txtar
  - cmd/ads/testdata/script/sweep_file.txtar
  - cmd/ads/testdata/script/sweep_public.txtar
  - cmd/ads/testdata/script/sweep_schedule.txtar
syncedFrom: ac68d575652607d8402ebc110e63ba47695f3bb7
verified: 2026-11-16
---

This page answers: how does ADS find work on its own, what does it file, and how do I run it on a schedule? A sweep reads part of the trunk with read-only agents. It files what they find as GitHub issues labeled `ads`. It never fixes anything by itself. You start the fixes when you say "work the queue".

## Sweep the codebase

You get new issues for the team, without writing them yourself.

**Situation.** The team has cleared the queue. You want it to look for problems in the code.

**You say**

```text
sweep the codebase
```

**You see** the report of the sweep:

```text
Read 4 files at trunk 3f9c0a7b12de
bugs  1 kept · 1 dropped · 1k tokens
bugs  calc/calc.go:3  Add subtracts
line  calc/calc.go:40
Filed #1 https://github.com/o/r/issues/1
```

**What happens.** Claude Code runs `ads sweep` in the background and shows its output as it is. One sweeper agent runs per category. ADS checks each finding, drops duplicates, and files the rest. Each issue carries the labels `ads` and `ads-sweep`. Then "work the queue" fixes them like any other `ads` issue.

## Look first: the dry run

**You say**

```text
what would a sweep find?
```

**What happens.** Claude Code runs `ads sweep --dry-run`. It prints the same report and files nothing. It makes no `gh` call and keeps no state, so the next sweep starts from the same place.

## What a sweep reads

A sweep reads the tracked files at the trunk tip. It never reads your working tree. It skips binary files. It reads at most `max_files` files:

- first, the files changed on the trunk since the last sweep, up to half of `max_files`;
- then, the next files in path order, from where the last sweep stopped.

The path order wraps at the end, so every file comes up in turn.

## Categories

There are four categories, in rank order: `security`, `bugs`, `tests` and `refactor`. A `security` or `bugs` finding needs a failure case. A `tests` or `refactor` finding needs a reason why it matters.

ADS drops a finding when:

- a required field is empty;
- its file is not tracked;
- its line is past the end of the file;
- its confidence is below `min_confidence`;
- its text holds an ADS marker.

The sweepers use the `sweeper` role. A config without that role uses the assessor adapter. When the sweeper uses the `fake` adapter, `ads sweep` refuses to run.

## Settings

The `sweep` block of `.ads/config.yaml` holds the settings. A change to it is a team-rule change, so it needs your approval (see [Approvals, undo, pause and stop](/ads/docs/approvals-and-undo/)). The defaults:

<div class="table-wrap">

| Setting | Default | What it limits |
|---|---|---|
| `categories` | `[security, bugs, tests, refactor]` | the sweepers that run |
| `min_confidence` | `high` | the lowest confidence a sweep keeps |
| `max_files` | 40 | the files of one sweep |
| `max_findings_per_category` | 3 | the findings kept per category, at most one per file |
| `max_filed` | 5, at most 50 | the issues one sweep files |
| `max_open` | 10, at most 200 | the open sweep issues at one time |
| `budget.tokens` | 4M | the tokens of the whole sweep, checked after each category |
| `budget.seconds` | 900 | the time of each category call |
| `budget.usd` | 0 | the dollars of each call; 0 means no limit |

</div>

When a sweep reaches its token limit, the categories left do not run. It still files what the finished categories found.

## Caps

One sweep files at most `max_filed` issues. It also files at most `max_open` minus the sweep issues already open. With 8 open sweep issues and the defaults, it files 2. With `max_open` open, it files none, until the queue works some off.

The report counts a finding over a cap as `Skipped cap`. ADS does not keep that finding. A later sweep finds it again when the rotation reaches its file, or sooner when the file changes on the trunk.

## One issue per category and file

A sweep files at most one issue per category and file. The fingerprint of a finding is the first 16 hex characters of the sha256 of its category and its file. The line, the title and the function it names are not part of it, because a model names the same problem differently on each run.

When a sweeper returns two findings on the same file, ADS keeps the higher ranked one. It drops the other as `same-file`. The cost: a second real problem in the same file and category waits until the first issue is closed as completed.

Before it files, a sweep lists the sweep issues of your `gh` login, open and closed:

- An open issue blocks its fingerprint.
- An issue closed as not planned, as a duplicate, or with no reason blocks it for good.
- An issue closed as completed frees it. A landed fix closes its issue as completed.

When that list reaches 1000 issues, the sweep files nothing and says so.

## Dismiss a finding for good

Close its issue as not planned:

```sh
gh issue close <n> --reason "not planned"
```

In GitHub, pick "Close as not planned". The default close counts as completed, so the finding comes back when a sweep reads its file again.

## Public repositories

A public issue would show a vulnerability to everyone before the fix. So a sweep files `security` findings only when `gh` says the repository is private. On a public repository, the security findings stay in the report:

```text
security  calc/calc.go:3  Key in the log
bugs  calc/calc.go:3  Add subtracts
Filed #1 https://github.com/o/r/issues/1
security  1 finding not filed: the repository is public
```

When `gh` cannot tell, the sweep files none either, and the line gives the reason. Read those findings in the report, and fix them privately. They do not count toward `max_filed`. The other categories file as usual.

## How a sweep issue lands

A sweep issue holds text that a model wrote after it read trunk code. Anyone who lands code can plant text there, so ADS treats it as untrusted:

- Its fix lands by itself only at risk `trivial` or `low`.
- From `medium` up, its fix always waits for your `ok <code>`, even after a clean run.
- Its fix files no follow-up issues, so text planted in the code never turns into more issues.

[How a change lands](/ads/docs/how-changes-land/#sweep-issues) has the details.

## The report and the exit code

`ads sweep` prints, in this order:

- the files it read and the trunk commit;
- one line per category, with the kept and dropped findings and the tokens;
- each kept finding;
- each dropped finding, with a one-word reason;
- each filed issue, as `Filed #N <url>`;
- the security findings not filed on a public repository;
- `Skipped duplicate <n>` and `Skipped cap <n>`.

It exits 0 when it succeeds. It exits 1 when filing failed, when every category that ran failed, or when it refuses to run. A second sweep of the same clone refuses to start while one runs.

## Sweep on a schedule

**You say**

```text
sweep every day
```

**What happens.** Claude Code runs `ads sweep schedule --every daily`. "sweep every week" runs `--every weekly`. The full form:

```sh
ads sweep schedule [--every daily|weekly] [--at HH:MM]
ads sweep unschedule
```

The sweep runs daily at 09:00 local time by default. A weekly sweep runs on Monday. Name another time with `--at`, for example `--at 07:30`. Say "stop the daily sweep" to run `ads sweep unschedule`.

Before it writes anything, `ads sweep schedule` runs the checks that a scheduled sweep would fail on later: `gh repo view` on the remote, `gh auth status`, a sweeper that is not `fake`, and `claude auth status`. It refuses on the first one that fails. The scheduled job runs `ads sweep --scheduled`. It only files issues. It never works the queue.

**On macOS**, the schedule is a launchd job:

- The label is `ai.sondalab.ads-sweep.<id>`. The `<id>` is the first 12 hex characters of the sha256 of the absolute path of the repository. A new schedule of the same repository replaces the old one.
- The plist is `~/Library/LaunchAgents/ai.sondalab.ads-sweep.<id>.plist`.
- `ads sweep unschedule` stops the job and deletes the plist.

**On Linux**, `ads sweep schedule` writes nothing. It prints a line for you to add with `crontab -e`, for example:

```text
0 9 * * * cd '/home/me/repo' && HOME='/home/me' PATH='/usr/local/bin:/usr/bin:/bin' '/home/me/go/bin/ads' sweep --scheduled >> '/home/me/repo/.git/ads/sweep/last.log' 2>&1
```

`ads sweep unschedule` then only reminds you to remove that line.

The job keeps the `PATH` and `HOME` of the shell where you ran `ads sweep schedule`, and its `CLAUDE_CONFIG_DIR` when that was set. So run it from a shell where `claude` works. Run it again after you move `gh`, `claude` or `ads`.

Only one clone on one machine should schedule a repository. The sweep lock stops a second sweep of the same clone only. Two clones can file the same finding twice.

## The log of the schedule

The job writes to `.git/ads/sweep/last.log` in a plain clone. It prints `ads sweep: started <time>` first. It prints `ads sweep: ok · <n> filed` or `ads sweep: failed · <error>` last. ADS never truncates the log, so delete it by hand when you want.

On macOS, `ads doctor` shows a `Sweep schedule` line with the plist path when the repository has a schedule. It warns when:

- the sweeper uses the `fake` adapter;
- the plist runs another `ads` than the one you run;
- the last line of the log is a failure, or a run that did not finish;
- no run happened for longer than the period plus one day: 2 days for a daily schedule, 8 days for a weekly one.

A Mac that is off or asleep for longer than that shows the overdue warning until the next run. `make uninstall` removes every sweep schedule on macOS (see [Getting started](/ads/docs/getting-started/#uninstall)).
