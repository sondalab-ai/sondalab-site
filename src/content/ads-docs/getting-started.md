---
title: Getting started
summary: What you need, how to install ADS, how to set it up once in your repository, and what your first change looks like.
order: 0
sources:
  - README.md
  - docs/guides/setup.md
  - go.mod
  - scripts/install.sh
  - internal/cli/wizard.go
  - internal/cli/work.go
  - internal/flow/landing.go
  - internal/report/report.go
  - internal/report/report_test.go
  - internal/report/view.go
  - internal/cli/agents.go
  - internal/config/config.go
  - internal/cli/doctor.go
  - internal/cli/memorydrift.go
  - internal/hooks/claude/settings.json
  - internal/agent/kinds/kinds.go
  - internal/onboard/ghversion.go
  - cmd/ads/testdata/script/init_rerun.txtar
  - cmd/ads/testdata/script/init_agents.txtar
  - cmd/ads/testdata/script/init_agents_wizard.txtar
  - cmd/ads/testdata/script/init_wizard.txtar
  - internal/onboard/runner.go
  - internal/term/input.go
  - internal/term/steps.go
  - internal/term/tui.json
  - cmd/ads/testdata/script/version.txtar
  - cmd/ads/testdata/script/work_default.txtar
syncedFrom: b64742e946cc0916dadce247e0a89ce0742f181a
verified: 2026-11-18
---

This page answers: what do I need, how do I install `ads`, what does the setup ask, and what does my first change look like? You run the install and the setup once, in a terminal. After that you work by talking to Claude Code.

## What you need

- Go 1.27.3 or newer (the `go` line of the ADS `go.mod`).
- git 2.38 or newer. With git 2.46 or newer, a sign-off question also shows line counts for a text file that `.gitattributes` marks as binary.
- OpenSSH: `ssh-keygen` and `ssh-add`.
- Claude Code. You work through it, and its hooks make approvals in the session work. When the `claude` CLI is on your `PATH`, `ads init` sets the claude agents for every role.
- The GitHub CLI, `gh`, 2.50 or newer. It is optional. Without it, run `ads init --no-github`. ADS reads the `stateReason` field of `gh issue list` for the queue, for follow-up issues and for `ads sweep`. Older `gh` versions do not have that field. `make install` and `ads doctor` warn when `gh --version` is older than 2.50 or cannot be read. The install does not fail for the gh version.
- MxM is optional. `ads memory propose` reads the team notes from it ([Team notes](/ads/docs/team-notes/)). Without it, a person writes the notes by hand.

## Install

The install builds `ads`, puts it in your Go bin directory, and copies the ADS skill for Claude Code. You need access to the repository.

```sh
git clone https://github.com/sondalab-ai/agentic-dev-system.git && cd agentic-dev-system
make install
```

If the Go bin directory is not on your `PATH`, the installer asks before it adds it to your shell file. Then check the install.

**You see**

```text
$ ads version
sonda/lab ads …
```

## Set up once: `ads init`

Run `ads init` in the repository you work on, in a terminal. Before each step it says what the step checks, why `ads` needs it, and what it changes, and it asks before it changes anything.

### What `ads init` asks you

- on a new repository, to use the claude agents for every role, when it finds the `claude` CLI;
- to set your signing key, which needs a passphrase (it can create one), and to create the team key;
- to add both keys as signing keys on GitHub, so the commits they sign show as verified;
- to make the first signed commit of `.ads/` on the trunk (the main branch, for example `main`), or a join request when `.ads/` already exists;
- to set the GitHub rulesets of the trunk, the git hooks, and the Claude Code hooks that make approvals in the session work.

The Claude Code hooks are the `PreToolUse`, `PostToolUse`, `UserPromptSubmit` and `SessionStart` entries of the untracked `.claude/settings.local.json`. `SessionStart` tells a new session, in count lines with no note text, when learned notes wait for your ok, when team notes changed in MxM, and when a reviewer flagged team notes. A repository set up before this entry existed needs `ads init` once more.

### Why there are two keys

The team key signs what the agents do and the changes that land by themselves. Your key signs what you do: your answers, approvals, sign-offs and team-rule changes.

You can skip the team key step, but then `ads work` does not start: it stops with `the team key is not set up: run ads init in a terminal`. It starts once `ads init` has set up the team key and listed it as trusted.

Running `ads init` again is safe: a step that is already fine reports `ok`, and the run fixes what is left. The last line says what to do next.

**You see** (a run with nothing left to fix)

```text
$ ads init
…
  ✓ Signing key on GitHub       …
  ✓ Team key on GitHub          …
  ✓ Rulesets                    …
  ✓ Server check                …

Summary  12 ok · 0 fixed · 1 warn · 0 failed
    Next: run ads doctor any time to re-check this setup
```

## The agents

On a new repository, `ads init` picks the agents that `.ads/config.yaml` gets, so your first change runs with real agents.

- **Claude Code is installed.** When the `claude` CLI is on your `PATH`, `ads init` asks whether to use the claude agents for every role. The default is yes, and with `--yes` or without a terminal it takes yes. Then `claude-opus` implements, and `claude-sonnet` writes the tests, reviews, settles disputes, assesses the requests and sweeps the trunk ([Find work](/ads/docs/find-work/)).
- **No Claude Code, or you say no.** Every role gets the `fake` adapter, which does no work, and a first change stops at the assessor. Install Claude Code if it is missing, then ask its session to "use the claude agents for every role". That is a team-rule change, so it needs your approval (see [Approvals, undo, pause and stop](/ads/docs/approvals-and-undo/)).
- **Your own agent command.** An adapter of kind `exec` runs a command you name. It must report the cost of each call, or ADS refuses its answer ([How a change lands](/ads/docs/how-changes-land/#budgets)). An optional `facts` block says what the agent does, because ADS cannot see it: `cost` lists the amounts each answer reports (`tokens`, `usd`, both, or `[]`), `schema` is `native` when the agent enforces the result schema itself (the default is `validated`), and `sessions: false` says that it keeps no session files.

**You see**, with Claude Code installed:

```text
$ ads init
…
  ● Agents                      claude CLI found at …
? Use the claude agents for every role in .ads/config.yaml? [Y/n]
…
  ✓ Agents                      every role uses the claude agents: claude-opus implements, claude-sonnet does the rest
```

**You see**, without it:

```text
  ! Agents                      no claude CLI on PATH: every role uses the fake adapter, and the first change stops at the assessor
    Try: install Claude Code, then ask its session: use the claude agents for every role
```

Each kind reads only its own keys. Every kind reads `kind`, `allowed_tools` and `escalate_to`. Besides those, `fake` reads only `script`, `exec` reads only `command` and `facts`, and `claude` reads only `model`, `max_budget_usd`, `permission_mode` and `bare`. ADS refuses any other key when the config loads, also when it holds an empty value such as `bare: false`, for example `adapters.x: kind exec does not read model: remove the key`. A trunk config that already has such a key still reads, so a team-rule change can remove it.

## Check: `ads doctor`

`ads doctor` re-runs the read-only checks of the setup. It changes no file and no branch. Run it in a terminal when something does not work. It exits 0 when no check failed, 1 when one did, and 2 on an internal error. `ads doctor --json` prints the same result for a script. While any role uses the `fake` adapter, it shows an `Agents` warning that names those roles.

It also checks the agents and their config. The adapters of the roles count, and so does the `escalate_to` adapter of the implementer:

- `Agent login (<adapter>)` runs the login check of the adapter with your shell environment: `claude auth status` for a `claude` adapter. An `exec` or `fake` adapter has no login check and no line. The line warns when the CLI is missing, when the check fails, or when it does not finish in 15s.
- `Agent facts (<adapter>)` says who checks the result schema and whether the agent keeps session files, for every adapter other than `fake`. It warns when the agent keeps session files, because they hold the change and its code outside the worktree. An `exec` adapter keeps them by default. For an `exec` adapter each fact says `(declared)` when the `facts` block sets it, and `(default)` otherwise.
- An `Adapter keys` warning shows the first key that the kind of an adapter does not read, with the fix `remove the key with a team-rule change`.
- An `Adapter costs` warning shows a budget that limits an amount which an adapter declares it does not report, with the fix `change facts.cost or the budget with a team-rule change` ([How a change lands](/ads/docs/how-changes-land/#budgets)).

`ads work` refuses a config with an `Adapter keys` or an `Adapter costs` warning.

It also checks the notes of the agents ([Team notes](/ads/docs/team-notes/)):

- `Team notes and MxM` compares each team note from MxM with the MxM facts of this clone. It is ok, a warning with the count of notes per state and the fix `say "update the team notes"`, or skipped with `cannot check` and the reason, for example `mxm is not on PATH`. It only reports, and it shows only when the team notes hold a note from MxM.
- `Learned notes` fails when a commit changed `.ads/memory/learned.md` outside ADS, for example a hand edit. It names the commit, with the fix `ads memory reset`.
- `Learned notes issue` warns when the GitHub issue that lists the waiting learned notes is out of date, and is skipped when notes wait and the repository has no GitHub remote.

When `gh` is installed and logged in, `ads doctor` shows a `GitHub CLI version` line. It reads `gh --version`:

- It is ok at gh 2.50 or newer, and shows `gh <version>`.
- It warns when gh is older: `gh <version> is older than 2.50: gh issue list has no stateReason field`.
- It warns when the version is unknown: `the gh version is unknown: …`, with what `gh --version` printed or why it failed.

The fix of both warnings is `upgrade gh to 2.50 or newer`. With `--no-github`, or when `gh` is missing or not logged in, the line does not show.

## Your first change

**Situation.** Issue #12 is a small bug: a fee is truncated instead of rounded. You want it fixed, with a test, without writing the code yourself.

**You say** in Claude Code:

```text
fix #12
```

**You see** the plan, one line per step and the end, then the report:

```text
#12  Plan   bug: ApplyFee truncates instead of rounding
#12  Plan   risk low (forecast): as declared
#12  Plan   test author, implementer, 1 review layer · at most 3 rounds · 1.5M tokens · 3600 s
#12  Step   test author done · 2 frozen tests · 74 s
#12  Step   round 1 · implementer done · 32 s
…
#12  End    landed · 1.2M tokens · $0.21

Landed: #12 ApplyFee truncates instead of rounding            bug · risk low · 1.2M tokens · $0.21
Intent       ApplyFee rounds the fee to the nearest cent, halves up.
Changed      ledger/ledger.go (+3 −1)
Proof        2 new tests failed before the change and pass now · checks pass
Review       correctness ✓
             1 round · 0 open findings · 0 advisory
…
Undo         say "undo #12"
```

**What happens.** Claude Code runs `ads work 12` in the background and relays its lines. A test author writes tests that fail on the current code, and they are frozen. An implementer changes the code until those tests and the checks pass. A reviewer checks the change. A change of trivial, low or medium risk that stays within its size limit and passes every check can land by itself, signed in git. The report is the last thing you see: `Landed`, `Ready for sign-off` when it waits for you, or `Waiting for you` with one question. If you press Ctrl-C while it runs, the running stage ends cleanly, the steps after it still run, and the command exits with 130 (143 for SIGTERM); a second signal kills it at once. [Everyday use](/ads/docs/everyday-use/) has more recipes, and [How a change lands](/ads/docs/how-changes-land/) has the rules.

## Update

```sh
git pull && make install
```

This also updates the skill. The git hooks call the binary by its full path, so they pick up the new one.

## Uninstall

```sh
make uninstall                      # this machine
make uninstall ARGS="--repo <dir>"  # this machine and one repository
```

The script lists what it removes and asks once. On this machine it removes the `ads` binary and its `PATH` line, the skill, the `ads.*` settings of your global git config, the ADS entries of the Claude Code hooks, every sweep schedule on macOS, and the team key on GitHub. On Linux, `ads sweep schedule` wrote no file: remove the line that runs `sweep --scheduled` from your crontab yourself. With `--repo`, it also removes the ADS git hooks and settings of that repository. Clean each repository where you ran `ads init`: without the `ads` binary, its hooks block commits and pushes.

It never removes `.ads/` on the trunk, the GitHub rulesets, your own signing key on GitHub, or your SSH keys. It prints the commands for those.
