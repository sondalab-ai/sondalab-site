---
title: The pilot that never landed
date: 2026-07-24
summary: MIT found 95% of enterprise GenAI pilots delivered no measurable P&L impact. The report is explicit that the models were not the problem.
---

MIT's NANDA initiative went looking for enterprise return on generative AI and
came back with a number that has been repeated ever since: [**95% of pilots
delivered no measurable P&L
impact**](https://www.healthcareitnews.com/news/mit-95-enterprise-ai-pilots-fail-deliver-measurable-roi).
The study rests on 52 executive interviews, surveys of 153 leaders and analysis
of 300 public deployments, against **$30–40 billion** of enterprise spending.

A separate body of 2026 work on agent pilots specifically puts the
pilot-to-production failure rate in the high eighties. Different methods,
different definitions, same shape.

## The failure is organisational

The MIT report is unusually direct about the cause. It is not model quality. It
is the **learning gap** — generic assistants are flexible enough to be
excellent for an individual and stall inside an organisation, because they do
not learn from or adapt to a workflow that nobody encoded.

Which reframes every failure on the list. Nobody defined done, nobody gave the
system the access it needed, nobody kept checking. All three have an owner who
does not exist on the org chart.

Where returns do show up, the same report finds them in the least glamorous
place available: **back-office automation** — process streamlining, reduced
outsourcing, cost taken out. Not the demo.

## The demo trap

The mechanism is consistent and it is worth naming plainly. A pilot is graded
on **whether it can**. Production is graded on **whether it does, every time,
including Tuesday at 3am when the upstream API returns HTML instead of JSON**.

Those are different systems. The pilot is a capability demonstration built by
the enthusiast; production is a reliability engineering problem owned by whoever
carries the pager. The transition between them is where 86% of the work dies,
and it dies because nobody budgeted for the second system — they budgeted for a
better version of the first.

## What the 5% seem to do

With the usual caveat that survivor analysis is generous to survivors:

- **Narrow scope first.** One workflow, one team, one measurable before/after.
- **Instrument the run, not the answer.** If you cannot replay what the agent
  did, you cannot debug what it did wrong.
- **Give it real access early.** Half the pilots fail on permissions that were
  deferred to "phase two".
- **Assign an owner who is on call.** Not a champion — an owner.

None of this is about the model. The model has been good enough for eighteen
months. The pager has not been assigned.
