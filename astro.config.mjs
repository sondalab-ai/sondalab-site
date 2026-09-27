// @ts-check
import { defineConfig } from 'astro/config';
import { sceneVersions } from './scripts/scene-versions.mjs';

// Canonical origin lives in exactly one place (see docs/specs). Drives
// canonical URLs, Open Graph tags and the sitemap. Change here only.
export default defineConfig({
  site: 'https://sondalab.eu',
  // 'always' matches nginx directory serving (products/x/index.html → /products/x/),
  // so internal links and canonical URLs never trigger a redirect.
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Scene plates are fetched from public/ by path; this gives each URL a hash
  // of the file, so a regenerated plate is never served from a stale cache.
  vite: { plugins: [sceneVersions()] },
});
