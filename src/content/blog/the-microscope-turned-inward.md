---
title: The microscope turned inward
date: 2026-05-15
summary: MIT named mechanistic interpretability a breakthrough technology of 2026. We can now find the feature for an emotion and push on it. Nobody is claiming we understand the model.
---

[MIT Technology Review named mechanistic interpretability one of its 10
Breakthrough Technologies of
2026](https://www.technologyreview.com/2026/01/12/1130003/mechanistic-interpretability-ai-research-models-2026-breakthrough-technologies/),
which is roughly the point at which a research programme stops being a research
programme and starts being infrastructure.

The arc is short and steep. In 2024 Anthropic built what it called a microscope
for Claude and identified features corresponding to recognisable concepts —
the Golden Gate Bridge, Michael Jordan. In 2025 the same tooling traced whole
**sequences** of features, following the path from prompt to response. In April
2026 an emotion-vectors paper identified **171 emotion concept vectors** in
Claude Sonnet 4.5 that causally shift behaviour in the direction the emotion
would predict.

Causally. Not correlated with — you can push on the vector and the behaviour
moves.

## Why this is the safety story that matters

Every other approach to model behaviour is **behavioural**: you prompt it, you
watch what comes out, you infer. That method has a fatal weakness that has been
obvious since the first red-team exercise — it cannot distinguish a model that
is aligned from a model that is aligned **on the distribution you tested**.

Interpretability is the first tool that reads the mechanism rather than the
output. OpenAI is building what it describes as a lie detector from model
internals — identifying deception by looking at what the model computed, not
what it said. Teams at DeepMind are using similar techniques on unexpected
behaviours.

If it works, evaluation stops being an empirical search over an infinite input
space and becomes something closer to reading a circuit diagram.

## The part that is not solved

We can identify features. We cannot yet read a model the way you read a
program, and the honest researchers say so loudly. A January 2025 paper
convened 29 researchers from 18 organisations just to formalise what the open
problems *are*.

Finding a feature is not understanding a computation, in the same way that
knowing which neuron fires for a grandmother is not neuroscience. The features
we can name are the ones we already had words for — which means the map is
biased toward what we expected to find.

## The operator's version

You will not run a sparse autoencoder over a frontier model this quarter. But
the disposition transfers, and it is the same one this whole site is about:
**do not accept the output as evidence about the process.** Instrument the run.
Look at what actually happened.

The labs are building microscopes because watching the output stopped being
enough. That was true for your agent six months ago.
