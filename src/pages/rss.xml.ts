import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '../lib/blog';
import { SITE } from '../lib/site';

/** Feed for the transmissions. `context.site` comes from astro.config.mjs. */
export async function GET(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: `${SITE.name} · Transmissions`,
    description:
      'Field notes on local-first agents, legible runs and the tooling that keeps an operator in the loop.',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.summary,
      pubDate: post.data.date,
      link: `/blog/${post.id}/`,
    })),
  });
}
