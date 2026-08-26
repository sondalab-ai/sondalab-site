---
title: The loophole has an address
date: 2026-08-17
summary: You cannot ship the chip to Beijing. Nothing stops Beijing from renting time on the chip in Singapore. Washington has noticed, and the fix is harder than the ban.
---

Export control on silicon assumes a border a physical object crosses. That
assumption held for about three years.

The policy itself has whipsawed. In January 2026 Commerce published a rule
permitting sales of **H200-class chips to China**, loosening a ban that had
stood since 2023. By late May, new rules pulled the most advanced Blackwell
parts back behind a licence requirement for any transfer to entities
headquartered in China or Macau. Cap here, exemption there, reversal next
quarter.

None of it addresses the actual mechanism. CNBC reported in August that Chinese
AI firms are [reaching Nvidia compute through data centres in Southeast
Asia](https://www.cnbc.com/2026/08/19/china-ai-nvidia-chips-us-export-controls.html)
— hardware that never leaves an allied jurisdiction, accessed over a network
by a customer the rule was written to exclude.

## Why this is structurally hard

A GPU is a thing. **Time on a GPU is a service.** Export control law is very
good at things and has almost no vocabulary for services. The proposed Remote
Access Security Act would extend controls to cloud-based access of restricted
hardware, which is the right instinct and an enforcement nightmare:

- **Attribution.** Who is the customer, when the customer is an account?
- **Jurisdiction.** Whose law binds a datacentre in a third country renting to
  a shell?
- **Verification.** What does an inspector inspect — a rack, or a log?

Every one of those problems is the same problem: **the thing being controlled
stopped having a location.**

## The part that should worry you either way

Whichever side of the policy you sit on, notice what the argument concedes.
Both camps now agree that access to concentrated compute is the strategic
asset — not the model, not the data, not the talent. Compute is treated as
enriched uranium with a REST API.

That framing will outlive this administration and this rule. And it points
somewhere uncomfortable for everyone downstream: if compute is a controlled
substance, the licence to think at scale becomes something governments issue.

Run something locally this week. Not as a protest — as a habit worth having
before the habit becomes paperwork.
