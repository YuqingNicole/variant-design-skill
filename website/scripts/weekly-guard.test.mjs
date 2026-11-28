import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseMemory, memoryVerdict, waitForMemory, resultsVerdict, openWeeklyPr, main, SKIP } from './weekly-guard.mjs';

const reading = (level, free, swapMB) => parseMemory({ level: `${level}\n`, pressure: `The system has 8589934592 (524288 pages with a page size of 16384).\nSystem-wide memory free percentage: ${free}%\n`, swap: `total = 29696.00M  used = ${swapMB.toFixed(2)}M  free = 1019.88M  (encrypted)\n` });

test('macOS readings parse, and a missing one stays null', () => {
  assert.deepEqual(reading(2, 34, 3076.12), { level: 2, freePercent: 34, swapMB: 3076.12 });
  assert.deepEqual(parseMemory({}), { level: null, freePercent: null, swapMB: null });
  assert.equal(memoryVerdict(parseMemory({})).ok, true);
});

test('a normal day passes; critical pressure, little free memory or the swap seen on 2026-11-27 skips', () => {
  assert.equal(memoryVerdict(reading(2, 34, 3076)).ok, true);
  assert.match(memoryVerdict(reading(4, 34, 3076)).reason, /critical/);
  assert.match(memoryVerdict(reading(2, 6, 3076)).reason, /6% of memory is free/);
  assert.match(memoryVerdict(reading(2, 30, 28 * 1024)).reason, /swap holds 28\.0 GB/);
});

test('memory is read again within a bounded window, and the first good reading lets the run go on', async () => {
  const bad = reading(4, 5, 28000), good = reading(2, 30, 2000), waits = [], log = [];
  const seq = [bad, bad, good];
  const ok = await waitForMemory({ tries: 3, wait: 1000, read: async () => seq.shift(), pause: async ms => waits.push(ms), log: l => log.push(l) });
  assert.equal(ok.ok, true); assert.deepEqual(waits, [1000, 1000]); assert.equal(log.length, 2);
  const never = await waitForMemory({ tries: 2, wait: 5, read: async () => bad, pause: async ms => waits.push(ms), log: () => {} });
  assert.equal(never.ok, false); assert.deepEqual(waits, [1000, 1000, 5]);
});

test('a run where nothing or at least half could be screened opens no pull request', () => {
  assert.equal(resultsVerdict('Accepted 0, rejected 0, left pending 10.\n? A: Chrome did not open its DevTools port within 45s').ok, false);
  assert.match(resultsVerdict('Accepted 0, rejected 0, left pending 10.').reason, /none of 10/);
  assert.match(resultsVerdict('Accepted 3, rejected 2, left pending 5.').reason, /5 of 10/);
  assert.equal(resultsVerdict('Accepted 4, rejected 2, left pending 3.').ok, true);
  assert.equal(resultsVerdict('Accepted 0, rejected 0, left pending 0.').ok, true);
  assert.equal(resultsVerdict('Accepted 2, rejected 1, left pending 0.').ok, true);
  assert.match(resultsVerdict('').reason, /no summary/);
  assert.equal(resultsVerdict('Error: claude not found\n    at run').ok, false);
});

test('an open weekly pull request from the same source blocks a new one; other sources do not', () => {
  const prs = [{ number: 342, headRefName: 'codex/sites-weekly-2026-11-26' }, { number: 9, headRefName: 'codex/x-weekly-2026-11-24' }, { number: 7, headRefName: 'codex/sites-weekly-memory' }];
  assert.equal(openWeeklyPr(prs, 'sites').number, 342);
  assert.equal(openWeeklyPr(prs, 'threads'), null);
  assert.equal(openWeeklyPr([], 'sites'), null);
});

test('the command line exits 0 to go on, 3 to skip with one log line, 2 on bad usage', async () => {
  const log = [], io = { log: l => log.push(l), pause: async () => {} };
  assert.equal(await main(['memory', '--tries', '1'], { ...io, read: async () => reading(2, 30, 2000) }), 0);
  assert.equal(await main(['memory', '--tries', '2', '--wait', '0'], { ...io, read: async () => reading(4, 5, 28000) }), SKIP);
  assert.match(log.at(-1), /^Skipped this run: the machine is short on memory/);
  assert.equal(await main(['open-pr', 'sites'], { ...io, prs: async () => [{ number: 342, headRefName: 'codex/sites-weekly-2026-11-26' }] }), SKIP);
  assert.match(log.at(-1), /#342/);
  assert.equal(await main(['open-pr', 'sites'], { ...io, prs: async () => [] }), 0);
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'weekly-guard-')), file = path.join(dir, 'out.txt');
  await fs.writeFile(file, 'Accepted 0, rejected 0, left pending 10.\n');
  assert.equal(await main(['results', file], io), SKIP);
  assert.match(log.at(-1), /^No pull request this run: none of 10/);
  await fs.writeFile(file, 'Accepted 6, rejected 3, left pending 1.\n');
  assert.equal(await main(['results', file], io), 0);
  await fs.rm(dir, { recursive: true, force: true });
  const err = console.error; console.error = () => {};
  try { assert.equal(await main(['memory', '--tries', '0'], io), 2); assert.equal(await main(['nope'], io), 2); } finally { console.error = err; }
});
