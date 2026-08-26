---
title: Everyone finances everyone else's compute
date: 2026-08-03
summary: Hyperscaler capex is heading for three quarters of a trillion this year. The argument that settles whether it is sane is a dispute about how fast a GPU stops being worth running.
---

The five largest infrastructure buyers are on track to spend somewhere in the
region of **$700–800 billion** on AI infrastructure this year. Goldman's
projection has hyperscaler capex at roughly **$1.15 trillion across 2025–2027**,
against $477 billion for the whole 2022–2024 stretch. Whatever this is, it is
not incremental.

Two structural details make it more interesting than a large number.

## The circle

A recurring pattern in the deal flow: a chip vendor takes equity in a model
lab, the lab signs take-or-pay compute commitments with a cloud provider, the
cloud provider funds GPU purchases with debt, and the GPUs come from the chip
vendor. Nvidia, OpenAI, Oracle and CoreWeave appear in each other's
arrangements in interlocking positions, and capex has [outrun operating cash
flow far enough that hyperscalers are reaching for external
financing](https://insight.factset.com/hyperscalers-tap-external-financing-as-ai-capex-outruns-cash-flow).

None of that is illegal or even unusual in a capital-intensive buildout. What
it does is make **end demand look larger and more independent than it is**. A
dollar can be counted at several points around the loop. The headline
Nvidia–OpenAI figure spent most of a year as a non-binding letter of intent
before resolving into a signed guarantee — a distinction that matters enormously
and gets flattened in every summary.

## The depreciation question

The one that will actually settle the argument:

- Hyperscalers generally **depreciate AI hardware over four to six years**, and
  compute is heading toward roughly 60% of capex, up from around 43% in 2022 —
  so the assumption matters more each quarter.
- **Michael Burry** has argued the real economic life is closer to **two to
  three years**, tracking Nvidia's three-year generational cadence, and
  estimated the cumulative hit to reported earnings at [**over $176 billion
  across
  2026–2028**](https://natlawreview.com/article/deep-quarry-useful-lives-gpus-key-considerations)
  if the schedules were shortened to match.

Attribute that figure carefully: it is one prominent investor's estimate under
his own assumptions, not a consensus. But the disagreement is not confined to
short sellers — **it is live inside the industry**. In January 2025 Amazon
shortened the useful life of part of its fleet and retired hardware early,
citing the pace of AI hardware development. **The same month, Meta extended
its schedule to 5.5 years.**

Two of the most sophisticated operators in the world, looking at the same
technology cycle, moved their assumptions in opposite directions. That is what
an unsettled question looks like on a balance sheet, and it is load-bearing
under every "the capex is fine" argument being made.

## For anyone building on top

The exposure is not to the stock price. It is to the **price of tokens**, which
today is set by companies willing to lose money to hold a position, and which
is therefore not a real price. Build as if inference costs what it costs to
serve, not what it costs to buy.

If your architecture only works at subsidised prices, you have not built a
business. You have taken a position on somebody else's balance sheet.
