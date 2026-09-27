export interface Source {
  /** 1-based, in reading order: the same number the post's superscript shows. */
  n: number;
  text: string;
  href: string;
  /** Hostname without `www.`, shown as the note's label. */
  host: string;
}

/**
 * The external links a post cites, in reading order, for its margin notes.
 * Only `[text](http…)` links count, which is every link the posts use; images,
 * relative links and links back to sondalab.eu are not sources, and fenced code
 * is not scanned. The order must match the CSS counter that numbers the links
 * in the rendered prose, which selects the same set.
 */
export function extractSources(body: string): Source[] {
  const prose = body.replace(/```[\s\S]*?```/g, '');
  const sources: Source[] = [];
  for (const m of prose.matchAll(/(!?)\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g)) {
    const [, bang, raw, href] = m;
    if (bang) continue;
    const host = new URL(href).hostname.replace(/^www\./, '');
    if (host === 'sondalab.eu') continue;
    const text = raw.replace(/\s+/g, ' ').replace(/[*_`]/g, '').trim();
    sources.push({ n: sources.length + 1, text, href, host });
  }
  return sources;
}
