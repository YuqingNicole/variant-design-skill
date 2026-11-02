import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { importTs } from './ts-module.mjs';

const { parseChangelog, inline, releaseId } = await importTs(new URL('../src/changelog.ts', import.meta.url).pathname);
const { changelogZh } = await importTs(new URL('../src/changelog-zh.ts', import.meta.url).pathname);
const releases = parseChangelog(fs.readFileSync(new URL('../../CHANGELOG.md', import.meta.url), 'utf8'));
const codes = text => inline(text).filter(part => 'code' in part).map(part => part.code).sort();

test('the changelog parses into releases with headings, items and text', () => {
  assert.ok(releases.length > 0);
  assert.deepEqual(parseChangelog('# Changelog\n\n## 1.0.0 — 2026-01-02\n\nIntro.\n\n### Fixed\n- One `a`\n'),
    [{ version: '1.0.0', date: '2026-01-02', blocks: [{ kind: 'text', text: 'Intro.' }, { kind: 'heading', text: 'Fixed' }, { kind: 'item', text: 'One `a`' }] }]);
  assert.deepEqual(inline('x `a` or `` $` `` y'), [{ text: 'x ' }, { code: 'a' }, { text: ' or ' }, { code: '$`' }, { text: ' y' }]);
  assert.equal(new Set(releases.map(r => releaseId(r.version))).size, releases.length);
});

test('every release has a Chinese translation, block for block, with the same code', () => {
  assert.deepEqual(Object.keys(changelogZh).sort(), releases.map(r => r.version).sort(), 'translate new releases in src/changelog-zh.ts');
  for (const r of releases) {
    const zh = changelogZh[r.version].blocks;
    assert.equal(zh.length, r.blocks.length, `${r.version}: block count`);
    r.blocks.forEach((b, i) => assert.deepEqual(codes(zh[i]), codes(b.text), `${r.version} block ${i}: ${b.text.slice(0, 60)}`));
  }
});
