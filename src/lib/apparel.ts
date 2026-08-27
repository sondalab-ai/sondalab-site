/**
 * Everything about the Apparel section that changes when a storefront provider
 * is finally chosen. The site is static output on nginx: it cannot own a cart
 * or a checkout, so the whole integration seam is one outbound URL.
 */

export interface ApparelCategory {
  id: string;
  label: string;
  note: string;
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
    { id: 'tees', label: 'Tees', note: 'Heavyweight, printed small.' },
    { id: 'caps', label: 'Caps', note: 'Low profile, no logo wall.' },
    { id: 'pants', label: 'Pants', note: 'Workwear cut.' },
  ],
};

/** Where a category row points, or `null` while the store does not exist yet. */
export function categoryHref(c: ApparelCategory): string | null {
  return c.href ?? APPAREL.storeUrl;
}
