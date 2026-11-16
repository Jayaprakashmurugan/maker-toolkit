/// <reference types="vitest/config" />
// Unit tests run through Astro's Vite config, so imports resolve exactly as they do in the site.
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
