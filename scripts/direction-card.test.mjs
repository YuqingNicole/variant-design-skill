import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { discoverProject } from './project-profile.mjs';
import { createTask } from './design-task.mjs';
import { cardToReference, loadCard, validateCard } from './direction-card.mjs';

const pair = (zh, en) => [zh, en];
const direction = (id, extra = {}) => ({ id, name: pair(`方向 ${id}`, `Direction ${id}`), comparison: { optimizes: pair(`优化 ${id}`, `Optimizes ${id}`), tradeoff: pair(`取舍 ${id}`, `Trades off ${id}`), bestFor: pair(`适合 ${id}`, `Fits ${id}`) }, ...extra });
const card = (extra = {}) => ({ format: 'variant-direction-card', version: 1, url: 'https://library.example/d/pulse.json', page: 'https://library.example/d/pulse',
  title: pair('脉搏', 'Pulse'), summary: pair('摘要', 'Summary'), brief: pair('任务', 'Brief'), category: 'data', source: 'own', kind: 'verified',
  credit: { name: 'Variant Design', url: 'https://library.example' }, reuse: 'Inspiration only.', recommendation: { variant: 'B', reason: pair('理由', 'Reason') },
  directions: ['A', 'B', 'C'].map(id => direction(id, { image: `https://library.example/media/pulse/${id.toLowerCase()}.jpg` })), ...extra });
function project(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'direction-card-')); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'index.html'), '<button>Buy</button>');
  const profile = discoverProject(root, 'index.html');
  const brief = { goal: 'Clarify the report', audience: 'Product lead', route: '/report', coreTask: 'Read the week', allowedFiles: ['index.html'], preserve: ['Report data'], acceptance: ['Data unchanged'], brandConstraints: [], unknowns: [], discoveryReview: profile.unknowns.map((x, index) => ({ index, status: 'unresolved', reason: 'Fixture', blocking: false })) };
  return { root, profile, brief };
}

test('a card becomes an inspiration reference the task contract accepts', t => {
  assert.deepEqual(validateCard(card()), []);
  const reference = cardToReference(card());
  assert.equal(reference.borrow, 'Optimizes B'); assert.deepEqual(reference.directions, ['A']); assert.equal(reference.usage, 'inspiration');
  assert.deepEqual(reference.review, { status: 'unverified' }); assert.match(reference.constraints, /outrank the card/);
  const zh = cardToReference(card(), { direction: 'C', targets: ['B', 'C'], language: 'zh' });
  assert.equal(zh.borrow, '优化 C'); assert.deepEqual(zh.directions, ['B', 'C']); assert.equal(zh.id, 'card-pulse-c');
  const { profile, brief } = project(t);
  assert.deepEqual(createTask(profile, { ...brief, designReferences: [reference] }).brief.designReferences, [reference]);
  assert.throws(() => cardToReference(card(), { direction: 'D' }), /no direction D/);
  assert.throws(() => cardToReference(card(), { targets: ['A', 'A'] }), /distinct/);
});

test('cards that would overstate rights or a choice are rejected', () => {
  assert.ok(validateCard(card({ format: 'other' })).some(e => e.includes('format')));
  assert.ok(validateCard(card({ url: 'http://library.example/d/pulse.json' })).some(e => e.includes('https')));
  assert.ok(validateCard(card({ selected: 'B' })).some(e => e.includes('selected')));
  assert.ok(validateCard(card({ reuse: '' })).some(e => e.includes('reuse')));
  const linked = card({ source: 'link-only' }); delete linked.kind;
  assert.ok(validateCard(linked).some(e => e.includes('Link-only cards cannot include images')));
  const broken = card(); broken.directions[1].comparison.tradeoff = ['only one'];
  assert.ok(validateCard(broken).some(e => e.includes('Direction B comparison.tradeoff')));
});

test('loading reports network problems and reads local copies', async t => {
  const ok = async () => ({ ok: true, json: async () => card() });
  assert.equal((await loadCard('https://library.example/d/pulse.json', { fetchImpl: ok })).title[1], 'Pulse');
  await assert.rejects(loadCard('https://library.example/d/pulse.json', { fetchImpl: async () => { throw new Error('getaddrinfo ENOTFOUND'); } }), /paste the card JSON/);
  await assert.rejects(loadCard('https://library.example/d/pulse.json', { fetchImpl: async () => ({ ok: false, status: 404 }) }), /HTTP 404/);
  await assert.rejects(loadCard('http://library.example/d/pulse.json', { fetchImpl: ok }), /https/);
  await assert.rejects(loadCard('https://library.example/d/pulse.json', { fetchImpl: async () => ({ ok: true, json: async () => card({ selected: 'A' }) }) }), /Invalid direction card/);
  const { root } = project(t);
  fs.writeFileSync(path.join(root, 'card.json'), JSON.stringify(card()));
  assert.equal((await loadCard('card.json', { root })).recommendation.variant, 'B');
  fs.symlinkSync(path.join(root, 'card.json'), path.join(root, 'linked.json'));
  await assert.rejects(loadCard('linked.json', { root }), /symlink/);
});
