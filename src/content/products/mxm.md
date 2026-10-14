---
name: MxM
tagline: Your coding agent remembers every session, on your machine, where you can read it.
accent: default
form: CLI
kind: research
order: 6
repo: https://github.com/sondalab-ai/MxM
repoPublic: false
summary: "Stores what past coding-agent sessions said and feeds the next one <strong>its project's experience</strong>, recalled by meaning with <strong>a local encoder</strong>, in one SQLite file per repository that you can open, move or delete."
---

A coding-agent session forgets everything when it ends. The next one
rediscovers the same root cause, walks into the same dead end and asks the same
questions, because what the last session learnt sits in a transcript nobody
reads again.

MxM (Model Experience Memory) keeps that experience. When a session ends it
stores each exchange, your prompt and the agent's reply, in one file per
repository. The next session starts with the most recent exchanges, and each
prompt you send gets the past exchanges that clearly stand out for it, recalled
by meaning with an encoder that runs on your CPU. An unrelated prompt gets
nothing: being the closest match isn't enough, a past exchange has to stand out
from the rest of the project's memory before it's shown.

After a session ends, a background worker distils it into short facts —
decisions and their reasons, root causes, dead ends, conventions — and checks
each one against the exchanges it came from before the next session sees it.
Facts are never edited in place; retracting one keeps the original on the
record.

Legible by design: every block the agent is shown is journaled, and
`mxm review` lets you mark each one useful or noise. It never edits your agent's
settings, it loads its hooks only for the session you start through
`mxm claude`, and if anything fails the session simply runs without memory. The
repository also holds the pre-registered research behind it, negative results
included.
