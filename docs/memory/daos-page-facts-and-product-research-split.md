---
name: daos-page-facts-and-product-research-split
description: /daos/ is "Asking twice", a research note (not a product page); the positioning decision and the DAOS facts, checked against the daos repo, that the copy depends on.
metadata:
  type: project
---

On 2026-10-13 the owner decided DAOS has no product case, and /daos/ became "Asking twice", a plain-language research note (PR #48).
- It covers what we measured, what didn't pay off, and when you don't need DAOS.
- /products/daos/ is a short research-library entry that links to it.

Why there is no product case:
- On one machine, `temperature=0` alone gave 1 answer in 20 runs.
- The exact-input rule (a typo means a new request) rules out chat and "consistency across people".
- Testing is not a selling point.
- Nothing in the suite imports DAOS.

Code excerpts appear only when they are intelligible and show a real use (see [[owner-rejected-code-excerpts-as-product-visuals]]). The DAOS dashboard (daos repo, separate session) was advised to pause after slice 2. That is the owner's call.

Facts checked against daos origin/main:
- The Q4 lone minority is 7 of 40 fields. 9 is the count of all 2–1 splits.
- The pinned cache key holds the model sha256 and load_config, not the backend.
- Input canonicalization is JCS(NFC) only, so case, spaces inside strings and typos all make a new key.
- The signed log is opt-in (EventLog plus run_id).
- logit_pool and x-tiePrior exist only in the spec.
- The quorum was not more accurate than F16 alone: 0.3317 vs 0.3367 on 600 CLINC150 tasks, with φ up to 0.978.
- LM Studio is the only real adapter.

**Why:** simplifying the copy is exactly where claims drift, and each round with the owner changed what DAOS is presented as.
**How to apply:**
- Re-check any number or claim against the daos README and docs/daos-track-b-research.md before editing the copy.
- Check every language. scripts/daos-i18n.test.mjs checks only keys and classes; numbers need a parity script.
- Don't reintroduce product pitches or a testing use case without the owner's say.
