---
name: SPEXR
tagline: The spec-based IDE where agents do the work and you keep command.
status: public-beta
accent: spexr
form: IDE
order: 0
repo: https://github.com/sondalab-ai/spexr-ide
repoPublic: true
links:
  - label: Download (releases)
    href: https://github.com/sondalab-ai/spexr-ide/releases
summary: An <strong>agent-centric IDE</strong> on Eclipse Theia where the agent session is the main surface and <strong>every change traces back to a spec</strong>, from plan to tasks to diff to PR. Ships <strong>on-device semantic search</strong>, built-in Git, and <strong>Darkfactory</strong>, a live wall of all your local agent sessions.
---

SPEXR inverts the usual layout: instead of bolting an agent into a sidebar, the
agent session is the primary surface and your files and terminals orbit it.
Specs are first-class artifacts: `docs/specs/<id>.md` becomes a plan, tasks, a
diff and a PR, and a drift detector flags divergence. A two-scope memory (user +
project) keeps what the agent learns.

It also ships local semantic search (hybrid keyword + embeddings, with one-line
file descriptions generated on-device, no API calls, nothing leaves the
machine), a full built-in Git provider, and **Darkfactory**: a wall of every
local agent session across your config profiles, with live state, on-device
summaries, and one-click resume.

Transparent about how it works: SPEXR does **not** call any hosted model API; it
spawns your locally installed agent binary and reuses its stored credentials.
Today that means a working agent CLI is a hard dependency, with
multi-harness support (OpenCode) on the way. It's public beta: MIT, on macOS,
Windows and Linux.
