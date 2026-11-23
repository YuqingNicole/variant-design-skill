import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEntries, toCard } from './content.mjs';
import { cardToReference, validateCard } from '../../scripts/direction-card.mjs';
import { indexableRoutes, agentInstall, aiTrainingCrawlers, shareCard, draftRoutes, escape, llms, llmsFull, loadReferences, referenceIndex, renderSite, robots, rss, sitemap, sectionPages, isCaseRoute, withNoindex, withoutCases, withoutDrafts } from './prerender.mjs';
import { importTs } from './ts-module.mjs';
const { detailTitle, sectionOf, sections, pageOf, relatedReferences, videoTypeOf } = await importTs(new URL('../src/inspiration-sections.ts', import.meta.url).pathname);
const template = '<!doctype html><html><head>\n<meta name="description" content="old" />\n<title>Old</title>\n</head><body><div id="root"></div></body></html>';

test('every entry and category gets its own page with metadata and readable content', () => {
  const { entries } = loadEntries(), pages = renderSite(entries, template, 'https://example.test');
  for (const e of entries) {
    const html = pages.get(`/zh/d/${e.slug}`);
    assert.ok(html.includes(`<title>${escape(e.title[0])} — Variant Design 方向库</title>`));
    assert.ok(html.includes(`<meta name="description" content="${escape(e.summary[0])}" />`));
    assert.ok(html.includes(`<link rel="canonical" href="https://example.test/zh/d/${e.slug}">`));
    assert.ok(html.includes('og:image" content="https://example.test/media/'));
    for (const d of e.directions) assert.ok(html.includes(escape(d.name[0])));
    assert.equal(html.match(/<title>/g).length, 1);
  }
  for (const category of new Set(entries.map(e => e.category))) assert.ok(pages.has(`/zh/c/${category}`));
  assert.ok(pages.get('/zh').includes('<link rel="canonical" href="https://example.test/zh">'));
  assert.ok(pages.get('/zh/about').includes('<title>关于 Variant Design</title>'));
});

test('text and dollar sequences are escaped, not interpreted', () => {
  const [entry] = loadEntries().entries;
  const tricky = { ...entry, slug: 'tricky', title: ['A & B <i> "$&" $` $$', 'x'], summary: ["it's <b>", 'x'] };
  const html = renderSite([tricky], template, 'https://example.test').get('/zh/d/tricky');
  assert.ok(html.includes('<title>A &amp; B &lt;i&gt; &quot;$&amp;&quot; $` $$ — Variant Design 方向库</title>'));
  assert.ok(html.includes('content="it&#39;s &lt;b&gt;"'));
  assert.ok(!html.includes('<i>'));
});

test('sitemap and RSS list every entry', () => {
  const { entries } = loadEntries(), pages = renderSite(entries, template, 'https://example.test');
  const map = sitemap(indexableRoutes(pages), 'https://example.test'), feed = rss(entries, 'https://example.test');
  for (const e of entries) { assert.ok(map.includes(`<loc>https://example.test/zh/d/${e.slug}</loc>`)); assert.ok(!map.includes(`<loc>https://example.test/d/${e.slug}</loc>`), 'the Chinese copy served at the English address is not listed'); assert.ok(feed.includes(`<link>https://example.test/zh/d/${e.slug}</link>`)); }
  assert.equal(feed.match(/<item>/g).length, entries.length);
  const refs = [{ id: 'a&b', name: 'A & B', addedAt: '2030-01-02T03:04:05+08:00', focus: { zh: '看点' }, application: { zh: '用处' } }], mixed = rss(entries, 'https://example.test', refs);
  assert.equal(mixed.match(/<item>/g).length, entries.length + 1);
  assert.ok(mixed.includes('<link>https://example.test/zh/inspiration/a&amp;b</link>') && mixed.includes('<title>A &amp; B</title>'));
  assert.ok(mixed.indexOf('/inspiration/a&amp;b') < mixed.indexOf('/d/'), 'newest item comes first');
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

// The kind of work each section's detail titles name, in Chinese and English. Pinned here so a change to either language is a deliberate one.
const work = {
  web: ['网站设计', 'Website design'], interface: ['产品界面设计', 'Product interface design'], 'design-motion': ['动态设计', 'Design in motion'], videos: ['创意视频', 'Creative video'],
};

test('a detail title names the work after the reference, in both languages, for every section', () => {
  assert.deepEqual(sections.map(s => [s.id, [s.work.zh, s.work.en]]), Object.entries(work));
  assert.equal(detailTitle({ name: 'Linear', category: 'landing', tag: 'SaaS' }, 'zh'), 'Linear — 网站设计灵感 — Variant Design');
  assert.equal(detailTitle({ name: 'Linear', category: 'landing', tag: 'SaaS' }, 'en'), 'Linear — Website design inspiration — Variant Design');
  assert.equal(detailTitle({ name: 'Blue cat zine', category: 'practice', tag: 'Print', kind: 'social-post' }, 'zh'), 'Blue cat zine — 动态设计灵感 — Variant Design');
  assert.equal(detailTitle({ name: 'Figma · Export', category: 'flow', tag: 'Delivery' }, 'en'), 'Figma · Export — Product interface design inspiration — Variant Design');
  assert.equal(detailTitle({ name: 'Pencil portrait timelapse', category: 'practice', tag: 'Illustration', kind: 'social-post' }, 'en'), 'Pencil portrait timelapse — Design in motion inspiration — Variant Design');
  assert.equal(detailTitle({ name: 'Clay chase', category: 'practice', tag: 'Craft', kind: 'youtube-video' }, 'zh'), 'Clay chase — 创意视频灵感 — Variant Design');
});

test('every reference gets its own detail page with an escaped title and a link back to the library', () => {
  const references = loadReferences(), english = Object.fromEntries(references.map(r => [`/inspiration/${r.id}`, '<main><h1>English body</h1></main>']));
  const pages = renderSite([], template, 'https://example.test', references, { english });
  for (const r of references) {
    const html = pages.get(`/zh/inspiration/${r.id}`);
    assert.ok(html, r.id);
    assert.ok(html.includes(`<title>${escape(r.name)} — ${work[sectionOf(r)][0]}灵感 — Variant Design</title>`), `${r.id}: ${html.match(/<title>[^<]*/)?.[0]}`);
    const en = pages.get(`/inspiration/${r.id}`);
    assert.ok(en.includes(`<title>${escape(r.name)} — ${work[sectionOf(r)][1]} inspiration — Variant Design</title>`), `${r.id}: ${en.match(/<title>[^<]*/)?.[0]}`);
    assert.ok(html.includes('href="/zh"') && html.includes(`href="${escape(r.url)}"`), r.id);
  }
});

test('the install guide, structured data and llms.txt are readable without JavaScript', async () => {
  const { importTs } = await import('./ts-module.mjs'), docs = await importTs(new URL('../src/docs-content.ts', import.meta.url).pathname);
  const { entries } = loadEntries(), references = loadReferences(), site = 'https://example.test';
  const pages = renderSite(entries, template, site, references, { docs, version: '9.9.9' });
  const data = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  const guide = pages.get('/zh/docs/install'), body = guide.replace(/<script[\s\S]*?<\/script>/g, '');
  assert.ok(body.includes(escape(docs.installCommand)) && body.includes(escape(docs.prompts.first.zh)));
  for (const a of docs.agents) assert.ok(body.includes(escape(docs.verify(a.path, true))), a.id);
  for (const [q, a] of docs.faq) assert.ok(body.includes(escape(q.zh)) && body.includes(escape(a.zh)), q.en);
  const [howTo, faqPage] = data(guide)[0]['@graph'];
  assert.equal(howTo['@type'], 'HowTo');
  assert.equal(faqPage.mainEntity.length, docs.faq.length);
  // The home page is the inspiration feed; the skill is described on /skills.
  const [home] = data(pages.get('/zh'));
  assert.equal(home['@type'], 'WebSite');
  // Videos is its own page, so the home counts only the references it lists.
  const listed = references.filter(r => !pageOf(r)).length;
  assert.ok(listed < references.length || !references.some(r => sectionOf(r) === 'videos'));
  assert.ok(home.description.includes(`目前 ${listed} 条`) && pages.get('/zh').includes(`目前 ${listed} 条`));
  const [skill] = data(pages.get('/zh/skills'));
  assert.equal(skill['@type'], 'SoftwareSourceCode');
  assert.equal(skill.version, '9.9.9');
  assert.match(skill.codeRepository, /^https:\/\/github\.com\//);
  for (const e of entries) assert.equal(data(pages.get(`/zh/d/${e.slug}`))[0].url, `${site}/zh/d/${e.slug}`);
  assert.deepEqual(data(pages.get('/zh/about')), []);
  const brief = llms(entries, docs, site, references), full = llmsFull(entries, docs, site, references);
  assert.match(brief, /^# Variant Design\n\n> /);
  assert.ok(brief.includes(docs.installCommand) && brief.includes(`${site}/docs`) && brief.includes(`${listed} curated`));
  for (const e of entries) assert.ok(brief.includes(`(${site}/d/${e.slug})`), e.slug);
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
  assert.ok(!pages.get('/zh/docs').includes('noindex'));
  assert.ok(!sitemap(pages.keys(), 'https://example.test').includes('/lab<'));
  const once = withNoindex(template);
  assert.equal(withNoindex(once), once);
});

test('guides get their own pages, are listed for search and read in both languages', async () => {
  const { guides: answers, guideRoute } = await importTs(new URL('../src/guides-content.ts', import.meta.url).pathname), { docsArticles } = await importTs(new URL('../src/docs-articles.ts', import.meta.url).pathname), { entries } = loadEntries();
  const guides = [...answers, ...docsArticles];
  // The Codex article's English has not been reviewed, so it is the one article marked draft.
  assert.ok(docsArticles.length >= 5 && docsArticles.every(g => g.base === '/docs'));
  assert.deepEqual(docsArticles.filter(g => g.translations).map(g => [g.slug, g.translations]), [['frontend-design-in-codex', { en: { status: 'draft' } }], ['design-system-after-pick-lessons', { en: { status: 'draft' } }], ['why-ai-design-directions-look-alike', { en: { status: 'draft' } }], ['make-ai-ui-look-premium', { en: { status: 'draft' } }], ['check-a-design-reference-is-still-true', { en: { status: 'draft' } }]]);
  const rendered = Object.fromEntries(guides.map(g => [guideRoute(g), `<main><h1>${g.slug}</h1></main>`]));
  const pages = renderSite(entries, template, 'https://example.test', [], { guides, rendered });
  const map = sitemap(indexableRoutes(pages), 'https://example.test'), docs = await importTs(new URL('../src/docs-content.ts', import.meta.url).pathname), text = llms(entries, docs, 'https://example.test', [], guides);
  for (const g of guides) {
    const route = guideRoute(g), html = pages.get(`/zh${route}`);
    assert.ok(html.includes(`<main><h1>${g.slug}</h1></main>`) && html.includes('"@type":"Article"'), g.slug);
    assert.ok(map.includes(`<loc>https://example.test/zh${route}</loc>`) && text.includes(`${route})`));
    assert.ok(html.includes(`<link rel="canonical" href="https://example.test/zh${route}">`) && html.includes(`"url":"https://example.test/zh${route}"`), route);
    const ids = g.sections.map(s => s.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const value of [g.title, g.answer, ...g.sections.flatMap(s => [s.heading, ...s.body, ...(s.list ?? []), ...(s.code ? [s.code] : [])])]) assert.ok(value.zh && value.en, g.slug);
    for (const s of g.sections) if (s.link && !s.link.href.startsWith('http')) assert.ok(pages.has(s.link.href) || ['/docs', '/docs/install', '/inspiration'].includes(s.link.href) || /^\/(guides|docs)\//.test(s.link.href) && pages.has(s.link.href) , s.link.href);
  }
});

test('language versions name each other, themselves and the default', () => {
  const site = 'https://example.test', { entries } = loadEntries(), [e] = entries, english = { '/': '<h1>Home</h1>', [`/d/${e.slug}`]: '<h1>English entry</h1>' };
  const pages = renderSite(entries, template, site, [], { english });
  const zh = pages.get(`/zh/d/${e.slug}`), en = pages.get(`/d/${e.slug}`);
  for (const html of [zh, en]) for (const [tag, href] of [['zh-CN', `${site}/zh/d/${e.slug}`], ['en', `${site}/d/${e.slug}`], ['x-default', `${site}/d/${e.slug}`]]) assert.ok(html.includes(`<link rel="alternate" hreflang="${tag}" href="${href}">`), tag);
  assert.ok(en.includes(`<link rel="canonical" href="${site}/d/${e.slug}">`) && zh.includes(`<link rel="canonical" href="${site}/zh/d/${e.slug}">`));
  assert.ok(en.includes('<h1>English entry</h1>') && en.includes(`<title>${escape(e.title[1])} — Variant Design direction library</title>`));
  assert.ok(pages.get('/').includes('<link rel="canonical" href="https://example.test/">'));
  // No English render means no hreflang promising one; the English address shows the Chinese copy, unindexed, canonical to /zh.
  const other = entries.find(x => x.slug !== e.slug);
  assert.ok(!pages.get(`/zh/d/${other.slug}`).includes('hreflang') && !pages.get(`/d/${other.slug}`).includes('hreflang'));
  assert.ok(pages.get(`/d/${other.slug}`).includes('name="robots" content="noindex"') && pages.get(`/d/${other.slug}`).includes(`<link rel="canonical" href="${site}/zh/d/${other.slug}">`));
  const map = sitemap(indexableRoutes(pages), site);
  assert.ok(map.includes(`<loc>${site}/d/${e.slug}</loc><xhtml:link rel="alternate" hreflang="zh-CN" href="${site}/zh/d/${e.slug}"/>`));
  assert.ok(map.includes(`<loc>${site}/zh/d/${other.slug}</loc></url>`) && !map.includes(`<loc>${site}/d/${other.slug}</loc>`));
});

test('addresses and languages convert both ways', async () => {
  const { localePath, parseLocale } = await importTs(new URL('../src/i18n/locale-route.ts', import.meta.url).pathname);
  assert.deepEqual(parseLocale('/zh'), { locale: 'zh', route: '/' });
  assert.deepEqual(parseLocale('/zh/d/pulse'), { locale: 'zh', route: '/d/pulse' });
  assert.deepEqual(parseLocale('/docs'), { locale: 'en', route: '/docs' });
  assert.deepEqual(parseLocale('/zhang'), { locale: 'en', route: '/zhang' });
  assert.deepEqual(parseLocale('/zh/lab'), { locale: 'en', route: '/zh/lab' });
  assert.equal(localePath('/', 'zh'), '/zh');
  assert.equal(localePath('/#works', 'zh'), '/zh#works');
  assert.equal(localePath('/inspiration?topic=x', 'zh'), '/zh/inspiration?topic=x');
  assert.equal(localePath('/docs', 'en'), '/docs');
  for (const fixed of ['/lab', '/lab/forma', '/d/pulse.json', '/fonts/LICENSES.txt', 'https://example.test/a', '#works', '//example.test/a']) assert.equal(localePath(fixed, 'zh'), fixed);
});

test('the reference index links every reference page in each language', () => {
  const references = loadReferences(), zh = referenceIndex(references, 'zh'), en = referenceIndex(references, 'en');
  for (const r of references) { assert.ok(zh.includes(`href="/zh/inspiration/${r.id}"`), r.id); assert.ok(en.includes(`href="/inspiration/${r.id}"`), r.id); }
  assert.equal(new Set(zh.match(/href="[^"]+"/g)).size, references.length);
  assert.ok(!referenceIndex([{ id: 'x', name: '<b>&' }], 'zh').includes('<b>'));
});


test('draft English stays out of the English pages, hreflang and sitemap, and the Chinese page stays (RFC-005 §3.5)', async () => {
  const { guides } = await importTs(new URL('../src/guides-content.ts', import.meta.url).pathname), { entries } = loadEntries();
  const [draft, kept] = guides, marked = [{ ...draft, translations: { en: { status: 'draft' } } }, { ...kept, translations: { en: { status: 'complete', reviewedAt: '2026-11-02' } } }, ...guides.slice(2)];
  const pulse = entries.find(e => e.slug === 'pulse'), draftEntries = entries.map(e => e === pulse ? { ...e, translations: { en: { status: 'draft' } } } : e);
  const drafts = draftRoutes({ guides: marked, entries: draftEntries });
  assert.deepEqual(drafts, [...marked.filter(g => g.translations?.en?.status === 'draft').map(g => `/guides/${g.slug}`), '/d/pulse']);
  const legacy = guides.map(({ translations, ...guide }) => guide);
  assert.deepEqual(draftRoutes({ guides: legacy, entries }), [], 'legacy items without a status count as published');
  assert.deepEqual(draftRoutes({ guides, entries }), ['/guides/undo-ai-design-changes', '/guides/git-or-snapshot-undo', '/guides/design-references-with-sources', '/guides/write-a-design-brief-for-ai', '/guides/edit-one-part-of-a-ui-with-ai']);
  const body = route => `<main><h1>${route}</h1></main>`, routes = [...guides.map(g => `/guides/${g.slug}`), '/d/pulse'];
  const english = Object.fromEntries(routes.map(r => [r, body(r)])), rendered = Object.fromEntries(guides.map(g => [`/guides/${g.slug}`, body(g.slug)]));
  const pages = renderSite(draftEntries, template, 'https://example.test', [], { guides: marked, rendered, english: withoutDrafts(english, drafts) });
  const noindex = route => pages.get(route).includes('name="robots" content="noindex"');
  assert.ok(pages.has(`/zh/guides/${draft.slug}`) && noindex(`/guides/${draft.slug}`) && noindex('/d/pulse'), 'a draft keeps its Chinese page, and the English address shows it unindexed');
  assert.ok(!pages.get(`/zh/guides/${draft.slug}`).includes('hreflang') && !pages.get('/zh/d/pulse').includes('hreflang'));
  assert.ok(!noindex(`/guides/${kept.slug}`) && pages.get(`/zh/guides/${kept.slug}`).includes('hreflang="en"'));
  const map = sitemap(indexableRoutes(pages), 'https://example.test');
  assert.ok(!map.includes(`<loc>https://example.test/guides/${draft.slug}<`) && !map.includes('<loc>https://example.test/d/pulse<') && map.includes(`<loc>https://example.test/guides/${kept.slug}<`));
  assert.equal(Object.keys(english).length, routes.length, 'withoutDrafts leaves its input unchanged');
});

test('robots.txt refuses AI training crawlers but keeps search engines and user-requested AI access', () => {
  const text = robots('https://example.test'), groups = text.split(/\n\s*\n/);
  for (const agent of aiTrainingCrawlers) assert.ok(groups.some(g => g.trim().startsWith(`User-agent: ${agent}\nDisallow: /`)), agent);
  for (const agent of ['OAI-SearchBot', 'ChatGPT-User', 'Claude-User', 'Claude-SearchBot', 'PerplexityBot', 'Googlebot']) assert.ok(!text.includes(`User-agent: ${agent}`), `${agent} stays allowed`);
  assert.match(text, /User-agent: \*\nContent-Signal: search=yes, ai-input=yes, ai-train=no\nAllow: \//);
  assert.ok(text.trimEnd().endsWith('Sitemap: https://example.test/sitemap.xml'));
});

test('production can leave the A/B/C cases out while keeping every other page', async () => {
  for (const route of ['/cases', '/zh/cases', '/c/landing', '/zh/c/landing', '/d/pulse', '/zh/d/pulse']) assert.equal(isCaseRoute(route), true, route);
  for (const route of ['/', '/zh', '/docs/install', '/cases-study', '/changelog', '/browse/motion', '/inspiration/linear', '/docs']) assert.equal(isCaseRoute(route), false, route);
  const pages = withoutCases(new Map([['/', 'a'], ['/cases', 'b'], ['/zh/d/pulse', 'c'], ['/c/landing', 'd'], ['/skills', 'e']]));
  assert.deepEqual([...pages.keys()], ['/', '/skills']);
  const docs = await importTs(new URL('../src/docs-content.ts', import.meta.url).pathname), text = llms([], docs, 'https://example.test');
  assert.ok(!text.includes('## Cases') && !text.includes('/d/'), 'llms.txt has no case section without entries');
  assert.ok(text.includes('## Library'));
});

test('the agent install page uses the guide\'s commands, asks before writing and says what was checked', async () => {
  const docs = await importTs(new URL('../src/docs-content.ts', import.meta.url).pathname), text = agentInstall(docs, 'https://example.test');
  assert.match(text, /^# Install Variant Design/);
  for (const a of docs.agents) assert.ok(text.includes(a.path), a.id);
  assert.ok(text.includes(docs.clone('<path>')) && text.includes('node --version') && text.includes('v22'));
  assert.ok(text.includes('do not use sudo') && text.includes('do not overwrite it') && text.includes('Ask the user one question'));
  assert.ok(llms([], docs, 'https://example.test').includes('https://example.test/install/agent.md'));
  assert.ok(text.includes('which of the checks above you actually ran') && text.includes('https://example.test/llms-full.txt'));
  assert.ok(!text.includes('`sudo '), 'never tells the agent to run sudo');
});

test('the share card is the size the pages declare', async () => {
  const fs = await import('node:fs');
  const png = fs.readFileSync(new URL('./share-card.png', new URL('../public/', import.meta.url)));
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [shareCard.width, shareCard.height]);
});

test('every reference page links to up to five others of its kind, never itself, and says where it sits', () => {
  const references = loadReferences();
  for (const r of references) {
    const { list, total } = relatedReferences(r, references);
    assert.ok(list.length <= 5 && !list.some(x => x.id === r.id), r.id);
    assert.ok(list.every(x => sectionOf(x) === sectionOf(r) && (sectionOf(r) !== 'videos' || videoTypeOf(x) === videoTypeOf(r))), r.id);
    assert.equal(list.length, Math.min(5, total - 1), `${r.id} lists every other one when there are fewer than five`);
  }
});

test('reference pages carry a breadcrumb and a CreativeWork, section pages an ItemList, and the Chinese body links related references', () => {
  const references = loadReferences(), sections = sectionPages(references);
  const pages = renderSite([], template, 'https://example.test', references, { sections, english: {} });
  const graph = html => JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)[1]);
  const r = references.find(x => sectionOf(x) === 'web'), zh = pages.get(`/zh/inspiration/${r.id}`);
  const types = graph(zh)['@graph'].map(n => n['@type']);
  assert.deepEqual(types, ['BreadcrumbList', 'CreativeWork']);
  const crumbs = graph(zh)['@graph'][0].itemListElement;
  assert.deepEqual(crumbs.map(c => c.position), [1, 2, 3]);
  assert.equal(crumbs[2].item, `https://example.test/zh/inspiration/${r.id}`);
  assert.equal(graph(zh)['@graph'][1].isBasedOn, r.url);
  assert.match(zh, /<h2>同类参考<\/h2>/);
  const list = graph(pages.get('/browse/videos'));
  assert.equal(list['@type'], 'CollectionPage');
  assert.equal(list.mainEntity.numberOfItems, references.filter(x => sectionOf(x) === 'videos').length);
});
