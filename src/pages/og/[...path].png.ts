// Generates a share image for every page at build time: /og/<page>.png
import type { APIRoute, GetStaticPaths } from 'astro';
import { renderOg, type OgCard } from '../../lib/og';
import { references } from '../../data/references';
import { slugify } from '../../data/types';
import { siteConfig } from '../../site.config';

export const getStaticPaths = (() => {
  const pages: { path: string; card: OgCard }[] = [
    {
      path: 'home',
      card: { kicker: 'Field manual · Power Platform', title: 'Formulas, decoded.', titleFont: 'display', summary: siteConfig.description },
    },
    {
      path: 'expression-beautifier',
      card: {
        kicker: 'Tool · Power Automate + Power Fx',
        title: 'Expression Beautifier',
        titleFont: 'display',
        summary: 'Paste a long one-line expression and get it back indented, color-coded and checked for mistakes.',
      },
    },
    {
      path: 'about',
      card: {
        kicker: 'About',
        title: 'Small tools for people who build.',
        titleFont: 'display',
        summary: `Built by ${siteConfig.author}, ${siteConfig.authorRole}.`,
      },
    },
    {
      path: 'changelog',
      card: { kicker: 'Changelog', title: 'What’s new', titleFont: 'display', summary: 'New tools, more formulas and fixes, newest first.' },
    },
  ];

  for (const ref of references) {
    pages.push({
      path: ref.slug,
      card: { kicker: `Reference · ${ref.kicker}`, title: ref.title, titleFont: 'display', summary: ref.description },
    });
    for (const item of ref.items) {
      pages.push({
        path: `${ref.slug}/${slugify(item.name)}`,
        card: {
          kicker: `${ref.product} · ${item.category}`,
          title: item.name,
          titleFont: 'mono',
          summary: item.summary,
          code: item.syntax,
          accent: ref.categories.find((c) => c.name === item.category)?.color,
        },
      });
    }
  }
  return pages.map((p) => ({ params: { path: p.path }, props: { card: p.card } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props, site }) =>
  new Response(new Uint8Array(renderOg({ ...(props.card as OgCard), host: site!.host })), {
    headers: { 'Content-Type': 'image/png' },
  });
