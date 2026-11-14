/**
 * Ordering and links of the /ads/docs/ pages. Pure, so scripts/*.test.mjs
 * can import it without Astro: the pages map their collection entries to
 * DocRef before they call it.
 */

export interface DocRef {
  id: string;
  title: string;
  order: number;
}

/**
 * The pages sorted by their `order`. Two pages with the same order would
 * make the sidebar and the previous/next links depend on file order, so a
 * duplicate fails the build instead.
 */
export function orderDocs<T extends DocRef>(docs: readonly T[]): T[] {
  const sorted = [...docs].sort((a, b) => a.order - b.order);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].order === sorted[i - 1].order) throw new Error(`ads docs: duplicate order ${sorted[i].order}`);
  }
  return sorted;
}

/**
 * The page before and after `id` in the ordered list, null at either end
 * and for an id that is not in the list (the index page).
 */
export function neighbours<T extends DocRef>(docs: readonly T[], id: string): { prev: T | null; next: T | null } {
  const i = docs.findIndex((d) => d.id === id);
  if (i < 0) return { prev: null, next: null };
  return { prev: docs[i - 1] ?? null, next: docs[i + 1] ?? null };
}

/** The URL of a docs page, with the trailing slash every site URL carries. */
export function docHref(id: string): string {
  return `/ads/docs/${id}/`;
}
