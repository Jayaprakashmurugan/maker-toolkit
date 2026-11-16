# Deployment

The site is live at **<https://maker-toolkit.jay365.workers.dev>**, hosted as a Cloudflare Worker that serves the
static build. The Worker is connected to this GitHub repo: **every push to `main` builds and deploys automatically.**

## How a deploy works

1. A commit lands on `main` (a merge or a direct push).
2. Cloudflare installs dependencies and runs the build command from `wrangler.jsonc` (`npm run build`), using the
   Node version in `.node-version`.
3. `dist/` is uploaded as the Worker's static assets. Unknown URLs get `dist/404.html`
   (`"not_found_handling": "404-page"`), and `public/_redirects` applies permanent redirects.

### Branch previews

Branches other than `main` are built too, then deployed as a **Preview** (`npx wrangler preview`, open beta) with
its own URL; the Workers Builds check on a pull request links to it. This needs the `"previews": {}` block in
`wrangler.jsonc` (without it the preview step fails with "missing a `previews` block"). Previews never touch the
production site.

`wrangler.jsonc`'s `name` must match the Worker's name in the Cloudflare dashboard. To check the deploy config without
deploying: `npx wrangler deploy --dry-run`.

## Safety net

- **CI** (`.github/workflows/ci.yml`) runs typecheck, lint, format check and the full build on every push and pull
  request. Work on a branch and merge only when CI is green; a direct push to `main` deploys before anyone can look.
- **Recommended GitHub setting:** protect `main` (Settings → Branches → Add rule) and require the "Typecheck, lint,
  format, build" check to pass before merging.
- **Dependabot** (`.github/dependabot.yml`) opens weekly dependency PRs. They go through CI like any other change.
- **Rolling back:** revert the bad commit on `main` (`git revert <sha>` and push), or pick an earlier deployment in the
  Cloudflare dashboard (Workers & Pages → maker-toolkit → Deployments).

## Public URL and custom domain

`site` in `astro.config.mjs` must be the public address; it's used for canonical links, the sitemap, RSS and share
images. If you add a custom domain in Cloudflare, update `site` and redeploy.

## Visitor stats (optional, free, cookie-free)

In Cloudflare: **Analytics & Logs → Web Analytics → Add a site**, enter the hostname and copy the `token` from the
snippet. Paste it into `cfAnalyticsToken` in `src/site.config.ts` and ship it. The privacy page updates itself.

## Google Search Console

`googleSiteVerification` in `src/site.config.ts` holds the "HTML tag" verification code (only the `content` value).
The sitemap is at `/sitemap-index.xml`.
