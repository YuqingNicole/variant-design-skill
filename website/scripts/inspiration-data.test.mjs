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
    assert.equal(i.source, i.media ? 'press-kit' : 'link-only', i.id);
    assert.ok(i.publisher?.trim(), i.id);
    assert.ok(['official-site', 'product-page', 'documentation', 'social-post'].includes(i.kind), i.id);
    assert.ok(i.designer === null || i.designer.trim(), i.id);
    assert.match(i.checkedAt, date, i.id);
  }
});

test('a source screenshot ships only with a recorded permission and as a local file', () => {
  for (const i of items.filter(i => i.media)) {
    const { src, width, height, alt, permission } = i.media;
    assert.match(src, /^\/inspiration-media\/[a-z0-9-]+\.(webp|png|jpg)$/, i.id);
    assert.ok(fs.existsSync(new URL(`../public${src}`, import.meta.url)), i.id);
    assert.ok(width > 0 && height > 0 && alt.length === 2, i.id);
    assert.ok(permission?.grantedBy?.trim() && permission?.terms?.trim(), i.id);
    assert.equal(new URL(permission.url).protocol, 'https:', i.id);
    assert.match(permission.grantedAt, date, i.id);
  }
});

test('best-practice entries are X posts with the oEmbed fields their card renders', () => {
  for (const i of items.filter(i => i.category === 'practice' || i.post)) {
    assert.equal(i.category, 'practice', i.id); assert.equal(i.kind, 'social-post', i.id); assert.equal(i.source, 'link-only', i.id);
    const m = /^https:\/\/x\.com\/([A-Za-z0-9_]+)\/status\/(\d+)$/.exec(i.url); assert.ok(m, i.id);
    assert.equal(i.post.handle, m[1], i.id); assert.equal(i.post.id, m[2], i.id);
    assert.ok(i.post.author.trim() && i.post.text.trim() && typeof i.post.hasMedia === 'boolean', i.id); assert.match(i.post.date, date, i.id);
    assert.doesNotMatch(i.focus[0] + i.application[0] + i.name, /TODO/, i.id);
  }
});

test('the prerendered description counts every reference', () => {
  const prerender = fs.readFileSync(new URL('./prerender.mjs', import.meta.url), 'utf8');
  assert.match(prerender, new RegExp(`'${items.length} 个外部设计参考`));
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
