import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '@lib/site';
import { getPublishedPosts, postUrl } from '@lib/blog';

const PLAIN_TEXT = { 'Content-Type': 'text/plain; charset=utf-8' };

export const GET: APIRoute = async () => {
    const posts = await getPublishedPosts();
    const projects = (await getCollection('projects')).sort(
        (a, b) => (a.data.order ?? 99) - (b.data.order ?? 99)
    );
    const about = (await getCollection('about')).sort(
        (a, b) => (a.data.order ?? 99) - (b.data.order ?? 99)
    );

    const lines = [
        `# ${SITE.name}`,
        '',
        `> ${SITE.description}`,
        '',
        `${SITE.jobTitle}. Areas of work: ${SITE.knowsAbout.join(', ')}.`,
        '',
        '## Blog',
        '',
        ...posts.map(
            (post) =>
                `- [${post.data.title}](${postUrl(post)}): ${post.data.description}` +
                ` (published ${post.data.pubDate.toISOString().slice(0, 10)})`
        ),
        '',
        '## Projects',
        '',
        `See: ${SITE.url}/projects/`,
        '',
        ...projects.map((project) => `- ${project.data.title}`),
        '',
        '## About',
        '',
        `See: ${SITE.url}/about/`,
        '',
        ...about.map((section) => `- ${section.data.title}`),
        '',
        '## Contact',
        '',
        `- Email: ${SITE.email}`,
        `- GitHub: ${SITE.socials.github}`,
        `- LinkedIn: ${SITE.socials.linkedin}`,
        '',
        `Full content of every post: ${SITE.url}/llms-full.txt`,
        '',
    ];

    return new Response(lines.join('\n'), { headers: PLAIN_TEXT });
};
