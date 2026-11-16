# Architecture

Maker Toolkit is a fully static Astro site. Every page is generated at build time; the interactive tools are React
islands that hydrate in the browser. There is no server, database or API: data lives in TypeScript files and Markdown.

## The big picture

```text
src/data/*.ts, src/uikit/items/*.ts, src/content/blog/*.md      ← single sources of truth
        │
        ├── src/pages/**            one page per URL (Astro), many generated with getStaticPaths
        ├── src/pages/og/…png.ts    a 1200×630 share image for every page (resvg, at build time)
        ├── src/pages/search-index.json.ts   one JSON index for site-wide search
        └── sitemap, RSS, favicons, web manifest, brand kit (all generated)
                │
                ▼
             dist/  →  Cloudflare Worker serves it as static assets
```

## Data drives everything

| File                                     | Drives                                                                                                                                         |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/data/tools.ts`                      | The four categories and every tool: homepage grid, `/tools/`, category pages (`/power-apps/` …), header count, footer columns, search entries. |
| `src/data/references.ts`                 | Ties each formula/expression dataset to its URL, title, FAQ and search hint.                                                                   |
| `src/data/power-apps-formulas.ts`        | Power Fx formulas (one `RefItem` each). Sorted automatically.                                                                                  |
| `src/data/power-automate-expressions.ts` | Workflow expression functions. `docs` defaults to the function's anchor on Microsoft Learn.                                                    |
| `src/data/desktop-formulas.ts`           | Power Fx for desktop flows: Microsoft's list of names, reusing the Power Apps entries with desktop examples.                                   |
| `src/data/products.ts`                   | Microsoft products a tool "works with", and which have an official icon.                                                                       |
| `src/data/changelog.ts`                  | The "What's new" page.                                                                                                                         |
| `src/data/experience.ts`, `profile.ts`   | About page, profile card, homepage "whoami" band.                                                                                              |
| `src/data/videos.ts`                     | Videos page and homepage section (hidden while empty).                                                                                         |
| `src/uikit/items/*.ts`                   | Every UI Kit page, card, share image and search entry.                                                                                         |
| `src/site.config.ts`                     | Name, author, links, YouTube, Cloudflare analytics token, Search Console code.                                                                 |

Types for references are in `src/data/types.ts` (`RefItem`, `Reference`, `slugify`).

## Pages and routing

- One file per URL under `src/pages/`. Dynamic routes generate many pages:
  - `formula-reference/[slug].astro`, `expression-reference/[slug].astro`, `desktop-flow-reference/[slug].astro`: one
    page per reference item, rendered by `components/ReferenceItem.astro`.
  - `[category]/index.astro`: one page per category in `tools.ts`.
  - `ui-kit/[slug].astro`: one page per kit item (and it validates the item; see [UI Kit](ui-kit.md)).
  - `blog/[...slug].astro`: one page per post.
  - `og/[...path].png.ts`: share images.
- `layouts/Base.astro` wraps every page: meta and Open Graph tags, theme bootstrapping, header/nav (counts come from
  the data), footer, the search dialog, and one delegated click handler for every `button[data-copy]`.
- `public/_redirects` holds permanent redirects for renamed URLs (Cloudflare honours it).

## Interactive tools (islands)

Each tool is two files:

- `src/lib/<engine>.ts`: pure functions, no React. Easy to test and reason about.
- `src/components/<Tool>.tsx`: the React UI, mounted from `src/pages/<slug>/index.astro` with `client:load`.

`client:load` also renders the island on the server, so browser-only APIs (`DOMParser`, `localStorage`,
`sessionStorage`, `window.location`) are only touched in effects or behind a "ready" flag. Shared pieces:

- `lib/highlight.tsx` (React) and `lib/fxHtml.ts` (HTML string) colour Power Fx and workflow expressions.
- `components/FormulaDetail.tsx` exports `CopyButton` / `CodeLine`, which render `button.copy-btn[data-copy]`; the
  layout's delegated handler does the copying and announces it to screen readers.
- `lib/handoff.ts` passes JSON between the JSON Schema Helper and the Expression Picker through `sessionStorage`.
- `components/AnimatedLines.tsx` unfolds output line by line (respects reduced motion).
- The reference explorer (`components/ReferenceExplorer.tsx`) supports deep links with `?f=Name`.

| Tool (URL)                                                | UI                                           | Engine                                                                                             |
| --------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Formula / expression references                           | `ReferenceExplorer.tsx`, `FormulaDetail.tsx` | data in `src/data/`                                                                                |
| Expression Beautifier (`/expression-beautifier/`)         | `Beautifier.tsx`                             | `lib/beautify.ts` (tokenizer, bracket parser, printer, checks)                                     |
| JSON Schema Helper (`/json-schema-helper/`)               | `SchemaHelper.tsx`                           | `lib/jsonSchema.ts` (shape inference, schema, JSON error locator)                                  |
| Expression Picker (`/json-expression-picker/`)            | `ExpressionPicker.tsx`                       | `lib/jsonExpression.ts` (path → expression and Power Fx)                                           |
| HTML Table Styler (`/html-table-styler/`)                 | `TableStyler.tsx`                            | `lib/htmlTable.ts` (presets, inline/style-block output)                                            |
| Adaptive Card Builder (`/adaptive-card-builder/`)         | `CardBuilder.tsx`                            | `lib/adaptiveCard.ts`; preview uses the official `adaptivecards` renderer                          |
| OData Filter Builder (`/odata-filter-builder/`)           | `ODataBuilder.tsx`                           | `lib/odata.ts` (per-source quoting, dates, SharePoint internal names)                              |
| Trigger Condition Builder (`/trigger-condition-builder/`) | `TriggerBuilder.tsx`                         | `lib/triggerCondition.ts`                                                                          |
| SVG to Power Apps (`/svg-to-power-apps/`)                 | `SvgConverter.tsx`                           | `lib/svgPowerApps.ts` (clean, re-serialize, color splices)                                         |
| Regex Tester (`/regex-tester/`)                           | `RegexTester.tsx`                            | `lib/powerFxRegex.ts` (Power Fx 1.0 parser/validator → JS RegExp; runs in a worker with a timeout) |
| List Copier (`/list-copier/`)                             | `ListCopier.tsx`                             | `lib/spList.ts` (SharePoint REST XML/JSON → console, flow and PnP scripts)                         |
| Naming Checker (`/naming-checker/`)                       | `NamingChecker.tsx`                          | `lib/naming.ts` (canvas YAML → renames)                                                            |
| UI Kit (`/ui-kit/`)                                       | `components/uikit/*`                         | `src/uikit/*` (see [UI Kit](ui-kit.md))                                                            |

See [Adding a tool](adding-a-tool.md) for the full recipe and conventions.

## Site-wide search

`src/pages/search-index.json.ts` builds one compact JSON index at build time (tools, every reference entry, UI Kit
items, blog posts, a few pages). `src/scripts/search.ts` fetches it the first time search opens (Ctrl K, ⌘K or `/`),
ranks results in the browser and renders them as text nodes (never HTML).

## Share images and icons

- `src/lib/og.ts` draws an SVG card in the site's style and renders it to PNG with `@resvg/resvg-js`, using fonts
  from the `@fontsource` packages (WOFF unpacked to TTF at build time). Rendering ~575 images is most of the build time.
- Tool share cards are listed by hand in `src/pages/og/[...path].png.ts`; references, kit items, categories and posts
  are generated from data.
- `src/lib/logo.ts` is the single source for the logo: header, favicons, app icons and the brand kit
  (`src/pages/favicon.*.ts`, `[icon].png.ts`, `site.webmanifest.ts`, `brand/`).

## Styling

All styling is in `src/styles/global.css` (plain CSS, no framework). Colour tokens are CSS variables at the top: dark
by default, light under `[data-theme='light']`. The theme toggle stores the choice in `localStorage` and an inline
script applies it before first paint.

The file has two layers, worth knowing before you change anything:

1. **Lines ~1–3400:** the original theme, one `/* ── Section ── */` block per page or tool.
2. **From "Base overrides for the console theme" on:** the later "formula console" redesign, which overrides parts of
   layer 1 (buttons, headings, search dialog, motion and so on appear in both). When a rule seems to have no effect,
   search for a later override of the same selector.

Tools share `bf-*` layout primitives (toolbar, panes, input, output, checks) and generic `segmented`, `chip`, `code`
classes; each tool adds its own prefix (`sh-`, `pk-`, `ts-`, `cb-`, `od-`, `sv-`, `rx-`, `lc-`, `nc-`, UI Kit `kit-`).

## Motion

`src/scripts/motion.ts` adds decoding titles, the typing formula bar, counters, scroll reveals and pointer effects
(tilt, magnetic buttons, spotlight). Everything that moves on its own is skipped under `prefers-reduced-motion`, and
pointer effects only run with a fine pointer. `Base.astro` removes the `motion` class after 2.5 s if the script never
runs, so content can't stay hidden.

## Build-time guarantees

- **Content schema:** `src/content.config.ts` validates every blog post's front matter.
- **UI Kit:** every kit item (and its variants and canvas-component form) is validated while its page is generated; a
  bad snippet fails the build. See [UI Kit](ui-kit.md).
- **Types, lint, formatting, unit tests:** `npm run check`, and CI on every push and PR. See [Development](development.md).

## Known quirks

- The logo gives its gradient a random id (`Logo.astro`), so every build changes every page's HTML slightly even when
  nothing else changed. Harmless, but it makes builds non-reproducible.
- The homepage search placeholder hard-codes the formula count (`src/pages/index.astro`); update it when references grow.
