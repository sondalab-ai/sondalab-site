import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

export type CatalogEntry = { title: string; classes: string[]; prose: string; snippets: string[] };
export type CatalogSection = { title: string; stylesheet?: string; entries: CatalogEntry[] };
export type CatalogJson = { components: { id: string; kind: string; classes: string[] }[] };
export type Token = { name: string; value?: string; colour: boolean };
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

/**
 * A catalog snippet made safe to draw inside the page. Snippets are copy-paste
 * markup: placeholder URLs must not 404 or navigate, inline handlers must not
 * run, landmarks and headings must not enter the page's own outline, and a
 * closed dialog is transparent by design. After rewriting, anything that
 * still navigates, loads or runs throws, so a snippet shape this cannot
 * handle fails the build.
 */
export function specimen(html: string, assets: SpecimenAssets): string {
  const out = html
    .replace(/<(\/?)(?:main|aside|h[1-6])\b/g, '<$1div')
    .replace(/(\shref=)(["'])(?!#)[^"']*\2/g, '$1"#"')
    .replace(/(<img\b[^>]*?\ssrc=)(["'])(?!data:)[^"']*\2/g, `$1"${assets.image}"`)
    .replace(/(\sdata-sl-src=)(["'])[^"']*\2/g, `$1"${assets.halftone}"`)
    .replace(/\son[a-z]+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(<button\b[^>]*>)…(<\/button>)/g, `$1${ICON}$2`)
    .replace(/<dialog\b(?![^>]*\bopen\b)/g, '<dialog open');
  const left = /\son[a-z]+\s*=|<script\b|\shref=(["'])(?!#)|\ssrc=(["'])(?!data:)/i.exec(out);
  if (left) throw new Error(`catalog snippet still has "${left[0].trim()}" after sanitising: ${out.slice(0, 80)}…`);
  return out;
}

const COLOUR = /^(#|rgb|hsl|oklch|color-mix|var\()/;

/** Group `--sl-*` declarations by family (`--sl-space-2` → `space`). Private `--_sl-*` macros are skipped. `colour` is read from the value's shape. */
export function parseTokens(css: string, groups = new Map<string, TokenGroup>()): TokenGroup[] {
  for (const m of css.matchAll(/^\s*(--sl-([a-z0-9]+)[a-z0-9-]*):\s*([^;]+);/gm)) {
    const [, name, family, raw] = m;
    const value = raw.trim();
    const g = groups.get(family) ?? { family, tokens: [] };
    if (!g.tokens.some((t) => t.name === name)) g.tokens.push({ name, value, colour: COLOUR.test(value) });
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
      into.tokens.push(themeNames.has(t.name) ? { name: t.name, colour: t.colour } : t);
    }
    byFamily.set(g.family, into);
  }
  return { version, groups: [...byFamily.values()] };
}
