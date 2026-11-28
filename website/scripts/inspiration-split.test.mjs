import test from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import { importTs } from './ts-module.mjs';
import { cardFields, cardLocales, cardOf, cardsSource, indexSource, inspirationPlugin, moduleSource, pageSize, readLibrary, rowFields, splitReferences } from './inspiration-split.mjs';

const { sectionOf, sections, pageOf } = await importTs(new URL('../src/inspiration-sections.ts', import.meta.url).pathname);
const library = readLibrary(), split = splitReferences(library.items, sectionOf, { ...library, onHome: r => !pageOf(r) });
const gzipKb = text => zlib.gzipSync(Buffer.from(text)).length / 1024;

test('the index keeps every reference in file order with only the row fields', () => {
  assert.equal(split.index.length, library.items.length);
  assert.deepEqual(split.index.map(r => r.id), library.items.map(r => r.id));
  for (const row of split.index) assert.deepEqual(Object.keys(row), rowFields);
  assert.ok(split.index.length === 0 || 'focus' in library.items[0]);
});

test('the first page is the newest references the home lists (no Videos), as the home sorts them, with their previews and media', () => {
  const newest = [...library.items].filter(r => !pageOf(r)).sort((a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt)).slice(0, pageSize);
  assert.deepEqual(split.first.items.map(r => r.id), newest.map(r => r.id));
  for (const r of split.first.items) {
    assert.equal(split.first.previews[r.id], library.previews[r.id]);
    assert.equal(split.first.media[r.id], library.media[r.id]);
  }
  assert.ok(Object.keys(split.first.previews).every(id => newest.some(r => r.id === id)));
});

test('the section chunks partition the library and carry only their own previews and media', () => {
  const ids = Object.values(split.sections).flatMap(s => s.items.map(r => r.id));
  assert.equal(ids.length, library.items.length);
  assert.equal(new Set(ids).size, ids.length);
  for (const [id, part] of Object.entries(split.sections)) {
    assert.ok(sections.some(s => s.id === id), id);
    for (const r of part.items) assert.equal(sectionOf(r), id);
    for (const key of Object.keys(part.previews)) assert.ok(part.items.some(r => r.id === key), `${id} preview ${key}`);
    for (const key of Object.keys(part.media)) assert.ok(part.items.some(r => r.id === key), `${id} media ${key}`);
  }
  assert.equal(Object.keys(split.all.previews).length, Object.keys(library.previews).filter(id => library.items.some(r => r.id === id)).length);
});

test('the browser gets cards for the first page and the SSR build the whole library', async () => {
  const plugin = inspirationPlugin(), id = plugin.resolveId('virtual:inspiration/initial');
  assert.equal(id, '\0virtual:inspiration/initial');
  const context = { addWatchFile() {} }, load = (name, ssr = false) => plugin.load.call(context, '\0virtual:inspiration/' + name, { ssr });
  assert.equal(await load('initial'), moduleSource({ items: [], previews: {}, media: {} }));
  assert.equal(await load('initial', true), moduleSource(split.all));
  for (const locale of Object.keys(cardLocales)) assert.equal(await load(`cards-${locale}`), cardsSource(split.first, locale), locale);
  assert.ok((await load('cards')).includes('import("virtual:inspiration/cards-zh")'));
  assert.equal(await load('first'), moduleSource(split.first));
  const loader = await load('loader');
  for (const section of Object.keys(split.sections)) assert.ok(loader.includes(`import("virtual:inspiration/section-${section}")`), section);
  assert.ok(loader.includes('"first":()=>import("virtual:inspiration/first")'));
  assert.ok(!Object.keys(split.sections).includes('first'), 'no section may be called first');
  assert.equal(await load('index'), indexSource(split.index, library.topics));
  assert.equal(plugin.resolveId('./inspiration-data'), undefined);
});

test('the index module rebuilds exactly the rows it was given', async () => {
  const url = 'data:text/javascript,' + encodeURIComponent(indexSource(split.index, library.topics)), mod = await import(url);
  assert.deepEqual(mod.index, JSON.parse(JSON.stringify(split.index)));
  assert.deepEqual(mod.topics, library.topics);
});

test('a card carries its link, its post or video and the focus line in one language, nothing else', () => {
  for (const r of split.first.items) for (const [locale, chain] of Object.entries(cardLocales)) {
    const card = cardOf(r, locale);
    assert.deepEqual(Object.keys(card).sort(), ['id', 'focus', ...cardFields.filter(k => r[k] !== undefined)].sort());
    assert.deepEqual(card.focus, { zh: chain.map(l => r.focus[l]).find(Boolean) });
  }
});

// The point of the split: what the home script carries no longer grows with the library (TODO §6), nor with a long note.
const homeKb = (lib, locale) => { const parts = splitReferences(lib.items, sectionOf, { ...lib, onHome: r => !pageOf(r) }); return gzipKb(indexSource(parts.index, lib.topics)) + gzipKb(cardsSource(parts.first, locale)); };
// 22, not 20 (2026-11-28): the index keeps one row per reference by design, about 0.03 KB each, and gzip on CI's x64 runners
// comes out slightly larger than on arm64 Macs (19.70 KB locally crossed 20 there). The Playwright home budget (125 KB) is the real guard.
test('the home script carries a small index and one page of cards, not the library', () => {
  for (const locale of Object.keys(cardLocales)) assert.ok(homeKb(library, locale) < 22, locale);
  assert.ok(gzipKb(moduleSource(split.all)) > 40, 'the whole library is what the split keeps out');
});

test('a new reference with long notes adds its row and one focus line to the home, not its notes', () => {
  const long = 'A long note about this reference that repeats a careful observation. '.repeat(40), base = split.first.items[0];
  const entry = { ...base, id: 'long-note-fixture', name: 'Long note fixture', addedAt: new Date(Date.parse(base.addedAt) + 1000).toISOString(),
    focus: { zh: '一句话的焦点。', en: 'A one-line focus.' }, application: { zh: long, en: long }, analysis: { structure: { zh: long, en: long } } };
  for (const locale of Object.keys(cardLocales)) {
    const grown = homeKb({ ...library, items: [...library.items, entry] }, locale) - homeKb(library, locale);
    assert.ok(grown < 0.25, `${locale}: ${grown.toFixed(2)} KB`);
  }
});
