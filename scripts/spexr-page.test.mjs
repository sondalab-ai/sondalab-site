import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { SPEXR_HERO, SPEXR_SECTIONS, SPEXR_RELEASES } from '../src/lib/spexr-page.ts';

const ASSETS = new URL('../src/assets/spexr/', import.meta.url);
const shots = [SPEXR_HERO, ...SPEXR_SECTIONS.flatMap((s) => s.shots)];

test('the feature sections come in the agreed order', () => {
  assert.deepEqual(
    SPEXR_SECTIONS.map((s) => s.id),
    ['specs', 'darkfactory', 'experts', 'memory', 'search', 'also'],
  );
});

test('every shot names a screenshot that exists, and every screenshot is used once', () => {
  for (const s of shots) assert.ok(existsSync(new URL(s.file, ASSETS)), s.file);
  const used = shots.map((s) => s.file).sort();
  assert.deepEqual(used, readdirSync(ASSETS).filter((f) => f.endsWith('.png')).sort());
});

test('every shot has alt text a screen reader can use', () => {
  for (const s of shots) assert.ok(s.alt.trim().length >= 24, `${s.file}: "${s.alt}"`);
});

// Numbers on this page are checked against spexr's source when written; a new
// one must be checked too, so the test lists the ones that were.
test('the copy states no number that was not verified', () => {
  const copy = JSON.stringify([SPEXR_HERO, SPEXR_SECTIONS]);
  const numbers = [...copy.matchAll(/\b\d+\b/g)].map((m) => m[0]);
  assert.deepEqual([...new Set(numbers)].sort(), []);
  assert.ok(/seven steps/.test(copy) && /seven built-in/.test(copy));
});

test('download points at the releases page', () => {
  assert.equal(SPEXR_RELEASES, 'https://github.com/sondalab-ai/spexr-ide/releases');
});
