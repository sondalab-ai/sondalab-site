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

These are the **dark set's** numbers, and they are emission. The light set is
ink on paper and has its own table under *Route D — light plate budgets*; the
two do not convert into one another.

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

> The payloads below are the **dark theme's** night. The light theme has its own
> set, authored as daylight, under *Route D* — a night laid down as ink prints as
> a tonal negative, which is a picture problem and not an exposure one.

Ideogram 4.0 accepts a **structured** prompt instead of a sentence:
`json_prompt` replaces `text_prompt` on `POST
https://api.ideogram.ai/v1/ideogram-v4/generate`, and the two are mutually
exclusive. The reason to use it here is not tidiness — **`json_prompt` disables
magic-prompt**, the rewriting layer that would otherwise put back exactly what
this pipeline forbids: colour, a named art movement, and text burned into the
frame. What is below is what the model receives.

> **The payload does not set the frame shape.** Ideogram's own note is blunt
> about it: *"The JSON prompt does not control output dimensions."* Send a
> payload on its own and you get the tool's default aspect — square, or whatever
> the picker was last left on — and every scene comes back tall and narrow with
> its composition crushed into a column. The width and height are a **sibling**
> setting, and they have to be set every time. See "The frame is set outside the
> payload" below.

It buys three things this brief needs and prose cannot express:

- **`color_palette`, up to 16 hex entries.** The luminance budget stops being a
  hope and becomes a number in the request. Grayscale is `R = G = B` in every
  entry; the plate's white point is the brightest entry.
- **`bbox`, four integers, normalised 0–1000, `[y_min, x_min, y_max, x_max]`,
  origin top-left — y before x.** Swapping the two is the documented common
  mistake, and it transposes the picture: a wide low band becomes a tall narrow
  column. This is where the four-axis separation table above becomes
  enforceable: `uprising` is a low wide band `[620, 0, 900, 1000]`, `city` fills
  the frame top to bottom, and each is coordinates rather than adjectives.
- **Everything is an `obj`.** No element carries `type: "text"`, anywhere, in
  any of the payloads — which is what keeps the frames legible-free.

### What it does not buy: a shared camera

Route A splits one render with a depth map, so constraint 5 — the four plates
share one camera — holds by construction. Ideogram generates each plate as its
own image, so assume the four plates will *not* line up for free.

A seed helps and is available: the REST reference omits it from the request
fields, but ComfyUI's `IdeogramV4` node exposes `seed` (`INT`, 0 – 2147483647)
and forwards it, so it is accepted. Fix one seed per scene. It is not enough on
its own — the four payloads differ, so the same seed gives four related images,
not four registered ones.

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

### The frame is set outside the payload

This is the first thing to get right and the easiest to miss: the 12 payloads
below are the value of `json_prompt` **only**. The frame is a sibling of it, and
it is named differently in each place the model runs:

| Where | What to set | Result |
|---|---|---|
| ComfyUI `IdeogramV4` node (paid) | `resolution` → `2560x1440 (16:9)` — **its default is `Auto`** | 2560 × 1440, downscale 0.8 on export |
| ComfyUI, local weights | `Ideogram4Scheduler` `width: 2048`, `height: 1152` | the export size exactly, no downscale |
| Hosted API, `POST /v1/ideogram-v4/generate` | `resolution`, the 16:9 entry of the 2K enum | 2560 × 1440, downscale 0.8 on export |
| The Ideogram web app | Prompt Box → Aspect Ratio → **16:9**, before generating | 16:9 at the app's own 2K |

The `IdeogramV4` node ships with `resolution` set to **`Auto`**, and `Auto` is
what produces a tall narrow plate: with nothing in the payload to say otherwise —
and there cannot be — the model picks its own shape. It is the first field to
change on a fresh node.

The model takes any resolution from 256 to 2048 per side in multiples of 16, up
to 6:1 — so **2048 × 1152 is native**, and running the weights locally skips the
downscale entirely. The hosted API is the one path that only offers fixed 2K
enums; there the 16:9 entry is 2560 × 1440, which is the same aspect and comes
back needing an 0.8 downscale.

An image that comes out tall and narrow is this setting, not the payload. The
`bbox` values cannot change the shape of the frame — they only place things
inside whatever shape was asked for.

### The rest of the envelope

```jsonc
{
  "json_prompt": { /* one payload from below */ },
  "resolution": "2560x1440",    // see the table above
  "rendering_speed": "QUALITY", // TURBO | DEFAULT | QUALITY; FLASH 400s today
  "seed": 12345                 // one per scene
}
```

with `Api-Key: <key>` as a header. The enum values are the ones ComfyUI's own
`IdeogramV4` node offers, read off a live 0.34.2 install — `rendering_speed` is
`DEFAULT`, `TURBO`, `QUALITY`, and `resolution` is the 22-entry 2K list whose
16:9 member the node labels `2560x1440 (16:9)`.

**In ComfyUI there is no separate `json_prompt` input.** The node takes a single
`prompt` string, and a payload from below goes into it serialised as JSON —
which is also what `BuildJsonPromptIdeogram` produces when you assemble one from
its parts. Passing the JSON directly skips that node entirely.

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
| watermark, signature, logo | **nothing catches this** — the model signs its work anyway; `scripts/make-scene-plates.mjs` wipes the bottom-right corner of every emissive plate |
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

### What the first set got wrong

Twelve plates came back and two complaints survived the levelling: in some of
them the point of the scene is not legible — `kinship`'s people-and-machine-at-
one-table worst of all — and the set as a whole reads as unadventurous. Neither
is a model problem. Both are traceable to lines in the payloads below, and the
five rules that came out of it apply to every payload in this document.

**1. Interlock the bboxes; do not tile them.** In the first `kinship/02-mid` the
machine sat at `[300, 380, 900, 640]` and the two people at `[320, 100, 920, 380]`
— side by side, not overlapping. The scene's whole argument is that they are
doing the same work, and the geometry said the opposite: a machine, and
separately some people. **One box around the group.**

**2. Name the thing they share.** "hands down on the same task as theirs" is not
drawable. A model cannot render a relationship, only an object and the hands on
it. Every scene where two parties are meant to be cooperating now names one
object — a beam, a tray, a channel — and puts every hand on it.

**3. Stage the geometry instead of describing the mood.** Hidden faces, seen
from behind, "relaxed posture": every cue of contact was removed on purpose and
what was left was figures near a table. Say where the hands converge, which tool
crosses from whom to whom, which two bodies lean over the same thing.

**4. The budget is a ceiling, not a description.** `02-mid` is capped at 84/255,
and the first pass spent that range on the table while the figures sat at
`#141414` — near-black on near-black. **Put the subject at the top of the plate's
range and the ground at the bottom.** Every subject has to read as a *shape* at
the plate's own contrast, because the runtime tints it and the shader vignettes
it before anyone sees it.

**5. Do not ask for the least striking image possible.** "documentary framing",
"natural unstaged composition", "restrained contrast", "ordinary clothes", "no
spectacle" — plus a frontal eye-level medium-wide in every plate. Nothing was
left to make a picture with. The wording the *pipeline* needs stays (no colour,
no text, no blur, no depth of field, pure black ground); the taste words that
flatten it are gone, and each scene now carries **one deliberate camera
decision** so no two plates share a framing.

| scene | camera decision | shared object |
|---|---|---|
| `uprising` | low, near the road surface; the street's vanishing point pushed into the right third | the raised-arm gesture running through people and machines alike, one rank |
| `city` | the near parapet cutting the frame as a diagonal, the tower mass anchored off-centre right | — (no two parties; the scale contrast is the subject) |
| `kinship` | close three-quarter over the table, the table filling the lower frame, hands at readable size | one open machine casing with its panel off, a human hand and a machine hand both inside it |

---

### `uprising` payloads

**`01-far`** — the firelight, and no skyline. The band is pinned to the bottom
40 % of the frame; there is nothing above it but smoke.

```json
{
  "high_level_description": "The end of a city street at night, seen from close to the road surface, lit only by fires burning out of frame beyond the far end. Monochrome, rendered on pure black.",
  "style_description": {
    "aesthetics": "stark and graphic, extreme contrast between light and deep crushed black, monochrome, no colour of any kind",
    "lighting": "a single source of firelight beyond the end of the street, low and far away, throwing hard rim light towards the camera, heavy volumetric smoke, no fill light, everything in perfect focus, no depth of field, no bokeh, no blur",
    "medium": "monochrome digital matte painting on a pure black ground, greyscale only, no paper texture, no film grain",
    "art_style": "cinematic concept art, camera close to the road surface looking down the street, anamorphic wide shot, the street's vanishing point pushed into the right third of the frame, strongly horizontal composition",
    "color_palette": ["#000000", "#0A0A0A", "#1A1A1A", "#2E2E2E"]
  },
  "compositional_deconstruction": {
    "background": "pure black, absolutely empty above the smoke line, no sky detail, no stars, no buildings, no towers, no structures of any height",
    "elements": [
      {
        "type": "obj",
        "bbox": [600, 0, 900, 1000],
        "desc": "a wide, low, continuous band of firelight lying along the far end of the street, spanning the full width of the frame, at its brightest around the vanishing point in the right third and dimming towards the left edge, soft-edged, no flame shapes readable, the brightest thing in the plate",
        "color_palette": ["#1A1A1A", "#2E2E2E"]
      },
      {
        "type": "obj",
        "bbox": [240, 0, 660, 1000],
        "desc": "thick smoke drifting upward off the fire and catching its light from underneath, dense and low, leaning to the left as it rises, thinning to pure black well before the top of the frame",
        "color_palette": ["#000000", "#0A0A0A", "#1A1A1A"]
      },
      {
        "type": "obj",
        "bbox": [700, 0, 1000, 1000],
        "desc": "the wet road surface running away from the camera in the near foreground, its reflections stretched into long horizontal streaks by the low vantage, very dark",
        "color_palette": ["#000000", "#0A0A0A"]
      }
    ]
  }
}
```

**`02-mid`** — one rank, not two groups. The people and the machines stand in the
same line, facing the same way, making the same gesture; that is what the scene
is about and it has to be inside a single box or it will come back as two
separate crowds.

```json
{
  "high_level_description": "The end of a city street at night, seen from close to the road surface, lit only by fires burning out of frame beyond the far end. Monochrome, rendered on pure black.",
  "style_description": {
    "aesthetics": "stark and graphic, extreme contrast between light and deep crushed black, monochrome, no colour of any kind",
    "lighting": "a single source of firelight beyond the end of the street, low and far away, throwing hard rim light towards the camera, heavy volumetric smoke, no fill light, everything in perfect focus, no depth of field, no bokeh, no blur",
    "medium": "monochrome digital matte painting on a pure black ground, greyscale only, no paper texture, no film grain",
    "art_style": "cinematic concept art, camera close to the road surface looking down the street, anamorphic wide shot, the street's vanishing point pushed into the right third of the frame, strongly horizontal composition",
    "color_palette": ["#000000", "#141414", "#2E2E2E", "#545454"]
  },
  "compositional_deconstruction": {
    "background": "pure black, empty, no architecture, no walls, no towers, nothing occupying the upper half of the frame",
    "elements": [
      {
        "type": "obj",
        "bbox": [420, 40, 900, 960],
        "desc": "one continuous rank standing across the road facing away from the camera towards the fire, people and humanoid machines alternating along it shoulder to shoulder and overlapping, the machines roughly a head and a half taller than the people beside them, two legs and a blocky torso and a small offset head, the same raised-arm gesture running through the whole rank so that a human arm and a machine arm are up side by side, every edge caught by the fire behind them and the rim light the brightest thing in the plate, bodies otherwise black",
        "color_palette": ["#141414", "#2E2E2E", "#545454"]
      },
      {
        "type": "obj",
        "bbox": [640, 0, 960, 1000],
        "desc": "overturned debris and improvised barricades built across the street below the rank, angled slabs and tipped vehicles, rim-lit along their top edges only, no detail on the near faces",
        "color_palette": ["#141414", "#2E2E2E"]
      },
      {
        "type": "obj",
        "bbox": [560, 0, 720, 1000],
        "desc": "the low silhouetted edge of single-storey street frontage running away from the camera on both sides towards the vanishing point on the right, nothing taller than the machines, no upper floors, no skyline",
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
        "bbox": [600, 0, 1000, 1000],
        "desc": "a dense crowd of people seen from very close and slightly below, heads, shoulders and raised arms overlapping into one continuous solid white shape, filling the lower third of the frame across its full width and rising higher on the left than on the right, ragged along its top edge with several arms breaking well clear of it, completely flat white inside with no faces, no clothing and no separation between figures",
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
nothing is in it. The first pass left both elements un-boxed on the reasoning
that a scatter has no place to be; what came back was a plume up the centre of
the frame. Left free, the model centres. The boxes below are wide on purpose.

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
        "bbox": [80, 20, 940, 980],
        "desc": "a scattering of small bright embers rising on a draught, spread evenly across the entire width of the frame from edge to edge, irregularly spaced, denser towards the lower half and thinning out towards the top, each one a hard point a few pixels across, never gathered into a plume or a column or a single rising stream, covering well under five percent of the frame in total",
        "color_palette": ["#8A8A8A", "#CCCCCC"]
      },
      {
        "type": "obj",
        "bbox": [200, 60, 980, 940],
        "desc": "a few larger flakes of ash tumbling among them, slightly dimmer than the embers, still small and sparse, also spread right across the frame rather than clustered",
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
    "art_style": "cinematic concept art, high rooftop vantage looking out and slightly down, the tower mass anchored off-centre to the right and the left third left almost empty, strongly vertical composition, extreme wide shot",
    "color_palette": ["#000000", "#0A0A0A", "#1A1A1A", "#2E2E2E"]
  },
  "compositional_deconstruction": {
    "background": "pure black, no sky detail, no stars, no moon, no horizon glow",
    "elements": [
      {
        "type": "obj",
        "bbox": [80, 0, 860, 1000],
        "desc": "innumerable distant towers receding layer behind layer into haze, each one reduced to a soft vertical block of dimly glowing haze with no readable windows, densest and tallest towards the right of the frame and falling away to almost nothing on the left, the right-hand mass the brightest thing in the plate, nothing sharp anywhere",
        "color_palette": ["#0A0A0A", "#1A1A1A", "#2E2E2E"]
      },
      {
        "type": "obj",
        "bbox": [300, 0, 900, 1000],
        "desc": "rain haze lying between the layers of towers and thickening with distance, a soft horizontal gradient that swallows the furthest ranks completely",
        "color_palette": ["#000000", "#0A0A0A", "#1A1A1A"]
      }
    ]
  }
}
```

**`02-mid`**

```json
{
  "high_level_description": "A dense future megacity at night seen from a high rooftop, looking out and slightly down over endless towers receding into rain haze. Monochrome, rendered on pure black.",
  "style_description": {
    "aesthetics": "oppressive scale, dense and vertical, extreme contrast between lit windows and deep crushed black, monochrome, no colour of any kind",
    "lighting": "thousands of small window lights and hanging signage glowing through rain haze, no sun, no moon, no sky light, strong atmospheric falloff with distance, everything in focus, no depth of field, no bokeh, no blur",
    "medium": "monochrome digital matte painting on a pure black ground, greyscale only, no paper texture, no film grain",
    "art_style": "cinematic concept art, high rooftop vantage looking out and slightly down, the tower mass anchored off-centre to the right and the left third left almost empty, strongly vertical composition, extreme wide shot",
    "color_palette": ["#000000", "#141414", "#2E2E2E", "#545454"]
  },
  "compositional_deconstruction": {
    "background": "pure black, nothing behind the towers, no sky, no haze glow",
    "elements": [
      {
        "type": "obj",
        "bbox": [0, 380, 1000, 1000],
        "desc": "a close rank of enormous towers filling the frame from top edge to bottom edge on the right, their faces gridded with small bright window lights, the grids the brightest thing in the plate, the concrete between them black, no readable interiors and nothing human-sized anywhere on them",
        "color_palette": ["#141414", "#2E2E2E", "#545454"]
      },
      {
        "type": "obj",
        "bbox": [120, 420, 780, 980],
        "desc": "hanging signage banners and gantries strung between the towers, tall narrow rectangles catching the light along one edge, abstract marks with no letters or characters",
        "color_palette": ["#2E2E2E", "#545454"]
      },
      {
        "type": "obj",
        "bbox": [200, 0, 900, 420],
        "desc": "a single much lower tower standing alone in the left third, far dimmer than the rank on the right, giving the frame something to fall away to",
        "color_palette": ["#000000", "#141414"]
      }
    ]
  }
}
```

**`03-near`** — the occluder.

```json
{
  "high_level_description": "A stencil mask: the solid white silhouette of a rooftop parapet and an aerial mast, on a pure black ground. Two tones only.",
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
        "bbox": [560, 0, 1000, 1000],
        "desc": "the near edge of a rooftop crossing the frame as a diagonal, high on the left and dropping away to the right, one continuous solid white shape with a flat unbroken top edge, no texture and no detail inside it",
        "color_palette": ["#FFFFFF"]
      },
      {
        "type": "obj",
        "bbox": [180, 620, 700, 780],
        "desc": "a single aerial mast rising from the parapet on the right, a narrow solid white vertical with two short crossbars, no guy wires, no lattice",
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
        "bbox": [0, 420, 1000, 1000],
        "desc": "fine diagonal rain streaks falling steeply from upper left to lower right, thin and broken, widely spaced, confined to the right of the frame and absent from its left third, covering only a small fraction of the frame",
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

An interior, and the one scene in the set that is *about* two parties doing one
thing. It must not read as either the street or the skyline, and it must not read
as a machine standing near some people: the camera is close enough that hands are
legible, and both pairs of hands are inside the same object.

**`01-far`**

```json
{
  "high_level_description": "A room at night behind a table, seen from close in and slightly above, the far wall falling away into darkness beyond the reach of one lamp. Monochrome, rendered on pure black.",
  "style_description": {
    "aesthetics": "warm and close, deep blacks, a single pool of light with everything outside it gone, monochrome, no colour of any kind",
    "lighting": "one low overhead lamp hanging just out of frame above the table, hard falloff into darkness within a metre of it, windows glowing faintly from the city behind them, no other source, everything in focus, no depth of field, no bokeh, no blur",
    "medium": "monochrome digital matte painting on a pure black ground, greyscale only, no paper texture, no film grain",
    "art_style": "cinematic concept art, close three-quarter view across a table from just above head height, the table's far edge running as a diagonal into the upper left, intimate framing",
    "color_palette": ["#000000", "#0A0A0A", "#1A1A1A", "#2E2E2E"]
  },
  "compositional_deconstruction": {
    "background": "pure black, the unlit depth of the room, no detail",
    "elements": [
      {
        "type": "obj",
        "bbox": [120, 60, 620, 660],
        "desc": "a bank of tall windows across the far wall on the left, each pane a soft dim rectangle of light, the city beyond them reduced to indistinct low blocks with no towers and nothing sharp, the brightest thing in the plate",
        "color_palette": ["#1A1A1A", "#2E2E2E"]
      },
      {
        "type": "obj",
        "bbox": [80, 0, 900, 1000],
        "desc": "faint haze in the room's air softening the light coming off the windows, very low contrast, thickest across the upper half",
        "color_palette": ["#000000", "#0A0A0A"]
      }
    ]
  }
}
```

**`02-mid`** — the plate the scene lives or dies on. One box, one object, four
hands.

```json
{
  "high_level_description": "A room at night behind a table, seen from close in and slightly above, the far wall falling away into darkness beyond the reach of one lamp. Monochrome, rendered on pure black.",
  "style_description": {
    "aesthetics": "warm and close, deep blacks, a single pool of light with everything outside it gone, monochrome, no colour of any kind",
    "lighting": "one low overhead lamp hanging just out of frame above the table, hard falloff into darkness within a metre of it, windows glowing faintly from the city behind them, no other source, everything in focus, no depth of field, no bokeh, no blur",
    "medium": "monochrome digital matte painting on a pure black ground, greyscale only, no paper texture, no film grain",
    "art_style": "cinematic concept art, close three-quarter view across a table from just above head height, the table's far edge running as a diagonal into the upper left, intimate framing",
    "color_palette": ["#000000", "#141414", "#2E2E2E", "#545454"]
  },
  "compositional_deconstruction": {
    "background": "pure black beyond the reach of the lamp, no walls, no furniture in the darkness",
    "elements": [
      {
        "type": "obj",
        "bbox": [300, 180, 900, 860],
        "desc": "one open machine casing lying on its side in the middle of the table with its panel off, its lit interior the brightest thing in the plate, and four hands reaching into that single opening from opposite sides: two human hands from the near right, and from the far left two jointed metal manipulators on the same scale, fingers and manipulator tips converging on the same point inside the casing, forearms overlapping across the opening, nothing between them",
        "color_palette": ["#2E2E2E", "#545454"]
      },
      {
        "type": "obj",
        "bbox": [200, 120, 720, 900],
        "desc": "the upper bodies the hands belong to, leaning in over the casing from both sides and meeting above it, one a person in a work shirt and one a humanoid machine of plain functional construction at the same height, heads bowed to the same point, edges caught by the lamp and everything else black",
        "color_palette": ["#141414", "#2E2E2E"]
      },
      {
        "type": "obj",
        "bbox": [520, 0, 940, 1000],
        "desc": "the table itself running out of frame on both sides, its lit surface scattered with laid-out tools and small parts, the wood dark and the parts catching the lamp",
        "color_palette": ["#141414", "#2E2E2E"]
      }
    ]
  }
}
```

**`03-near`** — the occluder.

```json
{
  "high_level_description": "A stencil mask: the solid white silhouettes of a table's near edge and a forearm crossing the foreground, on a pure black ground. Two tones only.",
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
        "bbox": [820, 0, 1000, 1000],
        "desc": "the near edge of a table crossing the very bottom of the frame from side to side, one continuous solid white band with a flat top edge, no legs, no grain, no detail",
        "color_palette": ["#FFFFFF"]
      },
      {
        "type": "obj",
        "bbox": [520, 620, 1000, 1000],
        "desc": "a bare forearm and hand entering from the lower right corner and reaching towards the middle of the frame, one continuous solid white shape with fingers separated, no clothing detail and no interior line work",
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
        "bbox": [60, 300, 460, 700],
        "desc": "one soft round bloom of lamplight hanging in the upper middle of the frame, brightest at its centre and falling away to nothing within its own width, no fitting, no shade, no cable",
        "color_palette": ["#8A8A8A", "#CCCCCC"]
      },
      {
        "type": "obj",
        "bbox": [420, 60, 940, 940],
        "desc": "a scattering of small hard specular highlights below it where the lamp catches metal and glass, spread right across the width of the frame rather than clustered under the bloom, each one a point or a short bright edge a few pixels across, covering well under five percent of the frame in total",
        "color_palette": ["#3D3D3D", "#8A8A8A"]
      }
    ]
  }
}
```

---

## Route D — the light set

### Why there is a second set at all

The tube follows the theme. On dark it is a lit screen and the plates are added
together as emission; on light it is paper, and `src/lib/crt-shader.ts` lays the
picture down as **ink** — plate luminance becomes ink coverage.

A night scene put through that comes back as a tonal negative: the black sky
prints as bare paper and the fires and the machines print as black. It is not
dim, it is inverted, and no gain or exposure fixes it. So the light theme gets
its own plates, authored for daylight, and `src/lib/scenes.json` carries them
under `light` alongside the night set.

### Author them as daylight; the script inverts

**Write the payload as an ordinary daylight picture.** Do not try to describe an
ink-density map, and do not pre-invert anything: asking a model for a negative
gets a picture that looks like a negative rather than an inverted picture.

`scripts/make-scene-plates.mjs --theme light` flips every emissive plate on the
way out, so the brightest pixel of the finished file is the densest mark on
paper. Occluders are left alone — a dark silhouette on a white ground already
comes back the right way round and the script's mean-luminance check handles it.

Two consequences for the wording:

- **The ground is pure white, not pure black.** After inversion white becomes
  black, which is no ink at all, which is bare paper. Say "on a pure white
  ground" in every emissive payload and give it a high-key palette.
- **The accent plane is not the light source.** On paper, sunlight is the
  *absence* of ink; it cannot be drawn. The `04` plate carries what is warm in
  hue rather than what is bright in value — terracotta, banner cloth, dry husks,
  wet channel stone — because it is tinted with `--sl-accent-default`, which on
  the light theme is a burnt ochre.

### Light plate budgets

Ink coverage, not emission, and the two do not convert. The light path tonemaps
in emission space, so a heavier ink load saturates rather than deepens and local
contrast is not monotonic in the budget. **These are a first cut.** Calibrate
them on screen — `.scenes-raw/` keeps every render, so
`--theme light --from-raw --levels` is seconds rather than an hour of GPU.

| Plate | Tone | Peak after inversion | Coverage | Notes |
|---|---|---|---|---|
| `01-far` | `structure` | 70 / 255 | broad, low | Sky and distance. On paper this is the palest wash. |
| `02-mid` | `depth` | 120 / 255 | moderate | The body of the scene. Carries the teal `accent-depth`. |
| `03-*` | `occluder` | pure white / pure black | 25–40 % of frame | A mask, exactly as on dark. |
| `04-*` | `accent` | 140 / 255 | under 8 % of frame | What is ochre, not what is bright. |

Everything else from Route C still holds: no colour, no text, no blur, no depth
of field, every element gets a `bbox`, and the five rules under *What the first
set got wrong* apply here first rather than last.

### `uprising` light payloads

The same street, rebuilt. The camera decision is a low vantage from under the
beam, so the frame is cut by a strong upward diagonal; the shared object is one
roof beam with every hand on it.

**`01-far`**

```json
{
  "high_level_description": "A city street in full midday sun, seen from low down near the road surface, its facades planted with terraced greenery all the way up. Monochrome, rendered on a pure white ground.",
  "style_description": {
    "aesthetics": "open and high-key, bright flat daylight, soft shadows, airy, monochrome, no colour of any kind",
    "lighting": "hard overhead midday sun with a wide bright sky, light bouncing back up off a pale road, no artificial light anywhere, everything in perfect focus, no depth of field, no bokeh, no blur",
    "medium": "monochrome digital matte painting on a pure white ground, greyscale only, no paper texture, no film grain",
    "art_style": "cinematic concept art, camera close to the road surface looking up the street, anamorphic wide shot, the street's vanishing point pushed into the right third of the frame, strong upward diagonal",
    "color_palette": ["#FFFFFF", "#E0E0E0", "#B8B8B8", "#8A8A8A"]
  },
  "compositional_deconstruction": {
    "background": "pure white, an empty blown-out sky filling the whole upper frame, no clouds, no sun disc, no birds",
    "elements": [
      {
        "type": "obj",
        "bbox": [120, 0, 780, 1000],
        "desc": "the facades on both sides of the street terraced with planting from pavement to roofline, tier above tier of foliage spilling over each ledge, the two sides converging towards the vanishing point in the right third, the leaf mass the darkest thing in the plate and the sky behind it left completely empty",
        "color_palette": ["#8A8A8A", "#B8B8B8"]
      },
      {
        "type": "obj",
        "bbox": [700, 0, 1000, 1000],
        "desc": "the pale road surface running away from the camera in the near foreground, catching the sky, almost as light as the sky itself, marked only by the long soft shadows of the planting falling across it",
        "color_palette": ["#E0E0E0", "#FFFFFF"]
      }
    ]
  }
}
```

**`02-mid`** — one beam, every hand on it.

```json
{
  "high_level_description": "A city street in full midday sun, seen from low down near the road surface, its facades planted with terraced greenery all the way up. Monochrome, rendered on a pure white ground.",
  "style_description": {
    "aesthetics": "open and high-key, bright flat daylight, soft shadows, airy, monochrome, no colour of any kind",
    "lighting": "hard overhead midday sun with a wide bright sky, light bouncing back up off a pale road, no artificial light anywhere, everything in perfect focus, no depth of field, no bokeh, no blur",
    "medium": "monochrome digital matte painting on a pure white ground, greyscale only, no paper texture, no film grain",
    "art_style": "cinematic concept art, camera close to the road surface looking up the street, anamorphic wide shot, the street's vanishing point pushed into the right third of the frame, strong upward diagonal",
    "color_palette": ["#FFFFFF", "#D0D0D0", "#9A9A9A", "#5A5A5A"]
  },
  "compositional_deconstruction": {
    "background": "pure white, an empty sky, nothing behind the figures",
    "elements": [
      {
        "type": "obj",
        "bbox": [180, 40, 820, 960],
        "desc": "one long timber roof beam lifted overhead and running as a steep diagonal from the lower left of the frame up into the upper right, and along its whole length a single mixed line of people and humanoid machines carrying it, alternating and overlapping, arms up and hands gripping the same beam, human hands and jointed metal manipulators side by side on it, the machines the same height as the people beside them, every figure seen from below against the empty sky",
        "color_palette": ["#5A5A5A", "#9A9A9A"]
      },
      {
        "type": "obj",
        "bbox": [420, 0, 940, 1000],
        "desc": "the part-built timber frame the beam is going onto, a lattice of uprights and cross-members rising on both sides of the street, open and light, seen against the sky",
        "color_palette": ["#9A9A9A", "#D0D0D0"]
      },
      {
        "type": "obj",
        "bbox": [520, 0, 900, 1000],
        "desc": "planting boxes and young trees along both pavements below the frame, small against it, giving the street its floor",
        "color_palette": ["#9A9A9A", "#D0D0D0"]
      }
    ]
  }
}
```

**`03-frame`** — the occluder. Black on white here, and the script flips it.

```json
{
  "high_level_description": "A stencil mask: the solid black silhouettes of two timber uprights and a pair of near shoulders, on a pure white ground. Two tones only.",
  "style_description": {
    "aesthetics": "hard-edged high contrast stencil, two tones only, absolutely no midtones, no shading, no gradient",
    "lighting": "none, this is a flat mask and not a lit scene, no shadows, no depth of field, no blur",
    "medium": "flat two-tone vector stencil, pure black shapes on a pure white ground",
    "art_style": "silhouette matte, clean unbroken outlines, no interior detail whatsoever",
    "color_palette": ["#000000", "#FFFFFF"]
  },
  "compositional_deconstruction": {
    "background": "pure white, completely flat and empty everywhere the silhouettes are not",
    "elements": [
      {
        "type": "obj",
        "bbox": [0, 60, 1000, 260],
        "desc": "one timber upright standing in the near foreground on the left, a solid black vertical running the full height of the frame, slightly wider at the base, no grain and no fixings",
        "color_palette": ["#000000"]
      },
      {
        "type": "obj",
        "bbox": [0, 740, 1000, 900],
        "desc": "a second timber upright in the near foreground on the right, the same solid black vertical, narrower than the first",
        "color_palette": ["#000000"]
      },
      {
        "type": "obj",
        "bbox": [720, 240, 1000, 780],
        "desc": "the heads and shoulders of two people standing with their backs to the camera between the uprights, low in the frame, one continuous solid black shape with no faces, no hair detail and no separation between them",
        "color_palette": ["#000000"]
      }
    ]
  }
}
```
> The script flips this one on mean luminance. If it comes back white-on-black
> already, that is fine too — the check handles both.

**`04-sun`** — the accent. What is ochre, not what is bright.

```json
{
  "high_level_description": "Scattered banner cloth, terracotta planters and dry seed husks, on a pure white ground, nothing else in frame. Monochrome.",
  "style_description": {
    "aesthetics": "sparse, minimal, isolated dark marks on an empty white field, monochrome",
    "lighting": "flat even daylight, no modelling, no cast shadows, everything sharp, no depth of field, no bokeh, no blur",
    "medium": "monochrome digital matte painting on a pure white ground, greyscale only, no film grain",
    "art_style": "isolated element study, empty composition",
    "color_palette": ["#FFFFFF", "#B8B8B8", "#6E6E6E", "#3D3D3D"]
  },
  "compositional_deconstruction": {
    "background": "pure white, completely empty, no street, no sky, no context of any kind",
    "elements": [
      {
        "type": "obj",
        "bbox": [60, 40, 720, 960],
        "desc": "a few long banners of cloth hanging at different heights, spread right across the width of the frame rather than clustered, each one a narrow soft-edged rectangle with a rippled lower edge, no letters, no characters, no emblems",
        "color_palette": ["#6E6E6E", "#3D3D3D"]
      },
      {
        "type": "obj",
        "bbox": [520, 20, 980, 980],
        "desc": "a scattering of terracotta planters and dry seed husks along the lower half, spread evenly from edge to edge and never gathered into a row or a pile, each one a small compact shape, covering well under eight percent of the frame in total",
        "color_palette": ["#B8B8B8", "#6E6E6E"]
      }
    ]
  }
}
```

### `city` light payloads

The same skyline, greened. Keep the interest on the **right half of the frame** —
the left is under type, exactly as in the night set. The camera decision is the
water channel cutting the frame corner to corner.

**`01-far`**

```json
{
  "high_level_description": "A dense city seen from a high rooftop at midday, its towers grown over with planting and terracing, receding into clear bright haze. Monochrome, rendered on a pure white ground.",
  "style_description": {
    "aesthetics": "open and high-key, enormous scale seen in flat daylight, airy, monochrome, no colour of any kind",
    "lighting": "clear overhead midday sun, a wide blown-out sky, light haze thinning the distance rather than darkening it, no artificial light anywhere, everything in focus, no depth of field, no bokeh, no blur",
    "medium": "monochrome digital matte painting on a pure white ground, greyscale only, no paper texture, no film grain",
    "art_style": "cinematic concept art, high rooftop vantage looking out and slightly down, the tower mass anchored off-centre to the right and the left third left almost empty, strongly vertical composition, extreme wide shot",
    "color_palette": ["#FFFFFF", "#E0E0E0", "#B8B8B8", "#8A8A8A"]
  },
  "compositional_deconstruction": {
    "background": "pure white, an empty blown-out sky, no clouds, no sun disc",
    "elements": [
      {
        "type": "obj",
        "bbox": [80, 0, 860, 1000],
        "desc": "rank behind rank of distant towers receding into haze, each one softened until it is barely separable from the sky, every roofline and ledge carrying planting, densest and tallest towards the right of the frame and falling away to almost nothing on the left, the right-hand mass the darkest thing in the plate, nothing sharp anywhere",
        "color_palette": ["#8A8A8A", "#B8B8B8"]
      },
      {
        "type": "obj",
        "bbox": [300, 0, 900, 1000],
        "desc": "clear daylight haze lying between the ranks and thickening with distance, a soft horizontal gradient that bleaches the furthest towers into the sky completely",
        "color_palette": ["#E0E0E0", "#FFFFFF"]
      }
    ]
  }
}
```

**`02-mid`**

```json
{
  "high_level_description": "A dense city seen from a high rooftop at midday, its towers grown over with planting and terracing, receding into clear bright haze. Monochrome, rendered on a pure white ground.",
  "style_description": {
    "aesthetics": "open and high-key, enormous scale seen in flat daylight, airy, monochrome, no colour of any kind",
    "lighting": "clear overhead midday sun, a wide blown-out sky, light haze thinning the distance rather than darkening it, no artificial light anywhere, everything in focus, no depth of field, no bokeh, no blur",
    "medium": "monochrome digital matte painting on a pure white ground, greyscale only, no paper texture, no film grain",
    "art_style": "cinematic concept art, high rooftop vantage looking out and slightly down, the tower mass anchored off-centre to the right and the left third left almost empty, strongly vertical composition, extreme wide shot",
    "color_palette": ["#FFFFFF", "#D0D0D0", "#9A9A9A", "#5A5A5A"]
  },
  "compositional_deconstruction": {
    "background": "pure white, an empty sky, nothing behind the towers",
    "elements": [
      {
        "type": "obj",
        "bbox": [0, 380, 1000, 1000],
        "desc": "a close rank of enormous towers filling the frame from top edge to bottom edge on the right, every setback and balcony planted, canopy walkways bridging between them at several heights, the foliage the darkest thing in the plate and the structure between it pale, nothing human-sized readable anywhere on them",
        "color_palette": ["#5A5A5A", "#9A9A9A"]
      },
      {
        "type": "obj",
        "bbox": [0, 300, 1000, 1000],
        "desc": "one open water channel running as a single unbroken diagonal from between the far towers in the upper right down to the near bottom edge of the frame, a narrow pale ribbon with a dark lip on each side, the one line that crosses the whole picture",
        "color_palette": ["#D0D0D0", "#5A5A5A"]
      },
      {
        "type": "obj",
        "bbox": [120, 420, 640, 980],
        "desc": "slow vertical-axis wind rotors standing on the tower tops, tall narrow open helices, seen against the empty sky",
        "color_palette": ["#9A9A9A", "#D0D0D0"]
      },
      {
        "type": "obj",
        "bbox": [200, 0, 900, 380],
        "desc": "a single much lower planted tower standing alone in the left third, far paler than the rank on the right, giving the frame something to fall away to",
        "color_palette": ["#D0D0D0", "#FFFFFF"]
      }
    ]
  }
}
```

**`03-parapet`** — the occluder.

```json
{
  "high_level_description": "A stencil mask: the solid black silhouettes of a rooftop parapet, a planter box and a wind rotor, on a pure white ground. Two tones only.",
  "style_description": {
    "aesthetics": "hard-edged high contrast stencil, two tones only, absolutely no midtones, no shading, no gradient",
    "lighting": "none, this is a flat mask and not a lit scene, no shadows, no depth of field, no blur",
    "medium": "flat two-tone vector stencil, pure black shapes on a pure white ground",
    "art_style": "silhouette matte, clean unbroken outlines, no interior detail whatsoever",
    "color_palette": ["#000000", "#FFFFFF"]
  },
  "compositional_deconstruction": {
    "background": "pure white, completely flat and empty everywhere the silhouettes are not",
    "elements": [
      {
        "type": "obj",
        "bbox": [560, 0, 1000, 1000],
        "desc": "the near edge of a rooftop crossing the frame as a diagonal, high on the left and dropping away to the right, one continuous solid black shape with a flat unbroken top edge, no texture and no detail inside it",
        "color_palette": ["#000000"]
      },
      {
        "type": "obj",
        "bbox": [420, 40, 700, 340],
        "desc": "a long planter box sitting on the parapet at the left, a solid black rectangle with a ragged top edge where the planting overhangs it, no individual leaves",
        "color_palette": ["#000000"]
      },
      {
        "type": "obj",
        "bbox": [140, 660, 620, 800],
        "desc": "one vertical-axis wind rotor standing on the parapet at the right, a narrow solid black column with three curved blades, no lattice and no guy wires",
        "color_palette": ["#000000"]
      }
    ]
  }
}
```
> The script flips this one on mean luminance.

**`04-water`** — the accent.

```json
{
  "high_level_description": "The wet stone lip of a water channel and a line of catchment basins, on a pure white ground, nothing else in frame. Monochrome.",
  "style_description": {
    "aesthetics": "sparse, minimal, isolated dark marks on an empty white field, monochrome",
    "lighting": "flat even daylight, no modelling, no cast shadows, everything sharp, no depth of field, no bokeh, no blur",
    "medium": "monochrome digital matte painting on a pure white ground, greyscale only, no film grain",
    "art_style": "isolated element study, empty composition",
    "color_palette": ["#FFFFFF", "#B8B8B8", "#6E6E6E", "#3D3D3D"]
  },
  "compositional_deconstruction": {
    "background": "pure white, completely empty, no city, no towers, no horizon, no context of any kind",
    "elements": [
      {
        "type": "obj",
        "bbox": [0, 420, 1000, 1000],
        "desc": "the wet stone lip of a channel running as a single narrow diagonal from the upper right down to the lower edge, broken into short segments where the water passes over it, confined to the right of the frame and absent from its left third",
        "color_palette": ["#6E6E6E", "#3D3D3D"]
      },
      {
        "type": "obj",
        "bbox": [260, 480, 900, 980],
        "desc": "a line of small catchment basins along it at different heights, each a short compact dark mark, widely spaced and never touching, covering well under eight percent of the frame in total",
        "color_palette": ["#B8B8B8", "#6E6E6E"]
      }
    ]
  }
}
```

### `kinship` light payloads

The same table, in daylight. The camera decision is a close three-quarter with
the table filling the lower frame; the shared object is one seed tray passing
between a human hand and a machine hand.

**`01-far`**

```json
{
  "high_level_description": "A room in full daylight behind a table, seen from close in and slightly above, a tall open window filling the far wall. Monochrome, rendered on a pure white ground.",
  "style_description": {
    "aesthetics": "open and high-key, bright even daylight, soft shadows, airy, monochrome, no colour of any kind",
    "lighting": "one tall open window carrying almost all the light, a wide blown-out sky beyond it, soft bounce filling the room, no artificial light anywhere, everything in focus, no depth of field, no bokeh, no blur",
    "medium": "monochrome digital matte painting on a pure white ground, greyscale only, no paper texture, no film grain",
    "art_style": "cinematic concept art, close three-quarter view across a table from just above head height, the table's far edge running as a diagonal into the upper left, intimate framing",
    "color_palette": ["#FFFFFF", "#E0E0E0", "#B8B8B8", "#8A8A8A"]
  },
  "compositional_deconstruction": {
    "background": "pure white, the room's far wall bleached out, no detail",
    "elements": [
      {
        "type": "obj",
        "bbox": [80, 60, 700, 620],
        "desc": "one tall window standing open across the far wall on the left, its frame and mullions the darkest thing in the plate, the view beyond it blown out to nothing but a few soft low shapes",
        "color_palette": ["#8A8A8A", "#B8B8B8"]
      },
      {
        "type": "obj",
        "bbox": [200, 40, 820, 540],
        "desc": "potted plants crowding the sill and the floor below the window, leaves overlapping into a soft mass, darker at the base and thinning upward",
        "color_palette": ["#8A8A8A", "#B8B8B8"]
      },
      {
        "type": "obj",
        "bbox": [80, 0, 900, 1000],
        "desc": "daylight haze filling the room's air and lifting everything away from the window towards white, very low contrast",
        "color_palette": ["#E0E0E0", "#FFFFFF"]
      }
    ]
  }
}
```

**`02-mid`** — one box, one tray, four hands.

```json
{
  "high_level_description": "A room in full daylight behind a table, seen from close in and slightly above, a tall open window filling the far wall. Monochrome, rendered on a pure white ground.",
  "style_description": {
    "aesthetics": "open and high-key, bright even daylight, soft shadows, airy, monochrome, no colour of any kind",
    "lighting": "one tall open window carrying almost all the light, a wide blown-out sky beyond it, soft bounce filling the room, no artificial light anywhere, everything in focus, no depth of field, no bokeh, no blur",
    "medium": "monochrome digital matte painting on a pure white ground, greyscale only, no paper texture, no film grain",
    "art_style": "cinematic concept art, close three-quarter view across a table from just above head height, the table's far edge running as a diagonal into the upper left, intimate framing",
    "color_palette": ["#FFFFFF", "#D0D0D0", "#9A9A9A", "#5A5A5A"]
  },
  "compositional_deconstruction": {
    "background": "pure white, the room behind bleached out, no walls, no furniture",
    "elements": [
      {
        "type": "obj",
        "bbox": [300, 180, 900, 860],
        "desc": "one shallow seed tray held in mid-air over the middle of the table and gripped from both sides at once: two human hands on the near right rim, and on the far left rim two jointed metal manipulators on the same scale, all four contacts on the same tray, forearms overlapping above it, the tray level and nothing between them",
        "color_palette": ["#5A5A5A", "#9A9A9A"]
      },
      {
        "type": "obj",
        "bbox": [200, 120, 720, 900],
        "desc": "the upper bodies the hands belong to, leaning in over the tray from both sides and meeting above it, one a person in a work shirt and one a humanoid machine of plain functional construction at the same height, heads bowed to the same point, both dark against the blown-out window behind them",
        "color_palette": ["#5A5A5A", "#9A9A9A"]
      },
      {
        "type": "obj",
        "bbox": [520, 0, 940, 1000],
        "desc": "the table itself running out of frame on both sides, its pale surface covered in seed trays, small pots and hand tools laid out in rows, everything catching the window light",
        "color_palette": ["#9A9A9A", "#D0D0D0"]
      }
    ]
  }
}
```

**`03-window`** — the occluder.

```json
{
  "high_level_description": "A stencil mask: the solid black silhouettes of a window mullion, a table's near edge and a forearm, on a pure white ground. Two tones only.",
  "style_description": {
    "aesthetics": "hard-edged high contrast stencil, two tones only, absolutely no midtones, no shading, no gradient",
    "lighting": "none, this is a flat mask and not a lit scene, no shadows, no depth of field, no blur",
    "medium": "flat two-tone vector stencil, pure black shapes on a pure white ground",
    "art_style": "silhouette matte, clean unbroken outlines, no interior detail whatsoever",
    "color_palette": ["#000000", "#FFFFFF"]
  },
  "compositional_deconstruction": {
    "background": "pure white, completely flat and empty everywhere the silhouettes are not",
    "elements": [
      {
        "type": "obj",
        "bbox": [0, 40, 820, 200],
        "desc": "one window mullion standing in the near foreground on the left, a solid black vertical running from the top of the frame down to the table line, plain and unmoulded",
        "color_palette": ["#000000"]
      },
      {
        "type": "obj",
        "bbox": [820, 0, 1000, 1000],
        "desc": "the near edge of a table crossing the very bottom of the frame from side to side, one continuous solid black band with a flat top edge, no legs, no grain, no detail",
        "color_palette": ["#000000"]
      },
      {
        "type": "obj",
        "bbox": [520, 620, 1000, 1000],
        "desc": "a bare forearm and hand entering from the lower right corner and reaching towards the middle of the frame, one continuous solid black shape with fingers separated, no clothing detail and no interior line work",
        "color_palette": ["#000000"]
      }
    ]
  }
}
```
> The script flips this one on mean luminance.

**`04-leaf`** — the accent.

```json
{
  "high_level_description": "Terracotta pots, dry seed husks and the rim of a woven tray, on a pure white ground, nothing else in frame. Monochrome.",
  "style_description": {
    "aesthetics": "sparse, minimal, isolated dark marks on an empty white field, monochrome",
    "lighting": "flat even daylight, no modelling, no cast shadows, everything sharp, no depth of field, no bokeh, no blur",
    "medium": "monochrome digital matte painting on a pure white ground, greyscale only, no film grain",
    "art_style": "isolated element study, empty composition",
    "color_palette": ["#FFFFFF", "#B8B8B8", "#6E6E6E", "#3D3D3D"]
  },
  "compositional_deconstruction": {
    "background": "pure white, completely empty, no room, no table, no context of any kind",
    "elements": [
      {
        "type": "obj",
        "bbox": [80, 300, 520, 720],
        "desc": "the woven rim of one shallow tray sitting high in the middle of the frame, a single closed oval band of dark hatching with nothing inside it",
        "color_palette": ["#6E6E6E", "#3D3D3D"]
      },
      {
        "type": "obj",
        "bbox": [420, 40, 960, 960],
        "desc": "a scattering of small terracotta pots and dry seed husks across the lower half, spread evenly from edge to edge and never gathered into a row or a pile, each one a small compact shape, covering well under eight percent of the frame in total",
        "color_palette": ["#B8B8B8", "#6E6E6E"]
      }
    ]
  }
}
```

---

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
- [ ] 2048 × 1152. Native if the frame was set to 2048 × 1152; the hosted API's
      2K enum returns 2560 × 1440, the same aspect, so downscale by 0.8 rather
      than cropping. A portrait or square plate means the frame was never set —
      see "The frame is set outside the payload".
- [ ] Nothing legible: no text survived, in any plate. Check the corners at high
      exposure — four of the first twelve carried a fabricated artist's monogram
      in the bottom right, faint enough to pass a normal look.
- [ ] **Light set only:** the file on disk is *inverted* relative to the picture
      that was rendered — bright where the daylight scene was dark. If it still
      looks like a photograph, `--theme light` was not passed and the plate is
      the wrong way round.
- [ ] **Light set only:** the subject reads as a shape. Open the plate at the
      size the tube will show it and look at it for a second: if the people and
      the machine are not obviously doing the same thing, the payload is wrong
      and no amount of levelling will fix it.

## Installing the plates

`scripts/make-scene-plates.mjs` writes them where they belong; the paths below
are what it is aiming at, and they come from `src/lib/scenes.json`.

```
public/scenes/uprising/{01-far,02-mid,03-crowd,04-embers}.webp
public/scenes/city/{01-far,02-mid,03-near,04-rain}.webp
public/scenes/kinship/{01-far,02-mid,03-near,04-warm}.webp

public/scenes/uprising/light/{01-far,02-mid,03-frame,04-sun}.webp
public/scenes/city/light/{01-far,02-mid,03-parapet,04-water}.webp
public/scenes/kinship/light/{01-far,02-mid,03-window,04-leaf}.webp
```

`uprising` and `kinship` share the blog band and the tube changes channel between
them on a timer; `city` is the `/apparel` opening. The light folders are optional
— a scene whose light plates are absent keeps its night on both themes, which is
what the site did before the light set existed.

Then rebuild the flattened composites that visitors without WebGPU download, and
re-check the pages:

```sh
npm run scenes:flats
npm run build
npm run contrast -- http://localhost:4321/apparel/ .ap-open__h .ap-open__lede
```

`scenes:flats` builds one composite per polarity per scene and skips a light set
whose plates are not on disk yet. Once a `<scene>-flat-light.webp` exists, pass
it to the tube as `flatLight` alongside `flat` — see `src/pages/apparel/index.astro`.

The contrast check is not optional on `/apparel`: the heading and the lede sit on
the glass, and a brighter plate than the placeholder will move those numbers. The
floors are 3:1 for the heading and 4.5:1 for the lede, and they have to hold on
**both** themes, which is why `city` is the constrained scene of the three.
