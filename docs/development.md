# Development

## Setup

1. Install Node 24 (the version in `.node-version`; Cloudflare and CI use the same file).
2. `npm install`
3. Open the folder in VS Code and accept the recommended extensions (Astro, Prettier, ESLint, EditorConfig).
   `.vscode/settings.json` formats on save with the repo's Prettier config.
4. `npm run dev` and open <http://localhost:4321>.

## Checks

| Command                | Checks                                                                          |
| ---------------------- | ------------------------------------------------------------------------------- |
| `npm run typecheck`    | `astro check`: TypeScript (strict) across `.ts`, `.tsx` and `.astro`.           |
| `npm run lint`         | ESLint: recommended JS/TS/Astro rules and the Rules of Hooks for React islands. |
| `npm run format:check` | Prettier. Fix with `npm run format`.                                            |
| `npm test`             | Unit tests (Vitest). `npm run test:watch` re-runs them as you save.             |
| `npm run check`        | All four. Run it before you push.                                               |
| `npm run build`        | The full build. Also validates every UI Kit snippet; a bad one fails the build. |

CI (`.github/workflows/ci.yml`) runs all of them, plus the build, on every push to `main` and every pull request.

### Unit tests

Tests sit next to the code they test as `*.test.ts` (for example `src/lib/beautify.test.ts`) and run through
Astro's Vite config (`vitest.config.ts`), so imports resolve as they do in the site. The engines in `src/lib/` and
`src/uikit/` are pure functions, which makes them easy to test: call the function, check the result.

When you fix a bug, first add a test that fails because of it, then make it pass.

`npm test` starts Vitest through `scripts/run-vitest.mjs`, which switches to the folder's true-case path first. On
Windows, a terminal opened at `c:\…` (lower-case drive, as VS Code does) otherwise makes Node load Vitest twice and
every test file fails with "Cannot read properties of undefined (reading 'config')". If you run `npx vitest`
directly and see that error, that's the cause.

### Lint choices worth knowing

- The React Compiler rules that come with `eslint-plugin-react-hooks` v7 are off: the site doesn't use the compiler,
  and islands read browser-only state in effects after hydration on purpose.
- `catch {}` with an empty body is allowed (it's how the site ignores blocked storage), and so are `cond && run()` and
  `a ? open() : close()` as statements.
- `eslint-plugin-jsx-a11y` isn't installed because it doesn't support ESLint 10 yet. Add it (and
  `astro.configs['flat/jsx-a11y-recommended']`) once it does.

### Formatting

Prettier settings are in `.prettierrc.json` (single quotes, semicolons, trailing commas, 120 columns). Blog posts in
`src/content/blog/` are excluded so authored prose stays exactly as written. The one-time reformat commit is listed in
`.git-blame-ignore-revs`; run `git config blame.ignoreRevsFile .git-blame-ignore-revs` once so local `git blame`
skips it too.

### Line endings

`.gitattributes` stores and checks out text files with LF on every OS, overriding `core.autocrlf`. If a file ever
shows as changed with no visible difference, run `git add --renormalize .`.

## Ship a change

Pushing to `main` deploys to production (see [Deployment](deployment.md)), so:

1. Branch: `git switch -c feature/short-name`.
2. Make the change, run `npm run check` and, for anything that affects pages, `npm run build`.
3. Add a line to `src/data/changelog.ts` if it's a new tool, a tool update or a blog post (only those; design,
   profile and About changes don't go there).
4. Push the branch and open a pull request. CI runs; merge when it's green.

Commit messages are short and say what changed for the visitor, e.g. "Regex Tester: explain anchors" or
"New post: solution layers".

## Conventions

- **Privacy promise:** no cookies, no sign-up, nothing a visitor types leaves the browser. New tools must work
  entirely client-side. Third-party scripts are limited to the optional Cloudflare Web Analytics beacon.
- **Data first:** add tools, formulas, kit items and posts as data; pages, cards, search and share images follow.
- **Microsoft product icons:** unmodified, always next to the product's name, only to show what a tool works with.
- **Copy:** short, plain, second-person sentences for makers; curly apostrophes (’) in UI text.
- **Accessibility:** labelled inputs, `aria-pressed` toggle buttons in `div.segmented[role=group]`, live-region
  announcements via `#sr-status`, and reduced-motion support for anything animated.

## Troubleshooting

- **"Permission denied" when renaming a folder on Windows:** VS Code's TypeScript/ESLint servers and Git extension
  keep handles on folders that contain a `package.json` or `.git`. Close the window, or move the folder's contents
  instead of the folder.
- **A UI Kit page errors in `npm run dev`:** that page's snippet failed validation; the message names the control and
  rule. The same error fails `npm run build`.
- **Build is slow:** almost all of it is share-image rendering (`src/pages/og/`). That's expected.
