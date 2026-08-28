# Sondalab site — Apparel section design & build spec

> **What is this file.** The implementation contract for the Apparel section of
> the Sondalab public website (`sondalab.eu`). Audience: the maintainer and any
> agent editing the site. Owner: Marcello Barile. Companions:
> `docs/specs/2026-08-24-sondalab-site-design.md` is the site-wide contract this
> one inherits from (stack, design-system tier, audit gate); the design system
> itself lives in `sondalab-ai/sondalab-ui`, consumed here as the
> `@sondalab/ui-kit` npm package.

## Goal

A public page at `/apparel/` that sells the *reason* for Sondalab merchandise
before it sells any garment: buying a piece funds Sondalab's open-source
research. Three categories — Tees, Caps, Pants. The commerce core (catalogue,
sizes, prices, cart, checkout, fulfilment) is **out of this site entirely** and
its provider is not yet chosen.

## Load-bearing constraint — the site cannot own checkout

The site is Astro with **static output**, mirrored to an nginx document root by
the deploy workflow. There is no server runtime, so no cart, no session, no
payment handling can live here. That settles the architecture before any
provider is picked: **the integration seam is a single outbound URL.**

Consequences, all deliberate:

- No `apparel` content collection. The catalogue lives at the provider; there is
  nothing here to iterate over, and a collection with no rows would be structure
  without content.
- No provider SDK, no `<script>` from a storefront host, no Buy Button embed in
  v1. Adopting Shopify, Stripe Payment Links, Printful, Big Cartel or Gumroad
  later means setting one URL, not redesigning the page.
- No prices on the site. A price rendered here and a price charged there drift
  the moment either changes.

## Decisions

- **Route**: `/apparel/`, a single static page — `src/pages/apparel/index.astro`.
  Top-level destination like the products pages, indexable, linkable.
- **Navigation**: one entry in `src/components/SiteHeader.astro`, after
  "Method" (then labelled "How it's made"), carrying `keep: true`. Below `34rem` the header nav hides
  every entry without it; Apparel, like Blog, is a destination that scrolling
  cannot reach, so hiding it on a phone would make the section unreachable.
- **Home page untouched.** No teaser block in `src/pages/index.astro`; the
  section numbering (`01`…`04`) of the home sections stays as it is.
- **Accent**: `default`. Apparel gets **no** registered accent of its own, which
  would require an entry in `@sondalab/ui-kit`'s `accent-registry.json`, a
  cross-repo change and a package bump for a single page.
- **Branch**: `feat/apparel`, rebased onto `main` at `d81fa1e` once the
  Transmissions blog merged (https://github.com/sondalab-ai/sondalab-site/pull/2).
- **Category vocabulary**: `Tees` · `Caps` · `Pants`. English, like the rest of
  the site, and short enough for the mono-uppercase register.

## The store switch

All state that changes when a provider is chosen lives in one new module,
`src/lib/apparel.ts`:

```ts
export const APPAREL = {
  /** Storefront URL. `null` until a provider is chosen: the page renders its
   *  "in preparation" state and the categories are inert. Set it and every
   *  call to action becomes a live link — no other file changes. */
  storeUrl: null as string | null,
  categories: [
    { id: 'tees',  label: 'Tees',  note: 'Heavyweight, printed small.' },
    { id: 'caps',  label: 'Caps',  note: 'Low profile, no logo wall.' },
    { id: 'pants', label: 'Pants', note: 'Workwear cut.' },
  ],
} as const;
```

A `category` may later carry its own `href` for a provider collection URL. Until
then the page derives both states from `storeUrl` alone:

| `storeUrl` | Status band | Categories | Call to action |
|---|---|---|---|
| `null` | `// in preparation` | inert `<li>` rows | `mailto:info@sondalab.eu`, subject prefilled |
| set | `// open` | rows link to the store | "Visit the store", `target="_blank" rel="noopener noreferrer"` |

The email address comes from `SITE.email` in `src/lib/site.ts`; it is not
repeated here.

## Page structure

Editorial, funding-led, typographic. Explicitly **not** a rounded-card grid —
the house anti-pattern. Four movements:

1. **Opening** — full-bleed, eyebrow `Apparel`, an oversized `.display`
   headline stating the pact, a `.lede` beneath it. Reuses the existing
   `.wrap` / `.eyebrow` / `.display` / `.lede` primitives from
   `src/styles/site.css`.
2. **The pact** — asymmetric split (roughly `1.1fr 0.9fr`, collapsing to one
   column below `52rem`, matching `Contact.astro`): left, why merchandise funds
   research; right, a mono list of what the proceeds buy. **No percentages and
   no figures** — a published split is a commitment that has to stay true, and
   it was not asked for.
3. **The three categories** — a numbered `<ol>` in the same editorial register
   as `ProductsIndex.astro`: numeral, rule, name, one-line note, and the
   category plate. Rows are `<li>` while `storeUrl` is `null` and become `<a>`
   when it is set. Above `52rem` each row is a half-and-half split with the
   plate at roughly `26rem`, and the plate alternates side row by row so the
   column reads as a rhythm rather than as three copies of one card; below it,
   the row stacks and the plate is capped at `22rem`. The plate keeps its 4:5
   frame at every width — it holds a drawing, which cropping would damage.
   Rows reveal on scroll, staggered by index, armed from script so a reader
   without JavaScript gets the page fully visible.
4. **Status band + call to action** — the state from the table above.

**Stock photography, standing in.** No shots of the actual pieces exist yet:
they come from the print-on-demand provider, which has not been chosen. The
plates are therefore stock product photography — three studio shots on neutral
grounds, chosen as a set so the lighting and background read as one series
rather than three unrelated pictures.

| Category | Source | Photographer | Licence |
|---|---|---|---|
| Tees | https://unsplash.com/photos/4rUYuwJ2vGw | mockupbee | Unsplash License |
| Caps | https://unsplash.com/photos/ozdzzeBu4Go | personalgraphic.com | Unsplash License |
| Pants | https://unsplash.com/photos/h6PKsr0wDH4 | TuanAnh Blue (@blueeyeaa) | Unsplash License |

The Unsplash License permits commercial use and modification, requires no
permission and no attribution, and forbids reselling the images unaltered or
building a competing image service (https://unsplash.com/license). The credits
above are recorded because the licence's terms are worth being able to check,
not because attribution is owed.

Two constraints drove the selection. **No people**: a commercial page using a
recognisable person needs a model release, and a face on a merchandising tile
implies an endorsement that does not exist. **No third-party brand marks**: the
pants shot carries a maker's label on the waistband, and the frame was cropped
to exclude it rather than retouched — a filled patch was tried first and read
as a censored block.

These are not Sondalab garments. While `storeUrl` is `null` and the page states
`// in preparation`, nothing on it claims otherwise. **When the store opens,
these files have to be replaced with photography of the real pieces**, or the
page becomes misleading. The plates live in `src/assets/apparel/` and are
served through `astro:assets`, which emits responsive WebP at build time;
replacing one means swapping the file, with no markup or CSS changes.

## Copy

The wording shipped on the page:

- Headline: *Wear the thesis. Fund the work.*
- Lede: *Sondalab's tools are open, local, and free to run. Nothing about that
  pays for itself. Apparel is how the research gets funded — you get something
  worth wearing, the work gets another month.*
- Pact, left: the argument that independent research without a funding model
  either takes investment and its incentives, or finds its own money.
- Pact, right (mono list): `compute` · `hardware` · `time`.
- Categories: `Tees` — *Heavy cotton, printed small. Made to outlast the
  framework it shipped with.* / `Caps` — *Low profile. Nothing on it announces
  anything, which is the whole specification.* / `Pants` — *Cut for standing at
  a bench, not for a lookbook.*

  The notes carry voice but **no specifications** — no fabric weights, no
  pocket counts, no measurements. Nothing is manufactured yet, and a number in
  this field becomes a promise the eventual garment has to keep.
- Waiting state: `// in preparation` and *Tell me when it drops.*

**Corrupting plates.** Each photograph carries the site's existing `shatter`
glitch (`src/lib/glitch.ts`, `.glitch--shatter` in `src/styles/site.css`):
during a burst the plate breaks into eight horizontal bands that jump sideways.
Two differences from the text version. The intact image stays visible
underneath instead of being hidden, so a displaced band doubles over what it
left behind — which is what datamoshed video actually looks like. And the bands
are `background-image` layers off a single `getImage()` URL rather than eight
duplicated `<Image>` tags, so the markup carries one resolved URL per category
instead of eight srcsets.

Two of the eight bands take a brand channel — amber and teal — as a flat tint
at 15% and 13%. Not `mix-blend-mode: screen`, which the text glitch uses: two
of the three photographs are shot on white, and screen over white is a no-op.
The alpha is low because the first attempt at 34% turned the band into a pastel
slab that hid the garment.

Bursts fire once as a row reveals, then ambiently every 9–17s, and on hover —
the same trigger the product rows use for their names. As everywhere on this
site, `prefers-reduced-motion` is deliberately not consulted; see
`scripts/motion-gate.mjs`.

## Out of scope

Cart, checkout, prices, inventory, sizes, discount codes, per-garment pages,
provider SDKs, order tracking, shipping and returns pages, and any legal text
beyond what the provider supplies.

## Provider selection — a note, not a task

Choosing the storefront is a later decision, but one criterion is worth
recording now: a **merchant-of-record** provider (Shopify, Gumroad, Printful's
own storefront) takes on EU VAT registration, cross-border shipping and returns
handling as part of its service, whereas a self-hosted checkout leaves all of it
with Sondalab. *(Assumption — general property of merchant-of-record
arrangements; verify against the specific provider's terms before committing.)*

## Files

| File | Change |
|---|---|
| `src/pages/apparel/index.astro` | new — the page |
| `src/lib/apparel.ts` | new — the store switch and category data |
| `src/assets/apparel/{tees,caps,pants}.jpg` | new — stock category photography |
| `src/components/SiteHeader.astro` | edit — one nav entry |
| `docs/specs/2026-08-27-apparel-design.md` | new — this spec |

`src/content.config.ts`, `src/pages/index.astro`, `src/lib/accents.ts` and
`@sondalab/ui-kit` are **not** touched.

## Verification

- `npx astro check` — zero errors.
- `npm run audit` — the design-system gate at **0 R-violations**. Every colour
  in the new `<style>` block must resolve to a DS token; no raw hex.
- `npm run build` — the page is emitted at `dist/apparel/index.html`.
- Manual: both themes via the header toggle; the nav entry; layout at 375px and
  1440px; the `mailto:` opens with the subject prefilled.

- `npm run motion-gate` — the page must not gate its motion behind
  `prefers-reduced-motion` in a way that disables it for everyone.
