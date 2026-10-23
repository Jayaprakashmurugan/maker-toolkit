// App icons for home screens (iOS, Android) and the web app manifest.
import type { APIRoute, GetStaticPaths } from 'astro';
import { markSvg } from '../lib/logo';
import { svgToPng } from '../lib/og';

const ICONS = {
  // iOS rounds the corners itself, so these are full-bleed squares.
  'apple-touch-icon': { size: 180, rounded: false, scale: 0.8 },
  'icon-192': { size: 192, rounded: true, scale: 1 },
  'icon-512': { size: 512, rounded: true, scale: 1 },
  // Android may crop to a circle: keep the mark inside the safe zone.
  'icon-maskable-512': { size: 512, rounded: false, scale: 0.62 },
} as const;

export const getStaticPaths = (() => Object.keys(ICONS).map((icon) => ({ params: { icon } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => {
  const { size, rounded, scale } = ICONS[params.icon as keyof typeof ICONS];
  return new Response(new Uint8Array(svgToPng(markSvg({ rounded, scale }), size)), {
    headers: { 'Content-Type': 'image/png' },
  });
};
