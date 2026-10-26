// Blog posts are Markdown files in src/content/blog/. The file name becomes the URL: my-post.md → /blog/my-post/.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    /** One or two sentences: shown on cards, in search results and when the post is shared. */
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    /** Drafts show while you run the site locally (npm run dev) but are never published. */
    draft: z.boolean().default(false),
    /** A YouTube video ID that goes with the post, shown at the top. */
    video: z.string().optional(),
  }),
});

export const collections = { blog };
