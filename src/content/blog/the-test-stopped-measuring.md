---
title: The test stopped measuring
date: 2026-07-29
summary: Nearly half of the benchmarks in a 60-benchmark study are saturated, and the rate rises with age. That is not a capability result — it is a broken instrument.
---

MMLU was hard once. It is now functionally saturated for frontier models —
meaning the gap between the top several is inside the noise, and every reported
difference between them is a rounding artefact presented as progress.

It is not one benchmark. A systematic study of **60 language model benchmarks**
found that [**nearly half exhibit saturation, with rates increasing with
age**](https://arxiv.org/abs/2602.16763). Benchmarks decay. We keep quoting
them anyway.

Andrej Karpathy has called the situation an **evaluation crisis**, and the
phrase is doing real work: it is not that models got too good, it is that we
lost the instrument and kept publishing the readings.

## Contamination is not an edge case

The obvious failure mode is that the answers were in the training data. This is
routinely dismissed as a solved hygiene problem. It is not: contamination has
been reported even against SWE-bench Verified, with frontier models able to
reproduce task specifics verbatim.

SWE-bench Verified is the benchmark most people point to when they want to
claim a coding result is real. If contamination reaches there, the correct
posture toward any single reported score is: *this is an upper bound on
capability and a lower bound on memorisation, and I cannot separate them.*

## What actually resists decay

The same 60-benchmark study found the protective factor, and it is not the one
the field assumed. **Resilience to saturation comes from expert curation, not
from keeping the test set private.**

That is a genuinely useful result and it cuts against the standard remedy.
Holding out your data delays contamination; it does not make a benchmark
measure anything better. A carefully constructed test stays informative because
the items are hard for the right reasons, not because nobody has seen them.

## What to do instead

There is no clean replacement and pretending otherwise is how we got here. But
there is a discipline:

- **Write your own evals** from your own failures. Twenty cases you actually
  care about beat a public benchmark with a leaderboard.
- **Hold them out.** Never paste them into a prompt with a model that logs.
- **Report cost alongside accuracy**, always. An accuracy number with no cost
  attached is half a result.
- **Re-run them on every model upgrade**, including the ones announced as
  strictly better.

The leaderboard is somebody's marketing. Your eval set is the only instrument
in the room that is pointed at your problem.
