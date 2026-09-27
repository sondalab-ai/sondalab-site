import { test } from 'node:test';
import assert from 'node:assert/strict';
import { versionScenes } from './scene-versions.mjs';

const json = JSON.stringify({
  a: { layers: [{ src: '/scenes/a/01.webp' }], light: [{ src: '/scenes/a/light/01.webp' }] },
});
const files = { 'public/scenes/a/01.webp': 'one', 'public/scenes/a/light/01.webp': 'two' };
const read = (p) => {
  if (!(p in files)) throw new Error(`ENOENT ${p}`);
  return Buffer.from(files[p]);
};

test('every scene plate URL carries a hash of its content', () => {
  const out = JSON.parse(versionScenes(json, read));
  assert.match(out.a.layers[0].src, /^\/scenes\/a\/01\.webp\?v=[0-9a-f]{10}$/);
  assert.match(out.a.light[0].src, /^\/scenes\/a\/light\/01\.webp\?v=[0-9a-f]{10}$/);
});

test('a regenerated plate gets a new URL, an unchanged one keeps its URL', () => {
  const before = JSON.parse(versionScenes(json, read)).a.layers[0].src;
  assert.equal(JSON.parse(versionScenes(json, read)).a.layers[0].src, before);
  files['public/scenes/a/01.webp'] = 'one, regenerated';
  assert.notEqual(JSON.parse(versionScenes(json, read)).a.layers[0].src, before);
});

test('a plate missing from public/ fails the build', () => {
  const missing = JSON.stringify({ b: { layers: [{ src: '/scenes/b/01.webp' }] } });
  assert.throws(() => versionScenes(missing, read), /ENOENT/);
});
