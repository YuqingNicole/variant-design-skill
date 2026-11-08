import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEntries } from './content.mjs';
import { loadReferences, renderSite, sectionPages, sitemap, indexableRoutes } from './prerender.mjs';
import { importTs } from './ts-module.mjs';
const { sections, sectionOf, sectionPath, activeSections } = await importTs(new URL('../src/inspiration-sections.ts', import.meta.url).pathname);
const template = '<!doctype html><html><head>\n<meta name="description" content="old" />\n<title>Old</title>\n</head><body><div id="root"></div></body></html>';

test('every reference belongs to exactly one section, so no tab repeats another', () => {
  const refs = loadReferences(), ids = new Set(sections.map(s => s.id));
  assert.equal(new Set(sections.map(s => s.id)).size, sections.length);
  const byId = Object.groupBy(refs, sectionOf);
  for (const id of Object.keys(byId)) assert.ok(ids.has(id), `unknown section ${id}`);
  assert.equal(Object.values(byId).flat().length, refs.length);
  assert.equal(new Set(Object.values(byId).flat().map(r => r.id)).size, refs.length);
});

test('mapping rules: practice splits by tag, landing is web, product and flow are interface', () => {
  assert.equal(sectionOf({ category: 'landing', tag: 'SaaS' }), 'web');
  assert.equal(sectionOf({ category: 'product', tag: 'Editor' }), 'interface');
  assert.equal(sectionOf({ category: 'flow', tag: 'History' }), 'interface');
  for (const [tag, id] of [['Motion', 'motion'], ['Interaction', 'interaction'], ['Branding', 'branding'], ['Brand', 'branding'], ['Web', 'web'], ['Illustration', 'illustration'], ['Poster', 'posters'], ['Print', 'print'], ['Anything else', 'web']]) assert.equal(sectionOf({ category: 'practice', tag }), id, tag);
  assert.equal(sectionPath(''), '/'); assert.equal(sectionPath('web'), '/browse/web');
});

test('a section with no reference has no tab and no page until one exists', () => {
  const only = [{ category: 'practice', tag: 'Motion' }];
  assert.deepEqual(activeSections(only).map(s => s.id), ['motion']);
  const refs = loadReferences(), active = activeSections(refs).map(s => s.id);
  for (const id of ['illustration', 'posters', 'print']) assert.ok(!active.includes(id));
  assert.ok(sectionPages(refs).every(s => s.count.zh > 0));
});

test('each section page has its own address, title, description and canonical, listed once in the sitemap', () => {
  const { entries } = loadEntries(), refs = loadReferences(), list = sectionPages(refs);
  const english = Object.fromEntries(list.map(s => [`/browse/${s.id}`, '<main><h1>x</h1></main>']));
  const pages = renderSite(entries, template, 'https://example.test', refs, { sections: list, english });
  const titles = new Set(), descriptions = new Set();
  for (const s of list) {
    const zh = pages.get(`/browse/${s.id}`), en = pages.get(`/en/browse/${s.id}`);
    assert.ok(zh && en, s.id);
    assert.ok(zh.includes(`<link rel="canonical" href="https://example.test/browse/${s.id}">`));
    assert.ok(en.includes(`<link rel="canonical" href="https://example.test/en/browse/${s.id}">`));
    assert.ok(zh.includes(`<title>${s.title.zh} — Variant Design</title>`));
    titles.add(s.title.zh); descriptions.add(zh.match(/name="description" content="([^"]*)"/)[1]);
  }
  assert.equal(titles.size, list.length); assert.equal(descriptions.size, list.length);
  const map = sitemap(indexableRoutes(pages), 'https://example.test');
  for (const s of list) assert.equal(map.split(`<loc>https://example.test/browse/${s.id}</loc>`).length - 1, 1);
});
