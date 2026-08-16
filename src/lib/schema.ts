import { SITE } from '@lib/site';
import { postUrl, type Post } from '@lib/blog';

const PERSON_ID = `${SITE.url}/#person`;
const SITE_ID = `${SITE.url}/#website`;

export function personSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Person',
        '@id': PERSON_ID,
        name: SITE.name,
        jobTitle: SITE.jobTitle,
        description: SITE.description,
        url: SITE.url,
        email: `mailto:${SITE.email}`,
        sameAs: [SITE.socials.github, SITE.socials.linkedin],
        knowsAbout: [...SITE.knowsAbout],
    };
}

export function webSiteSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': SITE_ID,
        name: SITE.name,
        url: SITE.url,
        inLanguage: SITE.locale,
        description: SITE.description,
        publisher: { '@id': PERSON_ID },
    };
}

export function breadcrumbSchema(pathname: string) {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return null;

    const items = [{ name: 'Home', url: `${SITE.url}/` }];
    let acc = '';
    for (const segment of segments) {
        acc += `/${segment}`;
        items.push({
            name: segment.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase()),
            url: `${SITE.url}${acc}/`,
        });
    }

    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.name,
            item: item.url,
        })),
    };
}

export function blogPostingSchema(post: Post) {
    const url = postUrl(post);
    return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.data.title,
        description: post.data.description,
        datePublished: post.data.pubDate.toISOString(),
        dateModified: (post.data.updatedDate ?? post.data.pubDate).toISOString(),
        author: { '@id': PERSON_ID },
        publisher: { '@id': PERSON_ID },
        ...(post.data.tags.length > 0 ? { keywords: post.data.tags.join(', ') } : {}),
        inLanguage: SITE.locale,
        url,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    };
}

export function blogSchema(posts: Post[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        '@id': `${SITE.url}/blog/#blog`,
        name: `${SITE.name} — Blog`,
        description: SITE.description,
        inLanguage: SITE.locale,
        publisher: { '@id': PERSON_ID },
        blogPost: posts.map((post) => ({
            '@type': 'BlogPosting',
            '@id': postUrl(post),
            headline: post.data.title,
            description: post.data.description,
            datePublished: post.data.pubDate.toISOString(),
            url: postUrl(post),
        })),
    };
}
