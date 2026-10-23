// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Your public address. Change it if you add a custom domain.
  site: 'https://power-platform-tools.mjaijayaprakash977.workers.dev',
  trailingSlash: 'ignore',
  integrations: [react(), sitemap({ filter: (page) => !page.includes('/404') })],
});
