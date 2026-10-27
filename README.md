# Maker Toolkit

Free, browser-based references and tools for Power Apps and Power Automate makers.
Built with [Astro](https://astro.build) and React, published as a static site.

## Run it on your computer

```sh
npm install       # first time only
npm run dev       # open http://localhost:4321 — changes appear as you save
npm run build     # produce the final site in dist/
npm run preview   # serve dist/ to check the production build
```

## Where things live

| Path | What it is |
| --- | --- |
| `src/site.config.ts` | Site name, author, links, Google verification and analytics token. **Edit this first.** |
| `astro.config.mjs` | `site:` is your public URL (used for the sitemap, canonical links and share images). |
| `src/data/power-apps-formulas.ts` | Power Apps (Power Fx) formulas and their categories. |
| `src/data/power-automate-expressions.ts` | Power Automate expression functions and their categories. |
| `src/data/desktop-formulas.ts` | Power Fx for desktop flows: Microsoft's list of 130 functions, reusing Power Apps entries with desktop examples. |
| `src/data/references.ts` | Ties each dataset to its URL, title, FAQ and search hint. |
| `src/data/products.ts` + `public/products/` | The Microsoft products a tool works with. Icons are Microsoft's official Power Platform icons, used unmodified and always next to the product name, per Microsoft's terms (see `public/products/NOTICE.txt`). |
| `src/data/tools.ts` | The four categories and every tool. The homepage, category pages (`/power-apps/` etc.), header, footer and search are all built from it. |
| `src/components/ToolGrid.astro` | The equal-weight tool cards used on the homepage and category pages. |
| `src/content/blog/` + `src/content.config.ts` | Blog posts (Markdown) and the fields each post needs. |
| `src/data/videos.ts` | Your YouTube videos; thumbnails are copied at build time by `src/pages/videos/thumbs/`. |
| `src/components/ProfileCard.astro`, `PageHead.astro`, `SectionHead.astro`, `Icon.astro` | Your profile card, page and section headings, and the icon set. |
| `src/scripts/search.ts` + `src/pages/search-index.json.ts` | Site-wide search (Ctrl K or /) over every tool and reference entry; the index is built at build time and loaded on first use. |
| `src/data/changelog.ts` | Entries for the "What's new" page. |
| `src/components/ReferenceIndex.astro` | Shared layout for a reference page (explorer, A–Z index, FAQ). |
| `src/components/ReferenceItem.astro` | Shared layout for one formula/expression page. |
| `src/components/ReferenceExplorer.tsx` | The interactive explorer (search, A–Z, categories, cards/tree, detail panel). |
| `src/components/Beautifier.tsx` + `src/lib/beautify.ts` | The Expression Beautifier UI and its formatting/checking engine. |
| `src/components/SchemaHelper.tsx` + `src/lib/jsonSchema.ts` | The JSON Schema Helper UI and its schema, expression and JSON-error engine. |
| `src/components/ExpressionPicker.tsx` + `src/lib/jsonExpression.ts` | The Expression Picker: JSON tree and the path-to-expression (and Power Fx) builder. |
| `src/components/TableStyler.tsx` + `src/lib/htmlTable.ts` | The HTML Table Styler: presets, inline/style-block output and the email preview. |
| `src/components/CardBuilder.tsx` + `src/lib/adaptiveCard.ts` | The Adaptive Card Builder: templates, card JSON, reply expressions; preview uses the official `adaptivecards` renderer. |
| `src/components/ODataBuilder.tsx` + `src/lib/odata.ts` | The OData Filter Builder: per-source formatting rules, date shortcuts and the SharePoint internal-name converter. |
| `src/components/TriggerBuilder.tsx` + `src/lib/triggerCondition.ts` | The Trigger Condition Builder: field paths per trigger, null-safe text checks, presets and AND/OR output. |
| `src/components/SvgConverter.tsx` + `src/lib/svgPowerApps.ts` | SVG to Power Apps: cleans and re-serializes the SVG with single quotes, finds its colors and builds the Image formula. |
| `src/components/RegexTester.tsx` + `src/lib/powerFxRegex.ts` | The Regex Tester: Power Fx 1.0 rule checker, translation to an equivalent JavaScript RegExp (run in a worker with a timeout), and formula output. |
| `src/components/ListCopier.tsx` + `src/lib/spList.ts` | The List Copier: parses SharePoint REST XML/JSON and generates console, Power Automate and PnP scripts. |
| `src/lib/og.ts` + `src/pages/og/` | Share images (1200×630 PNG) generated for every page at build time. |
| `src/lib/logo.ts` | The logo's paths and colors: the single source for the header logo, favicons, app icons and brand kit. |
| `src/pages/favicon.*.ts`, `[icon].png.ts`, `site.webmanifest.ts`, `brand/` | Favicon, home-screen icons, manifest and brand kit, all generated from `logo.ts`. |
| `src/pages/` | One file per URL. `[slug].astro` files generate a page per formula or expression. |
| `src/styles/global.css` | All styling. Colors are CSS variables at the top (light and dark). |

## Write a blog post

1. Add a Markdown file to `src/content/blog/`. The file name becomes the URL: `trigger-conditions.md` → `/blog/trigger-conditions/`.
2. Start it with this header, then write the post below it in Markdown:

   ```md
   ---
   title: Stop flows from triggering themselves
   description: One or two sentences, shown on cards, in search and when the post is shared.
   date: 2026-11-02
   tags: [Power Automate, Triggers]
   draft: true
   # video: VIDEO_ID   (optional: a YouTube video shown at the top of the post)
   # cover: ./images/my-post/cover.jpg   (optional: header image, also used as the card thumbnail)
   ---
   ```

3. Run `npm run dev` to see it at http://localhost:4321/blog/. Drafts show only there.
4. When it's ready, change `draft: true` to `draft: false`, commit and push. The post gets its own page, a share image
   with your photo, a spot on the homepage and in the RSS feed (`/blog/rss.xml`), and Blog appears in the menu.

Put a post's images in `src/content/blog/images/<post-name>/` and link them with `![](./images/<post-name>/1.png)`;
Astro resizes them and serves WebP. Label code blocks ` ```powerfx ` for Power Fx (it's highlighted with the
JavaScript grammar, set in `astro.config.mjs`) and ` ```js ` or ` ```json ` for flow expressions and JSON.

Posts brought over from Medium or LinkedIn keep a `source:` field (`name` and `url`) for your records; it isn't shown
on the site. Post dates aren't shown either: `date` only sets the order of posts and the dates in the RSS feed and
search-engine data.

## Add a YouTube video

Add an entry to `src/data/videos.ts` (newest first). The `id` is the part after `watch?v=` in the video's URL:

```ts
{ id: 'abc123XYZ', title: 'Trigger conditions in 5 minutes', date: '2026-11-02', duration: '5:12', description: '…' },
```

The thumbnail is copied into the site at build time, the video appears on the homepage and on `/videos/`, and Videos
appears in the menu. Set `youtubeUrl` in `src/site.config.ts` to your channel's URL to show Subscribe buttons and a
YouTube icon in the footer.

## Your photo and profile

Your name, role, bio, certifications and links live in `src/site.config.ts`. The photo is
`public/images/jayaprakash.jpg` (800×800, with a `.webp` copy next to it). To change it, replace both files, keeping the
names, or point `authorPhoto` at a new file.

The About page's "What I do", "Core expertise" and "Methods & tools" live in `src/data/profile.ts` (from the LinkedIn
About section); a paragraph's `focus` line is shown as a highlighted "Now" note.

Work history lives in `src/data/experience.ts` (copied from LinkedIn). It drives the About page's
Experience section and career bar, and the newest job without an `end` date shows as "now" on the profile card
(`src/components/ProfileCard.astro`) and in the homepage intro. Durations are worked out at build time, so a new
deploy keeps them current. When you change jobs, add the role at the top and give the old one an `end`.

## Add a formula

Add an object to the `formulas` array in `src/data/power-apps-formulas.ts`:

```ts
{
  name: 'Mod',
  category: 'Math',                 // must match a name in `categories`
  summary: 'One line shown on the card.',
  syntax: 'Mod(Number, Divisor)',
  params: [{ name: 'Number', description: '...' }],   // optional
  examples: [{ code: `Mod(10, 3)`, result: '1' }],
  notes: ['Optional maker tip.'],
  tags: ['remainder'],              // words people might search for
  docs: 'function-mod',             // Microsoft Learn slug
}
```

The list is sorted automatically, and a page at `/formula-reference/mod/` (plus its share image) is created on the next build.
Power Automate expressions work the same way in `src/data/power-automate-expressions.ts`; there `docs` defaults to the
function's anchor on Microsoft Learn, so you can leave it out.

## Add another reference

1. Create a data file like `src/data/power-automate-expressions.ts`.
2. Add a `Reference` for it in `src/data/references.ts` (and to the `references` list, so it gets share images).
3. Copy `src/pages/expression-reference/` to a new folder and import your new reference in both files.
4. Add it to `src/data/tools.ts` with its `category`. It then appears on the homepage, its category page, the footer and in search.

## Add a tool

Build the page under `src/pages/<slug>/`, then add one entry to `src/data/tools.ts` (pick a `category`, and `also` for other categories it helps with), a share image in `src/pages/og/[...path].png.ts`, and a line in `src/data/changelog.ts`.

## Visitor stats (optional, free, cookie-free)

In Cloudflare: **Analytics & Logs → Web Analytics → Add a site**, enter the site's hostname, and copy the `token`
from the snippet. Paste it into `cfAnalyticsToken` in `src/site.config.ts` and push. The privacy page updates itself.

## Publish (free)

Live at **<https://maker-toolkit.jay365.workers.dev>**, hosted as a Cloudflare Worker
connected to this GitHub repo. Every `git push` to `main` rebuilds and redeploys automatically.

- `wrangler.jsonc` tells Cloudflare how to deploy: it runs `npm run build`, then serves `dist/`
  (including `404.html` for unknown URLs). The `name` must match the Worker's name in the dashboard.
- `astro.config.mjs` → `site:` must be the public address. Update it if you add a custom domain.
- To check the deploy config locally without deploying: `npx wrangler deploy --dry-run`.

## Content and trademarks

Descriptions are written independently. Each entry links to its official Microsoft Learn page.
This project is not affiliated with Microsoft. Power Apps, Power Automate and Power Fx are trademarks of Microsoft Corporation.
