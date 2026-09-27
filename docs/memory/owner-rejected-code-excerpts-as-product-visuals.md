---
name: owner-rejected-code-excerpts-as-product-visuals
description: "Owner rejected verbatim code/terminal excerpts (\"specimens\") as the way to show tools on the site after seeing them built — hard to grasp for a visitor. Prefer real product screenshots; mock up visual proposals before building them."
metadata:
  node_type: memory
  type: feedback
  originSessionId: 8e107e5d-fcf9-4138-b549-07589b6d9890
  modified: 2026-09-26T13:42:14.511Z
---

On 2026-09-26 the owner approved "typographic specimens" (verbatim code, test
and terminal excerpts per tool) from a text description, then rejected them on
seeing the built page: "very hard to grasp its meaning". Only spexr's real
screenshots were kept (shipped in https://github.com/sondalab-ai/sondalab-site/pull/17);
the specimens branch was discarded unmerged on 2026-09-27 (last commit
f909071, recoverable from the reflog only).

**Why:** a visitor cannot tell what a tool does from a raw excerpt of its code
or config. A description of a visual approach did not let the owner judge it;
only the render did.

**How to apply:** for any visual change to the site, show a quick mockup or
throwaway render before writing the spec and plan. Don't propose code excerpts
as product imagery again; real screenshots or designed illustrations instead.
Related: [[only-spexr-has-curated-product-screenshots-spexr-docs-screen]].
