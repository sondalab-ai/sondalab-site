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
   * Category plate. Generated placeholders until the provider supplies real
   * product shots; swapping the file in `src/assets/apparel/` is the whole
   * replacement, no markup changes.
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

  categories: [
    { id: 'tees', label: 'Tees', note: 'Heavyweight, printed small.', image: teesImage },
    { id: 'caps', label: 'Caps', note: 'Low profile, no logo wall.', image: capsImage },
    { id: 'pants', label: 'Pants', note: 'Workwear cut.', image: pantsImage },
  ],
};

/** Where a category row points, or `null` while the store does not exist yet. */
export function categoryHref(c: ApparelCategory): string | null {
  return c.href ?? APPAREL.storeUrl;
}
