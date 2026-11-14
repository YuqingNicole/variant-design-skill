import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const records = JSON.parse(fs.readFileSync(new URL('../src/testimonials.json', import.meta.url), 'utf8'));
const day = /^\d{4}-\d{2}-\d{2}$/, both = v => Boolean(v?.zh?.trim() && v?.en?.trim());

// A testimonial is someone else's words under their name: published ones need their consent on record, a real
// source and nothing left over from the sample text. Drafts are the layout's placeholders and never reach production.
test('every testimonial is bilingual, dated and sourced; published ones carry consent and are not samples', () => {
  assert.ok(Array.isArray(records));
  assert.equal(new Set(records.map(r => r.id)).size, records.length);
  for (const r of records) {
    assert.ok([undefined, 'draft', 'published'].includes(r.status), `${r.id} status`);
    for (const key of ['name', 'role', 'org', 'quote']) assert.ok(both(r[key]), `${r.id} ${key} needs both languages`);
    assert.match(r.date, day); assert.match(r.source?.url ?? '', /^https:\/\//); assert.ok(both(r.source?.label), `${r.id} source label`);
    if (r.avatar) { assert.match(r.avatar.src, /^(https:\/\/|\/)/); assert.ok(both(r.avatar.alt), `${r.id} avatar alt`); }
    if (r.status === 'draft') continue;
    assert.equal(r.consent?.granted, true, `${r.id} needs recorded consent`); assert.match(r.consent?.at ?? '', day);
    assert.ok(!/example\.com/.test(r.source.url), `${r.id} still points at the sample source`);
    for (const text of [r.quote.zh, r.quote.en, r.name.zh, r.name.en]) assert.ok(!/示例|sample/i.test(text), `${r.id} still contains sample text`);
  }
});
