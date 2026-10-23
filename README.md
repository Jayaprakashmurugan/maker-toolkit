# Flow Tools

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
| `src/site.config.ts` | Site name, tagline, author, feedback link. **Edit this first.** |
| `astro.config.mjs` | `site:` is your public URL (used for the sitemap and canonical links). |
| `src/data/power-apps-formulas.ts` | All formula entries and categories. |
| `src/data/tools.ts` | The tool list shown on the homepage. |
| `src/components/ReferenceExplorer.tsx` | The interactive explorer (search, A–Z, categories, cards/tree, detail panel). |
| `src/components/FormulaDetail.tsx` | Syntax, parameters, examples and notes, shared by the panel and the formula pages. |
| `src/pages/` | One file per URL. `formula-reference/[slug].astro` generates a page per formula. |
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

The list is sorted automatically, and a page at `/formula-reference/mod/` is created on the next build.

## Add another reference (for example, Power Automate expressions)

1. Copy `src/data/power-apps-formulas.ts` to a new file and fill it in.
2. Add an entry for it in `src/data/tools.ts`.
3. Copy `src/pages/formula-reference/` to a new folder (for example `src/pages/expression-reference/`) and point it at the new data.

## Publish (free)

Live at **https://power-platform-tools.mjaijayaprakash977.workers.dev**, hosted as a Cloudflare Worker
connected to this GitHub repo. Every `git push` to `main` rebuilds and redeploys automatically.

- `wrangler.jsonc` tells Cloudflare how to deploy: it runs `npm run build`, then serves `dist/`
  (including `404.html` for unknown URLs). The `name` must match the Worker's name in the dashboard.
- `astro.config.mjs` → `site:` must be the public address. Update it if you add a custom domain.
- To check the deploy config locally without deploying: `npx wrangler deploy --dry-run`.

## Content and trademarks

Descriptions are written independently. Each entry links to its official Microsoft Learn page.
This project is not affiliated with Microsoft. Power Apps, Power Automate and Power Fx are trademarks of Microsoft Corporation.
