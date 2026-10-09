import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DAOS_I18N, DAOS_LANGS, resolveDaosLang } from '../src/lib/daos-i18n.ts';

const en = Object.keys(DAOS_I18N.en);

test('every language carries exactly the English keys', () => {
  for (const lang of DAOS_LANGS) {
    assert.deepEqual(Object.keys(DAOS_I18N[lang]).sort(), [...en].sort(), lang);
  }
});

test('no value is empty', () => {
  for (const lang of DAOS_LANGS) {
    for (const [k, v] of Object.entries(DAOS_I18N[lang])) assert.ok(v.trim().length > 0, `${lang}:${k}`);
  }
});

// The page writes these with innerHTML, and the audit only reads <style>
// blocks: an inline style would be colour the gate never sees.
test('values are inline markup only: no style, script or handlers', () => {
  const ALLOWED = new Set(['b', 'em', 'br', 'span']);
  for (const lang of DAOS_LANGS) {
    for (const [k, v] of Object.entries(DAOS_I18N[lang])) {
      assert.doesNotMatch(v, /style=|<script|\son\w+=/i, `${lang}:${k}`);
      for (const [, tag] of v.matchAll(/<\/?([a-z]+)/gi)) assert.ok(ALLOWED.has(tag.toLowerCase()), `${lang}:${k} <${tag}>`);
    }
  }
});

// A translation that drops the hero's underlined word, or a mono run, loses the
// styling the English has; the same classes have to survive in every language.
test('each value keeps the classes its English carries', () => {
  const classes = (v) => [...v.matchAll(/class="([^"]+)"/g)].map((m) => m[1]).sort();
  for (const k of en) {
    for (const lang of DAOS_LANGS) {
      assert.deepEqual(classes(DAOS_I18N[lang][k]), classes(DAOS_I18N.en[k]), `${lang}:${k}`);
    }
  }
});

test('a remembered pick wins over the browser', () => {
  assert.equal(resolveDaosLang('de', ['it-IT']), 'de');
});

test('an unknown remembered value falls through to the browser', () => {
  assert.equal(resolveDaosLang('fr', ['es-ES']), 'es');
});

test('the browser region subtag is ignored', () => {
  assert.equal(resolveDaosLang(null, ['it-IT', 'en-US']), 'it');
  assert.equal(resolveDaosLang(null, ['DE']), 'de');
});

test('the first supported preferred language is used', () => {
  assert.equal(resolveDaosLang(null, ['fr-FR', 'pt-BR', 'es-MX', 'it']), 'es');
});

test('nothing supported means English', () => {
  assert.equal(resolveDaosLang(null, ['fr-FR', 'ja']), 'en');
  assert.equal(resolveDaosLang(null, []), 'en');
});
