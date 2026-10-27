/**
 * The kit's page-head posters (ui-kit 0.42), and the site's mirror of each.
 * '' is the bare `.sl-art-poster` (a horizon); the others name the modifier
 * worn with it. Mirrored, a composition is a different picture on the same
 * whole-px cells, so four compositions give eight looks.
 */
export const POSTER_VARIANTS = ['', 'orbit', 'stair', 'bleed'] as const;
export type PosterVariant = (typeof POSTER_VARIANTS)[number];

/** The site's mirror: `scaleX(-1)` on the box (site.css), so it stays crisp. */
export const POSTER_FLIP = 'poster--flip';

const LOOKS = POSTER_VARIANTS.length * 2;

/** The classes for one poster: the kit's piece, its composition, the mirror. */
export function posterClass(variant: PosterVariant, flip = false): string {
  return ['sl-art-poster', variant && `sl-art-poster--${variant}`, flip && POSTER_FLIP].filter(Boolean).join(' ');
}

/**
 * The fixed posters of the pages that are not a collection entry, one look
 * each. Five pages and four compositions, so one composition comes back,
 * mirrored, on the two pages furthest apart (apparel and the design system).
 */
export const PAGE_POSTER_LOOKS = {
  blog: ['orbit', false],
  spexr: ['stair', false],
  daos: ['bleed', false],
  apparel: ['', false],
  designSystem: ['', true],
} as const satisfies Record<string, readonly [PosterVariant, boolean]>;

export const PAGE_POSTERS = Object.fromEntries(
  Object.entries(PAGE_POSTER_LOOKS).map(([page, [variant, flip]]) => [page, posterClass(variant, flip)]),
) as Record<keyof typeof PAGE_POSTER_LOOKS, string>;

/** FNV-1a over the slug: the look a page starts from, stable across builds. */
function slugLook(slug: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) h = Math.imul(h ^ slug.charCodeAt(i), 0x01000193) >>> 0;
  return h % LOOKS;
}

const variantOf = (look: number): PosterVariant => POSTER_VARIANTS[look % POSTER_VARIANTS.length];

/**
 * The posters for pages a reader opens one after the other (products by
 * order, posts newest first), keyed by slug. Each page starts from its slug's
 * look and steps on past any look whose composition matches the page before
 * it, so neighbours never share a composition, mirrored or not. `before` is
 * the composition of the page that leads into the first one (the archive's
 * own poster, for the newest post). The guarantee stops at the ends: the
 * oldest post's "read next" wraps to the newest, which may match, and a new
 * post shifts the looks of the ones after it.
 */
export function posterSequence(slugs: readonly string[], before?: PosterVariant): Map<string, string> {
  const out = new Map<string, string>();
  let prev: PosterVariant | undefined = before;
  for (const slug of slugs) {
    let look = slugLook(slug);
    if (variantOf(look) === prev) look = (look + 1) % LOOKS;
    prev = variantOf(look);
    out.set(slug, posterClass(prev, look >= POSTER_VARIANTS.length));
  }
  return out;
}
