import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { checkSystem, contrastIssues, ratio, unusedTokens } from './ds-check.mjs';
import { layerIssues, tokenMap } from './ds-tokens.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

test('contrast ratios follow WCAG relative luminance, for hex and oklch', () => {
  assert.equal(ratio('#000', '#fff'), 21);
  assert.equal(ratio('#777777', '#ffffff'), 4.48);
  assert.equal(ratio('oklch(100% 0 0)', '#000000'), 21);
  // A displayed 4.50 does not turn an actual ratio just below the threshold into a pass.
  assert.equal(ratio('rgb(110 121 120)', '#fff'), 4.5);
  assert.equal(checkSystem([':root{--color-bg:#fff;--color-on-bg:rgb(110 121 120)}']).issues.length, 1);
});

test('text tokens on surface tokens below 4.5:1 are reported, through aliases', () => {
  const css = `:root{
    --p-neutral-500:#777777; --color-bg:#ffffff; --color-surface:var(--color-bg); --color-surface-2:#f2f2f2;
    --color-text-primary:#111111; --color-text-secondary:var(--p-neutral-500); --color-text-tertiary:#bbbbbb;
    --color-accent:#e85d04; --color-text-on-accent:#ffffff; --text-sm:14px; --color-veil:rgba(0,0,0,.4) }`;
  assert.deepEqual(contrastIssues([{ source: css, origin: 'brand' }]), [
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
  fs.writeFileSync(bad, ':root{--color-bg:#fff;--color-on-bg:#999}'); fs.writeFileSync(good, ':root{--color-bg:#fff;--color-on-bg:#222}');
  assert.throws(() => execFileSync('node', [path.join(here, 'ds-check.mjs'), bad], { encoding: 'utf8' }), e => /--color-on-bg on --color-bg is 2\.85:1/.test(e.stdout));
  assert.match(execFileSync('node', [path.join(here, 'ds-check.mjs'), good], { encoding: 'utf8' }), /1 contrast pair\(s\) checked, 0 failed, 0 unverified/);
});

test('unused tokens: reached directly or through a used token, otherwise listed', () => {
  const system = ':root{--p-green-600:#395a3b;--p-green-200:#cbd7bf;--color-accent:var(--p-green-600);--space-4:16px;--z-toast:500}';
  assert.deepEqual(unusedTokens([system], ['.btn{background:var(--color-accent);padding:var( --space-4)}']), ['--p-green-200', '--z-toast']);
  assert.deepEqual(unusedTokens([system], []), ['--p-green-600', '--p-green-200', '--color-accent', '--space-4', '--z-toast']);
  assert.deepEqual(unusedTokens([{ source: ':root{--brand-color:#111;--brand-unused:8px}', origin: 'brand' }, ':root{--space-4:16px;--button-fg:var(--brand-color)}'], ['a{color:var(--button-fg)}']), ['--space-4']);
});

test('the CLI fails on unused tokens only when asked to check them', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-check-')), css = path.join(dir, 'ds.css'), page = path.join(dir, 'preview.html');
  fs.writeFileSync(css, ':root{--color-on-bg:#111;--color-bg:#fff;--space-9:36px}'); fs.writeFileSync(page, '<p style="color:var(--color-on-bg);background:var(--color-bg)">x</p>');
  execFileSync('node', [path.join(here, 'ds-check.mjs'), css]);
  const r = spawnSync('node', [path.join(here, 'ds-check.mjs'), css, '--used-by', page], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /1 token\(s\) .* never use: --space-9/);
});

test('generated pairs use exact roles or explicit surface notes, never a suffix guess', () => {
  const r = checkSystem([':root{--p-accent:#fff;--color-on-accent:#fff;--color-accent:#111;--color-panel-accent:#fff;--color-panel:#fff;--color-text-muted:#777; /* use: helper; on: --color-panel */}']);
  assert.deepEqual(r.checked.map(p => [p.text, p.surface]), [['--color-on-accent', '--color-accent'], ['--color-text-muted', '--color-panel']]);
  assert.equal(r.issues[0].ratio, 4.48);
  assert.ok(r.unverified.some(i => i.text === '--color-panel-accent'));
  const missing = checkSystem([':root{--color-on-accent:#fff;--p-accent:#111}']);
  assert.equal(missing.checked.length, 0);
  assert.match(missing.unverified[0].reason, /--color-accent is not defined/);
});

test('unpaired, unresolved, translucent and conditional text is unverified, never a pass', () => {
  const r = checkSystem([`:root{
    --color-muted:#777;--color-bg:#fff;--color-on-bg:var(--missing);
    --color-panel:#fff;--color-on-panel:color-mix(in srgb,black 50%,white);
    --color-fill:#111;--color-on-fill:rgb(255 255 255 / .5);
    --color-cyclic:var(--color-on-cyclic);--color-on-cyclic:var(--color-cyclic);
    --color-mode:#fff;--color-on-mode:#111;
  } @media (prefers-color-scheme:dark){:root{--color-mode:#111;--color-on-mode:#fff}}`]);
  assert.equal(r.checked.length, 0);
  for (const pattern of [/no declared surface/, /not defined/, /unsupported color/, /translucent/, /cyclic alias/, /multiple values/]) assert.ok(r.unverified.some(i => pattern.test(i.reason)), String(pattern));
  const roles = checkSystem([':root{--color-chart:#fc0; /* use: chart; contrast: non-text */ --color-border:#ddd;--text-sm:14px}']);
  assert.deepEqual(roles.unverified, []);
});

test('brand naming is exempt from layer rules, and legacy contrast is limited to the brand', () => {
  const brand = { source: ':root{--ink:#111;--paper:#fff;--button-bg:#fc0;--p-color-brand:#123456}', origin: 'brand' };
  const r = checkSystem([brand, { source: ':root{--color-muted:#777;--button-secondary-bg:var(--button-bg)}', origin: 'extension' }]);
  assert.equal(r.checked.length, 2); // The brand's button-bg is also a surface under its legacy naming.
  assert.deepEqual(r.layers, []);
  assert.ok(r.unverified.some(i => i.text === '--color-muted'));
  assert.deepEqual(checkSystem([':root{--ink:#111;--paper:#fff}']).checked, []);
  assert.deepEqual(layerIssues([brand]), []);
});

test('component layer rejects primitives, components, missing targets, literals and fallback values', () => {
  const r = layerIssues([`:root{--p-blue-500:#123456;--color-accent:var(--p-blue-500);--space-4:16px;
    --button-bg:var(--color-accent);--input-bg:var(--button-bg);--select-bg:var(--p-blue-500);
    --badge-bg:#fff;--dialog-bg:var(--missing);--card-pad:var(--space-4,16px);
    --button-font:500 var(--font-ui);--button-gap:var(--space-4);}`]);
  assert.deepEqual(r.map(i => i.token), ['--input-bg', '--select-bg', '--badge-bg', '--dialog-bg', '--card-pad', '--button-font']);
  assert.match(r.find(i => i.token === '--input-bg').reason, /component layer/);
  assert.match(r.find(i => i.token === '--select-bg').reason, /primitive layer/);
  // A nonstandard component namespace is declared by the Components heading; comments are not declarations.
  const custom = ':root{/* Semantic */--toolbar-height:36px;/* Components */--date-picker-height:var(--toolbar-height);--date-picker-bg:#fff;/* --fake:#fff; */}';
  assert.deepEqual(layerIssues([custom]).map(i => i.token), ['--date-picker-bg']);
  assert.ok(!tokenMap([custom]).has('--fake'));
});

test('CLI reports coverage, reads explicit brands and refuses invalid options', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-coverage-')), brand = path.join(dir, 'brand.css'), css = path.join(dir, 'extension.css');
  fs.writeFileSync(brand, ':root{--ink:#111;--paper:#fff;--brand-radius:8px}');
  fs.writeFileSync(css, ':root{--color-muted:#777;--button-radius:var(--brand-radius)}');
  const run = args => spawnSync(process.execPath, [path.join(here, 'ds-check.mjs'), ...args], { encoding: 'utf8' });
  const r = run([css, '--brand', brand, '--json']);
  assert.equal(r.status, 1);
  const report = JSON.parse(r.stdout);
  assert.equal(report.checked.length, 1);
  assert.equal(report.unverified[0].text, '--color-muted');
  assert.deepEqual(report.layers, []);
  assert.equal(run(['--brand']).status, 2);
  assert.equal(run([css, '--unknown']).status, 2);
  fs.writeFileSync(css, ':root{--space-4:16px}');
  assert.match(run([css]).stdout, /0 contrast pair\(s\) checked/);
  assert.doesNotMatch(run([css]).stdout, /contrast passed/);
});
