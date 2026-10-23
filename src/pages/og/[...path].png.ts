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
      path: 'json-expression-picker',
      card: {
        kicker: 'Tool · Power Automate · JSON to expression',
        title: 'Expression Picker',
        titleFont: 'display',
        summary: 'Paste a step’s JSON, click the value you need, and copy a ready-made expression.',
      },
    },
    {
      path: 'html-table-styler',
      card: {
        kicker: 'Tool · Power Automate · Emails',
        title: 'HTML Table Styler',
        titleFont: 'display',
        summary: 'Make Create HTML table look good in Outlook and Gmail. Pick a style, preview it, copy one step.',
      },
    },
    {
      path: 'adaptive-card-builder',
      card: {
        kicker: 'Tool · Power Automate · Teams',
        title: 'Adaptive Card Builder',
        titleFont: 'display',
        summary: 'Teams cards for approvals, alerts and forms. Start from a template, preview it, copy the JSON.',
      },
    },
    {
      path: 'odata-filter-builder',
      card: {
        kicker: 'Tool · SharePoint + Dataverse',
        title: 'OData Filter Builder',
        titleFont: 'display',
        summary: 'Build the Filter Query for Get items or List rows, with the right quotes, dates and names.',
      },
    },
    {
      path: 'list-copier',
      card: {
        kicker: 'Tool · SharePoint · Microsoft Lists',
        title: 'List Copier',
        titleFont: 'display',
        summary: 'Copy a list and its columns to another site, even another tenant. No app registration needed.',
      },
    },
    {
      path: 'json-schema-helper',
      card: {
        kicker: 'Tool · Power Automate · Parse JSON',
        title: 'JSON Schema Helper',
        titleFont: 'display',
        summary: 'Paste sample JSON. Get a Parse JSON schema that won’t fail on nulls, plus an expression for every field.',
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
