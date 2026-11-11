/**
 * The kit's page-head posters (procedural prints since ui-kit 0.45).
 * '' is the bare `.sl-art-poster` (a dawn over the sea); the others name the
 * modifier worn with it. A scene is a class; the picture of that scene comes
 * from the page's seed (`data-sl-art-seed`, drawn by the kit's `mountArt()`
 * in Base.astro), so every page shows a picture of its own. With no
 * JavaScript a page shows the kit's canonical picture of its scene.
 */
export const POSTER_VARIANTS = ['', 'overprint', 'hills', 'orbit'] as const;
export type PosterVariant = (typeof POSTER_VARIANTS)[number];

/** The classes for one poster: the kit's piece and its scene. */
export function posterClass(variant: PosterVariant): string {
  return ['sl-art-poster', variant && `sl-art-poster--${variant}`].filter(Boolean).join(' ');
}

/**
 * The fixed posters of the pages that are not a collection entry: the scene
 * and the seed of each. A head that already carries a CRT scene (the
 * archive, apparel) wears no poster: one picture to a head, or the flat
 * print and the photographic scene read as two sites (owner, 2026-11-11).
 */
export const PAGE_POSTER_LOOKS = {
  spexr: ['hills', 'spexr'],
  daos: ['overprint', 'daos'],
  designSystem: ['', 'design-system'],
} as const satisfies Record<string, readonly [PosterVariant, string]>;

type Page = keyof typeof PAGE_POSTER_LOOKS;
const pages = Object.entries(PAGE_POSTER_LOOKS) as [Page, readonly [PosterVariant, string]][];

export const PAGE_POSTERS = Object.fromEntries(pages.map(([page, [variant]]) => [page, posterClass(variant)])) as Record<Page, string>;
export const PAGE_POSTER_SEEDS = Object.fromEntries(pages.map(([page, [, seed]]) => [page, seed])) as Record<Page, string>;

/** FNV-1a over the slug: the scene a page starts from, stable across builds. */
function slugLook(slug: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) h = Math.imul(h ^ slug.charCodeAt(i), 0x01000193) >>> 0;
  return h % POSTER_VARIANTS.length;
}

/**
 * The posters for pages a reader opens one after the other (products by
 * order, posts newest first), keyed by slug. Each page starts from its slug's
 * scene and steps on past the scene of the page before it, so neighbours
 * never share a scene. `before` is the scene of the page that leads into the
 * first one, when it wears a poster. The page's slug
 * is also its seed, so two pages of one scene still show two pictures. The
 * guarantee stops at the ends: the oldest post's "read next" wraps to the
 * newest, which may match, and a new post shifts the scenes of the ones
 * after it.
 */
export function posterSequence(slugs: readonly string[], before?: PosterVariant): Map<string, string> {
  const out = new Map<string, string>();
  let prev: PosterVariant | undefined = before;
  for (const slug of slugs) {
    let look = slugLook(slug);
    if (POSTER_VARIANTS[look] === prev) look = (look + 1) % POSTER_VARIANTS.length;
    prev = POSTER_VARIANTS[look];
    out.set(slug, posterClass(prev));
  }
  return out;
}
