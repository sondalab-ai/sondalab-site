---
name: ads
tagline: An agent team tests, changes and reviews each change. You keep the last word.
status: beta
accent: default
form: CLI
order: 7
repo: https://github.com/sondalab-ai/agentic-dev-system
repoPublic: false
fullPage:
  href: /ads/
  label: See how ADS works
summary: "You ask Claude Code for a change; an agent team writes the tests, makes the change and reviews it in layers. A small change of trivial, low or medium risk that passes every check <strong>can land by itself</strong>; high and critical <strong>wait for your approval</strong>, and every step is signed in git."
---

You ask Claude Code for a change, "fix #12" or "work the queue", and `ads`
runs it for you. A test author writes tests first and freezes them (a
docs-only change has none), an implementer makes the change until those tests and the checks pass, and
separate reviewers look at it in layers. The more risk, the more layers.

The risk of the change decides who signs it. Once `ads init` has set up the
team key, a trivial, low or medium change within its size limit that passes
every check lands by itself, signed with that key; a medium change with a
dispute or a stall waits for you. A high or critical
change waits for your sign-off: one block in the session with the facts of
the change, and a short `ok <code>` from you, which signs it with your key.
Every step is a signed event in git, and every landed change can be undone
with a signed revert.

Each change has a budget of rounds, seconds and tokens for its risk, and asks
before it spends more. You can pause, stop or undo a change by saying so. The
approval guard is a text filter that runs as your user, not an OS sandbox,
and `ads` needs Claude Code. It is in beta, and the repository is private
for now.
