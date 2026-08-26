---
title: Legibility is a feature
date: 2026-08-19
summary: An agent that cannot show its work is not autonomous, it is unaccountable. The difference is entirely in the tooling around it.
---

The pitch for agents is that you stop watching. The reality is that you stop
watching *the steps you already trust*, which is a much smaller claim and a much
better one.

Getting there requires that the steps be watchable in the first place. Most
harnesses treat the trace as debug output: verbose, unstructured, discarded on
exit. That is backwards. **The trace is the product.** The answer is just the
last line of it.

## What "legible" actually means

It is not a log level. A legible run answers four questions without you
reconstructing anything:

1. **What went in.** Not "the prompt" — the *whole* context: which files, which
   tool definitions, which prior turns survived compaction.
2. **What it chose.** Every tool call, with arguments, in order, including the
   ones that failed and the retries that followed.
3. **What it cost.** Tokens per step, cache hits, wall time. Aggregates hide the
   one step that burned half the budget.
4. **What changed.** The diff on disk, separated from the narration about the
   diff.

Miss any one and you are back to trusting a summary written by the thing you
were trying to audit.

## The uncomfortable part

Legibility is expensive to build and boring to demo. Nobody screenshots a good
trace viewer. But it is the only thing that converts "the agent did something
strange" from a shrug into a bug report, and a bug report is the only artefact
that makes the next run better.

You cannot steer what you cannot see. Everything else is vibes with a spinner.
