---
title: The clock ran out in Brussels
date: 2026-08-24
summary: On 2 August the Commission stopped asking and started enforcing. The interesting part is not the fines — it is that a regulator can now demand access to a model.
---

For a year the EU AI Act was a calendar. Providers of the most capable models
had obligations on paper from August 2025, and a twelve-month grace period in
which nothing could actually happen to them. On **2 August 2026** that period
closed and the [Commission's enforcement powers came into
application](https://digital-strategy.ec.europa.eu/en/news/commission-starts-enforcing-ai-act-rules-and-new-transparency-requirements-2-august).

The number everyone quotes is the ceiling: **up to 3% of worldwide annual
turnover**. It is the wrong thing to look at. Fines are the ordinary end of any
regulation. What is not ordinary is the rest of the toolkit.

## What the Commission can now actually do

- **Request information** about a model, from the entity that trained it.
- **Request access to the model itself**, to run its own evaluations rather
  than read someone's report about them.
- **Require mitigation** of systemic risk, as a condition of staying on the
  market.
- **Restrict, withdraw or recall** a model already deployed.

Read that list again as an operator rather than a lawyer. It describes a
regulator that has given itself a debugger. Not a questionnaire, not an
attestation — an evaluation harness pointed at weights it did not train.
Whether the Commission has the staff and the compute to use it is a separate
and much less settled question. But the power is now written down.

## The quieter half: Article 50

The same date switched on transparency duties. Systems generating synthetic
audio, image, video or text must mark their output **in a machine-readable
format** and make it detectable as generated. Systems already on the market
before that date get until **2 December 2026** to comply with the marking and
detection requirements.

This is the provision that touches everyone, not just the six or seven labs
training frontier models. It says, in effect: the artefact must carry its own
origin. Not a label a platform adds later, not a classifier guessing after the
fact — a signature travelling with the file.

That is a good idea and a hard one, and the reason it is hard has nothing to do
with cryptography. It is that the marking only survives if every tool in the
chain agrees to preserve it, and most tools in the chain were built by people
who never agreed to anything.

The deadline is real. The plumbing is not there yet.
