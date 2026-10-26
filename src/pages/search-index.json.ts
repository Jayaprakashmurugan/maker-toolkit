// One index for the site-wide search: every tool, every reference entry and the main pages.
// Fetched by src/scripts/search.ts the first time someone opens search.
import type { APIRoute } from 'astro';
import { references } from '../data/references';
import { slugify } from '../data/types';
import { categoryById, tools } from '../data/tools';
import { getPosts, postUrl } from '../lib/posts';

export interface SearchEntry {
  /** Title. */
  t: string;
  /** URL. */
  u: string;
  /** Kind label shown on the result. */
  k: string;
  /** Group: the category name or the reference section. */
  g: string;
  /** One-line description. */
  d: string;
  /** Lowercase words to search in, besides the title and description. */
  s: string;
  /** Marker color. */
  c: string;
}

const KINDS: Record<string, { label: string; color: string }> = {
  'formula-reference': { label: 'Power Apps', color: categoryById('power-apps').color },
  'expression-reference': { label: 'Power Automate', color: categoryById('power-automate').color },
  'desktop-flow-reference': { label: 'Desktop flows', color: categoryById('power-automate').color },
};

export const GET: APIRoute = async () => {
  const posts = (await getPosts()).filter((p) => !p.data.draft);
  const entries: SearchEntry[] = [
    ...tools.map((t) => {
      const cat = categoryById(t.category);
      return {
        t: t.title,
        u: t.href,
        k: t.kind === 'reference' ? 'Reference' : 'Tool',
        g: cat.name,
        d: t.description,
        s: [t.meta, t.keywords, cat.name].join(' ').toLowerCase(),
        c: cat.color,
      };
    }),
    ...references.flatMap((r) =>
      r.items.map((item) => ({
        t: item.name,
        u: `/${r.slug}/${slugify(item.name)}/`,
        k: KINDS[r.slug]?.label ?? r.product,
        g: item.category,
        d: item.summary,
        s: [item.category, ...(item.tags ?? [])].join(' ').toLowerCase(),
        c: KINDS[r.slug]?.color ?? '#857f73',
      })),
    ),
    ...posts.map((p) => ({
      t: p.data.title,
      u: postUrl(p),
      k: 'Blog',
      g: 'Blog',
      d: p.data.description,
      s: ['blog guide', ...p.data.tags].join(' ').toLowerCase(),
      c: '#4c8dff',
    })),
    { t: 'What’s new', u: '/changelog/', k: 'Page', g: 'Site', d: 'Every release and what changed.', s: 'changelog release updates new', c: '#857f73' },
    { t: 'About', u: '/about/', k: 'Page', g: 'Site', d: 'Who makes this site and why.', s: 'author contact', c: '#857f73' },
    { t: 'Privacy & terms', u: '/privacy/', k: 'Page', g: 'Site', d: 'No cookies, no tracking, nothing leaves your browser.', s: 'privacy cookies terms', c: '#857f73' },
  ];
  return new Response(JSON.stringify(entries), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
