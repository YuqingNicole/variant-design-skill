import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { importTs } from './ts-module.mjs';

const { parseChangelog, inline, releaseId, packageVersion, packageGroups, withoutPackageLead, splitItem, monthOf, formatDate, formatMonth } = await importTs(new URL('../src/changelog.ts', import.meta.url).pathname);
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

test('website entries group under their package version, and the newest one is the version the site runs', () => {
  assert.equal(packageVersion('Website package `0.4.0`: the interface'), '0.4.0');
  assert.equal(packageVersion('Phones: the six category tabs'), null);
  assert.deepEqual(packageGroups([{ en: 'Website package `0.2.0`: a' }, { en: 'Phones: b' }, { en: 'Website package `0.2.1`: c' }]).map(g => [g.version, g.items.length]), [['0.2.0', 2], ['0.2.1', 1]]);
  assert.deepEqual(packageGroups([{ en: 'Loose' }, { en: 'Website package `1.0.0`: x' }]).map(g => g.version), [null, '1.0.0']);
  assert.equal(withoutPackageLead('Website package `0.2.0`: every category is its own page'), 'Every category is its own page');
  assert.equal(withoutPackageLead('Website package `0.3.0`: `/docs` is a hub'), '`/docs` is a hub');
  assert.equal(withoutPackageLead('网站包 `0.2.0`：灵感的每个分类'), '灵感的每个分类');
  assert.equal(withoutPackageLead('Website package `0.1.1` adds a footer'), 'Website package `0.1.1` adds a footer');
  // docs/versioning.md: a website release bumps website/package.json and describes itself under the newest release's Website heading.
  const website = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
  const versions = releases.map(r => {
    const start = r.blocks.findIndex(b => b.kind === 'heading' && b.text === 'Website');
    const items = start < 0 ? [] : r.blocks.slice(start + 1).reduce((acc, b) => (acc.done || b.kind === 'heading' ? { ...acc, done: true } : b.kind === 'item' ? { ...acc, items: [...acc.items, { en: b.text }] } : acc), { items: [], done: false }).items;
    return packageGroups(items).map(g => g.version).filter(Boolean);
  }).find(v => v.length);
  assert.equal(versions?.at(-1), website, `describe website package ${website} under the newest release's Website heading`);
  // The Chinese entries carry the same lead, so the page can drop it in both languages.
  for (const r of releases) r.blocks.forEach((b, i) => {
    const version = b.kind === 'item' && packageVersion(b.text);
    if (version) assert.match(changelogZh[r.version].blocks[i], new RegExp(`^网站包 \`${version.replace(/\./g, '\\.')}\``), `${r.version}: Chinese lead for ${version}`);
  });
});

test('every item opens with a short label in both languages, shown as its title', () => {
  assert.deepEqual(splitItem('Phones: the six category tabs scroll'), { title: 'Phones', body: 'The six category tabs scroll' });
  assert.deepEqual(splitItem('Website package `0.4.0`: Neutral ink: the interface is ink'), { title: 'Neutral ink', body: 'The interface is ink' });
  assert.deepEqual(splitItem('网站包 `0.2.0`：每个分类一个页面：灵感的每个分类'), { title: '每个分类一个页面', body: '灵感的每个分类' });
  assert.deepEqual(splitItem('`/docs` is a hub: no label before the code'), { title: null, body: '`/docs` is a hub: no label before the code' });
  assert.equal(splitItem('A first sentence this long is not a label, it is prose that happens to end in: this').title, null);
  assert.equal(splitItem('Website package `0.1.1` adds a footer').title, null);
  // docs/versioning.md: items and the notes after a heading carry a label; the release summary before the first heading does not.
  for (const r of releases) {
    let inArea = false;
    r.blocks.forEach((b, i) => {
      if (b.kind === 'heading') { inArea = true; return; }
      if (b.kind === 'text' && !inArea) return;
      assert.ok(splitItem(b.text).title, `${r.version} block ${i} needs a "Label: " lead: ${b.text.slice(0, 60)}`);
      assert.ok(splitItem(changelogZh[r.version].blocks[i]).title, `${r.version} block ${i} needs a "标签：" lead in Chinese: ${changelogZh[r.version].blocks[i].slice(0, 40)}`);
    });
  }
});

test('releases group by month in the timeline, with dates written out per language', () => {
  assert.equal(monthOf('2026-11-09'), '2026-11');
  assert.equal(monthOf(null), null);
  assert.equal(formatDate('2026-11-09', 'zh'), '2026 年 11 月 9 日');
  assert.equal(formatDate('2026-11-09', 'en'), 'November 9, 2026');
  assert.equal(formatMonth('2026-10', 'zh'), '10 月');
  assert.equal(formatMonth('2026-10', 'en'), 'October');
});
