import test from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import { importTs } from './ts-module.mjs';
import { inspirationPlugin, moduleSource, pageSize, readLibrary, rowFields, splitReferences } from './inspiration-split.mjs';

const { sectionOf, sections } = await importTs(new URL('../src/inspiration-sections.ts', import.meta.url).pathname);
const library = readLibrary(), split = splitReferences(library.items, sectionOf, library);
const gzipKb = text => zlib.gzipSync(Buffer.from(text)).length / 1024;

test('the index keeps every reference in file order with only the row fields', () => {
  assert.equal(split.index.length, library.items.length);
  assert.deepEqual(split.index.map(r => r.id), library.items.map(r => r.id));
  for (const row of split.index) assert.deepEqual(Object.keys(row), rowFields);
  assert.ok(split.index.length === 0 || 'focus' in library.items[0]);
});

test('the first page is the newest references, as the home sorts them, with their previews and media', () => {
  const newest = [...library.items].sort((a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt)).slice(0, pageSize);
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

test('the browser gets the first page and the SSR build the whole library from the same module', async () => {
  const plugin = inspirationPlugin(), id = plugin.resolveId('virtual:inspiration/initial');
  assert.equal(id, '\0virtual:inspiration/initial');
  const context = { addWatchFile() {} };
  const browser = await plugin.load.call(context, id, { ssr: false }), ssr = await plugin.load.call(context, id, { ssr: true });
  assert.equal(browser, moduleSource(split.first));
  assert.equal(ssr, moduleSource(split.all));
  const loader = await plugin.load.call(context, '\0virtual:inspiration/loader');
  for (const section of Object.keys(split.sections)) assert.ok(loader.includes(`import("virtual:inspiration/section-${section}")`), section);
  const index = await plugin.load.call(context, '\0virtual:inspiration/index');
  assert.ok(index.startsWith(`export const index=${JSON.stringify(split.index)};`));
  assert.ok(index.includes(`export const topics=${JSON.stringify(library.topics)};`));
  assert.equal(plugin.resolveId('./inspiration-data'), undefined);
});

// The point of the split: what the home script carries no longer grows with the library (TODO §6).
test('the home script carries a small index and one page, not the library', () => {
  assert.ok(gzipKb(JSON.stringify(split.index)) < 12, 'index');
  assert.ok(gzipKb(moduleSource(split.first)) < 25, 'first page');
  assert.ok(gzipKb(moduleSource(split.all)) > 40, 'the whole library is what the split keeps out');
});
