import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const slots = JSON.parse(fs.readFileSync(new URL('../src/sponsor-slots.json', import.meta.url), 'utf8'));
const day = /^\d{4}-\d{2}-\d{2}$/;

// The rules on /sponsor: labelled, relevant, no hidden tracking. A booked placement is data, so the data is checked.
test('every booked sponsor slot is a dated, bilingual, https placement', () => {
  assert.ok(Array.isArray(slots));
  assert.equal(new Set(slots.map(s => s.id)).size, slots.length);
  for (const s of slots) {
    assert.match(s.from, day); assert.match(s.until, day); assert.ok(s.from < s.until, `${s.id} runs backwards`);
    assert.ok(s.brand?.trim(), `${s.id} brand`);
    for (const key of ['title', 'text']) { assert.ok(s[key]?.zh?.trim() && s[key]?.en?.trim(), `${s.id} ${key} needs both languages`); }
    assert.match(s.url, /^https:\/\//);
    if (s.image) { assert.match(s.image.src, /^(https:\/\/|\/)/); assert.ok(s.image.alt?.zh && s.image.alt?.en, `${s.id} image alt`); }
  }
});
