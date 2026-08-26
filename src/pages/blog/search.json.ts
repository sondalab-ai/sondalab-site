import type { APIRoute } from 'astro';
import { getPosts, readingTime, formatDate, isoDate } from '../../lib/blog';

/**
 * Full archive as a flat list, fetched by the index page on the first
 * keystroke. Search stays client-side and dependency-free, and it sees every
 * post rather than only the page currently rendered.
 */
export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const total = posts.length;
  const body = posts.map((post, i) => ({
    slug: post.id,
    title: post.data.title,
    summary: post.data.summary,
    stamp: formatDate(post.data.date),
    iso: isoDate(post.data.date),
    no: String(total - i).padStart(2, '0'),
    mins: readingTime(post.body),
  }));
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
