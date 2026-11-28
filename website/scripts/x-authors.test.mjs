import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { addAuthor, removeAuthor, suggestAuthors, formatConfig, main } from './x-authors.mjs';

const shipped = await fs.readFile(new URL('../content/x-discovery.json', import.meta.url), 'utf8');
const base = () => ({
  skipHandles: [{ handle: 'lister', reason: 'repo lists' }],
  authors: { days: 7, minLikes: 100, list: [{ handle: 'maker', added: '2026-11-28', from: 'library: x-maker-1', why: 'animation' }], declined: [{ handle: 'fanacct', reason: 'fan work' }] },
  groups: [{ id: 'weekly', weekly: true, days: 7, queries: [{ terms: 'zine', minLikes: 150 }] }],
});

test('the shipped config is written in the format the script writes, so adding an author changes one line', () => {
  assert.equal(formatConfig(JSON.parse(shipped)), shipped);
});

test('an author is added with when, how and why, and refused when skipped, declined or already listed', () => {
  const added = addAuthor(base(), { handle: '@newmaker', from: 'followed by @maker', why: 'claymation shorts', added: '2026-11-29' });
  assert.deepEqual(added.authors.list.at(-1), { handle: 'newmaker', added: '2026-11-29', from: 'followed by @maker', why: 'claymation shorts' });
  assert.throws(() => addAuthor(base(), { handle: 'Lister', from: 'x', why: 'y', added: '2026-11-29' }), /in skipHandles/);
  assert.throws(() => addAuthor(base(), { handle: 'FanAcct', from: 'x', why: 'y', added: '2026-11-29' }), /in authors\.declined/);
  assert.throws(() => addAuthor(base(), { handle: 'MAKER', from: 'x', why: 'y', added: '2026-11-29' }), /already listed/);
  assert.throws(() => addAuthor(base(), { handle: 'newmaker', from: 'x', added: '2026-11-29' }), /needs "why"/);
  assert.deepEqual(removeAuthor(base(), 'Maker').authors.list, []);
  assert.throws(() => removeAuthor(base(), 'nobody'), /not listed/);
});

test('suggestions are makers of accepted Videos entries who are not listed, declined or skipped; nothing is added', () => {
  const items = [
    { id: 'x-a-1', tag: 'Animation', name: 'A', addedAt: '2026-11-20', post: { handle: 'NewOne' } },
    { id: 'x-a-2', tag: 'Craft', name: 'B', addedAt: '2026-11-25', post: { handle: 'newone' } },
    { id: 'x-m-1', tag: 'VFX', name: 'C', post: { handle: 'maker' } },
    { id: 'x-f-1', tag: 'Humor', name: 'D', post: { handle: 'fanacct' } },
    { id: 'x-d-1', tag: 'Interaction', name: 'E', post: { handle: 'designer' } },
    { id: 'site', tag: 'Animation', name: 'F' },
  ];
  assert.deepEqual(suggestAuthors(base(), items), [{ handle: 'newone', entry: 'x-a-2', name: 'B', tag: 'Craft', addedAt: '2026-11-25' }]);
});

test('the command line adds, lists, removes and suggests on the files it is given', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'x-authors-'));
  const config = path.join(dir, 'x-discovery.json'), data = path.join(dir, 'inspiration-data.ts');
  await fs.writeFile(config, formatConfig(base()));
  await fs.writeFile(data, `export const inspirationItems = [\n${JSON.stringify({ id: 'x-n-1', tag: 'Animation', name: 'N', post: { handle: 'newone' } })}\n];\n`);
  const lines = [], opts = { config, data, today: '2026-11-29', log: line => lines.push(line) };
  await main(['add', 'newone', '--from', 'library: x-n-1', '--why', 'stop motion'], opts);
  const text = await fs.readFile(config, 'utf8');
  assert.equal(formatConfig(JSON.parse(text)), text);
  assert.match(text, /\{ "handle": "newone", "added": "2026-11-29", "from": "library: x-n-1", "why": "stop motion" \}/);
  await main(['suggest'], opts);
  assert.equal(lines.at(-1), 'Author list: no makers of accepted videos left to suggest.');
  await main(['remove', 'newone'], opts);
  await main(['suggest'], opts);
  assert.equal(lines.at(-1), '  @newone\tx-n-1\tAnimation\tN');
  await main(['list'], opts);
  assert.equal(lines.at(-1), '1 listed authors');
  await assert.rejects(main(['add'], opts), /^Error: Usage/);
  await fs.rm(dir, { recursive: true });
});
