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

const { createPackWriter } = await importTs(new URL('../src/pack.ts', import.meta.url).pathname);
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const tick = () => new Promise(r => setTimeout(r, 0));

test('account writes go one at a time, and only the newest waiting pack is sent next', async () => {
  const calls = [], flights = [];
  const writer = createPackWriter((u, p) => { calls.push(p.n); const d = deferred(); flights.push(d); return d.promise; }, () => {}, () => {});
  writer.push('u', { n: 1 }); writer.push('u', { n: 2 }); writer.push('u', { n: 3 });
  await tick(); assert.deepEqual(calls, [1], 'the second write waits for the first');
  flights[0].resolve(); await tick(); await tick();
  assert.deepEqual(calls, [1, 3], 'pack 2 was superseded by pack 3 before it could be sent');
  flights[1].resolve(); await tick();
});

test('the browser copy is forgotten only after an import has been written, even when the first try fails', async () => {
  let fail = true, forgotten = 0; const reports = [];
  const writer = createPackWriter(async () => { await tick(); if (fail) throw new Error('offline'); }, ok => reports.push(ok), () => forgotten++);
  writer.push('u', { a: 1 }, true); await tick(); await tick(); await tick();
  assert.deepEqual([reports, forgotten], [[false], 0], 'a failed import keeps the browser copy');
  fail = false; writer.push('u', { a: 1, b: 2 }); await tick(); await tick(); await tick();
  assert.deepEqual([reports, forgotten], [[false, true], 1], 'the next successful write carries the import, so the copy goes');
  writer.push('u', { b: 2 }); await tick(); await tick(); await tick();
  assert.equal(forgotten, 1, 'later writes do not forget again');
});
