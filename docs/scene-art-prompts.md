# Generating the CRT scene plates

> **What is this file.** The brief for the artwork behind the CRT tubes on
> `/blog` and `/apparel`: what the pipeline requires of an image, and a set of
> ComfyUI prompts that produce it. Audience: whoever is generating the plates
> (today: Marcello Barile, who is also the owner). Companions:
> `docs/specs/2026-08-29-crt-scenes-design.md` is the implementation contract and
> explains *why* the constraints are what they are; `docs/webgpu-surfaces.md`
> covers the WebGPU pattern underneath. The placeholder plates currently in the
> repo were drawn by `scripts/make-scene-placeholders.mjs` and are meant to be
> replaced by the output of this brief.

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
shot, blade runner, low horizon, nothing sharp
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

## Negative prompt (all plates)

```
text, letters, words, watermark, signature, logo, caption, subtitle, ui, hud,
frame, border, vignette, colour, colored, saturated, sepia, blue tint,
low contrast, flat lighting, grey background, white background, blur,
depth of field, bokeh, people in the foreground, close-up face
```

`white background` stays in the negative for the emissive plates and comes
**out** for the occluder plates, which want exactly that.

## Before export — checklist

- [ ] Desaturated. Sample three pixels and confirm R = G = B.
- [ ] Black point is genuinely 0. A background at value 8 is a grey wash across
      the whole tube once the shader lifts it.
- [ ] White point is at the plate's budget from the table above.
- [ ] The occluder has no midtones except a 1–2 px edge.
- [ ] 2048 × 1152.
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
