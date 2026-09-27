import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, globSync } from 'node:fs';

// The server caches public/ files for ten years under a name that never
// changes, so a stylesheet pointing at one keeps showing the old picture after
// it is regenerated (the stance kept its ruled background on 2026-09-27).
// Styles reference images through src/assets instead, where the build hashes
// or inlines them.
test('no style points at a fixed-name file in public/', () => {
  const offenders = globSync('src/**/*.{astro,css}').flatMap((f) =>
    readFileSync(f, 'utf8')
      .split('\n')
      .map((l, i) => [f, i + 1, l])
      .filter(([, , l]) => /url\(\s*['"]?\/(?!\/)/.test(l)),
  );
  assert.deepEqual(offenders.map(([f, n]) => `${f}:${n}`), []);
});
