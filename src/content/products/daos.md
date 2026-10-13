---
name: daos
tagline: Same question, same answer. Every time.
accent: default
form: Library
order: 3
repo: https://github.com/sondalab-ai/daos
repoPublic: false
fullPage:
  href: /daos/
  label: Read the full DAOS page
summary: "A Python library that asks an AI model <strong>once</strong>, signs the answer, and gives back <strong>exactly that answer</strong> every time the same request comes in, with no new model call."
---

AI models can answer the same question differently each time, which makes them
hard to test, audit or debug. DAOS asks the model once, tidies the answer into a
fixed shape, signs it and stores it. From then on the same request gets that
stored answer back, byte for byte, and any logged run can be replayed later to
show exactly what the model said.

The signature is what makes the stored answers trustworthy: anyone who could
edit them could decide every future answer. So DAOS refuses to start without a
signing key, and an answer that was changed after signing is caught. It is a
local, single-user Python library, built from a written specification and
tested with unit, property, concurrency and structural suites.

It also runs as a local server that speaks the OpenAI chat API, so existing
apps only change an address. A daily check asks a stronger model and a web
search whether stored answers still hold up, and a single wrong answer can be
withdrawn or replaced without touching the rest.

There is no user interface: it is the quiet tool the rest of the suite relies
on when a claim needs checking. The source repository is currently private.
