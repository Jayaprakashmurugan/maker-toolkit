// Brand kit: logo files for profiles, posts and documents, at /brand/<file>.
import type { APIRoute, GetStaticPaths } from 'astro';
import { markSvg } from '../../lib/logo';
import { renderLockup, svgToPng } from '../../lib/og';

const FILES: Record<string, { type: string; body: () => string | Buffer }> = {
  'logo.svg': { type: 'image/svg+xml', body: () => markSvg() },
  'logo-512.png': { type: 'image/png', body: () => svgToPng(markSvg(), 512) },
  'lockup-light.png': { type: 'image/png', body: () => renderLockup('light') },
  'lockup-dark.png': { type: 'image/png', body: () => renderLockup('dark') },
};

export const getStaticPaths = (() => Object.keys(FILES).map((file) => ({ params: { file } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => {
  const f = FILES[params.file!];
  const body = f.body();
  return new Response(typeof body === 'string' ? body : new Uint8Array(body), { headers: { 'Content-Type': f.type } });
};
