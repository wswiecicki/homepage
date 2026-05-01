import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';

const projectsCollection = defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
    schema: z.object({
        title: z.string(),
        logos: z
            .array(
                z.object({
                    src: z.string(),
                    alt: z.string().optional(),
                })
            )
            .optional(),
        order: z.number().optional(),
    }),
});

const blogCollection = defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
    schema: z.object({
        title: z.string(),
        pubDate: z.date(),
        author: z.string(),
    }),
});

const aboutCollection = defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/about' }),
    schema: z.object({
        title: z.string(),
        order: z.number().optional(),
    }),
});

export const collections = {
    projects: projectsCollection,
    blog: blogCollection,
    about: aboutCollection,
};
