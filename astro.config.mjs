import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE_URL, BASE_PATH } from './site.config.mjs';
import { lastModified, pageFileForRoute } from './src/lib/git-dates.mjs';

const base = BASE_PATH.replace(/\/$/, '');

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      // lastmod = last git commit touching the page's source (or the shared rules/FAQ data it renders).
      serialize(item) {
        const route = new URL(item.url).pathname.slice(base.length) || '/';
        const file = pageFileForRoute(route);
        const date = file ? lastModified(file, 'src/lib/rules-data.ts', 'src/lib/faqs.ts', 'data/rules-history.json') : null;
        if (date) item.lastmod = date;
        return item;
      },
    }),
  ],
});
