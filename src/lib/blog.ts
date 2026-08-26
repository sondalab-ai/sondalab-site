import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

/** Average adult prose rate. Only used to round to whole minutes, so precision is moot. */
const WORDS_PER_MINUTE = 200;

/**
 * Strip the markdown that is read as structure rather than prose (fences, link
 * targets, heading marks) before counting, so a post heavy on code blocks does
 * not claim a reading time nobody spends.
 */
function proseWords(body: string): number {
  const text = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^[>#\-*+\s]+/gm, ' ');
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Whole minutes, floor of 1. Derived from the body on every build rather than
 * written in frontmatter: an author editing a post cannot leave it stale.
 */
export function readingTime(body: string | undefined): number {
  if (!body) return 1;
  return Math.max(1, Math.round(proseWords(body) / WORDS_PER_MINUTE));
}

/**
 * Archive label, `2026.08.26`. Read in UTC because `z.coerce.date()` parses a
 * bare `YYYY-MM-DD` as UTC midnight, which local getters can shift a day back.
 */
export function formatDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}.${pad(date.getUTCMonth() + 1)}.${pad(date.getUTCDate())}`;
}

/** Machine-readable form for `<time datetime>` and the feed. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Every published post, newest first. Drafts survive `astro dev` and are
 * dropped from the production build, so this is the only entry point any page,
 * the search index or the feed should use.
 */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) =>
    import.meta.env.PROD ? !data.draft : true,
  );
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
