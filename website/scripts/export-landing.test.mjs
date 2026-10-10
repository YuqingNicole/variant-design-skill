import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportLanding } from './export-landing.mjs';
import { prepareVariant, applyVariant, undoVariant, readContext } from '../../scripts/variant-history.mjs';

const project = fileURLToPath(new URL('../', import.meta.url));
test('actual landing B hero edit, undo and named export preserve A/C and selection', t => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'landing-dogfood-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const output = path.join(temp, 'variant-output'), candidate = path.join(temp, 'candidate');
  fs.mkdirSync(output); fs.mkdirSync(path.join(temp, 'src'));
  for (const file of ['.variant-context.json', 'VariantA.tsx', 'VariantB.tsx', 'VariantC.tsx']) {
    fs.copyFileSync(path.join(project, 'variant-output', file), path.join(output, file));
  }
  fs.copyFileSync(path.join(project, 'src/design-system.css'), path.join(temp, 'src/design-system.css'));
  fs.copyFileSync(path.join(project, 'src/landing-config.ts'), path.join(temp, 'src/landing-config.ts'));
  const initial = readContext(output);
  // Tests start a fresh undo stack; committed evidence may describe older local revisions.
  for (const value of Object.values(initial.variants)) { value.undo = []; value.history = []; }
  fs.writeFileSync(path.join(output, '.variant-context.json'), JSON.stringify(initial));
  prepareVariant(output, 'B', candidate);
  const original = fs.readFileSync(path.join(output, 'VariantB.tsx'), 'utf8');
  fs.writeFileSync(path.join(candidate, 'VariantB.tsx'), original.replace('三个方案，', '把三个方案，'));
  applyVariant(output, 'B', candidate, { summary: 'Test hero copy only', zone: 'hero' });
  assert.match(fs.readFileSync(path.join(output, 'VariantB.tsx'), 'utf8'), /把三个方案，/);
  const modified = exportLanding(temp, 'B');
  assert.equal(modified.changed, true);
  assert.match(fs.readFileSync(path.join(temp, 'src/landing-config.ts'), 'utf8'), /把三个方案，/);
  assert.ok(fs.existsSync(path.join(modified.backup, 'landing-config.ts')));
  undoVariant(output, 'B');
  assert.equal(fs.readFileSync(path.join(output, 'VariantB.tsx'), 'utf8'), original);
  const final = readContext(output);
  assert.deepEqual(final.variants.A, initial.variants.A);
  assert.deepEqual(final.variants.C, initial.variants.C);
  assert.equal(final.selectedVariant, initial.selectedVariant);
  exportLanding(temp, 'B');
  assert.doesNotMatch(fs.readFileSync(path.join(temp, 'src/landing-config.ts'), 'utf8'), /把三个方案，/);
  assert.equal(exportLanding(temp, 'B').changed, false);
});
