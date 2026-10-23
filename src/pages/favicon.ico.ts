// Classic favicon for browsers and tools that only look for /favicon.ico.
import type { APIRoute } from 'astro';
import { markSvg, pngToIco } from '../lib/logo';
import { svgToPng } from '../lib/og';

export const GET: APIRoute = () =>
  new Response(new Uint8Array(pngToIco(svgToPng(markSvg(), 32), 32)), {
    headers: { 'Content-Type': 'image/x-icon' },
  });
