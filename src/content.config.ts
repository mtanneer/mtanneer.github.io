import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    icon: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    repoUrl: z.string().url().nullable(),
    liveUrl: z.string().url().nullable().optional(),
    status: z.enum(['active', 'archived', 'concept']),
    date: z.coerce.date(),
  }),
});

export const collections = { projects };
