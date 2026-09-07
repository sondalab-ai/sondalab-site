---
name: claude-loadout
tagline: Start each session with only the tools it needs.
accent: default
form: Term
order: 2
repo: https://github.com/sondalab-ai/claude-loadout
repoPublic: true
links:
  - label: ccloadout on PyPI
    href: https://pypi.org/project/ccloadout/
summary: "Ranks your installed MCP servers, plugins, skills and notes against what you're working on, with <strong>a local model</strong>, then starts the session with <strong>only the relevant subset</strong> — the rest installed, just unloaded."
---

Every agent session loads *all* of your installed MCP servers, plugins and
skills, whether or not today's task touches them. Two costs stack up before you
type a word: context spent on tools you aren't using, and a more crowded set of
candidates the agent weighs when it decides what to auto-invoke.

claude-loadout addresses that per session, with nothing to toggle by hand. It
reads signals from your working directory (folder name, marker files like
`package.json`, the README's opening line), ranks your tools against the goal
with a small local model (no network call, no data leaving your machine),
applies your keep/drop rules, and launches your coding agent with just the relevant
subset. The first time you scope a repo the decision is saved to `.loadout/` and
reused; you refresh it deliberately with `claude-loadout update`.

Turn on `cld memory enable` and the same ranking applies to what you know, not
just to what you installed: a session starts with the past decisions, open debt
and notes that fit its goal, inside a token budget you set, and nothing else.
It reads the stores you already keep, `docs/memory/` in the repository, your
agent's own memory directory, an existing decision corpus, and writes back into
them in their own file formats. No note ever lands in a folder of ours, so
uninstalling leaves every one of them exactly where it was.

That layer takes over the two skillkit skills it overlaps with. `cld decision
new|list|show|supersede` writes the same records `debug-decisions` writes, in the
same directory, and the note store follows `memory-org`'s convention, so both
tools see one corpus and neither has to migrate the other's files. What those
skills leave to you by hand the launcher does per session: ranking notes against
the goal, keeping the index in step, surfacing what has gone stale in `cld memory
audit`. `cld decision revert` is deliberately absent, because running destructive
git operations is not a launcher's job.

Safe by design: nothing about your global setup changes, and if anything fails
it falls back to a normal full session. Install with `pipx install ccloadout`,
then type `claude-loadout` (or the short alias `cld`) in place of your usual agent command; it
forwards every argument through. Apache 2.0.
