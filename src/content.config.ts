import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro:schema';

/**
 * Product status vocabulary, mirrors the PM status legend rendered on the
 * page. A closed enum is the whole point: an agent editing a product file
 * cannot silently promote a PoC to "shipped", a wrong value fails the build.
 */
const STATUS = ['shipped', 'public-beta', 'beta', 'poc'] as const;

/**
 * Accent keys are the registered products in @sondalab/ui-kit's
 * accent-registry.json. Restricting to this set means a product page can only
 * ever pin an accent the design system actually knows, no invented hues.
 */
const ACCENT = ['default', 'spexr', 'introspect', 'local-agents'] as const;

/**
 * What kind of thing the product is, as shown to a visitor. The first four match
 * the design system's substrate matrix (substrate-matrix.json); Library and Utils
 * are site-only labels for products that ship no UI substrate of their own.
 */
const SURFACE = ['IDE', 'App', 'Page', 'Term', 'Library', 'Utils'] as const;

const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: z.object({
    name: z.string(),
    tagline: z.string().max(90),
    // Optional: a product may show no maturity label at all.
    status: z.enum(STATUS).optional(),
    accent: z.enum(ACCENT).default('default'),
    surface: z.enum(SURFACE),
    /** Sort order in the editorial index; flagship first. */
    order: z.number().int().nonnegative(),
    /** Canonical source repo. Rendered as a link only when repoPublic is true. */
    repo: z.string().url().optional(),
    repoPublic: z.boolean().default(false),
    links: z
      .array(z.object({ label: z.string(), href: z.string().url() }))
      .default([]),
    /** One-sentence "does X to solve Y" for the index row. */
    summary: z.string(),
  }),
});

export const collections = { products };
