import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

export type CatalogEntry = { title: string; classes: string[]; prose: string; snippets: string[] };
export type CatalogSection = { title: string; entries: CatalogEntry[] };
export type CatalogJson = { components: { id: string; kind: string; classes: string[] }[] };
export type Token = { name: string; value?: string; colour: boolean };
export type TokenGroup = { family: string; tokens: Token[] };

// Sections the page cannot show: effects need the kit's script, the rules are
// prose for authors. Everything else in the catalog is rendered as found.
const SKIPPED = /^(Effects|Rules of use)/i;

/**
 * Parse the kit's agent/catalog.md into sections of entries. The format is the
 * contract: `## Section`, `### Title — \`class\` (\`--mod\`)`, prose, then
 * ```html fences. Anything unrecognised throws, so a kit release that changes
 * the format breaks the build instead of silently emptying the page.
 */
export function parseCatalog(md: string): { sections: CatalogSection[] } {
  const sections: CatalogSection[] = [];
  let section: CatalogSection | undefined;
  let entry: CatalogEntry | undefined;
  let fence: string[] | undefined;
  let skipping = false;

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
      skipping = SKIPPED.test(h2[1]);
      section = skipping ? undefined : { title: h2[1].trim(), entries: [] };
      entry = undefined;
      if (section) sections.push(section);
      continue;
    }
    const h3 = /^### (.+)/.exec(line);
    if (h3 && section) {
      const m = /^(.+?) — (.+)$/.exec(h3[1]);
      const classes = m ? [...m[2].matchAll(/`([^`]+)`/g)].map((c) => c[1]) : [];
      if (!m || !classes.length) throw new Error(`catalog heading not recognised: "${h3[1]}"`);
      entry = { title: m[1].trim(), classes, prose: '', snippets: [] };
      section.entries.push(entry);
      continue;
    }
    if (entry && !fence) entry.prose += `${line}\n`;
  }

  if (fence) throw new Error('catalog ends inside an unclosed code fence');
  const kept = sections.filter((s) => s.entries.length);
  if (!kept.length) throw new Error('catalog has no component sections');
  for (const s of kept)
    for (const e of s.entries) {
      if (!e.snippets.length) throw new Error(`catalog entry "${e.title}" has no html snippet`);
      e.prose = e.prose.trim();
    }
  return { sections: kept };
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
 * shown live by the page.
 */
export function loadKitTokens() {
  const pkg = dirname(kitRoot());
  const version: string = JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8')).version;
  const fixed = parseTokens(readFileSync(join(pkg, 'tokens.css'), 'utf8'));
  const themed = new Map<string, TokenGroup>();
  for (const f of ['light', 'dark', 'high-contrast'])
    parseTokens(readFileSync(join(pkg, 'themes', `${f}.css`), 'utf8'), themed);
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
