import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { importTs } from './ts-module.mjs';
import { indexableRoutes, renderSite } from './prerender.mjs';
import { facetsModule } from './reference-facets.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const { collections, visibleCollections, collectionState, minimumReviewed } = await importTs(path.join(here, '../src/collections.ts'));
const template = '<!doctype html><html><head>\n<meta name="description" content="old" />\n<title>Old</title>\n</head><body><div id="root"></div></body></html>';
const dark = collections.find(c => c.slug === 'dark-websites');
const facet = (status, over = {}) => ({ status, ...(status === 'reviewed' ? { reviewedAt: '2026-11-21', reviewedBy: 'agent' } : {}), industry: null, medium: 'website', pageTypes: [], patterns: [], components: [], techniques: [], styles: ['dark'], ...over });
const facets = n => Object.fromEntries([...Array(8)].map((_, i) => [`r${i}`, facet(i < n ? 'reviewed' : 'draft', i === 7 ? { medium: 'poster' } : {})]));
const ids = [...Array(8)].map((_, i) => `r${i}`), rows = ids.map((id, i) => (i === 6 ? { id, category: 'practice', tag: 'Motion', kind: 'social-post' } : { id, category: 'landing', tag: 'SaaS', kind: 'official-site' }));

test('unreviewed English collection pages are listed as drafts for production', async () => {
  const { englishDraftRoutes } = await importTs(path.join(here, '../src/collections.ts'));
  assert.deepEqual(englishDraftRoutes([]), []);
  assert.deepEqual(englishDraftRoutes([dark, { slug: 'x', translations: { en: { status: 'complete' } } }]), ['/collections', '/collections/dark-websites']);
});

test('every collection filters on real facet values and has both languages', () => {
  const vocab = facetsModule.facetVocabulary;
  for (const c of collections) {
    assert.ok(c.short.zh && c.short.en && c.title.zh && c.title.en && c.intro.zh && c.intro.en, c.slug);
    for (const [name, value] of Object.entries(c.where)) assert.ok(Object.hasOwn(vocab[name], value), `${c.slug}: ${name}=${value}`);
  }
  assert.equal(new Set(collections.map(c => c.slug)).size, collections.length);
});

test('production publishes a collection only with enough reviewed members, and lists only those', () => {
  assert.deepEqual(collectionState(dark, facets(2), rows).members, ids.slice(0, 6));
  assert.equal(visibleCollections(facets(minimumReviewed - 1), rows, false).length, 0);
  const live = visibleCollections(facets(minimumReviewed), rows, false).find(c => c.slug === 'dark-websites');
  assert.deepEqual(live.items, ids.slice(0, minimumReviewed));
  const preview = visibleCollections(facets(0), rows, true).find(c => c.slug === 'dark-websites');
  assert.equal(preview.ready, false); assert.deepEqual(preview.items, ids.slice(0, 6)); // r6 is a video, r7 a poster: neither is a website
});

test('a ready collection is indexed with an ItemList; a preview-only one is noindex and out of the sitemap', () => {
  const refs = ids.map(id => ({ id, name: `Ref ${id}`, category: 'landing', tag: 'SaaS', url: 'https://a.test/', focus: { zh: 'f', en: 'f' }, application: { zh: 'a', en: 'a' }, publisher: 'p', checkedAt: '2026-11-21' }));
  const list = [{ ...dark, ready: true, items: ['r0', 'r1'] }, { ...collections[1], ready: false, items: ['r2'] }];
  const pages = renderSite([], template, 'https://example.test', refs, { collections: list }), routes = indexableRoutes(pages);
  assert.ok(routes.includes('/zh/collections/dark-websites') && routes.includes('/zh/collections'));
  assert.ok(!routes.includes(`/zh/collections/${collections[1].slug}`));
  const html = pages.get('/zh/collections/dark-websites');
  assert.ok(html.includes('"@type":"ItemList"') && html.includes('https://example.test/zh/inspiration/r1') && html.includes('Ref r1'));
  assert.equal(renderSite([], template, 'https://example.test', refs, {}).has('/zh/collections'), false);
});
