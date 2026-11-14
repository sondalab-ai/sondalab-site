// @ts-check
import { defineConfig } from 'astro/config';

// Canonical origin lives in exactly one place (see docs/specs). Drives
// canonical URLs, Open Graph tags and the sitemap. Change here only.
export default defineConfig({
  site: 'https://sondalab.eu',
  // 'always' matches nginx directory serving (products/x/index.html → /products/x/),
  // so internal links and canonical URLs never trigger a redirect.
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Terminal output and JSON examples in Markdown are painted on the ink like
  // the transcripts (site.css, .ads-doc pre), not by a syntax theme.
  markdown: { syntaxHighlight: false },
});
