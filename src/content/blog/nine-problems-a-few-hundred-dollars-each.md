---
title: Nine problems, a few hundred dollars each
date: 2026-07-03
summary: DeepMind's prover closed nine open Erdős problems and 44 OEIS conjectures. The success rate was 2.5%, and both numbers matter.
---

In May, Google DeepMind published AlphaProof Nexus, which [autonomously settled
nine of 353 open Erdős problems it
attempted](https://the-decoder.com/google-deepminds-alphaproof-nexus-solves-decades-old-math-problems-for-a-few-hundred-dollars/),
including two that had stood for 56 years. It also proved 44 of 492 open
conjectures from the Online Encyclopedia of Integer Sequences, settled a
15-year-old question on Hilbert functions, and improved a bound in convex
optimisation. Inference cost ran to a few hundred dollars per problem.

Fields medallist Tim Gowers endorsed the results as genuine contributions.
Terence Tao has consistently warned against reading too much into the
headlines. Both are correct, and holding both is the entire skill.

## The verification is the story

The architecture matters more than the score. A language model proposes proof
strategies; **Lean checks every logical step in software**. The output is not a
plausible-sounding argument that a referee must now spend a month evaluating —
it is a formal object that either compiles or does not.

That inverts the usual problem with machine output. Everywhere else, the
bottleneck is that a model produces confident text and a human has to
distinguish correct from convincing. In formal mathematics that distinction is
mechanical. **The domain came with a type checker.**

This is why mathematics is running ahead of every other research field, and
why the results transfer worse than the excitement suggests. Most disciplines
have no Lean. In most disciplines, "the model found something" still means a
human reads it carefully and hopes.

## The denominator

Nine of 353. Forty-four of 492. Roughly a **1–2% hit rate**, concentrated on the
easier end of the list. The framing "AI solved open problems in mathematics" is
true and the framing "AI mostly failed at open problems in mathematics" is the
same sentence.

What changed is not the ceiling. It is that attempting 353 hard problems became
cheap enough to be worth doing at a 2% hit rate. That is a **search economics**
result, not a reasoning result — and search economics is how most real progress
has always happened.

## The part worth stealing

If you work in a domain with a checker — types, tests, a simulator, a solver —
you have the same setup and probably have not exploited it. Generate widely,
verify mechanically, keep the survivors. Cheap generation plus strict
verification beats expensive careful generation, and it does so precisely
because you never have to trust the generator.

The lesson is not that the model is smart. It is that **the checker made it
safe to let the model be wrong.**
