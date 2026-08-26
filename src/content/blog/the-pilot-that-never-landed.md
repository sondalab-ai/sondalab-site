---
title: The pilot that never landed
date: 2026-07-24
summary: Independent studies converge on 86–89% of enterprise agent pilots never reaching production. The failure modes are almost never the model.
---

Three independent studies published between January and March 2026 — from
McKinsey, Gartner and a cross-sector analysis — landed within three points of
each other: **86 to 89% of enterprise AI agent pilots never reach
production**. Deloitte's 2026 Tech Trends puts it at 89%. Forrester and
Anaconda data puts the blockers at evaluation gaps (64% of leaders),
governance friction (57%) and model reliability (51%).

When four organisations with different methods and different incentives
converge that tightly, the number is describing something structural.

## The failure is organisational

Read the root-cause breakdown of deployments that went live and returned
negative ROI at twelve months: **41% unclear success criteria**, **33%
insufficient tool or data access**, **26% drift in evaluation coverage**.

Not one of those is a model-quality problem. They are, in order: nobody defined
done, nobody gave it the permissions it needed, and nobody kept checking. Every
failure mode on that list has an owner who does not exist on the org chart.

## The demo trap

The mechanism is consistent and it is worth naming plainly. A pilot is graded
on **whether it can**. Production is graded on **whether it does, every time,
including Tuesday at 3am when the upstream API returns HTML instead of JSON**.

Those are different systems. The pilot is a capability demonstration built by
the enthusiast; production is a reliability engineering problem owned by whoever
carries the pager. The transition between them is where 86% of the work dies,
and it dies because nobody budgeted for the second system — they budgeted for a
better version of the first.

## What the 11% seem to do

From the same body of work, with the usual caveat that survivor analysis is
generous to survivors:

- **Narrow scope first.** One workflow, one team, one measurable before/after.
- **Instrument the run, not the answer.** If you cannot replay what the agent
  did, you cannot debug what it did wrong.
- **Give it real access early.** Half the pilots fail on permissions that were
  deferred to "phase two".
- **Assign an owner who is on call.** Not a champion — an owner.

None of this is about the model. The model has been good enough for eighteen
months. The pager has not been assigned.
