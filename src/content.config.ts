import { defineCollection, z } from 'astro:content';

const projectsCollection = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        logoSrc: z.string().optional(),
        logoAlt: z.string().optional(),
    }),
});

const blogCollection = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        pubDate: z.date(),
        author: z.string(),
    }),
});

const aboutCollection = defineCollection({
    type: 'content',
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
