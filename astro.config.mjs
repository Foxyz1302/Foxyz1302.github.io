// @ts-check
import { defineConfig } from 'astro/config';
import data from './public/data.json' with { type: 'json' };

// The site address lives in public/data.json (site.url), so a domain change
// is one edit there (plus public/CNAME).
export default defineConfig({
  site: data.site.url,
  trailingSlash: 'always',
});
