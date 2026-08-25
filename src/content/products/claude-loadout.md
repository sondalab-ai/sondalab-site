---
name: claude-loadout
tagline: Start each session with only the tools it needs.
accent: default
surface: Term
order: 2
repo: https://github.com/sondalab-ai/claude-loadout
repoPublic: true
links:
  - label: ccloadout on PyPI
    href: https://pypi.org/project/ccloadout/
summary: "A launcher that sits in front of Claude Code: it detects what you're working on, ranks your installed MCP servers, plugins and skills against that goal with a local model, and starts the session with only the relevant subset. Everything else stays installed, just unloaded for that run."
---

Every Claude Code session loads *all* of your installed MCP servers, plugins and
skills, whether or not today's task touches them. Two costs stack up before you
type a word: context spent on tools you aren't using, and a more crowded set of
candidates Claude weighs when it decides what to auto-invoke.

claude-loadout addresses that per session, with nothing to toggle by hand. It
reads signals from your working directory (folder name, marker files like
`package.json`, the README's opening line), ranks your tools against the goal
with a small local model (no network call, no data leaving your machine),
applies your keep/drop rules, and launches Claude Code with just the relevant
subset. The first time you scope a repo the decision is saved to `.loadout/` and
reused; you refresh it deliberately with `claude-loadout update`.

Safe by design: nothing about your global setup changes, and if anything fails
it falls back to a normal full session. Install with `pipx install ccloadout`,
then type `claude-loadout` (or the short alias `cld`) in place of `claude`; it
forwards every argument through. Apache 2.0.
