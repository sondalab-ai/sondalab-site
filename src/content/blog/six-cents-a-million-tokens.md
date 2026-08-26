---
title: Six cents a million tokens
date: 2026-04-30
summary: Inference costs have fallen faster than almost any computing commodity in history. The interesting consequence is not cheapness — it is that the frontier stopped being the default.
---

When GPT-3 launched publicly in late 2021, reaching an MMLU score of 42 cost
around **$60 per million tokens**. By early 2026, [multiple models clear that
same bar at **six cents per million or
less**](https://epoch.ai/data-insights/llm-inference-price-trends).

Epoch AI's dataset puts the rate of decline between **9x and 900x per year**
depending on which capability threshold you anchor to, with a **median around
50x**. Restrict the window to January 2024 onward and that median jumps to
roughly **200x per year** — the collapse is accelerating, not levelling off.
Matching GPT-4's performance on PhD-level science questions got cheaper by
about 40x annually.

Nothing else in computing has fallen that fast. Not storage, not bandwidth, not
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

Run the arithmetic yourself rather than trusting anyone's headline. A machine
with enough unified memory to hold a capable model costs a few thousand
dollars once. Amortised over three years that is on the order of **$150 a
month**, and past some daily request volume — for most workloads, tens of
thousands — it undercuts every metered API, because the marginal cost of the
next request is zero.

What you give up is the top of the capability range, not the middle of it.
Reported figures vary and depend heavily on the task, but the practical
experience is consistent: a well-chosen local model handles the ordinary work
and visibly does not handle the hard work. The skill is knowing which is which.

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
