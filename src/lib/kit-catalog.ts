import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

export type CatalogEntry = { title: string; classes: string[]; prose: string; snippets: string[] };
export type CatalogSection = { title: string; stylesheet?: string; entries: CatalogEntry[] };
export type CatalogJson = { components: { id: string; kind: string; classes: string[] }[] };
export type TokenKind = 'colour' | 'space' | 'radius' | 'size' | 'font' | 'line' | 'z' | 'motion' | 'shadow' | 'focus' | 'value';
/** `themed` tokens differ per theme and carry no value here; `kind` picks the page's preview. */
export type Token = { name: string; value?: string; colour: boolean; themed?: boolean; kind?: TokenKind };
export type TokenGroup = { family: string; tokens: Token[] };

// The one section that is prose for authors, with nothing to draw.
const SKIPPED = /^Rules of use/i;

/**
 * Parse the kit's agent/catalog.md into sections of entries. The format is the
 * contract: `## Section`, `### Title — \`class\` (\`--mod\`)`, prose, then
 * ```html fences. An entry with no class in its heading or no html fence is
 * prose (a runtime contract, a stylesheet note) and is dropped; the page's
 * test checks that every component the kit's index names still has an entry.
 * A fence left open, or no component at all, throws, so a kit release that
 * changes the format breaks the build instead of silently emptying the page.
 * A section title that names a stylesheet (`effects.css`) records it.
 */
export function parseCatalog(md: string): { sections: CatalogSection[] } {
  const sections: CatalogSection[] = [];
  let section: CatalogSection | undefined;
  let entry: CatalogEntry | undefined;
  let fence: string[] | undefined;

  for (const line of md.split(/\r?\n/)) {
    if (fence) {
      if (line.startsWith('```')) {
        if (entry && fence[0] === 'html') entry.snippets.push(fence.slice(1).join('\n'));
        fence = undefined;
      } else fence.push(line);
      continue;
    }
    if (line.startsWith('```')) {
      fence = [line.slice(3).trim()];
      continue;
    }
    const h2 = /^## (.+)/.exec(line);
    if (h2) {
      const title = h2[1].trim();
      section = SKIPPED.test(title) ? undefined : { title, stylesheet: /`([\w./-]+\.css)`/.exec(title)?.[1], entries: [] };
      entry = undefined;
      if (section) sections.push(section);
      continue;
    }
    const h3 = /^### (.+)/.exec(line);
    if (h3 && section) {
      const m = /^(.+?) — (.+)$/.exec(h3[1]);
      const classes = m ? [...m[2].matchAll(/`([^`]+)`/g)].map((c) => c[1]) : [];
      entry = { title: (m?.[1] ?? h3[1]).trim(), classes, prose: '', snippets: [] };
      section.entries.push(entry);
      continue;
    }
    if (entry) entry.prose += `${line}\n`;
  }

  if (fence) throw new Error('catalog ends inside an unclosed code fence');
  for (const s of sections) {
    s.entries = s.entries.filter((e) => e.classes.length && e.snippets.length);
    for (const e of s.entries) e.prose = e.prose.trim();
  }
  const kept = sections.filter((s) => s.entries.length);
  if (!kept.length) throw new Error('catalog has no component sections');
  return { sections: kept };
}

/** Where a snippet's placeholder assets resolve on this page. */
export type SpecimenAssets = { image: string; halftone: string };

// The catalog writes "…" where a button's icon goes; draw an icon there.
const ICON =
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="3" cy="8" r="1.25"/><circle cx="8" cy="8" r="1.25"/><circle cx="13" cy="8" r="1.25"/></svg>';

// The catalog writes "…" for a component's content. A bare ellipsis shows
// nothing of what the component does, so each placeholder host gets sample
// content of its own kind. The "Markup" code keeps the catalog's shorthand.
const LINE = 'Sample copy sets in the kit\'s type and spacing, so the box reads as a surface and not as an empty frame.';
const PROSE =
  '<h2>A heading sets the measure</h2><p>Running text caps at about 63 characters, with <a href="#">a link</a>, <strong>strong text</strong> and <code>inline code</code> that keep their own rhythm.</p>' +
  '<h3>Lists and quotes</h3><ul><li>An unordered item</li><li>Another item</li></ul><ol><li>A first step</li><li>A second step</li></ol>' +
  '<blockquote>A quotation indents and takes the secondary ink.</blockquote><pre><code>const measure = "63ch";</code></pre>';
const FILL: [RegExp, string][] = [
  [/<div class="sl-prose">\s*<p>…<\/p>\s*<\/div>/g, `<div class="sl-prose">${PROSE}</div>`],
  [/(<(?:aside|main|div) class="sl-pane"[^>]*aria-label="([^"]+)"[^>]*>)…(<\/(?:aside|main|div)>)/g, '$1<p class="sl-eyebrow">$2</p><p>' + LINE + '</p>$3'],
  [/(<article class="sl-card[^"]*"[^>]*>)\s*…\s*(<\/article>)/g, '$1<strong>Card title</strong><p>' + LINE + '</p>$2'],
  [/(<div class="sl-wrap">) … (<\/div>)/g, '$1<p class="ds-wrapbox">sl-wrap: the content measure</p>$2'],
  [/(<section class="sl-haze">) … (<\/section>)/g, '$1<div class="sl-wrap"><h2>Light as atmosphere</h2><p>' + LINE + '</p></div>$2'],
  [/(<section class="sl-art-field[^"]*">) … (<\/section>)/g, '$1<p>' + LINE + '</p>$2'],
  // The poster's page head (ui-kit 0.42): its <h1> is a <div> by now.
  [/(<header>\s*<div>) <div>…<\/div> <p>…<\/p> (<\/div>)/g, '$1<p><strong>A page head</strong></p><p>' + LINE + '</p>$2'],
];
const HGRID_CELL = '<p class="sl-eyebrow">Metric</p><p><strong>42</strong></p><p>One line of copy.</p>';

/**
 * A catalog snippet made safe to draw inside the page. Snippets are copy-paste
 * markup: placeholder URLs must not 404 or navigate, inline handlers must not
 * run, landmarks and headings must not enter the page's own outline, and a
 * closed dialog is transparent by design. After rewriting, anything that
 * still navigates, loads or runs throws, so a snippet shape this cannot
 * handle fails the build.
 */
// What may not survive sanitising: handlers, scripts, embeds, and any attribute that
// loads or navigates unless it is "#" or a data: URI (the page's own image is
// swapped for a data: URI before this runs).
const UNSAFE = new RegExp(
  [
    '\\son[a-z]+\\s*=',
    '<(?:script|iframe|object|embed|link|style|meta|base)\\b',
    '\\s(?:href|src|srcset|action|formaction|poster|srcdoc|xlink:href)\\s*=\\s*(?!["\']?(?:#|data:))',
    'url\\(',
  ].join('|'),
  'i',
);

export function specimen(html: string, assets: SpecimenAssets): string {
  const base = html
    .replace(/<(\/?)(?:main|aside|h[1-6])\b/g, '<$1div')
    .replace(/(\shref=)(["'])(?!#)[^"']*\2/g, '$1"#"')
    .replace(/(<img\b[^>]*?\ssrc=)(["'])(?!data:)[^"']*\2/g, `$1"${assets.image}"`)
    .replace(/(\sdata-sl-src=)(["'])[^"']*\2/g, `$1"${assets.halftone}"`)
    .replace(/\son[a-z]+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(<button\b[^>]*>)…(<\/button>)/g, `$1${ICON}$2`)
    .replace(/<dialog\b(?![^>]*\bopen\b)/g, '<dialog open');
  // After the heading rewrite above, so the sample headings keep their level.
  let out = base;
  for (const [re, to] of FILL) out = out.replace(re, to);
  if (out.includes('class="sl-hgrid"')) out = out.replace(/<div>…<\/div>/g, `<div>${HGRID_CELL}</div>`);
  const left = UNSAFE.exec(out.split(assets.image).join('data:'));
  if (left) throw new Error(`catalog snippet still has "${left[0].trim()}" after sanitising: ${out.slice(0, 80)}…`);
  return out;
}

/** What a token is a token OF, so the page can draw the right preview: a colour is a swatch, a space a bar, a shadow a tile. */
export function kindOf(family: string, t: Token): TokenKind {
  if (['space', 'radius', 'font', 'line', 'z', 'motion', 'shadow'].includes(family)) return family as TokenKind;
  if (t.colour) return 'colour';
  if (family === 'text') return 'size';
  if (family === 'focus') return 'focus';
  return 'value';
}

const COLOUR = /^(#|rgb|hsl|oklch|color-mix|var\()/;

/** Group `--sl-*` declarations by family (`--sl-space-2` → `space`). Private `--_sl-*` macros are skipped. `colour` is read from the value's shape. */
export function parseTokens(css: string, groups = new Map<string, TokenGroup>()): TokenGroup[] {
  for (const m of css.matchAll(/^\s*(--sl-([a-z0-9]+)[a-z0-9-]*):\s*([^;]+);/gm)) {
    const [, name, family, raw] = m;
    const value = raw.trim();
    const g = groups.get(family) ?? { family, tokens: [] };
    const seen = g.tokens.find((t) => t.name === name);
    // A token a theme leaves `initial` is still a colour in the theme that sets it.
    if (seen) seen.colour ||= COLOUR.test(value);
    else g.tokens.push({ name, value, colour: COLOUR.test(value) });
    groups.set(family, g);
  }
  return [...groups.values()];
}

// Ids the page itself uses; a snippet declaring one would shadow an anchor.
const RESERVED_IDS = ['main', 'tokens'];

/**
 * Snippet ids share one document, so a repeat (or a clash with the page's own
 * ids or section anchors, passed as `taken`) would break labels and anchors.
 */
export function assertUniqueIds(sections: CatalogSection[], taken: string[] = []) {
  const seen = new Set([...RESERVED_IDS, ...taken]);
  for (const s of sections)
    for (const e of s.entries)
      for (const html of e.snippets)
        for (const [, , id] of html.matchAll(/\sid=(["'])(.+?)\1/g)) {
          if (seen.has(id)) throw new Error(`catalog snippet id "${id}" (${e.title}) is used twice on the page`);
          seen.add(id);
        }
}

const kitRoot = () => dirname(createRequire(import.meta.url).resolve('@sondalab/ui-kit/agent/catalog.json'));

/** The installed kit's catalog: parsed markdown plus the machine index. */
export function loadKitCatalog() {
  const dir = kitRoot();
  const json: CatalogJson = JSON.parse(readFileSync(join(dir, 'catalog.json'), 'utf8'));
  return { ...parseCatalog(readFileSync(join(dir, 'catalog.md'), 'utf8')), json };
}

/**
 * The installed kit's tokens and version. Fixed tokens carry their value;
 * theme tokens (colour) differ per theme, so they are listed by name only and
 * shown live by the page. Every file in themes/ counts as a theme.
 */
export function loadKitTokens() {
  const pkg = dirname(kitRoot());
  const version: string = JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8')).version;
  const fixed = parseTokens(readFileSync(join(pkg, 'tokens.css'), 'utf8'));
  const themed = new Map<string, TokenGroup>();
  for (const f of readdirSync(join(pkg, 'themes')).filter((n) => n.endsWith('.css')))
    parseTokens(readFileSync(join(pkg, 'themes', f), 'utf8'), themed);
  const themeNames = new Set([...themed.values()].flatMap((g) => g.tokens.map((t) => t.name)));
  const byFamily = new Map<string, TokenGroup>();
  // A name any theme declares differs per theme: listed live, never with a value.
  for (const g of [...fixed, ...themed.values()]) {
    const into = byFamily.get(g.family) ?? { family: g.family, tokens: [] };
    for (const t of g.tokens) {
      if (into.tokens.some((x) => x.name === t.name)) continue;
      const themedToken = themeNames.has(t.name);
      const full: Token = themedToken ? { name: t.name, colour: t.colour, themed: true } : t;
      into.tokens.push({ ...full, kind: kindOf(g.family, full) });
    }
    byFamily.set(g.family, into);
  }
  return { version, groups: [...byFamily.values()] };
}

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (t: string) =>
  esc(t)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s).,;:]|$)/g, '$1<em>$2</em>');
const block = (p: string) => {
  const lines = p.split('\n').map((l) => l.trim());
  if (lines.every((l) => /^- /.test(l))) return `<ul>${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join('')}</ul>`;
  return `<p>${inline(lines.join(' '))}</p>`;
};

/**
 * The catalog's entry prose as safe HTML: paragraphs, `code` and **bold**, and
 * nothing else. The first paragraph says what the component is; the rest is
 * usage (Consumes, Do, Don't), returned apart so the page can fold it.
 */
export function proseParts(prose: string): { lead: string; rest: string } {
  const paras = prose.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const html = (ps: string[]) => ps.map(block).join('');
  return { lead: html(paras.slice(0, 1)), rest: html(paras.slice(1)) };
}
