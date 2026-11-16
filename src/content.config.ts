import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/** Dated, time-ordered devlogs and essays. */
const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

/** Evergreen reference pages. Slugs are permanent: never rename these files. */
const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
    /** When the page was started. */
    created: z.coerce.date().optional(),
    /** Shown as "last reviewed" so readers can judge freshness. */
    updated: z.coerce.date().optional(),
    /** Pinned ordering in the notes index; lower comes first. */
    order: z.number().default(100),
    draft: z.boolean().default(false),
  }),
});

export const collections = { writing, notes };
