---
name: daos
tagline: A research bench for getting the same answer twice.
accent: default
form: Library
kind: research
order: 3
repo: https://github.com/sondalab-ai/daos
repoPublic: false
fullPage:
  href: /daos/
  label: Read “Asking twice”
summary: "A Python library we built to make an AI model give the same answer every time, and to <strong>measure what that takes</strong>. The findings are in the research note."
---

DAOS asks a local AI model once, tidies and signs the answer, and gives it back
byte for byte when the exact same request comes again. A logged run can be
replayed later, a stored answer can be checked against a stronger model, and a
single wrong one can be withdrawn or corrected.

We keep it as a research bench rather than a product. On one machine, turning
the model's randomness off was already enough to get one answer, and voting
across several copies of a model made answers consistent but not more
accurate. The research note covers what we measured, what did not pay off, and
when you do not need any of this.

It is a local, single-user Python library that drives models through LM Studio.
The source repository is currently private.
