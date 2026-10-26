import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bracketLabel } from '../src/lib/relabel.ts';

// A minimal element: an ordered child list with remove() and append().
function host(...children) {
  const el = { childNodes: [] };
  const add = (c) => {
    const node = { ...c, remove: () => el.childNodes.splice(el.childNodes.indexOf(node), 1) };
    el.childNodes.push(node);
  };
  children.forEach(add);
  el.append = (text) => add({ nodeType: 3, textContent: text });
  return el;
}
const text = (t) => ({ nodeType: 3, textContent: t });
const span = (cls) => ({ nodeType: 1, textContent: '', cls });

test('the label is bracketed', () => {
  const el = host(text('  See what we wire '));
  assert.equal(bracketLabel(el), '[ See what we wire ]');
  assert.deepEqual(el.childNodes.map((n) => n.textContent), ['[ See what we wire ]']);
});

test('a layer the kit injected (the dither span) survives the relabel', () => {
  const layer = span('sl-fx-dither');
  const el = host(layer, text('See what we wire'));
  bracketLabel(el);
  assert.equal(el.childNodes[0].cls, 'sl-fx-dither');
  assert.equal(el.childNodes.length, 2);
  assert.equal(el.childNodes[1].textContent, '[ See what we wire ]');
});
