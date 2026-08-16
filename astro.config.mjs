import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

function readPostLastmods() {
    const blogDir = fileURLToPath(new URL('./src/content/blog', import.meta.url));
    const lastmods = new Map();

    for (const entry of readdirSync(blogDir)) {
        if (!entry.endsWith('.md')) continue;
        const raw = readFileSync(`${blogDir}/${entry}`, 'utf8');
        const frontmatter = raw.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';

        if (/^draft:\s*true\s*$/m.test(frontmatter)) continue;

        const pubDate = frontmatter.match(/^pubDate:\s*['"]?([^'"\n]+?)['"]?\s*$/m)?.[1];
        const updatedDate = frontmatter.match(/^updatedDate:\s*['"]?([^'"\n]+?)['"]?\s*$/m)?.[1];
        const explicitSlug = frontmatter.match(/^slug:\s*['"]?([^'"\n]+?)['"]?\s*$/m)?.[1];
        if (!pubDate) continue;

        const slug = explicitSlug ?? entry.replace(/\.md$/, '');
        const date = new Date(updatedDate ?? pubDate);
        if (!Number.isNaN(date.valueOf())) lastmods.set(slug, date);
    }

    return lastmods;
}

const postLastmods = readPostLastmods();

export default defineConfig({
    site: 'https://www.wswiecicki.pl',
    trailingSlash: 'always',
    integrations: [
        sitemap({
            filter: (page) => {
                const path = new URL(page).pathname;
                if (path.startsWith('/blog/tags/')) return false;
                if (/^\/blog\/\d+\/$/.test(path)) return false;
                return true;
            },
            serialize(item) {
                const path = new URL(item.url).pathname;

                const postMatch = path.match(/^\/blog\/([^/]+)\/$/);
                if (postMatch) {
                    const lastmod = postLastmods.get(postMatch[1]);
                    if (lastmod) return { ...item, lastmod };
                }

                if (path === '/blog/' && postLastmods.size > 0) {
                    const latest = [...postLastmods.values()].sort((a, b) => b - a)[0];
                    return { ...item, lastmod: latest };
                }

                return item;
            },
        }),
    ],
});
