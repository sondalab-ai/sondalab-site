---
name: introspect
tagline: Audit and observe how Claude Code runs — replay and live.
status: beta
accent: introspect
surface: App
order: 1
repo: https://github.com/marcellobarile/introspect
repoPublic: true
verified: 2026-08-24
summary: A local, read-only dashboard that reads the files Claude Code already writes — instructions, skills, agents, memories, hooks, permissions — and renders them as a navigable audit. It replays past sessions as execution graphs and tails the active one live over WebSocket, and never writes to your config.
---

introspect is a window onto how Claude Code is set up and what it's doing. It
reads the files Claude already writes on your machine — system prompt, skills,
agents, slash commands, memories, hooks, permissions, plugins — and turns them
into a navigable dashboard. You can browse every project Claude has touched,
replay a past session as an execution graph, or watch the active one live: a
real-time graph of subagent spawns, tool calls, file reads and writes, and
current reasoning, streamed over WebSocket.

Built to be safe and legible by design: it is **read-only** on Claude's
filesystem (it never mutates settings, hooks or memories), binds to `localhost`
only — no network exposure, no auth, no database — and degrades per section, so
a missing source shows an empty state instead of crashing. The only thing it
produces is an export bundle, to a destination you choose, with secrets redacted
by default.
