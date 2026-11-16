# Content

How to add and change the things visitors read: posts, videos, references, the profile and the changelog.

## Write a blog post

1. Add a Markdown file to `src/content/blog/`. The file name becomes the URL: `trigger-conditions.md` →
   `/blog/trigger-conditions/`.
2. Start it with this front matter, then write the post below it:

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

3. Run `npm run dev` and open <http://localhost:4321/blog/>. Drafts only show locally.
4. When it's ready, set `draft: false`, add a `kind: 'blog'` entry to `src/data/changelog.ts`, and ship it
   ([Development](development.md#ship-a-change)). The post gets its own page, a share image with your photo, a spot
   on the homepage and in the RSS feed (`/blog/rss.xml`), and Blog appears in the menu.

Images go in `src/content/blog/images/<post-name>/` and are linked as `![](./images/<post-name>/1.png)`; Astro
resizes them and serves WebP. Label code blocks ` ```powerfx ` for Power Fx (highlighted with the JavaScript grammar,
set in `astro.config.mjs`) and ` ```js ` or ` ```json ` for flow expressions and JSON.

Posts brought over from Medium or LinkedIn keep a `source:` field (`name` and `url`) for your records; it isn't shown.
Post dates aren't shown either: `date` only sets the order and the dates in the RSS feed and structured data.

The front matter is validated by `src/content.config.ts`; a missing or wrong field fails the build.

## Add a YouTube video

Add an entry to `src/data/videos.ts` (newest first). The `id` is the part after `watch?v=`:

```ts
{ id: 'abc123XYZ', title: 'Trigger conditions in 5 minutes', date: '2026-11-02', duration: '5:12', description: '…' },
```

The thumbnail is copied into the site at build time (`src/pages/videos/thumbs/`), so visitors load nothing from
YouTube until they click. The video appears on the homepage and on `/videos/`, and Videos appears in the menu. Set
`youtubeUrl` in `src/site.config.ts` to show Subscribe buttons and a YouTube icon in the footer.

## Add a formula or expression

Add an object to `formulas` in `src/data/power-apps-formulas.ts`:

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

The list is sorted automatically, and `/formula-reference/mod/` (plus its share image and search entry) is created on
the next build. Power Automate expressions work the same way in `src/data/power-automate-expressions.ts`, where
`docs` defaults to the function's anchor on Microsoft Learn. Desktop-flow formulas reuse the Power Apps entries; give
a function desktop-style examples in the `EXAMPLES` map in `src/data/desktop-formulas.ts`.

If a reference grows, update the hard-coded count in the homepage search placeholder (`src/pages/index.astro`).

## Add a whole new reference

1. Create a data file like `src/data/power-automate-expressions.ts` (`categories`, items, `docsBase`).
2. Add a `Reference` for it in `src/data/references.ts`, and add it to the `references` list (share images, search).
3. Copy `src/pages/expression-reference/` to a new folder and import your reference in both files.
4. Add it to `src/data/tools.ts` with `kind: 'reference'` and its `category`. It then appears on the homepage, its
   category page, the footer and in search.

## Profile, About page and experience

- Name, role, bio, location, certifications and links: `src/site.config.ts`.
- Photo: `public/images/jayaprakash.jpg` (800×800) with a `.webp` copy next to it. Replace both, keeping the names, or
  point `authorPhoto` at a new file.
- "What I do", "Core expertise" and "Methods & tools": `src/data/profile.ts`. A paragraph's `focus` line shows as a
  highlighted "Now" note.
- Work history: `src/data/experience.ts`, newest first, dates as `YYYY-MM`. The newest role without an `end` shows as
  current on the profile card and homepage. Durations are worked out at build time. When you change jobs, add the new
  role at the top and give the old one an `end`.

## The changelog ("What's new")

`src/data/changelog.ts` lists only new tools, tool updates and blog posts (`kind: 'tool'` or `'blog'`), newest first.
Changes to the site's look, the profile or the About page don't go there.
