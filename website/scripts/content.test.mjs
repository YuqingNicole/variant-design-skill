import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { contentRoot, imageSize, loadEntries, maxImageBytes, validateEntry } from './content.mjs';

const real = slug => JSON.parse(fs.readFileSync(path.join(contentRoot, 'entries', slug + '.json'), 'utf8'));
function sandbox(entry) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'content-'));
  fs.mkdirSync(path.join(root, 'media', entry.slug), { recursive: true });
  for (const d of entry.directions ?? []) for (const m of d.media ?? []) {
    const source = path.join(contentRoot, 'media', 'variant-site', 'a.jpg');
    fs.copyFileSync(source, path.join(root, 'media', entry.slug, m.file));
  }
  return root;
}
const check = (entry, root = sandbox(entry)) => { try { return validateEntry(entry, { root }); } finally { fs.rmSync(root, { recursive: true, force: true }); } };

test('every published entry is valid', () => {
  const { entries, problems } = loadEntries();
  assert.deepEqual(problems, []);
  assert.ok(entries.some(e => e.kind === 'verified'));
  // The validator checks only the shape of run.record (the Vercel build has no docs/); the file must exist in this repository.
  for (const e of entries) if (e.run?.record) assert.ok(fs.existsSync(path.join(contentRoot, '../..', e.run.record)), `${e.slug}: ${e.run.record} is missing`);
});

test('image sizes come from the file headers', () => {
  assert.deepEqual(imageSize(fs.readFileSync(path.join(contentRoot, 'media', 'variant-site', 'a.jpg'))), { width: 1440, height: 900 });
  const png = Buffer.alloc(24); Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(png); png.writeUInt32BE(320, 16); png.writeUInt32BE(200, 20);
  assert.deepEqual(imageSize(png), { width: 320, height: 200 });
  assert.equal(imageSize(Buffer.from('not an image')), null);
});

test('verified directions must match what the skill recorded', () => {
  const entry = real('variant-site');
  assert.deepEqual(check(entry), []);
  entry.directions[1].comparison.optimizes[0] = 'Rewritten after the fact';
  assert.ok(check(entry).some(e => e.includes('direction B comparison.optimizes differs')));
  const moved = real('variant-site'); moved.evidence.context = '../outside/.variant-context.json';
  assert.ok(check(moved).some(e => e.includes('evidence.context')));
  const picked = real('variant-site'); picked.recommendation.variant = 'C';
  assert.ok(check(picked).some(e => e.includes('recommendation differs')));
});

test('hosting rules follow the source', () => {
  const linked = { ...real('offscript'), source: 'link-only', url: 'https://example.com/' }; delete linked.kind;
  assert.ok(check(linked).some(e => e.includes('link-only entries cannot host media')));
  const licensed = { ...real('offscript'), source: 'permission' }; delete licensed.kind;
  assert.ok(check(licensed).some(e => e.includes('permission needs grantor')));
  licensed.permission = { grantor: 'Studio', scope: 'entry, category and share cards', date: '2026-10-27', record: 'https://github.com/YuqingNicole/variant-design-skill/issues/1' };
  assert.deepEqual(check(licensed), []);
  const concept = real('offscript'); concept.evidence = { context: 'website/variant-output/.variant-context.json' };
  assert.ok(check(concept).some(e => e.includes('evidence applies only to verified')));
});

test('entries never record a selected winner', () => {
  assert.ok(check({ ...real('forma'), selected: 'B' }).some(e => e.includes('never record a selected direction')));
});

test('images must exist, match their recorded size and stay small', () => {
  const entry = real('forma'); entry.directions[0].media[0].width = 1200;
  assert.ok(check(entry).some(e => e.includes('is 1440×900, not 1200×900')));
  const missing = real('forma'), root = sandbox(missing);
  fs.rmSync(path.join(root, 'media', 'forma', 'b.jpg'));
  assert.ok(check(missing, root).some(e => e.includes('image b.jpg is missing')));
  const big = real('forma'), bigRoot = sandbox(big);
  fs.appendFileSync(path.join(bigRoot, 'media', 'forma', 'c.jpg'), Buffer.alloc(maxImageBytes));
  assert.ok(check(big, bigRoot).some(e => e.includes('image c.jpg is') && e.includes('limit')));
  const escape = real('forma'); escape.directions[0].media[0].file = '../a.jpg';
  assert.ok(check(escape).some(e => e.includes('must be a plain')));
});

test('a run record belongs to verified entries and carries plain figures', () => {
  const run = { agent: 'Claude Code 2.1.323', date: '2026-11-13', durationSec: 612, costUsd: 2.41, turns: 44, prompt: ['中文指令', 'The prompt'], commands: ['node .claude/skills/variant-design/scripts/variant-history.mjs prepare'] };
  const errors = (patch, base = real('variant-site')) => check({ ...base, run: { ...run, ...patch } }).filter(e => e.startsWith('run'));
  assert.deepEqual(errors({}), []);
  assert.deepEqual(errors({ record: 'docs/research/2026-10-27-direction-library-dogfood.md' }), []);
  assert.equal(errors({ date: '13 Nov' }).length, 1);
  assert.equal(errors({ costUsd: '2.41' }).length, 1);
  assert.equal(errors({ prompt: 'one language only' }).length, 1);
  assert.equal(errors({ commands: Array.from({ length: 21 }, () => 'x') }).length, 1);
  assert.equal(errors({ record: '../outside.md' }).length, 1);
  assert.ok(check({ ...real('offscript'), run }).some(e => e.includes('run applies only to verified')));
});

test('translation status is complete or draft, never for the source language', () => {
  const [entry] = loadEntries().entries;
  const errors = translations => validateEntry({ ...entry, translations }).filter(e => e.startsWith('translations'));
  assert.deepEqual(errors({ en: { status: 'draft' } }), []);
  assert.deepEqual(errors({ en: { status: 'complete', reviewedAt: '2026-11-02' } }), []);
  assert.equal(errors({ en: { status: 'machine' } }).length, 1);
  assert.equal(errors({ en: { status: 'complete', reviewedAt: 'yesterday' } }).length, 1);
  assert.equal(errors({ zh: { status: 'draft' } }).length, 1);
});
