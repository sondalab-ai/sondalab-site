// @ts-check
import { defineConfig } from 'astro/config';

// Canonical origin lives in exactly one place (see docs/specs). Drives
// canonical URLs, Open Graph tags and the sitemap. Change here only.
export default defineConfig({
  site: 'https://sondalab.eu',
  trailingSlash: 'never',
  build: { format: 'directory' },
});
