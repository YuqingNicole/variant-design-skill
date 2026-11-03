import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { contrastIssues, ratio } from './ds-check.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

test('contrast ratios follow WCAG relative luminance, for hex and oklch', () => {
  assert.equal(ratio('#000', '#fff'), 21);
  assert.equal(ratio('#777777', '#ffffff'), 4.48);
  assert.equal(ratio('oklch(100% 0 0)', '#000000'), 21);
});

test('text tokens on surface tokens below 4.5:1 are reported, through aliases', () => {
  const css = `:root{
    --p-neutral-500:#777777; --color-bg:#ffffff; --color-surface:var(--color-bg); --color-surface-2:#f2f2f2;
    --color-text-primary:#111111; --color-text-secondary:var(--p-neutral-500); --color-text-tertiary:#bbbbbb;
    --color-accent:#e85d04; --color-text-on-accent:#ffffff; --text-sm:14px; --color-veil:rgba(0,0,0,.4) }`;
  assert.deepEqual(contrastIssues([css]), [
    { text: '--color-text-secondary', surface: '--color-bg', ratio: 4.48, min: 4.5 },
    { text: '--color-text-secondary', surface: '--color-surface', ratio: 4.48, min: 4.5 },
    { text: '--color-text-secondary', surface: '--color-surface-2', ratio: 4, min: 4.5 },
    { text: '--color-text-on-accent', surface: '--color-accent', ratio: 3.5, min: 4.5 },
  ]);
  // Tertiary, placeholder and disabled text is exempt; type-size tokens are not colors.
  assert.deepEqual(contrastIssues([':root{--ink:#111;--paper:#fff;--muted-text:#555}']), []);
});

test('the CLI fails on low-contrast pairs and passes a clean system', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-check-')), bad = path.join(dir, 'bad.css'), good = path.join(dir, 'good.css');
  fs.writeFileSync(bad, ':root{--color-bg:#fff;--color-text:#999}'); fs.writeFileSync(good, ':root{--color-bg:#fff;--color-text:#222}');
  assert.throws(() => execFileSync('node', [path.join(here, 'ds-check.mjs'), bad], { encoding: 'utf8' }), e => /--color-text on --color-bg is 2\.85:1/.test(e.stdout));
  assert.match(execFileSync('node', [path.join(here, 'ds-check.mjs'), good], { encoding: 'utf8' }), /contrast passed/);
});
