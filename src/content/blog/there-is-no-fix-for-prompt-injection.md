---
title: There is no fix for prompt injection
date: 2026-07-10
summary: Adaptive attacks bypass essentially every published defence. Five Eyes issued joint guidance in May. The honest architecture assumes the injection lands.
---

Palo Alto's Unit 42 documented [the first real-world indirect prompt injection
in the wild](https://unit42.paloaltonetworks.com/ai-agent-prompt-injection/) in
December 2025, cataloguing 22 distinct payload techniques observed in
production. Since then the pattern has been found against Slack AI, Microsoft
365 Copilot, Cursor, GitHub's MCP integration and a long tail of coding
assistants. Microsoft's security team documented [RCE in agent
frameworks](https://www.microsoft.com/en-us/security/blog/2026/05/07/prompts-become-shells-rce-vulnerabilities-ai-agent-frameworks/)
where prompts became shells.

At Black Hat this month, browser-integrated assistants from major vendors were
shown still vulnerable *despite* layered guardrails. Dark Reading's summary was
blunt: [no perfect
fix](https://www.darkreading.com/application-security/no-perfect-fix-ai-browser-prompt-injection-flaws).

## Why it does not patch

An injection is not a bug in a parser. It is the system working: the model was
built to follow instructions in text, and the attacker put instructions in
text. There is no lexical boundary between "content to reason about" and
"orders to obey" because **the model has no type system**. Every published
defence — delimiters, spotlighting, classifiers, instruction hierarchies —
raises cost, and adaptive attacks have bypassed essentially all of them.

In May, CISA, NSA and their UK, Canadian, Australian and New Zealand
counterparts issued joint guidance on agentic AI. When Five Eyes writes a
document about a class of attack, the debate about whether it is theoretical is
over.

## The architecture that survives it

Stop asking whether the injection lands. Assume it landed on your worst day and
design backwards:

- **Least privilege, per task.** An agent reading a webpage should hold no
  credential that could matter if the webpage owned it.
- **Separate the reader from the actor.** The context that touches untrusted
  text should not be the context that holds the write token.
- **Confirm side effects out of band.** Anything irreversible — payment, mail,
  delete, deploy — goes through a human or a second channel the injection
  cannot reach.
- **Log the whole run.** Post-incident, the only thing that helps is being able
  to replay exactly what the agent read and what it then decided.

None of that prevents the injection. All of it bounds the blast radius, which
is the only thing security has ever actually done.

Treat every agent as a confused deputy with your credentials, because that is
exactly what it is.
