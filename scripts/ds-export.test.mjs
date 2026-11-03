import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { exportTokens } from './ds-export.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

test('custom properties become DTCG 2025.10 tokens grouped by type', () => {
  const { tokens, skipped } = exportTokens([`:root{
    --p-brand-500: oklch(56% 0.2 250); --ink:#14213d; --veil:rgba(20,33,61,.5); --paper:#fff;
    --space-4:16px; --text-lg:1.25rem; --radius-md:8px;
    --font-body:"DM Sans", Arial, sans-serif; --font-weight-bold:700; --leading-normal:1.5; --z-modal:200;
    --duration-fast:150ms; --ease-out:cubic-bezier(0, 0, 0.2, 1);
    --shadow-md:0 2px 8px rgba(0,0,0,.12), inset 0 0 0 1px var(--ink);
  }`]);
  assert.deepEqual(tokens.color['p-brand-500'], { $value: { colorSpace: 'oklch', components: [0.56, 0.2, 250] } });
  assert.deepEqual(tokens.color.ink, { $value: { colorSpace: 'srgb', components: [0.0784, 0.1294, 0.2392], hex: '#14213d' } });
  assert.deepEqual(tokens.color.veil, { $value: { colorSpace: 'srgb', components: [0.0784, 0.1294, 0.2392], alpha: 0.5, hex: '#14213d' } });
  assert.deepEqual(tokens.color.paper.$value.components, [1, 1, 1]);
  assert.deepEqual(tokens.dimension['space-4'], { $value: { value: 16, unit: 'px' } });
  assert.deepEqual(tokens.dimension['text-lg'], { $value: { value: 1.25, unit: 'rem' } });
  assert.deepEqual(tokens.fontFamily['font-body'], { $value: ['DM Sans', 'Arial', 'sans-serif'] });
  assert.deepEqual(tokens.fontWeight['font-weight-bold'], { $value: 700 });
  assert.deepEqual(tokens.number['leading-normal'], { $value: 1.5 });
  assert.deepEqual(tokens.number['z-modal'], { $value: 200 });
  assert.deepEqual(tokens.duration['duration-fast'], { $value: { value: 150, unit: 'ms' } });
  assert.deepEqual(tokens.cubicBezier['ease-out'], { $value: [0, 0, 0.2, 1] });
  assert.deepEqual(tokens.shadow['shadow-md'].$value, [
    { color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.12, hex: '#000000' }, offsetX: { value: 0, unit: 'px' }, offsetY: { value: 2, unit: 'px' }, blur: { value: 8, unit: 'px' }, spread: { value: 0, unit: 'px' } },
    { color: '{color.ink}', offsetX: { value: 0, unit: 'px' }, offsetY: { value: 0, unit: 'px' }, blur: { value: 0, unit: 'px' }, spread: { value: 1, unit: 'px' }, inset: true }]);
  for (const group of Object.keys(tokens).filter(k => !k.startsWith('$'))) assert.equal(tokens[group].$type, group);
  assert.deepEqual(skipped, []);
});

test('var() references become aliases, across files, in the referenced token\'s group', () => {
  const { tokens, skipped } = exportTokens([':root{--color-ink:#1d2a24;--radius:6px}', ':root{--ds-text:var(--color-ink);--radius-component:var(--radius);--ds-missing:var(--nowhere)}']);
  assert.deepEqual(tokens.color['ds-text'], { $value: '{color.color-ink}' });
  assert.deepEqual(tokens.dimension['radius-component'], { $value: '{dimension.radius}' });
  assert.deepEqual(skipped, [{ name: '--ds-missing', value: 'var(--nowhere)', reason: 'refers to --nowhere, which no file defines' }]);
});

test('values DTCG cannot express are listed, not guessed', () => {
  const { tokens, skipped } = exportTokens([':root{--text-hero:clamp(2rem,1.4rem + 3vw,3.5rem);--mix:color-mix(in srgb,red 10%,white);--w:50%;--t:background-color 150ms ease;--tracking:-.02em}']);
  assert.deepEqual(Object.keys(tokens).filter(k => !k.startsWith('$')), []);
  assert.deepEqual(skipped.map(s => s.name), ['--text-hero', '--mix', '--w', '--t', '--tracking']);
  assert.equal(skipped.at(-1).reason, 'DTCG dimensions are px or rem only');
});

test('the CLI writes a .tokens.json file and reports what it left out', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-export-')), css = path.join(dir, 'design-system.css'), out = path.join(dir, 'design-system.tokens.json');
  fs.writeFileSync(css, ':root{--ink:#000;--space-2:8px;--hero:clamp(1rem,2vw,2rem)}');
  const log = execFileSync('node', [path.join(here, 'ds-export.mjs'), css, '--out', out], { encoding: 'utf8' });
  assert.equal(JSON.parse(fs.readFileSync(out, 'utf8')).dimension['space-2'].$value.value, 8);
  assert.match(log, /2 tokens .* 1 left out/);
  assert.match(log, /--hero: clamp/);
});

test('a trailing use note becomes the DTCG $description', () => {
  const { tokens } = exportTokens([':root{\n  --color-danger: #9b3024; /* use: remove-access button, removal errors */\n  --space-4:16px;\n  --button-danger-bg: var(--color-danger); /* use: confirm removal */\n}']);
  assert.equal(tokens.color['color-danger'].$description, 'Use: remove-access button, removal errors');
  assert.equal(tokens.color['button-danger-bg'].$description, 'Use: confirm removal');
  assert.equal(tokens.dimension['space-4'].$description, undefined);
});
