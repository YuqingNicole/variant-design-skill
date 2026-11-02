import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { defaults, grade, parseBudget, probe } from './style-budget.mjs';

const script = new URL('./style-budget.mjs', import.meta.url).pathname;
const sample = sizes => ({ url: 'file:///a.html', counts: { families: { Fraunces: 2, Figtree: 9 }, sizes: Object.fromEntries(sizes.map(s => [s, 1])), weights: { 400: 9 }, textColors: { 'rgb(20, 20, 20)': 9 }, radii: { '4px': 3, full: 1 }, shadows: {} } });

test('grade reports counts over the budget with their values', () => {
  const result = grade(sample(['12px', '13px', '14px', '15px', '16px', '17px', '20px', '48px']));
  assert.deepEqual(result.over, ['sizes']);
  assert.deepEqual(result.rows.find(r => r.key === 'sizes'), { key: 'sizes', count: 8, limit: 7, over: true, values: ['12px', '13px', '14px', '15px', '16px', '17px', '20px', '48px'] });
  assert.equal(result.rows.find(r => r.key === 'radii').over, false);
});

test('grade compares with an earlier sample', () => {
  const result = grade(sample(['14px', '16px', '48px']), defaults, sample(['12px', '13px', '14px', '16px', '48px']));
  assert.deepEqual(result.rows.find(r => r.key === 'sizes'), { key: 'sizes', count: 3, limit: 7, over: false, values: ['14px', '16px', '48px'], before: 5 });
  assert.throws(() => grade({}), /counts/);
});

test('budgets override defaults and reject unknown keys', () => {
  assert.deepEqual(parseBudget('sizes=6,radii=2'), { ...defaults, sizes: 6, radii: 2 });
  assert.throws(() => parseBudget('spacing=4'), /known keys/);
  assert.throws(() => parseBudget('sizes=many'), /sizes=6/);
});

test('the probe serializes without module scope', () => {
  assert.doesNotThrow(() => new Function(`return (${probe})`)());
});

test('CLI exits 1 over budget and 0 within it', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'style-budget-'));
  try {
    const file = path.join(dir, 'after.json'), before = path.join(dir, 'before.json');
    fs.writeFileSync(file, JSON.stringify(sample(['14px', '16px', '48px'])));
    fs.writeFileSync(before, JSON.stringify(sample(['12px', '13px', '14px', '16px', '48px'])));
    const ok = spawnSync(process.execPath, [script, 'check', file, '--before', before], { encoding: 'utf8' });
    assert.equal(ok.status, 0, ok.stderr);
    assert.match(ok.stdout, /✓ sizes: 5 → 3 \(budget 7\)/);
    const over = spawnSync(process.execPath, [script, 'check', file, '--budget', 'sizes=2'], { encoding: 'utf8' });
    assert.equal(over.status, 1);
    assert.match(over.stdout, /✗ sizes: 3 \(budget 2\) · 14px \| 16px \| 48px/);
    const probeOut = spawnSync(process.execPath, [script, 'probe'], { encoding: 'utf8' });
    assert.match(probeOut.stdout, /^\(function probe\(\)/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
