# AGENTS.md

Guidance for AI coding assistants working in this repo. Humans: start with `README.md` and `docs/`.

## What this is

Maker Toolkit: a static Astro 7 site with React 19 islands, deployed to Cloudflare Workers. Free browser-based tools,
formula/expression references, a canvas-app UI Kit and a blog for Power Platform makers. Live:
<https://maker-toolkit.jay365.workers.dev>.

## Commands

```sh
npm run dev          # dev server on :4321 (in agent sessions prefer `astro dev --background`; stop with `astro dev stop`)
npm run check        # typecheck + lint + format check + unit tests: run before every commit
npm test             # unit tests only (Vitest); put tests next to the code as *.test.ts
npm run build        # full build, ~2 min; also validates every UI Kit snippet
npm run format       # apply Prettier
```

## Rules

- **Pushing to `main` deploys to production.** Work on a branch; never push or merge to `main` without the owner's
  explicit go-ahead.
- Keep everything client-side: no cookies, no sign-up, no network calls with visitor input, no new third-party scripts.
- Add things as data: tools in `src/data/tools.ts`, reference items in `src/data/*-formulas.ts` /
  `*-expressions.ts`, kit items in `src/uikit/items/`, posts in `src/content/blog/`. Pages, search, share images and
  navigation follow from the data.
- A new tool also needs a share card in `src/pages/og/[...path].png.ts` and a changelog entry.
- `src/data/changelog.ts` lists only new tools, tool updates and blog posts, never design or profile changes.
- Microsoft product icons: unmodified, next to the product name, only to show what a tool works with.
- Don't reformat blog posts (`src/content/blog/` is excluded from Prettier on purpose).
- Engines in `src/lib/` stay pure (no React). Islands touch browser-only APIs only in effects or behind a ready flag.
- Use `CopyButton`/`CodeLine` for copy buttons; the layout's delegated handler does the copying.

## Where to look

| Task                        | Read                                                         |
| --------------------------- | ------------------------------------------------------------ |
| How it fits together        | `docs/architecture.md`                                       |
| New tool                    | `docs/adding-a-tool.md`, then copy `src/pages/regex-tester/` |
| UI Kit item or control      | `docs/ui-kit.md`                                             |
| Posts, formulas, profile    | `docs/content.md`                                            |
| Checks, branching, shipping | `docs/development.md`, `docs/deployment.md`                  |

## Gotchas

- `src/styles/global.css` has two layers: the original theme, then "console theme" overrides further down. Search for
  later rules on the same selector before assuming a style isn't applied.
- Windows: VS Code keeps handles on folders containing `package.json`/`.git`, so renaming them fails while it's open.
- The logo's gradient id is random per build, so every page's HTML changes on every build. Normalise `slash-…` ids when
  diffing builds.
- Verify UI changes in a browser (light and dark theme, narrow width, reduced motion), not only with the build.
