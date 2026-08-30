# Generating the CRT scene plates

> **What is this file.** The brief for the artwork behind the CRT tubes on
> `/blog` and `/apparel`: what the pipeline requires of an image, and a set of
> ComfyUI prompts that produce it. Audience: whoever is generating the plates
> (today: Marcello Barile, who is also the owner). Companions:
> `docs/specs/2026-08-29-crt-scenes-design.md` is the implementation contract and
> explains *why* the constraints are what they are; `docs/webgpu-surfaces.md`
> covers the WebGPU pattern underneath. The placeholder plates currently in the
> repo were drawn by `scripts/make-scene-placeholders.mjs` and are meant to be
> replaced by the output of this brief. Two generators are covered: ComfyUI, in
> prose, for producing a whole scene at once; and Ideogram 4.0, as complete JSON
> payloads, for producing one plate at a time.

## What the pipeline needs

A scene is **four separate images**, one per distance from the viewer, that the
site composites live. It is not one picture cut into pieces after the fact —
each plate slides at its own rate, so each has to be complete on its own.

Six constraints, all of them load-bearing:

1. **Grayscale, on pure black.** No colour reaches the site from a file. Hue is
   applied at runtime from `--sl-accent-default` and `--sl-accent-depth`, which
   is what keeps the scenes on palette and lets them re-tint when the theme
   changes. A coloured plate does not fail loudly — it just puts a hue on the
   page that the design system never blessed.
2. **The pixel value *is* the light.** Emissive plates are composited additively:
   a mid-grey pixel emits mid-grey. Black emits nothing, which is what serves as
   transparency — the plates carry no alpha channel and need none.
3. **Each plate stays inside its luminance budget** (table below). Four plates at
   full value clip to white the moment two of them overlap.
4. **One plate per scene is an occluder, and it is a mask, not a picture.** The
   foreground silhouette stands *in front* of the light rather than emitting it,
   so it is drawn as a pure-white shape on pure black: white where the silhouette
   is, black everywhere else, no midtones except a soft edge one or two pixels
   wide. The site subtracts it.
5. **The four plates of a scene share one camera.** Same horizon line, same
   vanishing point, same lens. They are generated separately but they have to
   line up, or the parallax reads as four unrelated pictures sliding past one
   another.
6. **2048 × 1152, exported as WebP.** Wider than any tube on the site, because
   the parallax needs slack to slide into.

### The scenes must not read as the same picture

The first pass of the placeholders failed this and it was not obvious until the
two pages were open side by side: both were built from the same skyline and
tower generators, so they read as one city with a different random seed.

The two scenes are separated on four axes, and a plate that drifts on any of them
pulls the whole scene back towards the other one:

| | `uprising` (blog) | `city` (apparel) |
|---|---|---|
| Vantage | street level, looking down a road | a rooftop, looking out and down |
| Dominant direction | horizontal — a low, wide band of light | vertical — towers filling the frame top to bottom |
| Light source | fire beyond the end of the street | windows, signage, and the wet sheen they throw |
| Subject scale | figures: people and machines at human height | architecture: nothing in frame is human-sized |

If a prompt for `uprising` produces a skyline, it is the wrong picture, however
good it looks. The same goes the other way: a person legible in `city` breaks the
scale that makes the towers read as enormous.

### Plate budgets

| Plate | Tone in `scenes.json` | Peak luminance | Coverage | Notes |
|---|---|---|---|---|
| `01-far` | `structure` | 15–20 % white | broad, low | Haze and whatever the scene's light comes from. Nothing sharp. |
| `02-mid` | `depth` | 30–35 % white | moderate | The body of the scene. Carries the accent-depth hue. |
| `03-*` | `occluder` | pure white / pure black | 25–40 % of frame | A mask. No midtones, no detail inside the shape. |
| `04-*` | `accent` | 70–85 % white | under 5 % of frame | Sparse, bright, small: embers, rain, signage. Carries the accent hue. |

The `04` plate is the only one allowed to be bright, and only because almost
none of the frame is covered. If it fills the frame, the tube blows out.

## Route A — depth-split from one master render (recommended)

Generating four independent images that share a camera is the hard part, and a
depth model solves it for free. Render the scene once, then cut it into planes.

1. **Render the master** at 2048 × 1152 with the scene prompt below.
2. **`DepthAnythingV2` → depth map.** (`ControlNet Aux` pack; MiDaS also works.)
3. **Threshold the depth map three ways** to get three bands — far, mid, near —
   with `ImageThreshold` or a `Levels` node. Feather each edge by 2–4 px so the
   planes do not read as cut-outs.
4. **Multiply the master by each band mask** → three plates.
5. **Desaturate** each plate (`ImageDesaturate`, or `Saturation 0`).
6. **Levels per plate**: black point hard to 0, white point down to the budget in
   the table. This is the step that is easy to skip and expensive to skip.
7. **The near band becomes the occluder**: throw the picture away, keep the mask.
   Push it to pure white with a levels curve.
8. **Generate `04` separately** — embers, rain, signage — on a black background,
   as its own small render or with a particle/noise node. It is sparse enough
   that it does not need to agree with the depth map.

## Route B — one plate at a time

Less coherent, more control. Use it for a plate Route A produced badly, not for
a whole scene. Every prompt below ends with the isolation clause; keep it.

Route C, below the scene descriptions, is the same idea for Ideogram 4.0, where
per-plate is the only route: structured JSON payloads, one per plate, ready to
send.

---

## Scene: `uprising` — the blog band

The archive opens on it. Nothing is read on the glass, so this scene can run at
full strength.

**Master / `01-far`** — the fire, and nothing that resembles a skyline
```
the end of a city street at night, buildings burning out of frame beyond it,
a wide low band of firelight and smoke catching the light from underneath,
monochrome, eye-level, very low horizon, no towers, no skyline, nothing tall,
volumetric haze, high contrast between light and deep black
```

**`02-mid` — the machines and the street**
```
mid-ground of a night street at eye level, humanoid machines standing among
overturned debris and barricades, hard industrial geometry, human-scale, lit only
by fires far behind them, rim light, monochrome, no colour, cinematic wide shot,
no architecture above the frame
```

**`03-crowd` — the occluder**
```
solid black silhouettes of a dense crowd of people seen from behind, shoulders
and raised arms, filling the lower third of the frame, pure white background,
no detail inside the silhouettes, high contrast stencil, vector-like edges
```
> Invert this one before export: the pipeline wants white shapes on black.

**`04-embers` — the accent**
```
sparse glowing embers and floating ash drifting upward, small bright points,
pure black background, nothing else in frame, macro particles, high contrast
```

### Alternative for the same slot: `kinship`

The other reading of the brief — people and machines working together rather
than against each other. Same four plates, same budgets; swap the files in and
change nothing else.

The same four-axis separation applies: `kinship` is an interior at eye level, lit
by one lamp, with people at human scale — it must not read as either the street
or the skyline.

```
01-far:  a quiet domestic interior at night seen from deep inside, windows
         glowing onto a still city, soft haze, monochrome, wide shot, low contrast
02-mid:  a kitchen and a long table, a humanoid machine working alongside two
         people, hands on the same task, lit by one warm lamp overhead,
         monochrome, documentary framing, natural posture, no spectacle
03-near: solid black silhouettes of a doorframe and the back of a seated figure
         in the foreground, pure white background, no interior detail
04-warm: a single lamp's bloom and the specular highlights it throws on metal and
         glass, small bright points, pure black background, nothing else in frame
```

---

## Scene: `city` — the apparel backdrop

The heading and the lede sit on this one. It runs at roughly a third intensity
and a lit panel is laid over its left side, so **keep the interest on the right
half of the frame** — the left is under type and will not be seen.

**Master / `01-far`**
```
a dense future megacity at night seen from a high rooftop, endless towers
receding into rain haze, deep atmospheric perspective, monochrome, extreme wide
shot, wet streets, dense hanging signage, volumetric haze, nothing sharp
```

**`02-mid` — the towers**
```
mid-ground of colossal residential towers, thousands of small lit windows,
hanging signage and cables between them, rain in the air, monochrome,
cinematic wide shot, strong verticals
```

**`03-near` — the occluder**
```
solid black silhouette of a rooftop edge in the foreground, antennae, vents and
railings against the sky, pure white background, no detail inside the shape,
high contrast stencil
```
> Invert before export.

**`04-rain` — the accent**
```
heavy diagonal rain streaks and distant neon signage reduced to bright vertical
strokes, small and sparse, pure black background, nothing else in frame,
high contrast
```

---

## Route C — Ideogram 4.0, one plate per request

Ideogram 4.0 accepts a **structured** prompt instead of a sentence:
`json_prompt` replaces `text_prompt` on `POST
https://api.ideogram.ai/v1/ideogram-v4/generate`, and the two are mutually
exclusive. The reason to use it here is not tidiness — **`json_prompt` disables
magic-prompt**, the rewriting layer that would otherwise put back exactly what
this pipeline forbids: colour, a named art movement, and text burned into the
frame. What is below is what the model receives.

It buys three things this brief needs and prose cannot express:

- **`color_palette`, up to 16 hex entries.** The luminance budget stops being a
  hope and becomes a number in the request. Grayscale is `R = G = B` in every
  entry; the plate's white point is the brightest entry.
- **`bbox`, four integers, normalised 0–1000, `[y_min, x_min, y_max, x_max]`
  (row first).** This is where the four-axis separation table above becomes
  enforceable: `uprising` is a low wide band, `city` fills the frame top to
  bottom, and each is stated as coordinates rather than adjectives.
- **Everything is an `obj`.** No element carries `type: "text"`, anywhere, in
  any of the payloads — which is what keeps the frames legible-free.

### What it does not buy: a shared camera

Route A splits one render with a depth map, so constraint 5 — the four plates
share one camera — holds by construction. Ideogram generates each plate as its
own image, and the first-party reference for `/v1/ideogram-v4/generate` lists
`text_prompt`, `json_prompt`, `resolution`, `rendering_speed` and
`enable_copyright_detection`; `seed` appears in the **response**, not documented
as a request field. Assume the four plates will *not* line up for free.

The mitigation is in how the payloads below are written, and it is worth keeping
if they are edited. Only two plates of a scene are views through that camera —
`01-far` and `02-mid` — and across those two the `high_level_description` and all
four `style_description` strings (`aesthetics`, `lighting`, `medium`,
`art_style`) are **byte-identical**; only `color_palette` and
`compositional_deconstruction` differ. The occluder is a flat mask and the accent
plate is a scatter on empty black — neither is a view of anything, so each keeps
its own style block and neither has a horizon to disagree with. Expect to
regenerate a plate or two until the horizon agrees; Route A remains the
recommended way to produce a whole scene, and Route C the better way to produce
one plate.

### The request envelope

The 12 payloads below are the value of `json_prompt` only. Everything around it
is the envelope, and it is the part to check against the live reference before
the first call — the enum strings are versioned and every third-party host
(fal, Runware, Together) renames them:

```jsonc
{
  "json_prompt": { /* one payload from below */ },
  "resolution": "2560x1440",   // 16:9 at 2K — verify the exact enum string
  "rendering_speed": "QUALITY" // TURBO | DEFAULT/BALANCED | QUALITY — sources
                               // disagree on the middle name; FLASH 400s today
}
```

with `Api-Key: <key>` as a header. **2560 × 1440 is not the export size**: it is
16:9, the same as the 2048 × 1152 the pipeline wants, so downscale by 0.8 on the
way out. That step is in the checklist below.

### There is no negative prompt

Ideogram 4.0 takes a positive prompt only. Every exclusion in the negative block
further down has to land somewhere positive instead, and in these payloads it
does:

| What the negative prompt used to forbid | Where it lands now |
|---|---|
| colour, saturation, sepia, tint | `color_palette` is grayscale-only; `medium` says monochrome |
| text, watermark, logo, caption, ui | every element is `type: "obj"`; no `text` element exists |
| grey or white background | `background` states pure black, and `#000000` is in the palette |
| blur, depth of field, bokeh | stated in `lighting` and `medium` |
| low contrast, flat lighting | stated in `aesthetics` |
| skyline and towers in `uprising` | **cannot be a negation** — it is a `bbox` that leaves no room for one |

That last row is the one to watch. A `bbox` that contradicts the four-axis table
is how the two scenes drift back into being the same picture.

### Schema, and why the key order is not cosmetic

`high_level_description` → `style_description` → `compositional_deconstruction`,
of which only the last is required. Inside `style_description`:
`aesthetics` → `lighting` → `medium` → `art_style` → `color_palette` — the
non-photo order, which is what these scenes are; the photo path swaps in `photo`
and orders it `aesthetics → lighting → photo → medium`. Inside
`compositional_deconstruction`: `background` first, then `elements`. Each element
is `type` → `bbox` → `desc` → `color_palette`. Ideogram trained on captions with
a fixed key order and the model is sensitive to it, so keep the order when
editing rather than letting a formatter sort the keys.

`color_palette` is guidance, not a contract. The model will overshoot the white
point. **The Levels step in the pre-export checklist stays mandatory** — the
palette makes it a small correction instead of a large one.

---

### `uprising` payloads

**`01-far`** — the firelight, and no skyline. The band is pinned to the bottom
40 % of the frame; there is nothing above it but smoke.

```json
{
  "high_level_description": "The end of a city street at night, seen at eye level from the middle of the road, lit only by fires burning out of frame beyond the far end. Monochrome, rendered on pure black.",
  "style_description": {
    "aesthetics": "stark documentary realism, unglamorous, extreme contrast between light and deep crushed black, monochrome, no colour of any kind",
    "lighting": "a single source of firelight beyond the end of the street, low and far away, throwing hard rim light towards the camera, heavy volumetric smoke, no fill light, everything in perfect focus, no depth of field, no bokeh, no blur",
    "medium": "monochrome digital matte painting on a pure black ground, greyscale only, no paper texture, no film grain",
    "art_style": "cinematic concept art, eye-level anamorphic wide shot, very low horizon, strongly horizontal composition",
    "color_palette": ["#000000", "#0A0A0A", "#1A1A1A", "#2E2E2E"]
  },
  "compositional_deconstruction": {
    "background": "pure black, absolutely empty above the smoke line, no sky detail, no stars, no buildings, no towers, no structures of any height",
    "elements": [
      {
        "type": "obj",
        "bbox": [620, 0, 900, 1000],
        "desc": "a wide, low, continuous band of firelight lying along the far end of the street, spanning the full width of the frame, brightest at its centre, dimming to nothing at both edges, soft-edged, no flame shapes readable",
        "color_palette": ["#1A1A1A", "#2E2E2E"]
      },
      {
        "type": "obj",
        "bbox": [280, 0, 660, 1000],
        "desc": "thick smoke drifting upward off the fire and catching its light from underneath, dense and low, thinning to pure black well before the top of the frame",
        "color_palette": ["#000000", "#0A0A0A", "#1A1A1A"]
      },
      {
        "type": "obj",
        "bbox": [700, 0, 1000, 1000],
        "desc": "the wet road surface in the near foreground picking up a faint reflection of the fire, flat and horizontal, very dark",
        "color_palette": ["#000000", "#0A0A0A"]
      }
    ]
  }
}
```

**`02-mid`** — the machines and the street. Human scale is the whole point: the
machines are a head and a half taller than a person, not architecture.

```json
{
  "high_level_description": "The end of a city street at night, seen at eye level from the middle of the road, lit only by fires burning out of frame beyond the far end. Monochrome, rendered on pure black.",
  "style_description": {
    "aesthetics": "stark documentary realism, unglamorous, extreme contrast between light and deep crushed black, monochrome, no colour of any kind",
    "lighting": "a single source of firelight beyond the end of the street, low and far away, throwing hard rim light towards the camera, heavy volumetric smoke, no fill light, everything in perfect focus, no depth of field, no bokeh, no blur",
    "medium": "monochrome digital matte painting on a pure black ground, greyscale only, no paper texture, no film grain",
    "art_style": "cinematic concept art, eye-level anamorphic wide shot, very low horizon, strongly horizontal composition",
    "color_palette": ["#000000", "#141414", "#2E2E2E", "#545454"]
  },
  "compositional_deconstruction": {
    "background": "pure black, empty, no architecture, no walls, no towers, nothing occupying the upper half of the frame",
    "elements": [
      {
        "type": "obj",
        "bbox": [430, 60, 880, 940],
        "desc": "a row of humanoid machines standing in the middle distance across the road, roughly a head and a half taller than a person, two legs, a blocky torso, a small offset head, hard industrial geometry, lit only along their edges by the fire behind them, bodies otherwise black",
        "color_palette": ["#141414", "#2E2E2E", "#545454"]
      },
      {
        "type": "obj",
        "bbox": [620, 0, 960, 1000],
        "desc": "overturned debris and improvised barricades built across the street, angled slabs and tipped vehicles, rim-lit from behind, no detail on the near faces",
        "color_palette": ["#141414", "#2E2E2E"]
      },
      {
        "type": "obj",
        "bbox": [560, 0, 720, 1000],
        "desc": "the low silhouetted edge of single-storey street frontage running away from the camera on both sides, nothing taller than the machines, no upper floors, no skyline",
        "color_palette": ["#000000", "#141414"]
      }
    ]
  }
}
```

**`03-crowd`** — the occluder. A mask, not a picture: white shapes on pure
black, no midtones.

```json
{
  "high_level_description": "A stencil mask: solid white silhouettes of a dense crowd seen from behind, on a pure black ground. Two tones only.",
  "style_description": {
    "aesthetics": "hard-edged high contrast stencil, two tones only, absolutely no midtones, no shading, no gradient",
    "lighting": "none, this is a flat mask and not a lit scene, no shadows, no depth of field, no blur",
    "medium": "flat two-tone vector stencil, pure white shapes on a pure black ground",
    "art_style": "silhouette matte, clean unbroken outlines, no interior detail whatsoever",
    "color_palette": ["#000000", "#FFFFFF"]
  },
  "compositional_deconstruction": {
    "background": "pure black, completely flat and empty, value zero everywhere the silhouettes are not",
    "elements": [
      {
        "type": "obj",
        "bbox": [620, 0, 1000, 1000],
        "desc": "a dense crowd of people seen from behind, heads, shoulders and raised arms overlapping into one continuous solid white shape, filling the lower third of the frame across its full width, ragged along its top edge, completely flat white inside with no faces, no clothing and no separation between figures",
        "color_palette": ["#FFFFFF"]
      }
    ]
  }
}
```
> Check the polarity of what comes back. The pipeline wants **white on black**;
> if the model insists on the conventional black-on-white silhouette, invert
> before export.

**`04-embers`** — the accent. The only bright plate, and only because almost
nothing is in it. No `bbox`: the scatter is the point, and a full-frame box
would say nothing.

```json
{
  "high_level_description": "Sparse glowing embers and floating ash drifting upward through empty darkness. Monochrome, on pure black, nothing else in frame.",
  "style_description": {
    "aesthetics": "sparse, minimal, extreme contrast, isolated bright points against absolute black, monochrome",
    "lighting": "the particles are the only light and are self-luminous, no ambient light, no glow spill beyond a pixel or two, everything sharp, no depth of field, no bokeh, no blur",
    "medium": "monochrome digital matte painting on a pure black ground, greyscale only, no film grain",
    "art_style": "macro particle study, isolated elements, empty composition",
    "color_palette": ["#000000", "#3D3D3D", "#8A8A8A", "#CCCCCC"]
  },
  "compositional_deconstruction": {
    "background": "pure black, completely empty, no scene, no horizon, no smoke, no context of any kind",
    "elements": [
      {
        "type": "obj",
        "desc": "a scattering of small bright embers rising on a draught, irregularly spaced, denser towards the lower half and thinning out towards the top, each one a hard point a few pixels across, covering well under five percent of the frame in total",
        "color_palette": ["#8A8A8A", "#CCCCCC"]
      },
      {
        "type": "obj",
        "desc": "a few larger flakes of ash tumbling among them, slightly dimmer than the embers, still small and sparse",
        "color_palette": ["#3D3D3D", "#8A8A8A"]
      }
    ]
  }
}
```

---

### `city` payloads

Keep the interest on the **right half of the frame** — the left is under type.
The `bbox` values below already do this; preserve it when editing.

**`01-far`**

```json
{
  "high_level_description": "A dense future megacity at night seen from a high rooftop, looking out and slightly down over endless towers receding into rain haze. Monochrome, rendered on pure black.",
  "style_description": {
    "aesthetics": "oppressive scale, dense and vertical, extreme contrast between lit windows and deep crushed black, monochrome, no colour of any kind",
    "lighting": "thousands of small window lights and hanging signage glowing through rain haze, no sun, no moon, no sky light, strong atmospheric falloff with distance, everything in focus, no depth of field, no bokeh, no blur",
    "medium": "monochrome digital matte painting on a pure black ground, greyscale only, no paper texture, no film grain",
    "art_style": "cinematic concept art, high rooftop vantage looking out and slightly down, strongly vertical composition, extreme wide shot",
    "color_palette": ["#000000", "#0A0A0A", "#1A1A1A", "#2E2E2E"]
  },
  "compositional_deconstruction": {
    "background": "pure black, no sky detail, no stars, no moon, no horizon glow",
    "elements": [
      {
        "type": "obj",
        "bbox": [80, 0, 860, 1000],
        "desc": "innumerable distant towers receding layer behind layer into haze, each one reduced to a soft vertical block of dimly glowing haze with no readable windows, densest and tallest towards the right of the frame, nothing sharp anywhere",
        "color_palette": ["#0A0A0A", "#1A1A1A", "#2E2E2E"]
      },
      {
        "type": "obj",
        "bbox": [400, 0, 900, 1000],
        "desc": "a broad bank of rain haze lying across the middle distance, catching the collective light of the city from below and diffusing it",
        "color_palette": ["#000000", "#1A1A1A"]
      }
    ]
  }
}
```

**`02-mid`** — the towers, floor to ceiling. Vertical dominance is what
separates this scene from `uprising`, so the `bbox` spans the full frame height.

```json
{
  "high_level_description": "A dense future megacity at night seen from a high rooftop, looking out and slightly down over endless towers receding into rain haze. Monochrome, rendered on pure black.",
  "style_description": {
    "aesthetics": "oppressive scale, dense and vertical, extreme contrast between lit windows and deep crushed black, monochrome, no colour of any kind",
    "lighting": "thousands of small window lights and hanging signage glowing through rain haze, no sun, no moon, no sky light, strong atmospheric falloff with distance, everything in focus, no depth of field, no bokeh, no blur",
    "medium": "monochrome digital matte painting on a pure black ground, greyscale only, no paper texture, no film grain",
    "art_style": "cinematic concept art, high rooftop vantage looking out and slightly down, strongly vertical composition, extreme wide shot",
    "color_palette": ["#000000", "#141414", "#2E2E2E", "#545454"]
  },
  "compositional_deconstruction": {
    "background": "pure black between and behind the towers, no sky, nothing legible in the gaps",
    "elements": [
      {
        "type": "obj",
        "bbox": [0, 300, 1000, 1000],
        "desc": "colossal residential towers running the full height of the frame, top edge cropped off, thousands of small lit windows in irregular grids, weathered slab construction, concentrated on the right two thirds of the frame",
        "color_palette": ["#141414", "#2E2E2E", "#545454"]
      },
      {
        "type": "obj",
        "bbox": [0, 0, 1000, 340],
        "desc": "a single tower face closest to the camera on the far left, only partly in frame, its windows dimmer and more widely spaced, mostly in shadow",
        "color_palette": ["#000000", "#141414"]
      },
      {
        "type": "obj",
        "bbox": [180, 340, 760, 1000],
        "desc": "hanging signage boards, gantries and slack cables strung between the towers, unreadable, no letters or characters of any kind on them, silhouetted against the lit facades behind",
        "color_palette": ["#141414", "#2E2E2E"]
      }
    ]
  }
}
```

**`03-near`** — the occluder.

```json
{
  "high_level_description": "A stencil mask: the solid white silhouette of a rooftop edge with antennae and vents, on a pure black ground. Two tones only.",
  "style_description": {
    "aesthetics": "hard-edged high contrast stencil, two tones only, absolutely no midtones, no shading, no gradient",
    "lighting": "none, this is a flat mask and not a lit scene, no shadows, no depth of field, no blur",
    "medium": "flat two-tone vector stencil, pure white shapes on a pure black ground",
    "art_style": "silhouette matte, clean unbroken outlines, no interior detail whatsoever",
    "color_palette": ["#000000", "#FFFFFF"]
  },
  "compositional_deconstruction": {
    "background": "pure black, completely flat and empty, value zero everywhere the silhouette is not",
    "elements": [
      {
        "type": "obj",
        "bbox": [660, 0, 1000, 1000],
        "desc": "the near parapet of a rooftop running across the full width of the bottom of the frame, a solid unbroken white band, flat white inside with no surface detail",
        "color_palette": ["#FFFFFF"]
      },
      {
        "type": "obj",
        "bbox": [240, 40, 700, 420],
        "desc": "antennae, ducting and railings rising off the parapet on the left, thin hard-edged white shapes against the black, joined to the band below them",
        "color_palette": ["#FFFFFF"]
      }
    ]
  }
}
```
> Invert if the model returns black-on-white.

**`04-rain`** — the accent.

```json
{
  "high_level_description": "Heavy diagonal rain streaks and a few distant signage lights reduced to bright vertical strokes, on pure black, nothing else in frame. Monochrome.",
  "style_description": {
    "aesthetics": "sparse, minimal, extreme contrast, isolated bright strokes against absolute black, monochrome",
    "lighting": "the streaks are the only light and are self-luminous, no ambient light, no glow spill, everything sharp, no depth of field, no bokeh, no blur",
    "medium": "monochrome digital matte painting on a pure black ground, greyscale only, no film grain",
    "art_style": "isolated element study, empty composition",
    "color_palette": ["#000000", "#3D3D3D", "#8A8A8A", "#CCCCCC"]
  },
  "compositional_deconstruction": {
    "background": "pure black, completely empty, no city, no towers, no horizon, no context of any kind",
    "elements": [
      {
        "type": "obj",
        "desc": "fine diagonal rain streaks falling steeply from upper left to lower right, thin and broken, widely spaced, covering only a small fraction of the frame",
        "color_palette": ["#3D3D3D", "#8A8A8A"]
      },
      {
        "type": "obj",
        "bbox": [260, 600, 720, 940],
        "desc": "a handful of distant signage lights reduced to short bright vertical strokes, hanging at different heights on the right of the frame, abstract marks with no letters or characters, very small",
        "color_palette": ["#8A8A8A", "#CCCCCC"]
      }
    ]
  }
}
```

---

### `kinship` payloads — the alternative blog scene

An interior at eye level, one lamp, people at human scale. It must not read as
either the street or the skyline.

**`01-far`**

```json
{
  "high_level_description": "A quiet domestic interior at night seen from deep inside the room, its windows glowing faintly onto a still city beyond. Monochrome, rendered on pure black.",
  "style_description": {
    "aesthetics": "quiet domestic realism, warm and unhurried, restrained contrast, deep blacks, monochrome, no colour of any kind",
    "lighting": "one overhead lamp above a table out of frame, soft falloff into darkness, windows glowing faintly from the city behind them, no other source, everything in focus, no depth of field, no bokeh, no blur",
    "medium": "monochrome digital matte painting on a pure black ground, greyscale only, no paper texture, no film grain",
    "art_style": "cinematic concept art, interior eye-level medium wide shot, documentary framing, natural unstaged composition",
    "color_palette": ["#000000", "#0A0A0A", "#1A1A1A", "#2E2E2E"]
  },
  "compositional_deconstruction": {
    "background": "pure black, the unlit depth of the room, no detail",
    "elements": [
      {
        "type": "obj",
        "bbox": [160, 80, 700, 920],
        "desc": "a bank of tall windows across the far wall, each pane a soft dim rectangle of light, the city beyond them reduced to indistinct low blocks with no towers and nothing sharp",
        "color_palette": ["#1A1A1A", "#2E2E2E"]
      },
      {
        "type": "obj",
        "bbox": [80, 0, 900, 1000],
        "desc": "faint haze in the room's air softening the light coming off the windows, very low contrast",
        "color_palette": ["#000000", "#0A0A0A"]
      }
    ]
  }
}
```

**`02-mid`**

```json
{
  "high_level_description": "A quiet domestic interior at night seen from deep inside the room, its windows glowing faintly onto a still city beyond. Monochrome, rendered on pure black.",
  "style_description": {
    "aesthetics": "quiet domestic realism, warm and unhurried, restrained contrast, deep blacks, monochrome, no colour of any kind",
    "lighting": "one overhead lamp above a table out of frame, soft falloff into darkness, windows glowing faintly from the city behind them, no other source, everything in focus, no depth of field, no bokeh, no blur",
    "medium": "monochrome digital matte painting on a pure black ground, greyscale only, no paper texture, no film grain",
    "art_style": "cinematic concept art, interior eye-level medium wide shot, documentary framing, natural unstaged composition",
    "color_palette": ["#000000", "#141414", "#2E2E2E", "#545454"]
  },
  "compositional_deconstruction": {
    "background": "pure black beyond the reach of the lamp, no walls, no furniture in the darkness",
    "elements": [
      {
        "type": "obj",
        "bbox": [420, 60, 940, 940],
        "desc": "a long kitchen table lit from directly above, its surface the brightest thing in the plate, plates and tools laid across it",
        "color_palette": ["#2E2E2E", "#545454"]
      },
      {
        "type": "obj",
        "bbox": [300, 380, 900, 640],
        "desc": "a humanoid machine standing at the table, the same height as the people beside it, plain functional construction, hands down on the same task as theirs, no spectacle, no menace",
        "color_palette": ["#141414", "#2E2E2E", "#545454"]
      },
      {
        "type": "obj",
        "bbox": [320, 100, 920, 380],
        "desc": "two people working at the table alongside it, seen three-quarters from behind, ordinary clothes, relaxed posture, faces not visible",
        "color_palette": ["#141414", "#2E2E2E"]
      }
    ]
  }
}
```

**`03-near`** — the occluder.

```json
{
  "high_level_description": "A stencil mask: the solid white silhouettes of a doorframe and the back of a seated figure, on a pure black ground. Two tones only.",
  "style_description": {
    "aesthetics": "hard-edged high contrast stencil, two tones only, absolutely no midtones, no shading, no gradient",
    "lighting": "none, this is a flat mask and not a lit scene, no shadows, no depth of field, no blur",
    "medium": "flat two-tone vector stencil, pure white shapes on a pure black ground",
    "art_style": "silhouette matte, clean unbroken outlines, no interior detail whatsoever",
    "color_palette": ["#000000", "#FFFFFF"]
  },
  "compositional_deconstruction": {
    "background": "pure black, completely flat and empty, value zero everywhere the silhouettes are not",
    "elements": [
      {
        "type": "obj",
        "bbox": [0, 0, 1000, 1000],
        "desc": "a doorframe seen from just outside the room, forming a solid white border around all four edges of the frame with a large empty black opening in the middle, flat white with no moulding detail",
        "color_palette": ["#FFFFFF"]
      },
      {
        "type": "obj",
        "bbox": [480, 580, 1000, 940],
        "desc": "the back of a seated figure in the near foreground on the right, head and shoulders only, one continuous solid white shape with no hair, clothing or feature detail",
        "color_palette": ["#FFFFFF"]
      }
    ]
  }
}
```
> Invert if the model returns black-on-white.

**`04-warm`** — the accent.

```json
{
  "high_level_description": "A single lamp's bloom and the small specular highlights it throws on metal and glass, on pure black, nothing else in frame. Monochrome.",
  "style_description": {
    "aesthetics": "sparse, minimal, extreme contrast, isolated bright points against absolute black, monochrome",
    "lighting": "the lamp and its highlights are the only light and are self-luminous, no ambient light, no spill beyond a tight falloff, everything sharp, no depth of field, no bokeh, no blur",
    "medium": "monochrome digital matte painting on a pure black ground, greyscale only, no film grain",
    "art_style": "isolated element study, empty composition",
    "color_palette": ["#000000", "#3D3D3D", "#8A8A8A", "#CCCCCC"]
  },
  "compositional_deconstruction": {
    "background": "pure black, completely empty, no room, no table, no context of any kind",
    "elements": [
      {
        "type": "obj",
        "bbox": [120, 380, 460, 640],
        "desc": "a single small lamp bloom high in the frame, a bright core with a tight falloff, no visible fixture around it",
        "color_palette": ["#8A8A8A", "#CCCCCC"]
      },
      {
        "type": "obj",
        "bbox": [500, 200, 900, 860],
        "desc": "a scattering of small specular highlights on metal and glass below it, short hard glints, widely spaced, covering only a small fraction of the frame",
        "color_palette": ["#3D3D3D", "#8A8A8A"]
      }
    ]
  }
}
```

### Checking a payload before spending a call

Five invariants, all of them cheap to verify and all of them expensive to miss:

- [ ] It parses as JSON.
- [ ] No element anywhere has `type: "text"`.
- [ ] Every hex is grey: `R = G = B`.
- [ ] The brightest hex matches the plate's row in the budget table —
      `01-far` `#2E2E2E`, `02-mid` `#545454`, `03-*` `#FFFFFF`, `04-*` `#CCCCCC`.
- [ ] Key order is the one above, in every object.
- [ ] For `01-far` and `02-mid` of the same scene, `high_level_description` and
      the four `style_description` strings are byte-identical.

---

## Negative prompt (all plates) — ComfyUI only

```
text, letters, words, watermark, signature, logo, caption, subtitle, ui, hud,
frame, border, vignette, colour, colored, saturated, sepia, blue tint,
low contrast, flat lighting, grey background, white background, blur,
depth of field, bokeh, people in the foreground, close-up face
```

`white background` stays in the negative for the emissive plates and comes
**out** for the occluder plates, which want exactly that.

Ideogram 4.0 has no negative prompt at all. Route C carries these exclusions as
positive statements instead; the table in that section says where each one went.

## Before export — checklist

- [ ] Desaturated. Sample three pixels and confirm R = G = B.
- [ ] Black point is genuinely 0. A background at value 8 is a grey wash across
      the whole tube once the shader lifts it.
- [ ] White point is at the plate's budget from the table above.
- [ ] The occluder has no midtones except a 1–2 px edge.
- [ ] 2048 × 1152. Ideogram's 16:9 plates come back at 2560 × 1440 — the same
      aspect ratio, so downscale by 0.8 rather than cropping.
- [ ] Nothing legible: no text survived, in any plate.

## Installing the plates

Filenames are fixed — they are referenced by `src/lib/scenes.json`.

```
public/scenes/uprising/01-far.webp
public/scenes/uprising/02-mid.webp
public/scenes/uprising/03-crowd.webp
public/scenes/uprising/04-embers.webp
public/scenes/city/01-far.webp
public/scenes/city/02-mid.webp
public/scenes/city/03-near.webp
public/scenes/city/04-rain.webp
```

Then rebuild the flattened composite that visitors without WebGPU download, and
re-check the pages:

```sh
npm run scenes:flats
npm run build
npm run contrast -- http://localhost:4321/apparel/ .ap-open__h .ap-open__lede
```

The contrast check is not optional on `/apparel`: the heading and the lede sit on
the glass, and a brighter plate than the placeholder will move those numbers. The
floors are 3:1 for the heading and 4.5:1 for the lede.

Using the `kinship` set instead of `uprising` means renaming its files to the
`uprising/*` paths, or adding a `kinship` entry to `src/lib/scenes.json` and
pointing `src/pages/blog/[...page].astro` at it.

## Open: the paginated archive

Every page of `/blog` currently shows the same scene — `/blog/2/` gets the band
`/blog/` has. Giving each page its own would mean one more scene per page of
archive, which grows with the post count. If it is wanted, the cheapest version
is a small pool cycled by page number rather than one scene per page.
