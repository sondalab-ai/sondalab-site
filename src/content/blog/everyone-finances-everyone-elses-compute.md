---
title: Everyone finances everyone else's compute
date: 2026-08-03
summary: Hyperscaler capex is heading for three quarters of a trillion this year, and a meaningful slice of the demand signal is the vendors buying from each other.
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
vendor. Nvidia, OpenAI, Oracle and CoreWeave appear in each other's filings in
[interlocking
positions](https://ai-circular-economy.com/).

None of that is illegal or even unusual in a capital-intensive buildout. What
it does is make **end demand look larger and more independent than it is**. A
dollar can be counted at several points around the loop. The headline
Nvidia–OpenAI figure spent most of a year as a non-binding letter of intent
before resolving into a signed guarantee — a distinction that matters enormously
and gets flattened in every summary.

## The depreciation question

The one that will actually settle the argument, and nobody wants to litigate
it in public:

- Hyperscalers **depreciate AI hardware over five to six years**.
- Several analysts argue its economic life is closer to **two to three**, given
  the generational cadence and the power efficiency gap between generations.
- If the shorter figure is right, reported earnings across the sector are
  overstated by a large number — estimates run to roughly **$176 billion across
  2026–2028**.

This is not a fraud allegation. It is an accounting judgement about how fast a
GPU stops being worth running, and reasonable people hold different views. But
it is the load-bearing assumption underneath every "the capex is fine"
argument, and it is being asserted far more often than it is defended.

## For anyone building on top

The exposure is not to the stock price. It is to the **price of tokens**, which
today is set by companies willing to lose money to hold a position, and which
is therefore not a real price. Build as if inference costs what it costs to
serve, not what it costs to buy.

If your architecture only works at subsidised prices, you have not built a
business. You have taken a position on somebody else's balance sheet.
