/**
 * Everything about the Apparel section that changes when a storefront provider
 * is finally chosen. The site is static output on nginx: it cannot own a cart
 * or a checkout, so the whole integration seam is one outbound URL.
 */
import type { ImageMetadata } from 'astro';

import capsImage from '../assets/apparel/caps.jpg';
import pantsImage from '../assets/apparel/pants.jpg';
import teesImage from '../assets/apparel/tees.jpg';

export interface ApparelCategory {
  id: string;
  label: string;
  note: string;
  /**
   * Category plate. Stock product photography under the Unsplash License,
   * standing in until the provider supplies shots of the actual pieces —
   * sources and credits are listed in the design spec. Swapping the file in
   * `src/assets/apparel/` is the whole replacement, no markup changes.
   */
  image: ImageMetadata;
  /** Provider collection URL. Falls back to the storefront root when absent. */
  href?: string;
}

export const APPAREL: {
  storeUrl: string | null;
  categories: ApparelCategory[];
} = {
  /**
   * Storefront root. `null` renders the page's "in preparation" state with a
   * mailto call to action; setting it turns every category into a live link.
   * This is the only line that has to change when the provider is picked.
   */
  storeUrl: null,

  // Notes stay evocative and avoid specifications — weights, pockets, fabric
  // counts. Nothing here is manufactured yet, and a number in this field
  // becomes a promise the eventual product has to keep.
  categories: [
    {
      id: 'tees',
      label: 'Tees',
      note: 'Heavy cotton, printed small. Made to outlast the framework it shipped with.',
      image: teesImage,
    },
    {
      id: 'caps',
      label: 'Caps',
      note: 'Low profile. Nothing on it announces anything, which is the whole specification.',
      image: capsImage,
    },
    {
      id: 'pants',
      label: 'Pants',
      note: 'Cut for standing at a bench, not for a lookbook.',
      image: pantsImage,
    },
  ],
};

/** Where a category row points, or `null` while the store does not exist yet. */
export function categoryHref(c: ApparelCategory): string | null {
  return c.href ?? APPAREL.storeUrl;
}
