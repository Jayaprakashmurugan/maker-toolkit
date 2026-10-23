// Web app manifest: name, colors and icons used when someone adds the site to a home screen.
import type { APIRoute } from 'astro';
import { siteConfig } from '../site.config';
import { COLORS } from '../lib/logo';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        name: siteConfig.name,
        short_name: siteConfig.name,
        description: siteConfig.description,
        start_url: '/',
        display: 'standalone',
        background_color: COLORS.paper,
        theme_color: COLORS.ink,
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      null,
      2,
    ),
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
