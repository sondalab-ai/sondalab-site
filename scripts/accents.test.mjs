import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accentVars } from '../src/lib/accents.ts';

// The product page paints its primary with `--slc-accent-fill` from this
// function (ui-kit 0.32): the registry's fill where it names one, the accent
// otherwise, and an inheriting product resolves to its parent.

test('spexr returns its registered fill, which differs from its accent', () => {
  const a = accentVars('spexr');
  assert.deepEqual(a.fill, { light: '#4c58e9', dark: '#4c58e9' });
  assert.notEqual(a.fill.light, a.light);
});

test('a product without a registered fill uses its accent as the fill', () => {
  const a = accentVars('default');
  assert.deepEqual(a.fill, { light: a.light, dark: a.dark });
  assert.deepEqual(accentVars('introspect').fill, { light: accentVars('introspect').light, dark: accentVars('introspect').dark });
});

test('daos inherits the default accent and fill', () => {
  assert.deepEqual(accentVars('daos'), accentVars('default'));
});
