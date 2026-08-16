import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = 'dist';
const ORIGIN = 'https://www.wswiecicki.pl';

const read = (p) => readFile(join(DIST, p), 'utf8');
const exists = async (p) => access(join(DIST, p)).then(() => true, () => false);

async function htmlFiles(dir = DIST, acc = []) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) await htmlFiles(full, acc);
        else if (entry.name.endsWith('.html')) acc.push(full);
    }
    return acc;
}

const between = (html, open, close) => {
    const i = html.indexOf(open);
    if (i === -1) return null;
    const j = html.indexOf(close, i + open.length);
    return j === -1 ? null : html.slice(i + open.length, j);
};

describe('generated artifacts', () => {
    for (const file of [
        'sitemap-index.xml', 'sitemap-0.xml', 'rss.xml',
        'llms.txt', 'llms-full.txt', 'robots.txt', 'og-default.png', '_headers',
    ]) {
        test(`${file} exists`, async () => {
            assert.ok(await exists(file), `dist/${file} is missing`);
        });
    }
});

describe('permalinks', () => {
    test('the existing post URL did not change', async () => {
        assert.ok(await exists('blog/property-based-testing/index.html'));
    });
});

describe('head metadata', () => {
    let pages;
    before(async () => {
        pages = await Promise.all(
            (await htmlFiles()).map(async (f) => ({ file: f, html: await readFile(f, 'utf8') }))
        );
    });

    test('every page has exactly one title', () => {
        for (const { file, html } of pages) {
            const count = (html.match(/<title[ >]/g) ?? []).length;
            assert.equal(count, 1, `${file} has ${count} <title> tags`);
        }
    });

    test('no two pages share a title', () => {
        const seen = new Map();
        for (const { file, html } of pages) {
            const title = between(html, '<title>', '</title>');
            assert.ok(title, `${file} has no title text`);
            assert.ok(!seen.has(title), `${file} and ${seen.get(title)} share title "${title}"`);
            seen.set(title, file);
        }
    });

    test('every page has a non-empty meta description', () => {
        for (const { file, html } of pages) {
            const m = html.match(/<meta name="description" content="([^"]*)"/);
            assert.ok(m, `${file} has no meta description`);
            assert.ok(m[1].trim().length > 0, `${file} has an empty meta description`);
        }
    });

    test('every page has exactly one absolute canonical matching its own path', () => {
        for (const { file, html } of pages) {
            const links = html.match(/<link rel="canonical" href="([^"]*)"/g) ?? [];
            assert.equal(links.length, 1, `${file} has ${links.length} canonical links`);
            const href = html.match(/<link rel="canonical" href="([^"]*)"/)[1];
            assert.ok(href.startsWith(ORIGIN), `${file} canonical is not absolute: ${href}`);

            const ownPath = file.slice(DIST.length).replace(/index\.html$/, '');
            const expected = `${ORIGIN}${ownPath}`;
            assert.equal(href, expected, `${file} canonical "${href}" does not match its own path "${expected}"`);
        }
    });

    test('og:image resolves to a real file in dist/', async () => {
        for (const { file, html } of pages) {
            const m = html.match(/<meta property="og:image" content="([^"]*)"/);
            assert.ok(m, `${file} has no og:image meta`);
            const url = new URL(m[1]);
            assert.ok(url.href.startsWith(ORIGIN), `${file} og:image is not absolute: ${m[1]}`);
            assert.ok(await exists(url.pathname), `${file} og:image points at missing file ${url.pathname}`);
        }
    });

    test('every internal link resolves to a real file in dist/', async () => {
        for (const { file, html } of pages) {
            const hrefs = [...html.matchAll(/href="(\/[^"#]*)"/g)].map((m) => m[1]);
            for (const href of hrefs) {
                const resolved = href.endsWith('/') ? `${href}index.html` : href;
                assert.ok(await exists(resolved), `${file} links to "${href}", which does not exist in dist/`);
            }
        }
    });

    test('every page has a parseable JSON-LD block', () => {
        for (const { file, html } of pages) {
            const blocks = html.match(
                /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
            ) ?? [];
            assert.ok(blocks.length > 0, `${file} has no JSON-LD`);
            for (const block of blocks) {
                const json = between(block, '>', '</script>');
                assert.ok(json && json.trim().length > 0, `${file} has an empty JSON-LD payload`);
                assert.doesNotThrow(() => JSON.parse(json), `${file} has invalid JSON-LD`);
            }
        }
    });
});

describe('absolute urls in feeds', () => {
    for (const file of ['rss.xml', 'sitemap-0.xml', 'llms.txt']) {
        test(`${file} contains no relative links`, async () => {
            const body = await read(file);
            const bad = [...body.matchAll(/(?:<loc>|<link>|\]\(|^|\s)(\/[a-zA-Z0-9][^)<\s]*)/gm)];
            assert.equal(bad.length, 0, `${file} has relative URLs: ${bad.map((m) => m[1])}`);
            assert.ok(body.includes(ORIGIN), `${file} does not reference ${ORIGIN}`);
        });
    }
});

describe('robots.txt', () => {
    test('welcomes AI crawlers and points at the sitemap', async () => {
        const body = await read('robots.txt');
        for (const bot of ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) {
            assert.ok(body.includes(bot), `robots.txt does not mention ${bot}`);
        }
        assert.ok(body.includes(`Sitemap: ${ORIGIN}/sitemap-index.xml`));
        assert.ok(!/Disallow: \/\s*$/m.test(body), 'robots.txt contains a blanket Disallow');
    });
});

describe('llms.txt', () => {
    test('leads with the positioning line and lists posts absolutely', async () => {
        const body = await read('llms.txt');
        assert.ok(body.startsWith('# Wojciech Święcicki'));
        assert.ok(body.includes('Validating and building AI systems'));
        assert.ok(body.includes(`${ORIGIN}/blog/property-based-testing/`));
    });

    test('llms-full.txt carries post bodies, not just summaries', async () => {
        const summary = await read('llms.txt');
        const full = await read('llms-full.txt');
        assert.ok(full.length > summary.length * 2, 'llms-full.txt is suspiciously short');
    });
});

describe('rss', () => {
    test('is well-formed rss 2.0 with items', async () => {
        const body = await read('rss.xml');
        assert.ok(body.includes('<rss version="2.0"'));
        assert.ok(body.includes('<channel>'));
        const items = (body.match(/<item>/g) ?? []).length;
        assert.ok(items >= 1, 'rss.xml has no items');
    });
});

describe('tags', () => {
    test('a tag page exists and lists its post', async () => {
        assert.ok(await exists('blog/tags/index.html'));
        const page = await read('blog/tags/property-based-testing/index.html');
        assert.ok(page.includes('/blog/property-based-testing/'));
    });

    test('a tag page exists for every tag used by a published post', async () => {
        const index = await read('blog/tags/index.html');
        const hrefs = [...index.matchAll(/href="\/blog\/tags\/([a-z0-9-]+)\/"/g)].map((m) => m[1]);
        assert.ok(hrefs.length > 0, 'tags index lists no tags');
        for (const slug of hrefs) {
            assert.ok(await exists(`blog/tags/${slug}/index.html`), `no tag page for "${slug}"`);
        }
    });
});

describe('draft posts', () => {
    const DRAFT_SLUG = '_draft-probe';
    const DRAFT_TAG_SLUG = 'draft-probe-only-tag';

    test('draft post has no permalink page', async () => {
        assert.ok(!(await exists(`blog/${DRAFT_SLUG}/index.html`)));
    });

    test('draft post is absent from the blog list', async () => {
        const html = await read('blog/index.html');
        assert.ok(!html.includes(DRAFT_SLUG));
    });

    test('draft post is absent from rss.xml', async () => {
        const body = await read('rss.xml');
        assert.ok(!body.includes(DRAFT_SLUG));
    });

    test('draft post is absent from sitemap-0.xml', async () => {
        const body = await read('sitemap-0.xml');
        assert.ok(!body.includes(DRAFT_SLUG));
    });

    test('draft post is absent from llms.txt and llms-full.txt', async () => {
        assert.ok(!(await read('llms.txt')).includes(DRAFT_SLUG));
        assert.ok(!(await read('llms-full.txt')).includes(DRAFT_SLUG));
    });

    test('no tag page was generated for the draft-only tag', async () => {
        assert.ok(!(await exists(`blog/tags/${DRAFT_TAG_SLUG}/index.html`)));
    });
});
