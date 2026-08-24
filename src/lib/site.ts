/** Single source for site-wide, non-content constants. */

export const SITE = {
  name: 'Sondalab',
  claim: 'Built for operators, not passengers',
  tagline: 'see it · steer it · own it',
  email: 'info@sondalab.eu',
} as const;

/** Human labels + one-line meaning for the status legend. */
export const STATUS_META: Record<
  string,
  { label: string; note: string }
> = {
  shipped: { label: 'Shipped', note: 'in production, available now' },
  'public-beta': { label: 'Public beta', note: 'usable, still stabilising' },
  beta: { label: 'Beta', note: 'early, evolving fast' },
  poc: { label: 'PoC', note: 'proof of concept — not delivered' },
  library: { label: 'Library', note: 'code you build on, no UI' },
};

/**
 * Social channels — intentionally empty until the handles exist. Rendered only
 * when non-empty, so the site never ships a dead link. Add `{ label, href }`
 * entries here when the accounts are created.
 */
export const SOCIALS: { label: string; href: string }[] = [];
