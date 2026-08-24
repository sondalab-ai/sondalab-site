# Sondalab site — design & build spec

> **What is this file.** The implementation contract for the Sondalab public
> website (`sondalab.eu`). Audience: the maintainer and any agent editing the
> site. Owner: Marcello Barile. Companion: the design system lives in
> `sondalab-ai/sondalab-ui` (consumed here as the `@sondalab/ui-kit` npm
> package); this spec covers only the site that consumes it.

## Goal

A public, editorial site for the Sondalab brand: the thesis, the product suite
(flagship-forward, honest status), and how to make contact. Attractive and
original, rigorously on-brand, deliberately not a generic SaaS template.

## Load-bearing constraint — agentic management

Content is **structured data validated at build time**, not hand-written HTML.
Products live as one Markdown file each under `src/content/products/`, with
frontmatter checked by a typed Zod schema (`src/content.config.ts`). A wrong
edit — a PoC marked `shipped`, an unregistered accent, a missing `verified`
date — **fails the build** instead of publishing a false claim. Plus
`npm run audit` gates every authored style against the design system at **0
R-violations**. Together these make "an agent can safely manage this site" true
rather than aspirational.

## Stack & decisions

- **Astro** (static output). Chosen for content collections + schema validation
  (the constraint above), trivial consumption of the DS's CSS, and one product
  template → N pages.
- **Design system**: `@sondalab/ui-kit@0.7.1` as a real npm dependency (owner
  directive: no vendoring, no sync — a version bump propagates via `npm update`).
  **Tier A / Page substrate** (`data-sl-theme`): greenfield, so it consumes
  `themes/{light,dark}.css` directly. Substrate + tier confirmed against
  `substrate-matrix.json` (product `default` = Page, Tier A).
- **Accent**: the Sondalab **default** accent (amber/teal). Product pages pin
  their own **registered** accent (spexr indigo, introspect cyan, local-agents
  blue, daos → default). Values read from the DS `accent-registry.json`; the
  schema's accent enum forbids inventing a hue.
- **Fonts**: self-hosted via `@fontsource-variable/*` (Fraunces `full.css` for
  the opsz/SOFT/WONK axes, Instrument Sans, Martian Mono). No Google Fonts CDN
  — removes a third-party runtime dep and the `.eu` GDPR exposure.
- **Canonical origin**: `https://sondalab.eu`, set once in `astro.config.mjs`.
- **Hero**: hand-written Canvas2D glow-blob field (the "sonda" motif), adapted
  from the identity board; reads live DS tokens, follows the theme toggle,
  static frame under `prefers-reduced-motion`.

> **Status vocabulary (legend).** `shipped` = in production, available now ·
> `public-beta` = usable, stabilising · `beta` = early, evolving · `poc` = proof
> of concept, **not delivered** · `library` = code you build on, no UI. Rendered
> on the page under the product index.

## Slices

- **Slice 1 — foundation + home** *(this slice)*: repo, Astro, DS dep (Tier A),
  self-hosted fonts, content schema + six product data files, home (hero,
  thesis, editorial product index, contact), audit + type-check + build in CI.
  Host-agnostic — no deploy workflow yet.
- **Slice 2 — product subpages**: one shared template → six pages, each pinning
  its registered accent; rigorous verification of every external link against
  repo visibility (several repos are private — no dead links) before rendering
  `repo`/`links`; `verified` dates refreshed.
- **Slice 3 — contact/social + deploy**: social channels from `SOCIALS` (empty
  until handles exist — no dead links); deploy to the owner's VPS (static build
  behind Caddy, auto-HTTPS) via a small rsync/Action step.

## Open items

- Domain vs brand memory: memory records `sondalab.ai` / org `sondalab-ai`; the
  site canonical and contact use `sondalab.eu` per owner. Reconcile the brand
  record separately.
- Product `repoPublic` currently `false` for all; flip per-repo in Slice 2 after
  visibility checks. External links render only where `repoPublic` is true.
