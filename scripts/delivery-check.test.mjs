import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { checkDelivery, declaredFonts } from './delivery-check.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const comparison = id => ({ optimizes: `Position ${id}`, tradeoff: `Cost ${id}`, bestFor: `Scenario ${id}` });
// A brand-locked project whose three directions pass, so each test breaks one thing.
function project(change = () => {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'delivery-')), out = path.join(root, 'variant-output');
  fs.mkdirSync(path.join(root, 'src')); fs.mkdirSync(out);
  fs.writeFileSync(path.join(root, 'src/tokens.css'), ':root{--ink:#14213d;--accent:#e85d04;--font-sans:"Inter",sans-serif}\n');
  const state = { schemaVersion: 2, activeVariant: null, selectedVariant: null,
    taskContract: { primaryJob: 'Read the weekly report', data: 'shared/data.ts', requiredFunctions: ['KPIs', 'trend'] },
    recommendation: { variant: 'A', reason: 'Fits the Monday reader; untested.' },
    designSystem: { confirmed: true, file: 'src/tokens.css', fonts: ['Inter'] }, variants: {} };
  for (const id of ['A', 'B', 'C']) {
    fs.writeFileSync(path.join(out, `Variant${id}.tsx`), `export default function Variant${id}() { return <main className="v${id}">${id}</main>; }\n`);
    fs.writeFileSync(path.join(out, `Variant${id}.css`), `.v${id}{font-family:var(--font-sans);color:#14213d;border-color:#fff}\n`);
    state.variants[id] = { entry: `Variant${id}.tsx`, files: [`Variant${id}.tsx`, `Variant${id}.css`], tokens: { fonts: ['Inter'], colors: { ink: '#14213d' } }, comparison: comparison(id), version: 1, history: [], undo: [] };
  }
  change(state, out);
  fs.writeFileSync(path.join(out, '.variant-context.json'), JSON.stringify(state, null, 2));
  return out;
}
const run = change => checkDelivery(project(change));
const has = (list, text) => list.some(item => item.includes(text));

test('three distinct, recommended, brand-locked directions pass', () => {
  assert.deepEqual(run(), { errors: [], warnings: [], variants: ['A', 'B', 'C'] });
});

test('all three directions must be registered with their own files', () => {
  assert.ok(has(run(s => { delete s.variants.C; }).errors, 'Variant C is not registered'));
  assert.ok(has(run((s, out) => fs.rmSync(path.join(out, 'VariantB.css'))).errors, 'VariantB.css does not exist'));
  assert.ok(has(run(s => { s.variants.B.files.push('VariantA.css'); }).errors, 'owned by both A and B'));
  assert.ok(has(run(s => { s.variants.A.entry = 'Other.tsx'; }).errors, 'entry Other.tsx is not one of its files'));
  assert.ok(has(run((s, out) => fs.copyFileSync(path.join(out, 'VariantA.tsx'), path.join(out, 'VariantB.tsx'))).errors, 'A and B entry files are identical'));
});

test('each direction states its own position, cost and fit', () => {
  assert.ok(has(run(s => { s.variants.B.comparison.tradeoff = ' '; }).errors, 'Variant B comparison.tradeoff is empty'));
  assert.ok(has(run(s => { s.variants.C.comparison.optimizes = 'position  a'; }).errors, 'A and C have the same comparison.optimizes'));
  assert.ok(has(run(s => { s.taskContract.requiredFunctions = []; }).errors, 'taskContract needs'));
});

test('a recommendation is required and never becomes a selection', () => {
  assert.ok(has(run(s => { delete s.recommendation; }).errors, 'recommendation needs'));
  const picked = run(s => { s.selectedVariant = 'A'; });
  assert.deepEqual(picked.errors, []);
  assert.ok(has(picked.warnings, "Only the user's explicit pick sets it"));
});

test('a locked design system keeps its fonts and colors', () => {
  assert.ok(has(run(s => { s.variants.B.tokens.fonts = ['Newsreader']; }).errors, 'Variant B records fonts'));
  assert.ok(has(run((s, out) => fs.appendFileSync(path.join(out, 'VariantC.css'), '.x{font-family:"Playfair Display",serif}\n')).errors, 'declares font "Playfair Display"'));
  assert.ok(has(run(s => { s.variants.A.tokens.colors.accent = '#ff0000'; }).errors, 'records color accent #ff0000'));
  const drift = run((s, out) => fs.appendFileSync(path.join(out, 'VariantA.css'), '.y{background:#123456}\n'));
  assert.deepEqual(drift.errors, []);
  assert.ok(has(drift.warnings, 'uses #123456'));
  assert.ok(has(run(s => { s.designSystem.file = 'src/missing.css'; }).errors, 'src/missing.css does not exist'));
  // Recorded fonts may be whole stacks; the first family is what is locked.
  assert.deepEqual(run(s => { for (const v of Object.values(s.variants)) v.tokens.fonts = ['Inter, system-ui, sans-serif']; }).errors, []);
  // Exploration has no lock: different fonts per direction are the point.
  assert.deepEqual(run(s => { delete s.designSystem; s.variants.B.tokens.fonts = ['Newsreader']; }).errors, []);
});

test('fonts are read from declarations, custom properties and inline styles', () => {
  assert.deepEqual(declaredFonts(`a{font-family:'Newsreader',Georgia,serif} :root{--font-body: "Figtree", sans-serif; --font-size: 14px; --font-weight: bold}
    b{font-family:var(--font-body)} c{font-family:system-ui} <p style={{ fontFamily: 'IBM Plex Mono, monospace' }}/>`), ['Newsreader', 'Figtree', 'IBM Plex Mono']);
});

test('the CLI exits non-zero on errors and passes a real recorded run', () => {
  const broken = project(s => { delete s.recommendation; });
  assert.throws(() => execFileSync(process.execPath, [path.join(here, 'delivery-check.mjs'), broken], { stdio: 'pipe' }), e => e.status === 1 && String(e.stdout).includes('delivery check failed'));
  const harbor = path.join(here, '../website/content/evidence/harbor/variant-output');
  assert.match(execFileSync(process.execPath, [path.join(here, 'delivery-check.mjs'), harbor], { encoding: 'utf8' }), /delivery check passed for A\/B\/C/);
});
