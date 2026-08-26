---
title: Six cents a million tokens
date: 2026-04-30
summary: Inference costs have fallen faster than almost any computing commodity in history. The interesting consequence is not cheapness — it is that the frontier stopped being the default.
---

In 2020, GPT-3-level performance on MMLU cost around **$60 per million
tokens**. By March 2026, multiple models cleared that same bar at **$0.06 per
million tokens or less** — a thousandfold decline, with published estimates of
the rate ranging from 9x to 900x per year depending on which capability
milestone you anchor to.

Nothing in computing has fallen that fast. Not storage, not bandwidth, not
transistors.

## The consequence nobody planned

Cheap inference did not just make the same architectures cheaper. It changed
**which architecture is correct**.

When a token cost real money, the sensible design was one call to the best
available model. Now the sensible design is a router: send 80–90% of traffic to
a small model that handles it fine, escalate the rest. Practitioners report
cutting inference spend by around **70%** doing exactly that, and the quality
delta on the routed traffic is frequently zero, because most requests were
never hard.

Most of what an application asks a model to do is classification, extraction,
reformatting and short question answering. A 3B model does those. Sending them
to a frontier model is not thoroughness — it is **paying a reasoning premium on
work that requires no reasoning.**

## The local threshold has already been crossed

The numbers here are less quoted and more consequential. A Mac Studio M4 Max
with 128 GB is roughly **$5,000**, which amortises to about **$139/month over
three years** and undercuts every cloud API past roughly **50,000 daily
requests**. Local inference on consumer hardware delivers something like
**70–85% of frontier quality at zero marginal cost per request**.

Ollama passed **52 million monthly downloads** in Q1 2026, from around 100,000
in Q1 2023. Hugging Face hosts something like **135,000 GGUF-format models**.
That is not a hobbyist ecosystem any more. That is a distribution channel.

## What this actually buys you

Not savings. Savings are the least interesting part.

- **No rate limit.** The machine does what you ask, at 3am, in a loop.
- **No deprecation.** The weights on your disk cannot be retired by someone
  else's roadmap.
- **No egress.** The context never leaves the building — which for a lot of
  work is the difference between allowed and not.
- **A floor.** When the API is down or repriced, you still have a system.

The frontier is still the frontier and there is real work that needs it. But
the default stopped being obvious, and defaults are where the leverage is.

Route the easy 85% to a model you own. Keep the frontier for the work that
actually earns it.
