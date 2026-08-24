# sondalab-site

The public website for **Sondalab** — a lab for operators. Static site built
with Astro, styled entirely from the `@sondalab/ui-kit` design system.

Canonical: <https://sondalab.eu>

## Develop

```bash
npm install
npm run dev        # local dev server
npm run build      # static output → dist/
npm run preview    # serve the build
```

## Quality gates

```bash
npx astro check    # types
npm run audit      # design-system compliance (0 R-violations required)
node scripts/shoot.mjs   # screenshot both themes → .audit/ (needs local Chrome + a running preview)
```

## Editing content (the agentic path)

Products are data, not markup. Each lives in `src/content/products/<name>.md`
with typed frontmatter. The schema in `src/content.config.ts` is the contract:

- `status` ∈ `shipped | public-beta | beta | poc | library`
- `accent` ∈ `default | spexr | introspect | local-agents` (registered accents only)
- `surface` ∈ `IDE | App | Page | Term | Library`
- `verified` — the date the status/links were last checked

A value outside these sets **fails the build**. Add a product by adding a file;
the home index and (Slice 2) its subpage follow automatically.

Site-wide constants — claim, tagline, contact email, social links — live in
`src/lib/site.ts`. Social links render only when present (no dead links).

See `docs/specs/2026-08-24-sondalab-site-design.md` for the full design.
