---
name: daos-page-facts-and-product-research-split
description: /daos/ copy rules (plain language, shipped vs research split) and the DAOS facts verified against the daos repo that the copy depends on.
metadata:
  type: project
---

Owner (2026-10-13) wants /daos/ in plain, concrete language, with everything not shipped kept only in §06 "Research · not in the product". The brain section stays there because it is the spec's design; each card is marked as not built, measured or rejected. Code excerpts appear only when a visitor can read them and they show a real use; each is tagged "Real output" or "The commands" (see [[owner-rejected-code-excerpts-as-product-visuals]]).

Facts checked against daos origin/main:
- The Q4 lone minority is 7 of 40 fields. 9 is the count of all 2–1 splits, and the old page wrongly said 9.
- The pinned cache key holds the model sha256 and load_config, not the backend.
- The signed log is opt-in: it needs an EventLog and a run_id.
- logit_pool and x-tiePrior exist only in the spec.
- The quorum was not more accurate than F16 alone (φ up to 0.978).

**Why:** the first port was jargon-heavy, and simplifying it is where claims tend to drift.
**How to apply:** re-verify any number or claim against the daos README and docs/daos-track-b-research.md before editing the copy, and check every language (scripts/daos-i18n.test.mjs checks only keys and classes).
