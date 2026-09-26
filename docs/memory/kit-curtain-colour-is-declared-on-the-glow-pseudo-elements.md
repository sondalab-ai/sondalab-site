---
name: kit-curtain-colour-is-declared-on-the-glow-pseudo-elements
description: "@sondalab/ui-kit declares the aurora curtains' --slfx-pillar-* ON the seated glow's ::before/::after, per page theme. A rebinding set on an ancestor (e.g. .sl-invert) is never inherited. Override on the pseudo-elements, and check with npm run curtains <url>."
metadata:
  type: project
---

The kit's curtain rules (effects.css, 0.17.0 ~1591 and ~1598) set
`--slfx-pillar-a/b` and their alphas directly on
`.sl-fx-aurora__glow[data-sl-fx-seated][data-sl-fx-pillars]…::before/::after`.
A declared value beats an inherited one, so an ancestor rebinding looks
correct in the CSS and does nothing.

On 2026-09-26 this left the dark theme's stance band painting #DAE3E4
curtains on a #DAE3E4 band. Every CSS-text gate passed.

**Why:** the kit picks the curtain colour by PAGE theme, and an inversion band
flips its ground locally.

**How to apply:** override on the same pseudo-elements, repeating the kit's
busy-exemption `:not(:has(…))` clause (site.css, after `.sl-invert`). After
any kit bump, run `scripts/curtain-probe.mjs` against a served build: the kit
may change that selector, and a copied selector then becomes a silent no-op.
The upstream fix would be a consumer-rebindable point-of-use variable, like
`--slfx-text-light`.
