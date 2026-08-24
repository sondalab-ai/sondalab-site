---
name: SPEXR
tagline: The spec-based IDE where agents do the work and you keep command.
status: public-beta
accent: spexr
surface: IDE
order: 0
repo: https://github.com/sondalab-ai/spexr-ide
repoPublic: true
links:
  - label: Download (releases)
    href: https://github.com/sondalab-ai/spexr-ide/releases
verified: 2026-08-24
summary: An agent-centric IDE on Eclipse Theia where the Claude session is the main surface and every change traces back to a spec — plan → tasks → diff → PR. Ships on-device semantic search, built-in Git, and Darkfactory, a live wall of all your local Claude sessions.
---

SPEXR inverts the usual layout: instead of bolting an agent into a sidebar, the
Claude session is the primary surface and your files and terminals orbit it.
Specs are first-class artifacts — `docs/specs/<id>.md` becomes a plan, tasks, a
diff and a PR, and a drift detector flags divergence. A two-scope memory (user +
project) keeps what the agent learns.

It also ships local semantic search (hybrid keyword + embeddings, with one-line
file descriptions generated on-device — no API calls, nothing leaves the
machine), a full built-in Git provider, and **Darkfactory**: a wall of every
local Claude session across your config profiles, with live state, on-device
summaries, and one-click resume.

Transparent about how it works: SPEXR does **not** call the Anthropic API — it
spawns your locally installed agent binary and reuses its stored credentials.
Today that means a working Claude Code CLI is a hard dependency, with
multi-harness support (OpenCode) on the way. It's public beta — MIT, on macOS,
Windows and Linux.
