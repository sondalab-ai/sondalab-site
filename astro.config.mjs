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
  // Shiki stays on for what it gives every <pre>: tabindex="0", so a block
  // that scrolls sideways scrolls from the keyboard too. Its css-variables
  // theme paints with --astro-code-* only, which site.css sets to the ink of
  // the transcripts (.ads-doc pre), so no syntax theme colours the blocks.
  markdown: { shikiConfig: { theme: 'css-variables' } },
});
