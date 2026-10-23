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
| `src/data/references.ts` | Ties each dataset to its URL, title, FAQ and search hint. |
| `src/data/tools.ts` | The tool list shown on the homepage. |
| `src/data/changelog.ts` | Entries for the "What's new" page. |
| `src/components/ReferenceIndex.astro` | Shared layout for a reference page (explorer, A–Z index, FAQ). |
| `src/components/ReferenceItem.astro` | Shared layout for one formula/expression page. |
| `src/components/ReferenceExplorer.tsx` | The interactive explorer (search, A–Z, categories, cards/tree, detail panel). |
| `src/components/Beautifier.tsx` + `src/lib/beautify.ts` | The Expression Beautifier UI and its formatting/checking engine. |
| `src/components/SchemaHelper.tsx` + `src/lib/jsonSchema.ts` | The JSON Schema Helper UI and its schema, expression and JSON-error engine. |
| `src/components/ExpressionPicker.tsx` + `src/lib/jsonExpression.ts` | The Expression Picker: JSON tree and the path-to-expression (and Power Fx) builder. |
| `src/components/TableStyler.tsx` + `src/lib/htmlTable.ts` | The HTML Table Styler: presets, inline/style-block output and the email preview. |
| `src/components/ListCopier.tsx` + `src/lib/spList.ts` | The List Copier: parses SharePoint REST XML/JSON and generates console, Power Automate and PnP scripts. |
| `src/lib/og.ts` + `src/pages/og/` | Share images (1200×630 PNG) generated for every page at build time. |
| `src/lib/logo.ts` | The logo's paths and colors: the single source for the header logo, favicons, app icons and brand kit. |
| `src/pages/favicon.*.ts`, `[icon].png.ts`, `site.webmanifest.ts`, `brand/` | Favicon, home-screen icons, manifest and brand kit, all generated from `logo.ts`. |
| `src/pages/` | One file per URL. `[slug].astro` files generate a page per formula or expression. |
| `src/styles/global.css` | All styling. Colors are CSS variables at the top (light and dark). |

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
4. Add it to `src/data/tools.ts` and the nav in `src/layouts/Base.astro`.

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
