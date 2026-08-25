---
name: claude-skills
tagline: A pick-and-install kit of agent skills.
accent: default
surface: Library
order: 5
repo: https://github.com/marcellobarile/claude-skills
repoPublic: true
summary: A collection of agent skills with an <strong>interactive installer</strong>, <strong>pick only the ones you want</strong> and it copies them into your agent's skills directory, wiring any slash commands and hooks (settings backed up first). The uninstaller removes them cleanly and <strong>never deletes your recorded data</strong>.
---

claude-skills is a curated set of skills for your coding agent, each a concrete,
repeatable capability an agent can run, from planning an astrophotography
session to building a CV, running an adversarial PR review, or tracking
architectural decisions.

An interactive installer (`npx github:marcellobarile/claude-skills`, no clone
needed) lists what's available, lets you multi-select, and copies each chosen
skill into your agent's skills directory. Skills that ship extra wiring (slash commands,
hooks) are set up on request, with your `settings.json` backed up first and the
change made idempotently. The uninstaller runs each skill's teardown, removes its
commands and hooks, and deletes the directory, but never touches recorded user
data, which you remove by hand if you want it gone.

The shared toolbox the rest of the suite reaches for when an agent needs to *do*
something specific rather than reason it out from scratch. Public and open.
