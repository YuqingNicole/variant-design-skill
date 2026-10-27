import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEntries } from './content.mjs';
import { escape, renderSite, rss, sitemap } from './prerender.mjs';
const template = '<!doctype html><html><head>\n<meta name="description" content="old" />\n<title>Old</title>\n</head><body><div id="root"></div></body></html>';

test('every entry and category gets its own page with metadata and readable content', () => {
  const { entries } = loadEntries(), pages = renderSite(entries, template, 'https://example.test');
  for (const e of entries) {
    const html = pages.get(`/d/${e.slug}`);
    assert.ok(html.includes(`<title>${escape(e.title[0])} — Variant Design 方向库</title>`));
    assert.ok(html.includes(`<meta name="description" content="${escape(e.summary[0])}" />`));
    assert.ok(html.includes(`<link rel="canonical" href="https://example.test/d/${e.slug}">`));
    assert.ok(html.includes('og:image" content="https://example.test/media/'));
    for (const d of e.directions) assert.ok(html.includes(escape(d.name[0])));
    assert.equal(html.match(/<title>/g).length, 1);
  }
  for (const category of new Set(entries.map(e => e.category))) assert.ok(pages.has(`/c/${category}`));
  assert.ok(pages.get('/').includes('<link rel="canonical" href="https://example.test/">'));
  assert.ok(pages.get('/about').includes('<title>关于 Variant Design</title>'));
});

test('text and dollar sequences are escaped, not interpreted', () => {
  const [entry] = loadEntries().entries;
  const tricky = { ...entry, slug: 'tricky', title: ['A & B <i> "$&" $` $$', 'x'], summary: ["it's <b>", 'x'] };
  const html = renderSite([tricky], template, 'https://example.test').get('/d/tricky');
  assert.ok(html.includes('<title>A &amp; B &lt;i&gt; &quot;$&amp;&quot; $` $$ — Variant Design 方向库</title>'));
  assert.ok(html.includes('content="it&#39;s &lt;b&gt;"'));
  assert.ok(!html.includes('<i>'));
});

test('sitemap and RSS list every entry', () => {
  const { entries } = loadEntries(), pages = renderSite(entries, template, 'https://example.test');
  const map = sitemap(pages.keys(), 'https://example.test'), feed = rss(entries, 'https://example.test');
  for (const e of entries) { assert.ok(map.includes(`<loc>https://example.test/d/${e.slug}</loc>`)); assert.ok(feed.includes(`<link>https://example.test/d/${e.slug}</link>`)); }
  assert.equal(feed.match(/<item>/g).length, entries.length);
  assert.throws(() => renderSite(entries, '<html></html>', 'https://example.test'), /Could not place metadata/);
});
