---
title: Nobody signed the picture
date: 2026-06-12
summary: Content Credentials became the obvious way to satisfy the EU's labelling rules. It still cannot tell you anything about an unsigned file — and a signed one is not proof either.
---

C2PA — [Content
Credentials](https://en.wikipedia.org/wiki/Content_Credentials) — does
something narrow and does it well. It binds **cryptographically signed
provenance metadata** to a media file: who made it, when, with what tool,
whether a model was involved, and every meaningful edit since capture. Its AI
assertion type maps cleanly onto the EU AI Act's Article 50 labelling duty that
became enforceable in August, and a conformance programme has been pulling in
implementers since 2025 — Google in August of that year, the IPTC in April
2026.

Regulatory pull is the strongest adoption force this standard has ever had. It
is still not enough, for two reasons: one structural, one that has already
happened.

## The asymmetry that breaks it

A valid credential proves something. **A missing credential proves nothing.**

Absence of provenance is the default state of essentially all media in
circulation. It is also what you get from: a screenshot, a re-encode, a
platform that strips metadata on upload, a phone from 2019, a scanner, a fax, a
crop in a tool that never joined the coalition, or an attacker who simply did
not sign.

So the verification question can never be "is this credentialed" — it is "is
this credentialed **and did I have a prior expectation that it would be**".
That prior only exists inside closed pipelines: a newsroom's own cameras, a
studio's own render farm, an insurer's own claims app. Inside those, C2PA is
genuinely excellent. Outside them, it is a green tick that most true things
will never earn.

## And a valid credential proves less than it looks like

In August 2025 a Nikon firmware update exposed a flaw that let a user **combine
unauthentic images with authentic photos and still produce a file carrying a
valid signature**. Nikon revoked the certificates.

That is the failure mode that should worry anyone treating the green tick as an
answer. The signature attests that a specific device asserted a specific
history. It does not attest that the history is true — only that the device
said so, and devices are firmware, and firmware has bugs. Chain of custody is a
statement about process integrity, and process integrity is exactly what an
attacker attacks.

## What it is actually for

Stop thinking of it as a detector. It is a **chain of custody**, and chains of
custody have always worked the same way: they raise the cost of a specific lie
inside a specific system, and say nothing about the world.

That is worth building. It is not worth pretending it is deepfake detection,
because the failure mode of that pretence is the dangerous one — a public
trained to read "no credential" as "fake" will disbelieve every real photograph
taken by anyone without an enterprise imaging workflow.

## The version that would work

Signing at capture, in hardware, by default, in every phone — with the signature
surviving the ordinary edits people actually perform. That is a decade of
platform coordination and a set of privacy questions nobody has answered, since
a signature that proves provenance also proves presence.

We will get the labelling requirement first and the infrastructure later. That
order is backwards, and it is the order we are going to get.
