// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Your public address. Change it after your first Cloudflare deploy (or when you add a custom domain).
  site: 'https://flow-tools.pages.dev',
  trailingSlash: 'ignore',
  integrations: [react(), sitemap({ filter: (page) => !page.includes('/404') })],
});
