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
  - internal/flow/resume.go
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
syncedFrom: 055c6548b89d73996e2a234bb4d52771ae9aa426
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
| `max_findings_per_category` | 3 | the findings kept per category, at most one per file, not counting files whose sweep issue blocks them |
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

A finding whose category and file already have a sweep issue that blocks it is left out before `max_findings_per_category` applies. The report counts it as `Skipped duplicate`. It is not a kept line and not a dropped line. So it never takes the place of a finding on a new file.

A dry run lists no issues, so it leaves out none. A dry run can therefore show a finding that the real sweep skips as a duplicate.

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

When `gh` fails, the sweep waits 2 seconds and asks once more. When `gh` still cannot tell, the sweep files none either, and the line gives the reason. Read those findings in the report, and fix them privately. They do not count toward `max_filed`. A security finding that an existing sweep issue blocks is a duplicate, not a withheld finding. The other categories file as usual.

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

It exits 0 when it succeeds. It exits 1 when filing failed, when every category that ran failed, or when it refuses to run. It exits 130 after Ctrl-C and 143 after SIGTERM, also with `--scheduled`. A second sweep of the same clone refuses to start while one runs.

## Stop a sweep

Ctrl-C or SIGTERM stops a sweep. This includes the SIGTERM that `launchctl bootout` sends to a scheduled sweep.

- During the sweeper calls, the sweep stops them and files nothing.
- During filing, the issue in flight finishes, and the sweep files no more.

In both cases the sweep saves no state. The next sweep reads the same files again, and dedupe blocks the issues already filed. The sweep removes its worktree, releases its lock and exits with 130 or 143. A scheduled sweep logs `ads sweep: failed · interrupted`.

A sweep reads the trunk in a worktree whose name starts with `sweep-`. A sweep that was killed can leave that worktree behind. The `ads resume` cleanup removes it only when no sweep holds the lock. A dry run holds no lock.

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

Before it writes anything, `ads sweep schedule` runs the checks that a scheduled sweep would fail on later: `gh repo view` on the remote, `gh auth status`, a sweeper that is not `fake`, and `claude auth status`. It refuses on the first one that fails.

`gh auth status` and `claude auth status` run with only the job's variables: `PATH`, `HOME`, `USER`, `XDG_CONFIG_HOME`, `GH_CONFIG_DIR` and `CLAUDE_CONFIG_DIR`, each when set. A login that works only through a token variable of your shell would fail every scheduled run, so ADS refuses it: `GH_TOKEN`, `GITHUB_TOKEN`, `GH_ENTERPRISE_TOKEN` or `GITHUB_ENTERPRISE_TOKEN` for gh, and `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN` or `CLAUDE_CODE_OAUTH_TOKEN` for claude. The refusal lists the job variables that are set, names the token variables your shell sets (never their values), and gives the error of the check. ADS never writes a token into the plist or the crontab line. Log in with `gh auth login` or `claude auth login`.

There is one schedule per clone. The scheduled job runs `ads sweep --scheduled` in the main worktree of the clone. It only files issues. It never works the queue. `ads sweep schedule` from a linked worktree replaces the schedule of the clone and says `The job runs in <main worktree>, the main worktree of this clone.` The job keeps working after you remove the linked worktree. `ads sweep unschedule` and `ads doctor` find the schedule from any worktree of the clone.

**On macOS**, the schedule is a launchd job:

- The label is `ai.sondalab.ads-sweep.<id>`. The `<id>` is the first 12 hex characters of the sha256 of the absolute path of the main worktree. A new schedule of the same clone replaces the old one.
- The plist is `~/Library/LaunchAgents/ai.sondalab.ads-sweep.<id>.plist`.
- `ads sweep unschedule` stops the job and deletes the plist.
- A schedule that an older ADS set from a linked worktree keeps its old label. Remove it with `launchctl bootout gui/$UID/<label>`, then delete `~/Library/LaunchAgents/<label>.plist`. `make uninstall` also removes it.

**On Linux**, `ads sweep schedule` writes nothing. It prints a line for you to add with `crontab -e`, for example:

```text
0 9 * * * cd '/home/me/repo' && HOME='/home/me' PATH='/usr/local/bin:/usr/bin:/bin' USER='me' '/home/me/go/bin/ads' sweep --scheduled >> '/home/me/repo/.git/ads/sweep/last.log' 2>&1
```

`ads sweep unschedule` then only reminds you to remove that line. Remove an old line that does `cd` into a linked worktree.

The job keeps the `PATH`, `HOME` and `USER` of the shell where you ran `ads sweep schedule`, and its `XDG_CONFIG_HOME`, `GH_CONFIG_DIR` and `CLAUDE_CONFIG_DIR` when they were set. `claude` finds its keychain login by `USER`. Without the right `GH_CONFIG_DIR` or `XDG_CONFIG_HOME`, `gh` reads `~/.config/gh`. So run it from a shell where `claude` works. Run it again after you move `gh`, `claude` or `ads`.

Only one clone on one machine should schedule a repository. ADS keeps one schedule per clone, and the sweep lock stops a second sweep of the same clone only. Two clones can file the same finding twice.

## The log of the schedule

The job writes to `.git/ads/sweep/last.log` in a plain clone. It prints `ads sweep: started <time>` first. It prints `ads sweep: ok · <n> filed` or `ads sweep: failed · <error>` last. ADS never truncates the log, so delete it by hand when you want.

On macOS, `ads doctor` shows a `Sweep schedule` line with the plist path when the clone has a schedule. It warns when:

- the sweeper uses the `fake` adapter;
- the plist runs another `ads` than the one you run;
- the last line of the log is a failure, or a run that did not finish;
- no run happened for longer than the period plus one day: 2 days for a daily schedule, 8 days for a weekly one.

A Mac that is off or asleep for longer than that shows the overdue warning until the next run. `make uninstall` removes every sweep schedule on macOS (see [Getting started](/ads/docs/getting-started/#uninstall)).
