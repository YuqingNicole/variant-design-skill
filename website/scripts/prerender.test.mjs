import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEntries, toCard } from './content.mjs';
import { cardToReference, validateCard } from '../../scripts/direction-card.mjs';
import { draftRoutes, escape, llms, llmsFull, loadReferences, referenceIndex, renderSite, rss, sitemap, withNoindex, withoutDrafts } from './prerender.mjs';
import { importTs } from './ts-module.mjs';
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

test('published direction cards pass the skill\'s own validator', () => {
  for (const entry of loadEntries().entries) {
    const card = toCard(entry, 'https://example.test');
    assert.deepEqual(validateCard(card), [], entry.slug);
    assert.equal(card.url, `https://example.test/d/${entry.slug}.json`);
    assert.ok(card.directions.every(d => d.image?.startsWith(`https://example.test/media/${entry.slug}/`)));
    assert.equal(cardToReference(card).usage, 'inspiration');
  }
});

test('every reference gets its own detail page with an escaped title and a link back to the library', () => {
  const references = loadReferences(), pages = renderSite([], template, 'https://example.test', references);
  for (const r of references) {
    const html = pages.get(`/inspiration/${r.id}`);
    assert.ok(html, r.id);
    assert.match(html, new RegExp(`<title>${escape(r.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} — 灵感参考`));
    assert.ok(html.includes('href="/inspiration"') && html.includes(`href="${escape(r.url)}"`), r.id);
  }
});

test('the install guide, structured data and llms.txt are readable without JavaScript', async () => {
  const { importTs } = await import('./ts-module.mjs'), docs = await importTs(new URL('../src/docs-content.ts', import.meta.url).pathname);
  const { entries } = loadEntries(), references = loadReferences(), site = 'https://example.test';
  const pages = renderSite(entries, template, site, references, { docs, version: '9.9.9' });
  const data = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  const guide = pages.get('/docs'), body = guide.replace(/<script[\s\S]*?<\/script>/g, '');
  assert.ok(body.includes(escape(docs.installCommand)) && body.includes(escape(docs.prompts.first.zh)));
  for (const a of docs.agents) assert.ok(body.includes(escape(docs.verify(a.path, true))), a.id);
  for (const [q, a] of docs.faq) assert.ok(body.includes(escape(q.zh)) && body.includes(escape(a.zh)), q.en);
  const [howTo, faqPage] = data(guide)[0]['@graph'];
  assert.equal(howTo['@type'], 'HowTo');
  assert.equal(faqPage.mainEntity.length, docs.faq.length);
  const skill = data(pages.get('/'))[0]['@graph'].find(g => g['@type'] === 'SoftwareSourceCode');
  assert.equal(skill.version, '9.9.9');
  assert.match(skill.codeRepository, /^https:\/\/github\.com\//);
  for (const e of entries) assert.equal(data(pages.get(`/d/${e.slug}`))[0].url, `${site}/d/${e.slug}`);
  assert.deepEqual(data(pages.get('/about')), []);
  const brief = llms(entries, docs, site, references), full = llmsFull(entries, docs, site, references);
  assert.match(brief, /^# Variant Design\n\n> /);
  assert.ok(brief.includes(docs.installCommand) && brief.includes(`${site}/en/docs`) && brief.includes(`${references.length} curated`));
  for (const e of entries) assert.ok(brief.includes(`(${site}/en/d/${e.slug})`), e.slug);
  // Shorthand quoted for agents must be commands the install guide documents.
  const usage = brief.slice(brief.indexOf('## For agents'), brief.indexOf('## Docs')), commands = [...docs.refine, ...docs.deliver].map(([c]) => c);
  for (const [, c] of usage.match(/Shorthand.*$/m)[0].matchAll(/`([^`]+)`/g)) assert.ok(commands.includes(c), c);
  for (const [q] of docs.faq) assert.ok(full.includes(`### ${q.zh}`) && full.includes(`### ${q.en}`), q.en);
  for (const a of docs.agents) assert.ok(full.includes(docs.verify(a.path, false)) && full.includes(docs.verify(a.path, true)), a.id);
});

test('structured data cannot close its script tag', () => {
  const [entry] = loadEntries().entries;
  const html = renderSite([{ ...entry, slug: 'tricky', title: ['</script><b>', 'x'] }], template, 'https://example.test').get('/d/tricky');
  assert.ok(!html.includes('</script><b>') && html.includes('\\u003c/script>\\u003cb>'));
});

test('experiments stay out of the sitemap and out of search results', () => {
  const pages = renderSite(loadEntries().entries, template, 'https://example.test');
  assert.ok(pages.get('/lab').includes('<meta name="robots" content="noindex">'));
  assert.ok(!pages.get('/docs').includes('noindex'));
  assert.ok(!sitemap(pages.keys(), 'https://example.test').includes('/lab<'));
  const once = withNoindex(template);
  assert.equal(withNoindex(once), once);
});

test('guides get their own pages, are listed for search and read in both languages', async () => {
  const { guides } = await importTs(new URL('../src/guides-content.ts', import.meta.url).pathname), { entries } = loadEntries();
  const rendered = Object.fromEntries(guides.map(g => [`/guides/${g.slug}`, `<main><h1>${g.slug}</h1></main>`]));
  const pages = renderSite(entries, template, 'https://example.test', [], { guides, rendered });
  const map = sitemap(pages.keys(), 'https://example.test'), docs = await importTs(new URL('../src/docs-content.ts', import.meta.url).pathname), text = llms(entries, docs, 'https://example.test', [], guides);
  for (const g of guides) {
    const html = pages.get(`/guides/${g.slug}`);
    assert.ok(html.includes(`<main><h1>${g.slug}</h1></main>`) && html.includes('"@type":"Article"'), g.slug);
    assert.ok(map.includes(`<loc>https://example.test/guides/${g.slug}</loc>`) && text.includes(`/guides/${g.slug})`));
    const ids = g.sections.map(s => s.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const value of [g.title, g.answer, ...g.sections.flatMap(s => [s.heading, ...s.body, ...(s.list ?? []), ...(s.code ? [s.code] : [])])]) assert.ok(value.zh && value.en, g.slug);
    for (const s of g.sections) if (s.link && !s.link.href.startsWith('http')) assert.ok(pages.has(s.link.href) || ['/docs', '/inspiration'].includes(s.link.href) , s.link.href);
  }
});

test('language versions name each other, themselves and the default', () => {
  const site = 'https://example.test', { entries } = loadEntries(), [e] = entries, english = { '/': '<h1>Home</h1>', [`/d/${e.slug}`]: '<h1>English entry</h1>' };
  const pages = renderSite(entries, template, site, [], { english });
  const zh = pages.get(`/d/${e.slug}`), en = pages.get(`/en/d/${e.slug}`);
  for (const html of [zh, en]) for (const [tag, href] of [['zh-CN', `${site}/d/${e.slug}`], ['en', `${site}/en/d/${e.slug}`], ['x-default', `${site}/d/${e.slug}`]]) assert.ok(html.includes(`<link rel="alternate" hreflang="${tag}" href="${href}">`), tag);
  assert.ok(en.includes(`<link rel="canonical" href="${site}/en/d/${e.slug}">`) && zh.includes(`<link rel="canonical" href="${site}/d/${e.slug}">`));
  assert.ok(en.includes('<h1>English entry</h1>') && en.includes(`<title>${escape(e.title[1])} — Variant Design direction library</title>`));
  assert.ok(pages.get('/en').includes('<link rel="canonical" href="https://example.test/en">'));
  // No English render means no English page and no hreflang promising one.
  const other = entries.find(x => x.slug !== e.slug);
  assert.ok(!pages.has(`/en/d/${other.slug}`) && !pages.get(`/d/${other.slug}`).includes('hreflang'));
  const map = sitemap(pages.keys(), site);
  assert.ok(map.includes(`<loc>${site}/en/d/${e.slug}</loc><xhtml:link rel="alternate" hreflang="zh-CN" href="${site}/d/${e.slug}"/>`));
  assert.ok(map.includes(`<loc>${site}/d/${other.slug}</loc></url>`));
});

test('addresses and languages convert both ways', async () => {
  const { localePath, parseLocale } = await importTs(new URL('../src/i18n/locale-route.ts', import.meta.url).pathname);
  assert.deepEqual(parseLocale('/en'), { locale: 'en', route: '/' });
  assert.deepEqual(parseLocale('/en/d/pulse'), { locale: 'en', route: '/d/pulse' });
  assert.deepEqual(parseLocale('/docs'), { locale: 'zh', route: '/docs' });
  assert.deepEqual(parseLocale('/english'), { locale: 'zh', route: '/english' });
  assert.deepEqual(parseLocale('/en/lab'), { locale: 'zh', route: '/en/lab' });
  assert.equal(localePath('/', 'en'), '/en');
  assert.equal(localePath('/#works', 'en'), '/en#works');
  assert.equal(localePath('/inspiration?topic=x', 'en'), '/en/inspiration?topic=x');
  assert.equal(localePath('/docs', 'zh'), '/docs');
  for (const fixed of ['/lab', '/lab/forma', '/d/pulse.json', '/fonts/LICENSES.txt', 'https://example.test/a', '#works', '//example.test/a']) assert.equal(localePath(fixed, 'en'), fixed);
});

test('the reference index links every reference page in each language', () => {
  const references = loadReferences(), zh = referenceIndex(references), en = referenceIndex(references, 'en');
  for (const r of references) { assert.ok(zh.includes(`href="/inspiration/${r.id}"`), r.id); assert.ok(en.includes(`href="/en/inspiration/${r.id}"`), r.id); }
  assert.equal(new Set(zh.match(/href="[^"]+"/g)).size, references.length);
  assert.ok(!referenceIndex([{ id: 'x', name: '<b>&' }]).includes('<b>'));
});


test('draft English stays out of the English pages, hreflang and sitemap, and the Chinese page stays (RFC-005 §3.5)', async () => {
  const { guides } = await importTs(new URL('../src/guides-content.ts', import.meta.url).pathname), { entries } = loadEntries();
  const [draft, kept] = guides, marked = [{ ...draft, translations: { en: { status: 'draft' } } }, { ...kept, translations: { en: { status: 'complete', reviewedAt: '2026-11-02' } } }, ...guides.slice(2)];
  const pulse = entries.find(e => e.slug === 'pulse'), draftEntries = entries.map(e => e === pulse ? { ...e, translations: { en: { status: 'draft' } } } : e);
  const drafts = draftRoutes({ guides: marked, entries: draftEntries });
  assert.deepEqual(drafts, [`/guides/${draft.slug}`, '/d/pulse']);
  assert.deepEqual(draftRoutes({ guides, entries }), [], 'items without a status count as published');
  const body = route => `<main><h1>${route}</h1></main>`, routes = [...guides.map(g => `/guides/${g.slug}`), '/d/pulse'];
  const english = Object.fromEntries(routes.map(r => [r, body(r)])), rendered = Object.fromEntries(guides.map(g => [`/guides/${g.slug}`, body(g.slug)]));
  const pages = renderSite(draftEntries, template, 'https://example.test', [], { guides: marked, rendered, english: withoutDrafts(english, drafts) });
  assert.ok(pages.has(`/guides/${draft.slug}`) && !pages.has(`/en/guides/${draft.slug}`) && !pages.has('/en/d/pulse'));
  assert.ok(!pages.get(`/guides/${draft.slug}`).includes('hreflang') && !pages.get('/d/pulse').includes('hreflang'));
  assert.ok(pages.has(`/en/guides/${kept.slug}`) && pages.get(`/guides/${kept.slug}`).includes('hreflang="en"'));
  const map = sitemap(pages.keys(), 'https://example.test');
  assert.ok(!map.includes(`/en/guides/${draft.slug}<`) && !map.includes('/en/d/pulse<') && map.includes(`/en/guides/${kept.slug}<`));
  assert.equal(Object.keys(english).length, routes.length, 'withoutDrafts leaves its input unchanged');
});
