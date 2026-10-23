// The browser-tab icon. Swaps colors when the browser UI is dark.
import type { APIRoute } from 'astro';
import { markSvg } from '../lib/logo';

export const GET: APIRoute = () =>
  new Response(markSvg({ themed: true }), { headers: { 'Content-Type': 'image/svg+xml' } });
