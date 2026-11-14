import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { drift, readDocs } from './ads-docs-drift.mjs';

const SCRIPT = fileURLToPath(new URL('./ads-docs-drift.mjs', import.meta.url));

/** Runs git in dir with a fixed identity, so commits work without global config. */
function git(dir, ...args) {
  return execFileSync('git', ['-C', dir, '-c', 'user.name=test', '-c', 'user.email=test@example.com', ...args], {
    encoding: 'utf8',
  }).trim();
}

/** A temp ADS repo with two commits: the second changes a.go only. */
function adsRepo() {
  const dir = mkdtempSync(join(tmpdir(), 'ads-drift-'));
  git(dir, 'init', '-q');
  writeFileSync(join(dir, 'a.go'), 'package a\n');
  writeFileSync(join(dir, 'b.go'), 'package b\n');
  git(dir, 'add', '.');
  git(dir, 'commit', '-q', '-m', 'first');
  const first = git(dir, 'rev-parse', '--short', 'HEAD');
  writeFileSync(join(dir, 'a.go'), 'package a\n\nconst X = 1\n');
  git(dir, 'commit', '-q', '-am', 'second');
  return { dir, first };
}

test('readDocs reads id, sources and syncedFrom from the frontmatter', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ads-docs-'));
  writeFileSync(
    join(dir, 'page-one.md'),
    '---\ntitle: Page one\nsummary: A page.\norder: 0\nsources:\n  - a.go\n  - docs/b.md\nsyncedFrom: d7e7189\nverified: 2026-11-14\n---\n\nBody.\n',
  );
  writeFileSync(join(dir, 'notes.txt'), 'not a page');
  assert.deepEqual(readDocs(dir), [{ id: 'page-one', sources: ['a.go', 'docs/b.md'], syncedFrom: 'd7e7189' }]);
});

test('drift reports a page whose source changed since syncedFrom, and skips a clean page', () => {
  const { dir, first } = adsRepo();
  const head = git(dir, 'rev-parse', 'HEAD');
  const docs = [
    { id: 'a', sources: ['a.go', 'b.go'], syncedFrom: first },
    { id: 'b', sources: ['b.go'], syncedFrom: first },
    { id: 'c', sources: ['a.go'], syncedFrom: head },
  ];
  assert.deepEqual(drift(docs, dir), [{ id: 'a', changed: ['a.go'] }]);
});

test('drift throws when syncedFrom is not a commit of the ADS repo', () => {
  const { dir } = adsRepo();
  const docs = [{ id: 'c', sources: ['a.go'], syncedFrom: 'deadbeef' }];
  assert.throws(() => drift(docs, dir), /ads docs: commit deadbeef of c is not in/);
});

test('drift throws when a source is not in the ADS repo at HEAD', () => {
  const { dir, first } = adsRepo();
  mkdirSync(join(dir, 'docs'));
  writeFileSync(join(dir, 'docs', 'untracked.md'), 'not committed\n');
  for (const missing of ['gone.go', 'docs/untracked.md']) {
    const docs = [{ id: 'd', sources: ['a.go', missing], syncedFrom: first }];
    assert.throws(() => drift(docs, dir), new RegExp(`ads docs: source ${missing} of d is not in`));
  }
});

test('the CLI exits 2 with a usage line without --ads', () => {
  const r = spawnSync(process.execPath, [SCRIPT], { encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /usage: .*--ads <dir>/);
});

test('the CLI prints <id>: <file> and exits 1 on drift, 0 when clean, 2 on a missing source', () => {
  const { dir, first } = adsRepo();
  const head = git(dir, 'rev-parse', 'HEAD');
  const docsDir = mkdtempSync(join(tmpdir(), 'ads-docs-'));
  const page = (sha, src = 'a.go') => `---\ntitle: P\norder: 0\nsources:\n  - ${src}\nsyncedFrom: ${sha}\n---\n`;
  const run = () => spawnSync(process.execPath, [SCRIPT, '--ads', dir, '--docs', docsDir], { encoding: 'utf8' });

  writeFileSync(join(docsDir, 'p.md'), page(first));
  let r = run();
  assert.equal(r.status, 1);
  assert.equal(r.stdout, 'p: a.go\n');

  writeFileSync(join(docsDir, 'p.md'), page(head));
  r = run();
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '');

  writeFileSync(join(docsDir, 'p.md'), page(head, 'gone.go'));
  r = run();
  assert.equal(r.status, 2);
  assert.match(r.stderr, /ads docs: source gone.go of p is not in/);
});
