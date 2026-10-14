---
name: skillkit
tagline: A pick-and-install kit of agent skills.
accent: default
form: Kit
order: 5
repo: https://github.com/sondalab-ai/skillkit
repoPublic: true
summary: "Five skills that give a coding agent <strong>durable working habits</strong>: decisions with a revert plan, specs and memories the repo can see, the set synced across machines. Two of the five now ride inside claude-loadout too."
---

skillkit is a catalog of skills for your coding agent, each a concrete, repeatable
capability rather than a prompt you retype every session. Four of the five address
the same gap: an agent is good at doing the work and bad at leaving a trail behind
it. `debug-decisions` records architectural choices as versioned Markdown with a
revert plan attached, `spec-versioning` puts specs and implementation plans where
the repo can find them, `memory-org` settles which memories belong to the project
and which belong to you, and `sync-skills` keeps the whole set in step across
machines. `mind-gym` is the odd one out and stays on purpose: it trains the human,
not the agent.

An interactive installer (`npx github:sondalab-ai/skillkit`, no clone needed) lists
what is available, lets you multi-select, and copies each chosen skill into your
agent's skills directory. Skills that ship extra wiring, slash commands or hooks,
are set up on request, with your settings backed up first and the change made
idempotently. The uninstaller runs each skill's teardown, removes its commands and
hooks, and deletes the directory, but never touches recorded user data, which you
remove by hand if you want it gone.

Two of those five now have a second home. claude-loadout implements the same jobs
as commands, writing the identical decision records into the identical directory
and following `memory-org`'s layout for its note store, and does per session what
the skills leave to you by hand. If you run the launcher, take `debug-decisions`
and `memory-org` from there. skillkit stays the standalone route, no Python and no
wrapper around your agent command, and it keeps the one thing a launcher will not
ship: the guided revert of a decision it recorded. `spec-versioning`, `sync-skills`
and `mind-gym` live here and nowhere else.

The shared toolbox the rest of the suite reaches for when an agent needs to *do*
something specific rather than reason it out from scratch. Public and open.
