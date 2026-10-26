import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE_URL, BASE_PATH } from './site.config.mjs';

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
});
