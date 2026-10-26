// Copies each video's YouTube thumbnail into the site at build time, so pages load no images from YouTube.
import type { APIRoute, GetStaticPaths } from 'astro';
import { videos } from '../../../data/videos';

export const getStaticPaths = (() => videos.map((v) => ({ params: { id: v.id } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  // hqdefault exists for every video; maxresdefault only for HD uploads.
  for (const size of ['maxresdefault', 'hqdefault']) {
    const res = await fetch(`https://i.ytimg.com/vi/${params.id}/${size}.jpg`);
    if (res.ok) return new Response(await res.arrayBuffer(), { headers: { 'Content-Type': 'image/jpeg' } });
  }
  throw new Error(`No YouTube thumbnail found for video ${params.id}. Check the id in src/data/videos.ts.`);
};
