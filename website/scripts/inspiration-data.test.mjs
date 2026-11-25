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
    assert.ok(['official-site', 'product-page', 'documentation', 'social-post', 'youtube-video'].includes(i.kind), i.id);
    assert.ok(i.designer === null || i.designer.trim(), i.id);
    assert.match(i.checkedAt, date, i.id);
    assert.ok(Number.isFinite(Date.parse(i.addedAt)), `${i.id}: first collection timestamp`);
  }
});

test('best-practice entries and other X links carry the oEmbed fields their card renders', () => {
  for (const i of items.filter(i => (i.category === 'practice' && i.kind !== 'youtube-video') || i.post || i.kind === 'social-post')) {
    assert.ok(i.post, i.id); assert.equal(i.kind, 'social-post', i.id); assert.equal(i.source, 'link-only', i.id);
    const m = /^https:\/\/x\.com\/([A-Za-z0-9_]+)\/status\/(\d+)(?:\/photo\/(\d+))?$/.exec(i.url); assert.ok(m, i.id);
    assert.equal(i.post.handle, m[1], i.id); assert.equal(i.post.id, m[2], i.id);
    // One picture of a photo post: the link opens that picture on X, and the entry is filed as the page or interface it shows.
    if (m[3] || 'photo' in i.post) {
      assert.ok(Number.isInteger(i.post.photo) && i.post.photo >= 1, i.id); assert.equal(m[3], String(i.post.photo), i.id); assert.ok(i.post.hasMedia, i.id);
      assert.ok(['landing', 'product', 'flow'].includes(i.category), i.id); assert.equal(i.id, `x-${i.post.handle.toLowerCase()}-${i.post.id.slice(-6)}-${String(i.post.photo).padStart(2, '0')}`, i.id);
    } else assert.equal(i.category, 'practice', i.id);
    // A media-only post has no text; it must then carry media and the no-linguistic-content language tag.
    assert.ok(i.post.author.trim() && typeof i.post.text === 'string' && typeof i.post.hasMedia === 'boolean', i.id);
    if (!i.post.text.trim()) { assert.ok(i.post.hasMedia, i.id); assert.equal(i.post.lang, 'zxx', i.id); }
    if (i.via) assert.match(i.via, /^https:\/\/[^/]+\//, i.id);
    assert.doesNotMatch(i.post.text, /&(amp|lt|gt|quot|#\d+);/, `${i.id}: store decoded text`); assert.match(i.post.date, date, i.id);
    assert.doesNotMatch(i.focus.zh + i.application.zh + i.name, /TODO/, i.id);
  }
});

test('YouTube entries name their video and have no X post fields', () => {
  for (const i of items.filter(i => i.kind === 'youtube-video' || i.video)) {
    assert.equal(i.kind, 'youtube-video', i.id); assert.ok(!i.post, i.id); assert.equal(i.source, 'link-only', i.id); assert.equal(i.category, 'practice', i.id);
    assert.equal(i.video.platform, 'youtube', i.id); assert.match(i.video.id, /^[A-Za-z0-9_-]{11}$/, i.id);
    assert.equal(i.url, `https://www.youtube.com/watch?v=${i.video.id}`, i.id); assert.equal(i.id, `yt-${i.video.id}`, i.id);
    assert.ok(i.video.channel?.trim(), i.id); if (i.video.date) assert.match(i.video.date, date, i.id); if ('seconds' in i.video) assert.ok(i.video.seconds > 0, i.id);
    assert.doesNotMatch(i.focus.zh + i.application.zh + i.name, /TODO/, i.id);
  }
});

test('topics stay small, dated and point at existing references', () => {
  const ids = new Set(items.map(i => i.id));
  for (const t of topics) {
    assert.ok(t.items.length > 0 && t.items.length <= 12, t.id);
    assert.equal(new Set(t.items).size, t.items.length, t.id);
    for (const id of t.items) assert.ok(ids.has(id), `${t.id}: ${id}`);
    assert.match(t.linksCheckedAt, date, t.id);
  }
});

// RFC-005 P1: our own notes are values per language, never positional pairs; both published languages are written.
test('every note, topic and source label is written in both languages', () => {
  const sources = read('inspirationSources');
  const fields = [...items.flatMap(i => [[`${i.id}.focus`, i.focus], [`${i.id}.application`, i.application]]),
    ...topics.flatMap(t => [[`${t.id}.title`, t.title], [`${t.id}.task`, t.task]]), ...sources.map(s => [`${s.name}.type`, s.type])];
  for (const [name, value] of fields) {
    assert.ok(value && !Array.isArray(value), name);
    assert.deepEqual(Object.keys(value), ['zh', 'en'], name);
    assert.ok(value.zh.trim() && value.en.trim(), name);
  }
});

// A breakdown is hand-written from opening the site: dated, and every part written in both languages.
test('every breakdown is dated and complete in both languages', () => {
  const analysed = items.filter(i => i.analysis);
  assert.ok(analysed.length >= 5);
  for (const { id, analysis: a } of analysed) {
    assert.match(a.checkedAt, /^\d{4}-\d{2}-\d{2}$/, id);
    for (const key of ['structure', 'learn', 'avoid']) { assert.deepEqual(Object.keys(a[key]), ['zh', 'en'], `${id}.${key}`); assert.ok(a[key].zh.trim() && a[key].en.trim(), `${id}.${key}`); assert.ok(/[㐀-鿿]/.test(a[key].zh) && /[A-Za-z]{3}/.test(a[key].en), `${id}.${key} languages`); }
    assert.ok(a.measured.zh.length >= 2 && a.measured.zh.length === a.measured.en.length, `${id}.measured`);
    assert.ok([...a.measured.zh, ...a.measured.en].every(v => v.trim()), id);
  }
});
