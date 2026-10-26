import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { assertUniqueIds, parseCatalog, loadKitCatalog, parseTokens, loadKitTokens, proseParts, kindOf, specimen } from '../src/lib/kit-catalog.ts';

// The design-system page is generated from the installed kit, so these tests
// pin the parser's contract on a fixture and then run it against the real
// package: a kit release that changes the catalog's format fails here, not as
// an empty page.

const KIT = dirname(dirname(createRequire(import.meta.url).resolve('@sondalab/ui-kit/agent/catalog.json')));
const read = (...p) => readFileSync(join(...p), 'utf8');

const FIXTURE = `# Title

intro

## Primitives (ready)

### Button — \`sl-btn\` (\`--primary\`)
Prose about it.
\`\`\`html
<button class="sl-btn">Go</button>
\`\`\`
Consumes: \`--slc-text\`.

### A note without a class
\`\`\`html
<link rel="stylesheet" href="x.css">
\`\`\`

### Stylesheet — \`glass.css\`
Prose only.

## Effects (opt-in, \`effects.css\`)

### Glass — \`sl-fx-glass\`
\`\`\`html
<div class="sl-fx-glass"></div>
\`\`\`

## Rules of use

- one
`;

test('splits sections and entries, keeps snippets and prose', () => {
  const { sections } = parseCatalog(FIXTURE);
  const [btn] = sections[0].entries;
  assert.equal(btn.title, 'Button');
  assert.deepEqual(btn.classes, ['sl-btn', '--primary']);
  assert.deepEqual(btn.snippets, ['<button class="sl-btn">Go</button>']);
  assert.match(btn.prose, /Prose about it/);
});

test('effects are kept and name their stylesheet; the rules of use are dropped', () => {
  const { sections } = parseCatalog(FIXTURE);
  assert.deepEqual(sections.map((s) => s.title), ['Primitives (ready)', 'Effects (opt-in, `effects.css`)']);
  assert.equal(sections[0].stylesheet, undefined);
  assert.equal(sections[1].stylesheet, 'effects.css');
});

test('an entry with no class, or no html snippet, is prose and is dropped', () => {
  const entries = parseCatalog(FIXTURE).sections[0].entries;
  assert.deepEqual(entries.map((e) => e.title), ['Button']);
});

test('throws when there is nothing to draw, or a fence is left open', () => {
  assert.throws(() => parseCatalog('# nothing here'), /no component sections/);
  assert.throws(() => parseCatalog('## A\n\n### B — `sl-b`\n```js\nx\n```'), /no component sections/);
  assert.throws(() => parseCatalog('## A\n\n### B — `sl-b`\n```html\n<b></b>\n'), /unclosed/);
});

test('non-html fences are ignored and CRLF parses', () => {
  const md = '## A\r\n\r\n### B — `sl-b`\r\n```html\r\n<b></b>\r\n```\r\n```js\r\nx\r\n```\r\n';
  assert.deepEqual(parseCatalog(md).sections[0].entries[0].snippets, ['<b></b>']);
});

const KINDS = ['effect', 'primitive', 'signature', 'workbench'];

test('every component the kit indexes is on the page, and the index has no unknown kind', () => {
  const { sections, json } = loadKitCatalog();
  const entries = sections.flatMap((s) => s.entries);
  const owner = (cls) => entries.find((e) => e.classes[0] === cls);
  const unknown = [...new Set(json.components.map((c) => c.kind))].filter((k) => !KINDS.includes(k));
  assert.deepEqual(unknown, [], 'a new kind of component: decide how the page shows it');
  const missing = json.components
    .filter((c) => c.kind !== 'effect')
    .filter((c) => !owner(c.classes[0]))
    .map((c) => c.id);
  assert.deepEqual(missing, []);
  assert.ok(entries.some((e) => json.components.some((c) => c.kind === 'effect' && c.classes.includes(e.classes[0]))), 'at least one effect is drawn');
});

test('every stylesheet a catalog section names is imported by the page or the layout', () => {
  const { sections } = loadKitCatalog();
  const code = read('src/pages/design-system.astro') + read('src/layouts/Base.astro');
  const missing = sections.filter((s) => s.stylesheet && !code.includes(`ui-kit/${s.stylesheet}`)).map((s) => s.stylesheet);
  assert.deepEqual(missing, []);
});

test('the installed catalog has unique snippet ids', () => {
  assert.doesNotThrow(() => assertUniqueIds(loadKitCatalog().sections));
});

test('a repeated snippet id, or one that shadows the page, throws', () => {
  const sec = (...ids) => [{ title: 'S', entries: ids.map((id) => ({ title: id, classes: [], prose: '', snippets: [`<i id='${id}'></i>`] })) }];
  assert.throws(() => assertUniqueIds(sec('a', 'a')), /used twice/);
  assert.throws(() => assertUniqueIds(sec('tokens')), /used twice/);
  assert.throws(() => assertUniqueIds(sec('primitives'), ['primitives']), /used twice/);
  assert.doesNotThrow(() => assertUniqueIds(sec('a', 'b')));
});

// ── tokens ───────────────────────────────────────────────────────────────────

test('tokens are grouped by family from the declarations', () => {
  const groups = parseTokens(':root{\n --sl-space-1: 0.25rem;\n --sl-space-2: 0.5rem;\n --sl-radius-sm: 6px;\n --_sl-private: 1;\n}');
  assert.deepEqual(groups.map((g) => g.family), ['space', 'radius']);
  assert.equal(groups[0].tokens.length, 2);
  assert.equal(groups[0].tokens[0].name, '--sl-space-1');
  assert.equal(groups[0].tokens[0].value, '0.25rem');
});

test('the installed tokens: the parse finds every declaration, and theme tokens carry no value', () => {
  const { version, groups } = loadKitTokens();
  assert.match(version, /^\d+\.\d+\.\d+/);
  const all = groups.flatMap((g) => g.tokens);
  const declared = (css) => new Set([...css.matchAll(/(--sl-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
  const themes = readdirSync(join(KIT, 'themes')).filter((n) => n.endsWith('.css')).map((f) => declared(read(KIT, 'themes', f)));
  const themed = new Set(themes.flatMap((s) => [...s]));
  const fixed = declared(read(KIT, 'tokens.css'));
  for (const name of [...fixed, ...themed]) assert.ok(all.some((t) => t.name === name), `${name} is listed`);
  for (const t of all) if (themed.has(t.name)) assert.equal(t.value, undefined, `${t.name} differs per theme`);
});

// ── specimens ────────────────────────────────────────────────────────────────

const ASSETS = { image: 'data:image/png;base64,AA==', halftone: '/_astro/subject.png' };
const run = (html) => specimen(html, ASSETS);

test('a specimen cannot navigate, load or run anything', () => {
  const out = run(`<a href="/specs">a</a><a href='?p=2'>b</a><a href="https://x.dev">c</a><img src="/x.png"><img src='./y.png'><canvas data-sl-src="/art/s.png"></canvas><input oninput="alert(1)" onclick='x()'>`);
  assert.equal([...out.matchAll(/href="#"/g)].length, 3);
  assert.equal([...out.matchAll(/src="data:image\/png/g)].length, 2);
  assert.match(out, /data-sl-src="\/_astro\/subject\.png"/);
  assert.doesNotMatch(out, /\son[a-z]+=/);
});

test('landmarks and headings do not enter the page outline', () => {
  const out = run('<main class="sl-pane"><aside>a</aside><h1 class="sl-anchor">T</h1><h2>U</h2></main>');
  assert.doesNotMatch(out, /<\/?(main|aside|h[1-6])\b/);
  assert.match(out, /<div class="sl-pane"><div>a<\/div><div class="sl-anchor">T<\/div><div>U<\/div><\/div>/);
});

test('a closed dialog opens, an open one is left, an ellipsis button gets an icon', () => {
  assert.match(run('<dialog class="sl-dialog">x</dialog>'), /<dialog open class="sl-dialog">/);
  assert.equal(run('<dialog open>x</dialog>'), '<dialog open>x</dialog>');
  assert.match(run('<button class="sl-icon-btn">…</button>'), /<button class="sl-icon-btn"><svg /);
});

test('the art hosts get sample copy: a spaced card ellipsis and an art field (ui-kit 0.41)', () => {
  assert.match(run('<article class="sl-card sl-art-corner"> … </article>'), /<article class="sl-card sl-art-corner"><strong>Card title<\/strong><p>/);
  assert.match(run('<section class="sl-art-field"> … </section>'), /<section class="sl-art-field"><p>Sample copy/);
});

test('a script in a snippet fails the build', () => {
  assert.throws(() => run('<script>x()</script>'), /<script/);
});

test('every installed snippet sanitises without throwing', () => {
  for (const s of loadKitCatalog().sections) for (const e of s.entries) for (const html of e.snippets) run(html);
});

test('no live specimen is left with a bare ellipsis as its content', () => {
  const { sections } = loadKitCatalog();
  for (const s of sections)
    for (const e of s.entries)
      for (const html of e.snippets) {
        const live = run(html).replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/g, '');
        const m = />\s*(…|\.\.\.)\s*</.exec(live);
        assert.ok(!m, `${e.title}: a placeholder ellipsis is still rendered: ${live.slice(Math.max(0, m?.index - 40), (m?.index ?? 0) + 40)}`);
      }
});

test('a token a theme leaves initial is still a colour where another theme sets it (spectrum)', () => {
  const { groups } = loadKitTokens();
  const spectrum = groups.find((g) => g.family === 'spectrum');
  assert.ok(spectrum.tokens.length > 0);
  for (const t of spectrum.tokens) assert.equal(t.kind, 'colour', `${t.name} is drawn as a swatch`);
});

test('every token gets a preview kind, and only unknown families fall back to a bare value', () => {
  const { groups } = loadKitTokens();
  for (const t of groups.flatMap((g) => g.tokens)) assert.ok(t.kind, `${t.name} has a kind`);
  const byName = Object.fromEntries(groups.flatMap((g) => g.tokens).map((t) => [t.name, t.kind]));
  assert.equal(byName['--sl-space-2'], 'space');
  assert.equal(byName['--sl-shadow-sm'], 'shadow');
  assert.equal(byName['--sl-motion-fast'], 'motion');
});

test('proseParts keeps the first paragraph as the lead, escapes markup, and renders code and bold', () => {
  const { lead, rest } = proseParts('A **bold** `code` <b>x</b>.\n\nSecond paragraph.');
  assert.equal(lead, '<p>A <strong>bold</strong> <code>code</code> &lt;b&gt;x&lt;/b&gt;.</p>');
  assert.equal(rest, '<p>Second paragraph.</p>');
});

test('specimen refuses anything that loads or navigates, in any spelling', () => {
  for (const bad of ['<img src=x>', '<a href = "http://x">a</a>', '<img srcset="a.png 1x">', '<form action="/x"></form>', '<iframe></iframe>', '<div style="background:url(a.png)"></div>', '<link rel="stylesheet">'])
    assert.throws(() => run(bad), /still has/, bad);
});

test('the page image, rewritten to a non-data URL, is allowed', () => {
  assert.doesNotThrow(() => run('<img src="https://elsewhere/a.png" alt="">'));
});

test('kindOf puts the family before the value shape, so an alias is not a swatch', () => {
  assert.equal(kindOf('space', { name: '--sl-space-gutter', value: 'var(--sl-space-4)', colour: true }), 'space');
  assert.equal(kindOf('focus', { name: '--sl-focus-ring', colour: true }), 'colour');
  assert.equal(kindOf('text', { name: '--sl-text-sm', value: '0.875rem', colour: false }), 'size');
});

test('parseTokens keeps colour when any file sets a colour and another leaves it initial', () => {
  const g = new Map();
  parseTokens('[a]{\n --sl-spectrum-0: initial;\n}', g);
  parseTokens('[b]{\n --sl-spectrum-0: #ff4d6d;\n}', g);
  assert.equal(g.get('spectrum').tokens[0].colour, true);
});

test('proseParts renders lists and emphasis, and no literal markdown survives in the real catalog', () => {
  assert.equal(proseParts('Intro.\n\n- **A** one\n- B two').rest, '<ul><li><strong>A</strong> one</li><li>B two</li></ul>');
  assert.equal(proseParts('A *set* here.').lead, '<p>A <em>set</em> here.</p>');
  for (const s of loadKitCatalog().sections)
    for (const e of s.entries) {
      const { lead, rest } = proseParts(e.prose);
      const text = (lead + rest).replace(/<code>.*?<\/code>/g, '');
      assert.doesNotMatch(text, /\*\*|(^|\s)\*\S|<p>- /, `${e.title}: literal markdown left in the prose`);
    }
});
