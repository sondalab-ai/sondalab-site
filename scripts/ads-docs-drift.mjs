// Lists the ADS docs pages whose `sources` changed in the ADS repo since their `syncedFrom`.
// Usage: node scripts/ads-docs-drift.mjs --ads <ADS checkout> [--docs <pages dir>]
// Exit 0 clean, 1 drifted, 2 on error.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DOCS_DIR = fileURLToPath(new URL('../src/content/ads-docs/', import.meta.url));

/**
 * Reads the frontmatter of every `*.md` page in dir.
 * Supports the subset the pages use: `key: value` scalars and the `sources:` list.
 * Returns one entry per page, in file-name order, with the file name (no `.md`) as id.
 */
export function readDocs(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => {
      const id = f.replace(/\.md$/, '');
      const head = readFileSync(join(dir, f), 'utf8').match(/^---\n([\s\S]*?)\n---\n/)?.[1];
      if (head === undefined) throw new Error(`ads docs: ${id} has no frontmatter`);
      const syncedFrom = head.match(/^syncedFrom:\s*(\S+)\s*$/m)?.[1];
      if (!syncedFrom) throw new Error(`ads docs: ${id} has no syncedFrom`);
      const list = head.match(/^sources:\s*\n((?:[ \t]+-.*\n?)*)/m)?.[1] ?? '';
      const sources = [...list.matchAll(/^[ \t]+-\s*(.+?)\s*$/gm)].map((m) => m[1]);
      return { id, sources, syncedFrom };
    });
}

/** Runs git in dir without a shell; returns trimmed stdout, or null when git fails. */
function git(dir, ...args) {
  try {
    return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

/**
 * Compares each page's sources between its syncedFrom commit and HEAD of the ADS repo at adsDir.
 * Returns only the pages with changed files, as { id, changed }.
 * Throws when a syncedFrom is not a commit of adsDir, or a source is not a file at its HEAD.
 */
export function drift(docs, adsDir) {
  const out = [];
  for (const doc of docs) {
    if (git(adsDir, 'cat-file', '-e', `${doc.syncedFrom}^{commit}`) === null) {
      throw new Error(`ads docs: commit ${doc.syncedFrom} of ${doc.id} is not in ${adsDir}`);
    }
    for (const src of doc.sources) {
      if (git(adsDir, 'cat-file', '-e', `HEAD:${src}`) === null) {
        throw new Error(`ads docs: source ${src} of ${doc.id} is not in ${adsDir}`);
      }
    }
    const diff = git(adsDir, 'diff', '--name-only', doc.syncedFrom, 'HEAD', '--', ...doc.sources);
    if (diff === null) throw new Error(`ads docs: git diff failed for ${doc.id} in ${adsDir}`);
    const changed = diff.split('\n').filter(Boolean);
    if (changed.length > 0) out.push({ id: doc.id, changed });
  }
  return out;
}

/** Value of `--name <value>` in argv, or undefined. */
function arg(argv, name) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

function main(argv) {
  const ads = arg(argv, '--ads');
  if (!ads) {
    console.error('usage: npm run ads-docs:drift -- --ads <dir>');
    return 2;
  }
  try {
    const found = drift(readDocs(arg(argv, '--docs') ?? DOCS_DIR), resolve(ads));
    for (const d of found) for (const f of d.changed) console.log(`${d.id}: ${f}`);
    return found.length > 0 ? 1 : 0;
  } catch (err) {
    console.error(err.message);
    return 2;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
