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
  "How it's made". No `keep` attribute — on `main` the header nav hides in full
  below `34rem`, so Apparel behaves exactly like every other entry.
- **Home page untouched.** No teaser block in `src/pages/index.astro`; the
  section numbering (`01`…`04`) of the home sections stays as it is.
- **Accent**: `default`. Apparel gets **no** registered accent of its own, which
  would require an entry in `@sondalab/ui-kit`'s `accent-registry.json`, a
  cross-repo change and a package bump for a single page.
- **Branch**: `feat/apparel`, cut from `main`. Independent of the unmerged
  `feat/blog`; expect a one-line conflict in `SiteHeader.astro` whenever blog
  merges.
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
   as `ProductsIndex.astro`: numeral, rule, name, one-line note. Rows are `<li>`
   while `storeUrl` is `null` and become `<a>` when it is set.
4. **Status band + call to action** — the state from the table above.

**No photography in v1.** The repo has no `astro:assets` pipeline and no image
directory, and garment mockups normally come from the print-on-demand provider —
so they depend on a decision that has not been made. The page is typographic,
which is consistent with the site's voice, and images slot into the category
rows when they exist.

## Copy (draft — owner to review for voice)

Placeholder text carrying the intended meaning, not final wording:

- Headline: *Wear the thesis. Fund the work.*
- Lede: *Sondalab's tools are open, local, and free to run. Nothing about that
  pays for itself. Apparel is how the research gets funded — you get something
  worth wearing, the work gets another month.*
- Pact, left: the argument that independent research without a funding model
  either takes investment and its incentives, or finds its own money.
- Pact, right (mono list): `compute` · `hardware` · `time`.
- Categories: `Tees` — *heavyweight, printed small.* / `Caps` — *low profile,
  no logo wall.* / `Pants` — *workwear cut.*
- Waiting state: `// in preparation` and *Tell me when it drops.*

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

(`npm run motion-gate` does not exist on `main` — it arrives with `feat/blog`.
If this branch is rebased onto a `main` that has it, run it too.)
