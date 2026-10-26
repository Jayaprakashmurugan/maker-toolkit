// RSS feed for the blog, so readers and tools like Feedly or LinkedIn newsletters can follow new posts.
import type { APIRoute } from 'astro';
import { getPosts, postUrl } from '../../lib/posts';
import { siteConfig } from '../../site.config';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = async ({ site }) => {
  const posts = (await getPosts()).filter((p) => !p.data.draft);
  const base = site!.href;
  const items = posts
    .map((p) => {
      const url = new URL(postUrl(p), base).href;
      return `    <item>
      <title>${esc(p.data.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <description>${esc(p.data.description)}</description>
      <pubDate>${p.data.date.toUTCString()}</pubDate>
${p.data.tags.map((t) => `      <category>${esc(t)}</category>`).join('\n')}
    </item>`;
    })
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(siteConfig.name)} blog</title>
    <link>${new URL('/blog/', base).href}</link>
    <atom:link href="${new URL('/blog/rss.xml', base).href}" rel="self" type="application/rss+xml"/>
    <description>Guides for Power Apps, Power Automate and Dataverse by ${esc(siteConfig.author)}.</description>
    <language>en</language>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
