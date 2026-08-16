import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { SITE } from '@lib/site';
import { getPublishedPosts, postPath } from '@lib/blog';

export const GET: APIRoute = async (context) => {
    const posts = await getPublishedPosts();

    return rss({
        title: `${SITE.name} — Blog`,
        description: SITE.description,
        site: context.site ?? SITE.url,
        trailingSlash: true,
        items: posts.map((post) => ({
            title: post.data.title,
            description: post.data.description,
            pubDate: post.data.pubDate,
            link: postPath(post),
            categories: post.data.tags,
            author: SITE.email,
        })),
        xmlns: { atom: 'http://www.w3.org/2005/Atom' },
        customData: `<language>en</language><atom:link href="${new URL('/rss.xml', context.site ?? SITE.url).href}" rel="self" type="application/rss+xml"/>`,
    });
};
