// Checks the internal links of src/content/** against the built site (dist/).
// Usage: npm run build && node scripts/content-links.mjs [--content <dir>] [--dist <dir>]
// A link passes when its route has a page in dist and its #anchor is an id on that page.
// Exit 0 clean, 1 broken links, 2 on error (for example dist/ is missing).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { markdownToMdast } from 'satteri';

const ROOT = fileURLToPath(new URL('../', import.meta.url));

/** Route each content collection is served under (see src/pages). */
export const COLLECTION_ROUTES = { 'ads-docs': '/ads/docs/', blog: '/blog/', products: '/products/' };

/** Lists the .md and .mdx files under dir, recursively, sorted. */
function contentFiles(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...contentFiles(p));
    else if (/\.mdx?$/.test(e.name)) out.push(p);
  }
  return out.sort();
}

/**
 * Parses Markdown and returns every link and image target as { target, line }.
 * Code spans and fenced or indented code blocks are not links, so the parser's code nodes are skipped.
 * Raw HTML href and src attributes count too.
 */
export function collectLinks(source) {
  const out = [];
  const walk = (node) => {
    if ((node.type === 'link' || node.type === 'image' || node.type === 'definition') && node.url) {
      out.push({ target: node.url, line: node.position.start.line });
    } else if (node.type === 'html') {
      for (const m of node.value.matchAll(/\b(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
        const line = node.position.start.line + node.value.slice(0, m.index).split('\n').length - 1;
        out.push({ target: m[1] ?? m[2], line });
      }
    }
    for (const child of node.children ?? []) walk(child);
  };
  walk(markdownToMdast(source, {}, { trackPositions: true }));
  return out;
}

/** Collects the ids of an HTML document, as a Set. */
export function htmlIds(html) {
  return new Set([...html.matchAll(/\sid\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g)].map((m) => m[1] ?? m[2] ?? m[3]));
}

/**
 * Checks one link target found on the page at pageRoute.
 * Returns null when it is fine or not checked (external, mailto, ...), else the reason it is broken.
 */
export function checkTarget(target, pageRoute, distDir, ids) {
  if (target.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(target)) return null;
  let url;
  try {
    url = new URL(target, `http://site.invalid${pageRoute}`);
  } catch {
    return 'not a valid URL';
  }
  let path;
  try {
    path = decodeURIComponent(url.pathname);
  } catch {
    return 'not a valid URL';
  }
  const asFile = join(distDir, path);
  let htmlFile;
  if (path.endsWith('/')) {
    htmlFile = join(asFile, 'index.html');
    if (!existsSync(htmlFile)) return `no page at ${path}`;
  } else if (existsSync(asFile) && statSync(asFile).isFile()) {
    if (!asFile.endsWith('.html')) return null;
    htmlFile = asFile;
  } else if (existsSync(join(asFile, 'index.html'))) {
    return `missing trailing slash (the site uses trailingSlash: 'always'; use ${path}/)`;
  } else {
    return `no page at ${path}`;
  }
  const hash = url.hash.slice(1);
  if (hash === '' || hash === 'top') return null;
  const anchor = decodeURIComponent(hash);
  if (!ids(htmlFile).has(anchor)) return `no element with id "${anchor}" on ${path}`;
  return null;
}

/**
 * Checks every link of the content files under contentDir against distDir.
 * Returns one { file, line, target, reason } per broken link, where file is relative to contentDir.
 */
export function checkContent(contentDir, distDir, routes = COLLECTION_ROUTES) {
  const cache = new Map();
  const ids = (file) => {
    if (!cache.has(file)) cache.set(file, htmlIds(readFileSync(file, 'utf8')));
    return cache.get(file);
  };
  const broken = [];
  for (const file of contentFiles(contentDir)) {
    const rel = relative(contentDir, file).split('\\').join('/');
    const [collection, ...rest] = rel.split('/');
    const base = routes[collection];
    if (base === undefined) throw new Error(`content links: no route known for collection ${collection} (${rel})`);
    const pageRoute = `${base}${rest.join('/').replace(/\.mdx?$/, '')}/`;
    for (const { target, line } of collectLinks(readFileSync(file, 'utf8'))) {
      const reason = checkTarget(target, pageRoute, distDir, ids);
      if (reason) broken.push({ file: rel, line, target, reason });
    }
  }
  return broken;
}

function main(argv) {
  const opt = (name, fallback) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : fallback);
  const contentDir = opt('--content', join(ROOT, 'src/content'));
  const distDir = opt('--dist', join(ROOT, 'dist'));
  if (!existsSync(distDir)) {
    console.error(`content links: ${distDir} not found, run "npm run build" first`);
    return 2;
  }
  const broken = checkContent(contentDir, distDir);
  for (const b of broken) console.log(`src/content/${b.file}:${b.line}: ${b.target}: ${b.reason}`);
  if (broken.length > 0) console.error(`content links: ${broken.length} broken link(s)`);
  return broken.length > 0 ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    process.exitCode = 2;
  }
}
