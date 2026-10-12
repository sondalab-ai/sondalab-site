import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertUniqueIds, parseCatalog, loadKitCatalog, parseTokens, loadKitTokens } from '../src/lib/kit-catalog.ts';

// The design-system page is generated from the installed kit, so these tests
// pin the parser's contract on a fixture and then run it against the real
// package: a kit release that changes the catalog's format fails here, not as
// an empty page.

const FIXTURE = `# Title

intro

## Primitives (ready)

### Button — \`sl-btn\` (\`--primary\`)
Prose about it.
\`\`\`html
<button class="sl-btn">Go</button>
\`\`\`
Consumes: \`--slc-text\`.

## Effects (opt-in)

### Glass — \`sl-fx-glass\`
\`\`\`html
<div class="sl-fx-glass"></div>
\`\`\`

## Rules of use

- one
`;

test('splits sections and entries, keeps snippets and prose', () => {
  const { sections } = parseCatalog(FIXTURE);
  assert.deepEqual(sections.map((s) => s.title), ['Primitives (ready)']);
  const [btn] = sections[0].entries;
  assert.equal(btn.title, 'Button');
  assert.deepEqual(btn.classes, ['sl-btn', '--primary']);
  assert.deepEqual(btn.snippets, ['<button class="sl-btn">Go</button>']);
  assert.match(btn.prose, /Prose about it/);
});

test('drops sections that need script or are not components', () => {
  const titles = parseCatalog(FIXTURE).sections.map((s) => s.title);
  assert.ok(!titles.some((t) => /Effects|Rules/.test(t)));
});

test('throws when the format is not recognised', () => {
  assert.throws(() => parseCatalog('# nothing here'), /no component sections/);
  assert.throws(() => parseCatalog('## Primitives\n\n### Broken heading\n```html\n<a></a>\n```'), /heading/);
});

test('the installed catalog parses and every primitive is shown', () => {
  const { sections, json } = loadKitCatalog();
  assert.ok(sections.length >= 3);
  const entries = sections.flatMap((s) => s.entries);
  const owner = (cls) => entries.find((e) => e.classes[0] === cls);
  const missing = json.components
    .filter((c) => c.kind === 'primitive' || c.kind === 'signature')
    .filter((c) => !owner(c.classes[0]))
    .map((c) => c.id);
  assert.deepEqual(missing, []);
  const effects = json.components.filter((c) => c.kind === 'effect' && owner(c.classes[0])).map((c) => c.id);
  assert.deepEqual(effects, []);
});

test('tokens are grouped by family from the declarations', () => {
  const groups = parseTokens(':root{\n --sl-space-1: 0.25rem;\n --sl-space-2: 0.5rem;\n --sl-radius-sm: 6px;\n --_sl-private: 1;\n}');
  assert.deepEqual(groups.map((g) => g.family), ['space', 'radius']);
  assert.equal(groups[0].tokens.length, 2);
  assert.equal(groups[0].tokens[0].name, '--sl-space-1');
  assert.equal(groups[0].tokens[0].value, '0.25rem');
});

test('the installed tokens include the version and several families', () => {
  const { version, groups } = loadKitTokens();
  assert.match(version, /^\d+\.\d+\.\d+/);
  assert.ok(groups.length >= 5);
});

test('an unclosed fence, or an entry with no html snippet, throws', () => {
  assert.throws(() => parseCatalog('## A\n\n### B — `sl-b`\n```html\n<b></b>\n'), /unclosed/);
  assert.throws(() => parseCatalog('## A\n\n### B — `sl-b`\n```js\nx\n```'), /no html snippet/);
});

test('non-html fences are ignored, headings in skipped sections do not throw, CRLF parses', () => {
  const md = '## A\r\n\r\n### B — `sl-b`\r\n```html\r\n<b></b>\r\n```\r\n```js\r\nx\r\n```\r\n\r\n## Effects\r\n\r\n### Turning on, no classes\r\n';
  const { sections } = parseCatalog(md);
  assert.deepEqual(sections[0].entries[0].snippets, ['<b></b>']);
});

test('a token any theme declares is theme-only: listed without a value', () => {
  const { groups } = loadKitTokens();
  const viz = groups.find((g) => g.family === 'viz').tokens[0];
  assert.equal(viz.value, undefined);
  assert.equal(viz.colour, true);
  const space = groups.find((g) => g.family === 'space').tokens[0];
  assert.match(space.value, /rem|^0$/);
  assert.equal(space.colour, false);
});

test('a repeated snippet id, or one that shadows the page, throws', () => {
  const sec = (...ids) => [{ title: 'S', entries: ids.map((id) => ({ title: id, classes: [], prose: '', snippets: [`<i id="${id}"></i>`] })) }];
  assert.throws(() => assertUniqueIds(sec('a', 'a')), /used twice/);
  assert.throws(() => assertUniqueIds(sec('tokens')), /used twice/);
  assert.doesNotThrow(() => assertUniqueIds(sec('a', 'b')));
});

test('the installed catalog has unique snippet ids', () => {
  assert.doesNotThrow(() => loadKitCatalog());
});
