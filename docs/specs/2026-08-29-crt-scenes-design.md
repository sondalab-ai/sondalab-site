# CRT scenes on /blog and /apparel

> **What is this file.** The implementation contract for the parallax CRT
> surfaces on `/blog` and `/apparel`: what was built, why each constraint exists,
> and what is still open. Audience: the maintainer and any agent extending the
> site. Owner: Marcello Barile. Companions: `docs/webgpu-surfaces.md` is the
> reusable WebGPU pattern and carries the traps; `docs/scene-art-prompts.md` is
> the brief for the artwork; `docs/specs/2026-08-28-crt-hero-design.md` records
> the hero this work generalises.

## Status legend

- **Delivered** — merged and available to visitors.
- **Placeholder (not delivered)** — the mechanism ships, the content is a stand-in.

## What this is

The hero's CRT tube, generalised to carry pictures instead of prose, and mounted
on two more pages:

- **`/blog`** — a full-bleed band between the archive's header and its first row.
  Scene: `uprising`. No text on the glass.
- **`/apparel`** — the backdrop of the opening section, with the heading and the
  lede on the glass. Scene: `city`, at roughly a third intensity.

Both are progressive enhancements over a real picture, not over an empty box.

## Architecture

Four pieces, each of which can be read without the others.

| Unit | Responsibility |
|---|---|
| `src/lib/crt-surface.ts` | Boot, texture upload, relayout, theme observer, run/stop policy. Knows nothing about content. |
| `src/lib/crt-scene.ts` | Draws a parallax scene on a 2D canvas. Knows nothing about the shader. |
| `src/lib/scenes.json` + `scenes.ts` | The plane list: order, depth, tone, gain. Read by the site *and* by the build scripts. |
| `src/components/CrtScene.astro` | The element: fallback picture, canvas, and the wiring between them. |

`crt-surface.ts` is an extraction, not a new abstraction: every line of it was
already running in `TerminalField.astro`, which now consumes it through a small
adapter. The hero's own behaviour is unchanged, verified by screenshot in both
themes and — separately — in its fallback state.

### The source contract

```ts
interface CrtSource {
  canvas; width; height; dirty; lightPolarity; screenBackground;
  tick(dt); draw(time); drawSignalLoss(); refreshTokens(); resize(aspect, narrow);
}
```

A source owns a canvas, redraws it when it feels like it, and reports which
polarity the tube should be in. `crt-terminal.ts` satisfies it through an adapter
that carries its typing options; `crt-scene.ts` satisfies it directly.

## The four decisions that shaped it

### 1. Polarity: a scene mirrors the terminal, or it renders as a negative

The shader's light path is subtractive — `crt-shader.ts:167` computes
`screenBg - col`. A picture drawn as emission on the light theme therefore comes
back as a photographic negative in a hue the accent registry never blessed.

The fix is not a second light-theme treatment. It is that a source must do what
`crt-terminal.ts` already does: on dark, black ground and planes added together
as emission; on light, the page's own paper and planes laid down as ink. Measured
by screenshot before the rest of the work was designed. **This was the spike, and
it came back favourable**: no dark-only compromise was needed.

### 2. Occluders: a foreground silhouette is not light to add

An additive compositor can only put light in. A rooftop or the back of a crowd
takes light *out*, and adding it produces a bright slab where a silhouette
belongs.

So `tone: "occluder"` is a fifth kind of plane, and it is a mask rather than a
picture: on glass it is drawn with `destination-out`, punching the planes behind
it back to the tube's black; on paper it is solid ink over them. The background
is then filled in **underneath** with `destination-over`, because
`copyExternalImageToTexture` does not un-premultiply and a transparent pixel
would otherwise reach the GPU as a colour nobody chose.

### 3. Text on glass needs a ground, not a dimmer picture

`/apparel` puts the heading and the lede on the surface. Measured with
`scripts/contrast-probe.mjs`, the light theme bottomed out at **1.00:1** — the
tube matching the lede's own colour exactly — and the scene had to fall to a
smudge before it cleared 4.5:1. Both the text and the picture are ink on paper;
they are the same substance.

Two moves fixed it, and the numbers are in the table below:

- The scene runs at `LIGHT_SCALE = 0.3` on the light theme, so it reads as a pale
  engraving under the type rather than a night behind it.
- The left of the tube is lit to the page's own canvas colour and falls off
  across the frame — a broadcast's lower-third, not a wash over a photo. The
  picture survives where nothing is read, which is most of the frame.

### 4. One asset story, two render tiers

| | Every visitor | WebGPU visitors, in view |
|---|---|---|
| Downloads | one flattened composite, ~22–31 KB | four plates, ~72–78 KB |
| Renders | `<img>` under the site's shatter bands | the tube |

The flattened composite is built by `scripts/make-scene-flats.mjs` **using the
same compositing rules as the runtime** — emissive planes added, occluders
subtracted — so the fallback is the picture the tube would have shown rather than
a different arrangement of the same parts. It is stored neutral and tinted in
CSS from the same tokens, so one file serves both themes.

## Measured

Contrast, `scripts/contrast-probe.mjs`, 1440 × 900, worst pixel behind the text:

| Target | Floor | Dark | Light |
|---|---|---|---|
| `.ap-open__h` | 3:1 | 10.13:1 | 8.43:1 |
| `.ap-open__lede` | 4.5:1 | 7.86:1 | 5.06:1 |
| `.ap-open .eyebrow` | 4.5:1 | 4.83:1 | **3.49:1** |

The eyebrow's light-theme figure is **pre-existing and site-wide**: an identical
3.49:1 is measured on `.ap-pact .eyebrow`, in a section with no tube. The scrim
restored it to baseline rather than degrading it. Fixing it is a token decision
that belongs to the whole site, not to this work.

## Not done

- **The artwork is Placeholder (not delivered).** The plates in
  `public/scenes/` are blocks and capsules drawn by
  `scripts/make-scene-placeholders.mjs`. They are the right dimensions, the right
  luminance budget and the right plane structure, and nothing about the pipeline
  changes when they are replaced. `docs/scene-art-prompts.md` is the brief.
- **The scenes do not rotate.** One per page. Cycling would double the asset
  budget for a page whose job is to list posts.
- **Frame rate is unmeasured off Apple Silicon**, as with the hero.
- **The `/apparel` scrim is a visual call made without review.** It is the one
  decision here that is aesthetic rather than forced, and it is the first thing
  to look at.

## Verification

```sh
npm run build && npm run check && npm run audit && npm run motion-gate
node scripts/shoot.mjs http://localhost:4321/blog/ blog
node scripts/shoot.mjs http://localhost:4321/apparel/ apparel
npm run shoot:fallback -- http://localhost:4321/apparel/ apparel
npm run contrast -- http://localhost:4321/apparel/ .ap-open__h .ap-open__lede
```

The fallback has to be photographed separately. Its CSS is inert while the GPU
path runs, which is how the hero's fallback stayed broken for two commits without
anyone seeing it.
