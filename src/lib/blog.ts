import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE } from '@lib/site';

export type Post = CollectionEntry<'blog'>;

export interface TagInfo {
    tag: string;
    slug: string;
    count: number;
}

export function postSlug(post: Post): string {
    return post.data.slug ?? post.id;
}

export function postPath(post: Post): string {
    return `/blog/${postSlug(post)}/`;
}

export function postUrl(post: Post): string {
    return new URL(postPath(post), SITE.url).href;
}

export function assertUniqueSlugs(posts: Post[]): void {
    const bySlug = new Map<string, Post>();
    for (const post of posts) {
        const slug = postSlug(post);
        const existing = bySlug.get(slug);
        if (existing !== undefined) {
            throw new Error(
                `Post slug collision: "${existing.id}" and "${post.id}" both resolve to /blog/${slug}/.`
            );
        }
        bySlug.set(slug, post);
    }
}

export async function getPublishedPosts(): Promise<Post[]> {
    const posts = await getCollection('blog', ({ data }) => data.draft !== true);
    posts.sort(
        (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf() || a.id.localeCompare(b.id)
    );
    assertUniqueSlugs(posts);
    return posts;
}

export function tagSlug(tag: string): string {
    return tag
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export async function getTags(): Promise<TagInfo[]> {
    const posts = await getPublishedPosts();
    const bySlug = new Map<string, TagInfo>();

    for (const post of posts) {
        for (const tag of post.data.tags) {
            const slug = tagSlug(tag);
            if (slug === '') {
                throw new Error(`Tag "${tag}" slugifies to an empty string.`);
            }
            const existing = bySlug.get(slug);
            if (existing === undefined) {
                bySlug.set(slug, { tag, slug, count: 1 });
            } else if (existing.tag !== tag) {
                throw new Error(
                    `Tag slug collision: "${existing.tag}" and "${tag}" both slugify to "${slug}".`
                );
            } else {
                existing.count += 1;
            }
        }
    }

    return [...bySlug.values()].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export async function getPostsByTag(slug: string): Promise<Post[]> {
    const posts = await getPublishedPosts();
    return posts.filter((post) => post.data.tags.some((tag) => tagSlug(tag) === slug));
}
