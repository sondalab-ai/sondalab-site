// Content-hashed URLs for the CRT scene plates.
//
// The plates live in public/scenes/ (the art scripts write there, and the
// runtime fetches them by path from src/lib/scenes.json), and the server caches
// public/ for ten years under names that never change: a regenerated plate
// would never reach a returning visitor. So at build time every plate URL in
// scenes.json gets `?v=` and a hash of the file's bytes. The JSON on disk keeps
// the plain paths the scripts read.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

/**
 * Returns `json` (the text of scenes.json) with each layer's `src` suffixed by
 * a 10-hex hash of `public/<src>`. `read` reads a path relative to the repo
 * root; a missing plate throws, so the build fails rather than shipping a
 * broken scene.
 */
export function versionScenes(json, read = readFileSync) {
  const scenes = JSON.parse(json);
  for (const scene of Object.values(scenes)) {
    for (const layer of [...(scene.layers ?? []), ...(scene.light ?? [])]) {
      const hash = createHash('sha256').update(read(`public${layer.src}`)).digest('hex').slice(0, 10);
      layer.src = `${layer.src}?v=${hash}`;
    }
  }
  return JSON.stringify(scenes);
}

/** A Vite plugin that versions src/lib/scenes.json as it is imported. */
export function sceneVersions() {
  return {
    name: 'sondalab:scene-versions',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('/src/lib/scenes.json')) return null;
      return { code: versionScenes(code), map: null };
    },
  };
}
