---
name: the-mcp-tab-is-hidden-so-raf-and-intersectionobserver-never
description: A tab driven by the Claude-in-Chrome extension reports visibilityState "hidden", so requestAnimationFrame and IntersectionObserver never fire in it. Anything gated on either renders nothing and looks broken. Drive those paths by hand and say in the report that they were forced, not observed.
metadata:
  node_type: memory
  loadout_kind: memory
  scope: repo
  created: 2026-09-11
---

Measured on 2026-09-11: `document.visibilityState` is `"hidden"` and
`document.hasFocus()` is `false` in the extension's tab, whatever is on screen.

Two consequences, both of which cost a wrong diagnosis in one session:

- **requestAnimationFrame never runs.** `sondalab-ui`'s pane loop
  (`integratePane`) is a rAF loop, so `--slfx-lit` stays unset, the tier-2
  `draw()` is never called, and the tier label reads TIER 1 forever. It looks
  exactly like a GPU path that failed to boot.
- **IntersectionObserver never delivers.** `mountGpu()` tracks backdrop panes
  lazily as they scroll into view; in this tab nothing is ever "in view", so no
  pane gets its canvas and the material is simply absent.

**What to do instead.** Import the module and call the entry point yourself —
`bootLight({canvas, state, geom, tokens})` then `handle.track(el)` — rather than
waiting for the page to do it. Then SAY SO in the report: the path was forced,
not observed, and a real tab is still the only place it has been seen start on
its own.

Related: [[lab-pixdiff-toggle-one-property-and-diff-the-identical-crop]] — the
same session's other source of false readings was the measuring column, not the
material. And `python3 -m http.server` sends no cache headers, so Chrome serves
a stale stylesheet beside fresh JS; `lab/_serve.py` exists because that produced
two more false readings. Use it, not the stdlib server.
