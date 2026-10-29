import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
// The data module is plain JSON literals, so CI on Node 22 can read it without a TS loader.
const source = fs.readFileSync(new URL('../src/inspiration-data.ts', import.meta.url), 'utf8');
const read = name => { const start = source.indexOf(`export const ${name} = `); assert.ok(start >= 0, name); const from = source.indexOf('[', start); return JSON.parse(source.slice(from, source.indexOf('\n];', from) + 2)); };
const items = read('inspirationItems'), topics = read('inspirationTopics');
const date = /^\d{4}-\d{2}-\d{2}$/;

test('every external reference records provenance; unknown designers stay null', () => {
  assert.equal(new Set(items.map(i => i.id)).size, items.length);
  for (const i of items) {
    assert.equal(new URL(i.url).protocol, 'https:', i.id);
    assert.equal(i.source, 'link-only', i.id);
    assert.ok(i.publisher?.trim(), i.id);
    assert.ok(['official-site', 'product-page', 'documentation'].includes(i.kind), i.id);
    assert.ok(i.designer === null || i.designer.trim(), i.id);
    assert.match(i.checkedAt, date, i.id);
  }
});

test('topics stay small, dated and point at existing references', () => {
  const ids = new Set(items.map(i => i.id));
  for (const t of topics) {
    assert.ok(t.items.length > 0 && t.items.length <= 12, t.id);
    assert.equal(new Set(t.items).size, t.items.length, t.id);
    for (const id of t.items) assert.ok(ids.has(id), `${t.id}: ${id}`);
    assert.match(t.linksCheckedAt, date, t.id);
    assert.equal(t.title.length, 2); assert.equal(t.task.length, 2);
  }
});
