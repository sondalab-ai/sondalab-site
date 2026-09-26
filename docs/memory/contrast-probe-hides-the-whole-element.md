---
name: contrast-probe-hides-the-whole-element
description: "scripts/contrast-probe.mjs hides the target with visibility:hidden, so on a filled control (a button pill) it measures the page BEHIND the control, not its fill. For a filled control, hide only the label (color + text-shadow + --slfx-text-*-a) and sample the text Range box, adding scrollX/scrollY to the clip."
metadata:
  type: project
---

Found 2026-09-26 while measuring the product pages' glass GitHub button. The
probe reported 15:1 for a label that actually read 2.3–3.5:1 against its pill.

Three traps a pixel measurement hits here:
- `visibility: hidden` removes the fill along with the text.
- `color: transparent` leaves the kit's glass text halo (text-shadow) behind.
  Zero it, or the "background" is the halo.
- Puppeteer's `clip` is measured from the top of the document, while
  `getBoundingClientRect()` is measured from the viewport. Add
  `scrollX`/`scrollY` after scrolling, or the capture misses the target.

The probe also used to parse the computed colour's first three numbers as
sRGB; kit labels compute to `oklch()`. Fixed on 2026-09-26: the colour is now
painted on a 1px canvas and read back.
