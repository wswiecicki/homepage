import type { APIRoute } from 'astro';
import { SITE } from '@lib/site';
import { getPublishedPosts, postUrl } from '@lib/blog';

const PLAIN_TEXT = { 'Content-Type': 'text/plain; charset=utf-8' };

export const GET: APIRoute = async () => {
    const posts = await getPublishedPosts();

    const sections = posts.map((post) =>
        [
            `## ${post.data.title}`,
            '',
            `URL: ${postUrl(post)}`,
            `Published: ${post.data.pubDate.toISOString().slice(0, 10)}`,
            post.data.tags.length > 0 ? `Tags: ${post.data.tags.join(', ')}` : null,
            '',
            (post.body ?? '').trim(),
            '',
        ]
            .filter((line) => line !== null)
            .join('\n')
    );

    const body = [
        `# ${SITE.name} — full content`,
        '',
        `> ${SITE.description}`,
        '',
        ...sections,
    ].join('\n');

    return new Response(body, { headers: PLAIN_TEXT });
};
