# Maker Toolkit

Free, browser-based tools, references, a UI Kit and guides for Power Apps, Power Automate and Dataverse/SharePoint
makers. Everything runs in the visitor's browser: no sign-up, no cookies, nothing typed into a tool leaves the device.

**Live:** <https://maker-toolkit.jay365.workers.dev>

Built with [Astro](https://astro.build) (static output) and React islands, deployed as a Cloudflare Worker.

## Quick start

Needs Node 24 (see `.node-version`).

```sh
npm install
npm run dev        # http://localhost:4321, reloads as you save
```

| Script              | What it does                                                                       |
| ------------------- | ---------------------------------------------------------------------------------- |
| `npm run dev`       | Local dev server. Drafts and the UI Kit's checks show here too.                    |
| `npm run build`     | Production build into `dist/` (about 575 pages plus share images, ~2 minutes).     |
| `npm run preview`   | Serve `dist/` to check the production build.                                       |
| `npm run typecheck` | TypeScript and Astro type check (`astro check`).                                   |
| `npm run lint`      | ESLint.                                                                            |
| `npm run format`    | Format everything with Prettier (`format:check` only checks).                      |
| `npm test`          | Unit tests (Vitest); `npm run test:watch` re-runs them as you save.                |
| `npm run check`     | Typecheck + lint + format check + tests: the same checks CI runs, minus the build. |

## Project layout

```text
.github/            CI workflow and Dependabot
docs/               How the site works and how to change it (start here)
public/             Files served as-is: photo, product icons, _redirects
src/
  site.config.ts    Site name, author, links, analytics and verification tokens
  data/             Tool registry, formula/expression references, profile, changelog, videos
  pages/            One file per URL; [slug] files generate a page per item
  layouts/          Base.astro: head, header, footer, search dialog, copy buttons
  components/       Astro components and React islands (one per tool)
  lib/              Pure engines behind each tool, plus share-image and search helpers
  uikit/            UI Kit: component model, YAML generator, validation, items
  content/blog/     Blog posts (Markdown)
  scripts/          Client-side search and motion
  styles/           global.css: all styling, light and dark tokens
astro.config.mjs    Public site URL, integrations, Markdown highlighting
wrangler.jsonc      Cloudflare Worker deploy config
```

## Documentation

| Guide                                  | Read it when you want to…                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------ |
| [Architecture](docs/architecture.md)   | Understand how the pieces fit: data registry, islands, search, share images, styles. |
| [Development](docs/development.md)     | Set up, run the checks, branch and ship a change safely.                             |
| [Content](docs/content.md)             | Write a blog post, add a video, a formula or a whole reference, update the profile.  |
| [Adding a tool](docs/adding-a-tool.md) | Build a new browser tool the way the existing ones are built.                        |
| [UI Kit](docs/ui-kit.md)               | Add or change a canvas component, a control type or a theme token.                   |
| [Deployment](docs/deployment.md)       | Understand how pushes go live, analytics, Search Console, custom domains.            |

## Deployment in one line

Every push to `main` is built and deployed by Cloudflare automatically, so work on a branch, let CI pass on the pull
request, then merge. See [docs/deployment.md](docs/deployment.md).

## Content and trademarks

Descriptions are written independently, and each reference entry links to its official Microsoft Learn page. This
project is not affiliated with Microsoft. Power Apps, Power Automate, Power Fx, Dataverse and SharePoint are trademarks
of Microsoft Corporation. Product icons are Microsoft's official Power Platform icons, used unmodified and only to show
which product a tool works with (see `public/products/NOTICE.txt`).
