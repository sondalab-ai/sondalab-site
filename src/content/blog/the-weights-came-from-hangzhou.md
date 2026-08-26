---
title: The weights came from Hangzhou
date: 2026-06-26
summary: Four of the five leading open-weight models come from Chinese labs. "Open source means second best" stopped being true, and the licences deserve a closer look than the benchmarks.
---

The assumption that the strongest models necessarily sit behind a corporate API
has quietly collapsed. Top open-weight models now cluster around **80% on
SWE-bench Verified and 90% on GPQA Diamond** — the same conversation as the
closed frontier, not a tier below it.

The geography is the part nobody planned. **Four of the five leaders are
Chinese**: DeepSeek, Moonshot, Zhipu, Alibaba's Qwen. DeepSeek's reasoning line
ships under a plain **MIT licence**. Qwen 3 spans 0.5B to 235B parameters —
phone to datacentre from one family, one tokeniser, one prompt format.

## "Open" is doing a lot of work in that sentence

Meta's Llama 4 is the most-searched Western open model and the [Open Source
Initiative does not classify it as open
source](https://huggingface.co/blog/daya-shankar/open-source-llms), because the
community licence carries commercial-scale limits and field-of-use
restrictions. That is not a technicality. It is the difference between
*downloadable* and *yours*.

The licence spectrum, in the order that matters to anyone building:

- **MIT / Apache 2.0** — actually open. Fork it, sell it, embed it, no
  conversation.
- **Community licences with scale caps** — fine until you succeed.
- **Open weights, closed data, closed recipe** — reproducible in the sense that
  a cake is reproducible from a slice.

Almost nothing on the leaderboard is open in the third sense, including the
models people call the most open. Weights are an artefact, not a method.

## Why this matters more than the ranking

A closed model is a **dependency with a phone number**. It can be deprecated,
repriced, safety-tuned into a different personality, or made unavailable in
your jurisdiction — and none of those events are yours to schedule. Every one of
those has happened to somebody's production system in the last two years.

An open-weight model is a file. Files do not get deprecated. They get old,
which is a completely different failure mode and one you control the timing of.

The gap between the best open model and the best closed model is now smaller
than the gap between a model you can pin and a model somebody else can change
underneath you.

Pin the file. Ship on top of something that cannot be recalled.
