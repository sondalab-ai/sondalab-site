---
name: sondalab-ui-lab-probe-pages-are-classic-scripts-not-es-modul
description: "sondalab-ui lab/: probe pages are classic scripts, not ES modules — Chrome refuses import over file://, and a probe must open by double-click with nothing served. Agent-side captures need a throwaway 'python3 -m http.server' since the Chrome extension refuses file:// URLs — and it must be served from the REPO ROOT, not from lab/, because probes reference ../docs/references/assets/."
metadata: 
  node_type: memory
  loadout_kind: memory
  scope: repo
  created: 2026-09-11
  originSessionId: 9bbae2fe-85a2-4fa8-b03f-bb0afe704927
  modified: 2026-09-11T08:48:53.874Z
---

Probe pages in `sondalab-ui/lab/` are classic scripts, not ES modules: Chrome
refuses `import` over `file://`, and the whole point is that the owner opens a
probe by double-clicking it with nothing installed and nothing served.

**For agent-side captures**, the Chrome extension refuses `file://` URLs, so a
throwaway server is needed — but serve the **repository root**, not `lab/`:

```
cd sondalab-ui && python3 -m http.server 8731
# then open http://localhost:8731/lab/<slice>-<probe>.html
```

A probe's `REFERENCE.src` points at `../docs/references/assets/<capture>.png`,
which resolves only when the server's root is above both directories. Serving
`lab/` gives a 404 on the reference, and the harness then paints its loud
"reference capture missing" placeholder — which looks like a broken probe rather
than a wrong `cwd`.

Also: no `requestAnimationFrame` in a probe. See
[[claude-in-chrome-the-mcp-tab-reports-visibilitystate-hidden]] — the MCP tab is
`hidden` between tool calls, rAF freezes, and the renderer hangs. Write pointer
state straight from the event handler instead; a real `computer hover` does fire
`pointermove`, so the page stays both capturable and interactive.

For deciding whether an effect actually does anything, see
[[lab-pixdiff-toggle-one-property-and-diff-the-identical-crop]].
