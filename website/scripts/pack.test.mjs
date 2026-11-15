import { test } from 'node:test';
import assert from 'node:assert/strict';
import { importTs } from './ts-module.mjs';
const { parsePack, mergePacks } = await importTs(new URL('../src/pack.ts', import.meta.url).pathname);
const known = id => ['a', 'b', 'c'].includes(id);

test('a pack is an object of known ids with use and avoid strings, or it is rejected whole', () => {
  assert.deepEqual(parsePack({ a: { use: 'x', avoid: '' } }, known), { a: { use: 'x', avoid: '' } });
  for (const bad of [null, [], 'a', { z: { use: '', avoid: '' } }, { a: { use: 1, avoid: '' } }, { a: null }]) assert.throws(() => parsePack(bad, known));
});

test('the first sign-in keeps everything the visitor wrote, in the account or in the browser', () => {
  const account = { a: { use: 'account note', avoid: '' }, b: { use: '', avoid: '' } };
  const local = { a: { use: 'browser note', avoid: 'browser avoid' }, b: { use: 'fills the empty one', avoid: '' }, c: { use: '', avoid: '' } };
  assert.deepEqual(mergePacks(account, local), { changed: true, pack: {
    a: { use: 'account note', avoid: 'browser avoid' }, b: { use: 'fills the empty one', avoid: '' }, c: { use: '', avoid: '' } } });
  assert.deepEqual(mergePacks(account, {}), { changed: false, pack: account });
  assert.deepEqual(mergePacks({}, {}), { changed: false, pack: {} });
  assert.equal(mergePacks(account, { a: { use: 'other', avoid: '' } }).changed, false, 'the account note wins; nothing to write');
});
