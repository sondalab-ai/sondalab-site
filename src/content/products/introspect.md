---
name: introspect
tagline: Audit and observe how your coding agent runs, replay and live.
status: beta
accent: introspect
surface: App
order: 1
repo: https://github.com/sondalab-ai/introspect
repoPublic: true
summary: A <strong>local, read-only dashboard</strong> that reads the files your coding agent already writes (instructions, skills, agents, memories, hooks, permissions) and renders them as a navigable audit. It <strong>replays past sessions</strong> as execution graphs and <strong>tails the active one live</strong> over WebSocket, and <strong>never writes to your config</strong>.
---

introspect is a window onto how your coding agent is set up and what it's doing. It
reads the files the agent already writes on your machine (system prompt, skills,
agents, slash commands, memories, hooks, permissions, plugins) and turns them
into a navigable dashboard. You can browse every project the agent has touched,
replay a past session as an execution graph, or watch the active one live: a
real-time graph of subagent spawns, tool calls, file reads and writes, and
current reasoning, streamed over WebSocket.

Built to be safe and legible by design: it is **read-only** on the agent's
filesystem (it never mutates settings, hooks or memories), binds to `localhost`
only (no network exposure, no auth, no database) and degrades per section, so
a missing source shows an empty state instead of crashing. The only thing it
produces is an export bundle, to a destination you choose, with secrets redacted
by default.
