// Generates a share image for every page at build time: /og/<page>.png
import type { APIRoute, GetStaticPaths } from 'astro';
import { renderOg, type OgCard } from '../../lib/og';
import { references } from '../../data/references';
import { slugify } from '../../data/types';
import { siteConfig } from '../../site.config';
import { categories, tools, toolsIn } from '../../data/tools';
import { formatDate, getPosts } from '../../lib/posts';

export const getStaticPaths = (async () => {
  const pages: { path: string; card: OgCard }[] = [
    {
      path: 'home',
      card: {
        kicker: 'Free tools for Power Platform makers',
        title: 'Maker Toolkit',
        titleFont: 'display',
        summary: 'Free tools, guides and videos for Power Apps, Power Automate and Dataverse makers.',
        byline: { name: siteConfig.author, photo: siteConfig.authorPhoto },
      },
    },
    ...categories.map((c) => ({
      path: c.id,
      card: {
        kicker: `Category · ${toolsIn(c.id).length} tools`,
        title: `${c.name} tools`,
        titleFont: 'display' as const,
        summary: c.summary,
      },
    })),
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
      path: 'trigger-condition-builder',
      card: {
        kicker: 'Tool · Power Automate · Triggers',
        title: 'Trigger Condition Builder',
        titleFont: 'display',
        summary: 'Make a flow start only when it should. Conditions for SharePoint, Dataverse and Outlook, ready to paste.',
      },
    },
    {
      path: 'svg-to-power-apps',
      card: {
        kicker: 'Tool · Power Apps · Icons',
        title: 'SVG to Power Apps',
        titleFont: 'display',
        summary: 'Turn an SVG icon into an Image formula, cleaned and ready to paste, with colors from Power Fx.',
      },
    },
    {
      path: 'regex-tester',
      card: {
        kicker: 'Tool · Power Apps · Power Fx',
        title: 'Regex Tester for Power Fx',
        titleFont: 'display',
        summary: 'Test patterns for IsMatch, Match and MatchAll, check them against Power Fx’s rules, copy the formula.',
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
        title: siteConfig.author,
        titleFont: 'display',
        summary: `${siteConfig.authorRole} in ${siteConfig.authorLocation}, and the person behind ${siteConfig.name}.`,
        byline: { name: siteConfig.author, photo: siteConfig.authorPhoto },
      },
    },
    {
      path: 'tools',
      card: {
        kicker: `${tools.length} free tools and references`,
        title: 'Tools for Power Platform makers',
        titleFont: 'display',
        summary: 'Power Apps, Power Automate and Dataverse. Nothing to install, nothing leaves your browser.',
      },
    },
    {
      path: 'blog',
      card: { kicker: 'Blog', title: 'Guides for makers', titleFont: 'display', summary: 'Practical posts on Power Apps, Power Automate and Dataverse.', byline: { name: siteConfig.author, photo: siteConfig.authorPhoto } },
    },
    {
      path: 'videos',
      card: { kicker: 'Videos', title: 'Walkthroughs and tips', titleFont: 'display', summary: 'Short videos on Power Apps, Power Automate and the tools on this site.', byline: { name: siteConfig.author, photo: siteConfig.authorPhoto } },
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
  for (const post of await getPosts()) {
    pages.push({
      path: `blog/${post.id}`,
      card: {
        kicker: `Blog · ${formatDate(post.data.date)}`,
        title: post.data.title,
        titleFont: 'display',
        summary: post.data.description,
        byline: { name: siteConfig.author, photo: siteConfig.authorPhoto },
      },
    });
  }
  return pages.map((p) => ({ params: { path: p.path }, props: { card: p.card } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props, site }) =>
  new Response(new Uint8Array(renderOg({ ...(props.card as OgCard), host: site!.host })), {
    headers: { 'Content-Type': 'image/png' },
  });
