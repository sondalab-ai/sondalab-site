---
name: lab-pixdiff-toggle-one-property-and-diff-the-identical-crop
description: "Never decide whether a CSS effect does anything by looking at two screenshots — it failed twice in one session. Toggle ONE property, capture the identical crop, run sondalab-ui/lab/_pixdiff.py, and read the affected ROWS before naming a cause. Always take a control diff that should change nothing; 0 px proves the pipeline is noise-free and that a non-zero result elsewhere is signal."
metadata: 
  node_type: memory
  loadout_kind: memory
  scope: repo
  created: 2026-09-11
  originSessionId: 9bbae2fe-85a2-4fa8-b03f-bb0afe704927
  modified: 2026-09-11T08:49:42.770Z
---

`sondalab-ui/lab/_pixdiff.py` (pure stdlib — this machine has no Pillow):

```
python3 lab/_pixdiff.py before.png after.png [threshold]
```

It reports the differing pixel count, the max channel delta, the **row
histogram**, and whether the frame's brightest row (usually the backdrop feature
you care about — a rule, a hairline) is among the rows that moved.

**Why the row histogram is the whole point.** Reading two screenshots of a glass
button, I twice concluded the backdrop hairline "clearly bends" under it. It does
not: the diff was 45 px confined to rows 118–125 and 143–151 — the element's rim
bands — while the hairline at row 135 was bit-identical. What looks like a bend is
an alpha tint layer occluding the line, which is present in both states. Rows
clustered at an element's edges are **compositing**; rows on a backdrop feature
mean the backdrop **actually moved**.

**Always run a control.** Diff two captures that should be identical (e.g. the
same crop under a theme toggle that does not reach the component). A 0-px control
is what licenses the claim that a non-zero diff elsewhere is real rather than
capture noise.

This is the method that produced
[[backdrop-filter-url-svg-displacement-is-applied-but-inert-ch152]], and it is
how any `lab/` probe variant should be compared to its reference capture.
See [[sondalab-ui-lab-probe-pages-are-classic-scripts-not-es-modul]] for how to
serve and capture a probe in the first place.
