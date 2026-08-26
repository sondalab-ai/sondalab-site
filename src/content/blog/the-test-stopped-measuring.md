---
title: The test stopped measuring
date: 2026-07-29
summary: Frontier models clear MMLU above 99%. That is not a capability result, it is a broken instrument, and the industry has no agreed replacement.
---

MMLU was hard once. GPT-3 scored 43.9% in 2020. Frontier models in 2026 clear
**99%**, and the family is functionally saturated above 88% — meaning the gap
between the top several models is inside the noise, and every reported
difference between them is a rounding artefact presented as progress.

Andrej Karpathy has called the situation an **evaluation crisis**, and the
phrase is doing real work: it is not that models got too good, it is that we
lost the instrument and kept publishing the readings.

## Contamination is not an edge case

The obvious failure mode is that the answers were in the training data. This is
routinely dismissed as a solved hygiene problem. It is not. OpenAI's own audit
found that **every frontier model tested could reproduce verbatim gold patches
or problem statements** from certain SWE-bench Verified tasks.

SWE-bench Verified is the benchmark most people currently point to when they
want to claim a coding result is real. If contamination reaches there, it
reaches everywhere, and the correct posture toward any single reported score
is: *this is an upper bound on capability and a lower bound on memorisation,
and I cannot separate them.*

## The gap that shows up in production

The number that should end the argument comes from deployment rather than
research. Enterprise agentic systems show roughly a **37% gap between
benchmark scores and real-world performance**, with something like **50x cost
variation** between setups reaching similar accuracy.

Fifty times. On the same task. That is not a measurement of the model at all —
it is a measurement of scaffolding, retries, context handling and tool design,
none of which the benchmark touches.

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
