import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro:schema';

/**
 * Product status vocabulary, mirrors the PM status legend rendered on the
 * page. A closed enum is the whole point: an agent editing a product file
 * cannot silently promote a PoC to "shipped", a wrong value fails the build.
 */
const STATUS = ['shipped', 'public-beta', 'beta', 'poc', 'research', 'archived'] as const;

/**
 * Accent keys are the registered products in @sondalab/ui-kit's
 * accent-registry.json. Restricting to this set means a product page can only
 * ever pin an accent the design system actually knows, no invented hues.
 */
const ACCENT = ['default', 'spexr', 'introspect', 'local-agents'] as const;

/**
 * What kind of thing the product is, as shown to a visitor. IDE, App and Page
 * match the design system's substrate matrix (substrate-matrix.json); CLI is its
 * "Term" substrate under a name a visitor reads at a glance; Library and Kit are
 * site-only labels for products that ship no UI substrate of their own.
 */
const FORM = ['IDE', 'App', 'Page', 'CLI', 'Library', 'Kit'] as const;

/**
 * Which shelf of the index a product sits on: a tool you use, or a research
 * bench whose findings are the point. The home page renders the two apart.
 */
const KIND = ['product', 'research'] as const;

const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: z.object({
    name: z.string(),
    tagline: z.string().max(90),
    // Optional: a product may show no maturity label at all.
    status: z.enum(STATUS).optional(),
    accent: z.enum(ACCENT).default('default'),
    form: z.enum(FORM),
    kind: z.enum(KIND).default('product'),
    /** Sort order in the editorial index; flagship first. */
    order: z.number().int().nonnegative(),
    /** Canonical source repo. Rendered as a link only when repoPublic is true. */
    repo: z.string().url().optional(),
    repoPublic: z.boolean().default(false),
    links: z
      .array(z.object({ label: z.string(), href: z.string().url() }))
      .default([]),
    /**
     * The product's long-form page on this site (e.g. /daos/), linked from its
     * product page. An internal path with the trailing slash every site URL
     * carries (astro.config.mjs); `links` is for absolute external URLs only.
     */
    fullPage: z
      .object({
        href: z.string().regex(/^\/[a-z0-9-]+(\/[a-z0-9-]+)*\/$/),
        label: z.string(),
      })
      .optional(),
    /** One-sentence "does X to solve Y" for the index row. */
    summary: z.string(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    /**
     * Publication date, `YYYY-MM-DD`. Drives ordering, the archive label and
     * the feed's pubDate, so it is required rather than defaulted: a post with
     * no date would silently sort to the epoch.
     */
    date: z.coerce.date(),
    /** One-sentence standfirst. Shown in the index row, the feed and the meta description. */
    summary: z.string().max(200),
    /**
     * Work in progress. Still rendered by `astro dev`, dropped from production
     * builds, so an unfinished post can be committed without shipping it.
     */
    draft: z.boolean().default(false),
  }),
});

export const collections = { products, blog };
