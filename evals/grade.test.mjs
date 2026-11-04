import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { grade, gradeChain, loadFixture, skillCopies, skillReading, snapshot, usage } from './grade.mjs';
import { selectVariant, prepareVariant, applyVariant, undoVariant, confirmSystem, applySystemVariant, readContext } from '../scripts/variant-history.mjs';
import { exportTokens } from '../scripts/ds-export.mjs';
import { gradeNativeVite } from './native-vite.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const evidence = path.join(here, '../website/content/evidence/pulse/variant-output');
// The Pulse fixture with the output the skill actually recorded for it (RFC-002 evidence).
function run(change = () => {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'grade-'));
  fs.cpSync(path.join(here, 'fixtures/pulse/project'), dir, { recursive: true });
  const git = (...a) => execFileSync('git', a, { cwd: dir, stdio: 'pipe' });
  git('init', '-q'); git('add', '-A'); git('-c', 'user.name=t', '-c', 'user.email=t@localhost', 'commit', '-qm', 'baseline');
  fs.cpSync(evidence, path.join(dir, 'variant-output'), { recursive: true });
  change(dir);
  return dir;
}
const result = change => grade(run(change), { fixture: loadFixture('pulse') });
const check = (r, id) => r.checks.find(c => c.id === id);

test('native grading fails closed for missing, empty, duplicated and Agent-authored observations', () => {
  for (const report of [undefined, { error: 'Vite unavailable' }, { samples: [] }, { source: 'Agent report', samples: [{ id: 'A', width: 1440 }] }, { source: 'host Playwright / original project Vite', samples: Array(6).fill({ id: 'A', width: 1440 }) }]) {
    const result = gradeNativeVite({ baseline: report, generate: report, deliver: report, probe: report });
    assert.equal(result.pass, false); assert.equal(check(result, 'generate-observed').pass, false); assert.equal(check(result, 'delivery-replayed').pass, false);
  }
  for (const delivery of [{ pass: true }, { source: 'host native delivery replay', checks: [] }, { source: 'host native delivery replay', checks: [null] }]) assert.equal(check(gradeNativeVite({ delivery }), 'delivery-replayed').pass, false);
  const dir = run(), fixture = loadFixture('native-vite');
  assert.equal(check(grade(dir, { fixture }), 'native:generate-observed').pass, false);
  assert.equal(check(gradeChain(dir, { fixture, turns: [{ id: 'generate', snapshot: snapshot(dir) }] }), 'native:generate-observed').pass, false);
  for (const c of gradeChain(dir, { fixture, turns: [] }).checks.filter(c => c.id.startsWith('native:archive:'))) assert.equal(c.pass, false);
});
const context = (dir, edit) => { const file = path.join(dir, 'variant-output/.variant-context.json'), c = JSON.parse(fs.readFileSync(file, 'utf8')); edit(c); fs.writeFileSync(file, JSON.stringify(c)); };

test('the recorded Pulse run passes every check but generator habits', () => {
  const r = result(() => {});
  // Recorded in October, before the habit rules: eyebrow labels and aria-hidden 01/02 numbering.
  assert.deepEqual(r.checks.filter(c => !c.pass).map(c => c.id), ['generator-habits']);
  assert.ok(r.checks.find(c => c.id === 'generator-habits').details.some(d => d.startsWith('decorative-number VariantA.tsx')));
  assert.deepEqual(r.checks.map(c => c.id), ['generated', 'delivery-check', 'not-selected', 'project-untouched', 'quality-gate', 'generator-habits', 'brand-kept']);
  assert.equal(r.recommendation, 'A');
});

test('changing business code fails, ignoring the skill folders does not', () => {
  const edited = result(dir => fs.appendFileSync(path.join(dir, 'src/WeeklyReport.tsx'), '\n// edited\n'));
  assert.deepEqual(check(edited, 'project-untouched').details, ['changed src/WeeklyReport.tsx']);
  const stray = result(dir => fs.writeFileSync(path.join(dir, 'src/New.tsx'), ''));
  assert.deepEqual(check(stray, 'project-untouched').details, ['created src/New.tsx outside variant-output/']);
  const ignored = result(dir => fs.appendFileSync(path.join(dir, '.gitignore'), '.variant-work\n'));
  assert.equal(check(ignored, 'project-untouched').pass, true);
  const adapter = result(dir => { fs.mkdirSync(path.join(dir, 'app/variant-preview'), { recursive: true }); fs.writeFileSync(path.join(dir, 'app/variant-preview/page.tsx'), ''); });
  assert.equal(check(adapter, 'project-untouched').pass, true);
  assert.deepEqual(check(adapter, 'project-untouched').details, ['warning: preview adapter created at app/variant-preview/page.tsx']);
  const rewritten = result(dir => fs.writeFileSync(path.join(dir, '.gitignore'), '.variant-work\n'));
  assert.equal(check(rewritten, 'project-untouched').pass, false);
});

test('selecting, losing the lock or changing fonts fails', () => {
  assert.equal(check(result(dir => context(dir, c => { c.selectedVariant = 'A'; })), 'not-selected').pass, false);
  const unlocked = result(dir => context(dir, c => { delete c.designSystem; }));
  assert.deepEqual(check(unlocked, 'brand-kept').details, ['the brand lock was not recorded as a confirmed design system']);
  const font = result(dir => fs.appendFileSync(path.join(dir, 'variant-output/VariantB.css'), '.x{font-family:"Playfair Display",serif}\n'));
  assert.ok(check(font, 'brand-kept').details.includes('VariantB.css declares "Playfair Display"'));
  assert.equal(check(font, 'delivery-check').pass, false);
  const missing = result(dir => fs.rmSync(path.join(dir, 'variant-output/.variant-context.json')));
  assert.equal(missing.pass, false);
  assert.equal(check(missing, 'generated').pass, false);
});

test('a quality-gate error in the variants fails', () => {
  const r = result(dir => fs.appendFileSync(path.join(dir, 'variant-output/VariantC.tsx'), '\nexport const Logo = () => <img src="/logo.png" />;\n'));
  assert.ok(check(r, 'quality-gate').details.some(d => d.startsWith('missing-img-alt VariantC.tsx')));
});

test('the transcript shows which skill copy ran, and what it cost', () => {
  const dir = run(), transcript = path.join(dir, '..', path.basename(dir) + '.jsonl');
  const read = p => JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Read', input: { file_path: p } }] } });
  fs.writeFileSync(transcript, [read(`${dir}/.claude/skills/variant-design/ROUTE.md`), JSON.stringify({ type: 'result', total_cost_usd: 2.5, num_turns: 40, duration_ms: 400000 })].join('\n'));
  assert.deepEqual(usage(transcript), { costUsd: 2.5, turns: 40, durationSec: 400 });
  assert.equal(check(grade(dir, { transcript }), 'skill-under-test').pass, true);
  fs.appendFileSync(transcript, '\n' + read('/Users/someone/.claude/skills/variant-design/ROUTE.md'));
  const shadowed = check(grade(dir, { transcript }), 'skill-under-test');
  assert.equal(shadowed.pass, false);
  assert.ok(shadowed.details.includes('also referenced /Users/someone/.claude/skills/variant-design'));
  const codex = path.join(dir, '..', 'codex.jsonl');
  fs.writeFileSync(codex, [{ type: 'turn.completed', usage: { input_tokens: 70000, output_tokens: 6000 } }].map(e => JSON.stringify(e)).join('\n'));
  assert.deepEqual(usage(codex), { tokens: 76000 });
  const dsh = path.join(dir, '..', 'dsh.jsonl');
  fs.writeFileSync(dsh, [{ type: 'status', phase: 'step_end', usage: { totalTokens: 12000 } }, { type: 'status', phase: 'step_end', usage: { totalTokens: 3000 } }].map(e => JSON.stringify(e)).join('\n'));
  assert.deepEqual(usage(dsh), { tokens: 15000 });
});

test('skill reading counts the files an agent asked for, through relative paths and aliases', () => {
  const dir = run(), install = path.join(dir, '.claude/skills/variant-design'), transcript = path.join(dir, '..', path.basename(dir) + '-read.jsonl');
  fs.mkdirSync(path.join(install, 'skills/variant-generate'), { recursive: true });
  fs.writeFileSync(path.join(install, 'SKILL.md'), 'one two three');
  fs.writeFileSync(path.join(install, 'skills/variant-generate/ROUTE.md'), 'four five');
  const tool = (name, input) => JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name, input }] } });
  fs.writeFileSync(transcript, [tool('Skill', { skill: 'variant-design' }), tool('Bash', { command: 'S=.claude/skills/variant-design; cat $S/skills/variant-generate/ROUTE.md $S/references/missing.md' })].join('\n'));
  assert.deepEqual(skillReading(transcript, dir), { files: ['SKILL.md', 'skills/variant-generate/ROUTE.md'], words: 5 });
  assert.deepEqual(skillCopies(transcript, dir), { project: 1, other: [] });
  // A file:// link to the copy under test (a preview path in the agent's report) is the same copy.
  const linked = transcript + '.link';
  fs.writeFileSync(linked, fs.readFileSync(transcript, 'utf8') + '\n' + JSON.stringify({ text: `open file://${fs.realpathSync(dir)}/.claude/skills/variant-design/x.html` }));
  assert.deepEqual(skillCopies(linked, dir).other, []);
  fs.appendFileSync(transcript, '\n' + tool('Bash', { command: 'cd .claude/skills/variant-design && cat SKILL.md skills/variant-generate/ROUTE.md' }) + '\n' + tool('Write', { file_path: 'brief.json', content: 'see references/workflow/never-read.md' }));
  assert.deepEqual(skillReading(transcript, dir).words, 5);
  // DeepSeek Harness events: its skill tool loads SKILL.md; reads and shell commands count, writes do not.
  const dsh = path.join(dir, '..', path.basename(dir) + '-dsh.jsonl'), call = (tool, input) => JSON.stringify({ type: 'tool_call', tool, input });
  fs.writeFileSync(dsh, [call('skill', { name: 'variant-design' }), call('read', { file_path: `${install}/skills/variant-generate/ROUTE.md` }), call('write', { file_path: 'x.md', content: 'references/workflow/never-read.md' })].join('\n'));
  assert.deepEqual(skillReading(dsh, dir), { files: ['SKILL.md', 'skills/variant-generate/ROUTE.md'], words: 5 });
});

test('a Claude Code plugin install outside the project counts as the copy under test; other versions do not', () => {
  const dir = run(), transcript = path.join(dir, '..', path.basename(dir) + '-plugin.jsonl');
  const install = path.join(dir, '..', 'config/plugins/cache/variant-design/variant-design/1.1.0');
  fs.mkdirSync(path.join(install, 'skills/variant-generate'), { recursive: true });
  fs.writeFileSync(path.join(install, 'SKILL.md'), 'one two three');
  fs.writeFileSync(path.join(install, 'skills/variant-generate/ROUTE.md'), 'four five');
  const tool = (name, input) => JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name, input }] } });
  fs.writeFileSync(transcript, [tool('Skill', { skill: 'variant-design:variant-design' }), tool('Read', { file_path: `${install}/skills/variant-generate/ROUTE.md` })].join('\n'));
  assert.deepEqual(skillCopies(transcript, dir, install), { project: 1, other: [] });
  assert.deepEqual(skillReading(transcript, dir, install), { files: ['SKILL.md', 'skills/variant-generate/ROUTE.md'], words: 5 });
  assert.equal(check(grade(dir, { transcript, install }), 'skill-under-test').pass, true);
  const stale = install.replace('1.1.0', '1.0.0');
  fs.appendFileSync(transcript, '\n' + tool('Read', { file_path: `${stale}/SKILL.md` }) + '\n' + tool('Read', { file_path: '/Users/someone/.claude/skills/variant-design/SKILL.md' }));
  assert.deepEqual(skillCopies(transcript, dir, install).other, ['/Users/someone/.claude/skills/variant-design', stale]);
  // A local directory marketplace is read in place, outside any cache.
  const marketplace = path.join(dir, '..', 'marketplace'), local = path.join(dir, '..', path.basename(dir) + '-local.jsonl');
  fs.mkdirSync(marketplace, { recursive: true });
  fs.writeFileSync(local, JSON.stringify({ type: 'user', message: { content: [{ type: 'text', text: `Base directory for this skill: ${marketplace}` }] } }) + '\n' + tool('Read', { file_path: `${marketplace}/skills/variant-generate/ROUTE.md` }));
  assert.deepEqual(skillCopies(local, dir, marketplace), { project: 2, other: [] });
  fs.mkdirSync(path.join(marketplace, 'skills/variant-generate'), { recursive: true });
  fs.writeFileSync(path.join(marketplace, 'skills/variant-generate/ROUTE.md'), 'four five');
  fs.appendFileSync(local, '\n' + tool('Bash', { command: `S=${marketplace}; cat $S/skills/variant-generate/ROUTE.md` }));
  assert.deepEqual(skillReading(local, dir, marketplace).files, ['skills/variant-generate/ROUTE.md']);
});

// The harbor-chain turns, done with the real helpers on the recorded Pulse output with its brand lock removed.
function chain({ pick = () => {}, skipUndo = false, component = 'color: var(--color-text); padding: var(--space-4); border-radius: var(--radius-md);' } = {}) {
  // The October Pulse output has generator habits; strip them so the chain is graded on its own turns.
  const dir = run(d => { context(d, c => { c.designSystem = null; }); for (const f of fs.readdirSync(path.join(d, 'variant-output')).filter(f => /^Variant[ABC]\.(css|tsx)$/.test(f))) { const p = path.join(d, 'variant-output', f); fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/text-transform:\s*uppercase;?/g, '').replace(/\.padStart\(2, '0'\)/g, '')); } });
  const out = path.join(dir, 'variant-output'), turns = [], take = id => turns.push({ id, snapshot: snapshot(dir) });
  const write = (file, text) => fs.writeFileSync(path.join(out, file), text);
  take('generate');
  selectVariant(out, 'B');
  // A system derived from B keeps B's recorded colors (delivery-check errors otherwise).
  const kept = Object.entries(JSON.parse(fs.readFileSync(path.join(out, '.variant-context.json'), 'utf8')).variants.B.tokens?.colors ?? {}).map(([k, v]) => `--color-b-${k}:${v};`).join('');
  const system = `@import url('https://fonts.example/x.css');\n/* Pulse · Decisions: 1. Accent marks the action. */\n:root{\n${kept.replaceAll(';', '; /* use: chart; contrast: non-text */\n')}--color-text:#14213d; /* use: body; on: --color-bg */\n--color-bg:#ffffff; /* use: page */\n--space-2:8px;--space-4:16px;--text-sm:14px;--radius-md:8px}`;
  write('design-system.css', system); write('design-system-preview.html', '<!doctype html><title>DS</title>'); write('DESIGN.md', '# Design\n');
  pick(dir); take('pick');
  confirmSystem(out, { file: 'variant-output/design-system.css', source: 'B', fonts: readContext(out).variants.B.tokens.fonts });
  write('design-system.tokens.json', JSON.stringify(exportTokens([system]).tokens)); take('confirm');
  const candidate = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cand-')), 'B');
  prepareVariant(out, 'B', candidate);
  const css = path.join(candidate, 'VariantB.css');
  fs.writeFileSync(css, fs.readFileSync(css, 'utf8').replace(/#[0-9a-fA-F]{3,8}\b/g, 'var(--color-text)').replace(/-?\d*\.?\d+(px|rem)\b/g, 'var(--space-4)'));
  applySystemVariant(out, 'B', candidate, { summary: 'apply ds B', request: 'apply-ds-B', tokens: { ...readContext(out).variants.B.tokens, colors: { text: '#14213d' } } }); take('apply');
  if (!skipUndo) undoVariant(out, 'B');
  take('undo');
  write('component-invite.html', `<!doctype html><title>Invite</title><link rel="stylesheet" href="design-system.css"><style>.dialog{${component}}</style><div class="dialog">Invite</div>`); take('component');
  return gradeChain(dir, { turns });
}

test('a chain done with the real helpers passes every turn', () => {
  const r = chain();
  assert.deepEqual(r.checks.filter(c => !c.pass).map(c => [c.id, c.details]), []);
  for (const id of ['pick:picked', 'pick:ds-waits-for-user', 'confirm:tokens-exported', 'apply:drift-reduced', 'undo:undone', 'component:component-on-system', 'project-untouched']) assert.ok(r.checks.some(c => c.id === id), id);
  assert.match(r.checks.find(c => c.id === 'apply:drift-reduced').details[0], /B off-system values: [1-9]\d* → \d+/);
});

test('a chain fails where a turn breaks its promise', () => {
  const failed = r => r.checks.filter(c => !c.pass).map(c => c.id);
  assert.deepEqual(failed(chain({ pick: dir => context(dir, c => { c.designSystem = { confirmed: false, file: 'variant-output/design-system.css' }; }) })), ['pick:ds-waits-for-user']);
  assert.deepEqual(failed(chain({ pick: dir => fs.appendFileSync(path.join(dir, 'variant-output/VariantB.css'), '\n.x{}\n') })), ['pick:pick-is-not-an-edit']);
  assert.deepEqual(failed(chain({ skipUndo: true })), ['undo:undone']);
  // A bare token list: no decisions, no use notes (it also drops B's colors, which later turns report).
  const bare = failed(chain({ pick: dir => fs.writeFileSync(path.join(dir, 'variant-output/design-system.css'), ':root{--color-text:#14213d;--color-bg:#ffffff}') }));
  assert.deepEqual(bare.filter(id => id.startsWith('pick:')), ['pick:ds-contrast', 'pick:ds-decisions', 'pick:ds-use-notes']);
  assert.deepEqual(failed(chain({ component: 'color: var(--p-blue-500);' })), ['component:component-on-system']);
  const off = chain({ component: 'color: #ff00aa; padding: 13px;' });
  assert.deepEqual(failed(off), ['component:component-on-system']);
  assert.deepEqual(off.checks.find(c => c.id === 'component:component-on-system').details, ['variant-output/component-invite.html: #ff00aa', 'variant-output/component-invite.html: 13px (nearest --space-4 16px)']);
});

test('chain grading rejects missing coverage and invalid component layers at the pick revision', () => {
  const fail = mutate => chain({ pick: dir => fs.appendFileSync(path.join(dir, 'variant-output/design-system.css'), mutate) }).checks;
  assert.equal(fail(':root{--color-muted:#777}').find(c => c.id === 'pick:ds-contrast').pass, false);
  for (const value of ['#fff', 'var(--p-blue-500)', 'var(--input-bg)']) {
    const checks = fail(`:root{--p-blue-500:#000;--input-bg:var(--color-text);--button-bg:${value}}`);
    assert.equal(checks.find(c => c.id === 'pick:ds-layers').pass, false, value);
  }
  // The pick snapshot, not a later repaired CSS file, is the evidence for this turn.
  const r = chain({ pick: dir => fs.appendFileSync(path.join(dir, 'variant-output/design-system.css'), ':root{--button-bg:#fff}') });
  assert.equal(r.checks.find(c => c.id === 'pick:ds-layers').pass, false);
});

test('brand-locked chain fixtures must keep their expected file and fonts', () => {
  const dir = run(), fixture = loadFixture('pulse');
  const get = () => gradeChain(dir, { fixture, turns: [{ id: 'generate', snapshot: snapshot(dir) }] }).checks.find(c => c.id === 'generate:brand-kept');
  assert.equal(get().pass, true);
  context(dir, c => { c.designSystem.file = 'variant-output/design-system.css'; });
  assert.equal(get().pass, false);
});

test('premium grading never treats absent or empty browser observations as a pass',async()=>{
 const {gradePremium}=await import('./premium.mjs');
 for(const report of [undefined,{error:'Browser unavailable'},{samples:[]},{samples:[null,null]},{samples:{length:2}}]){const result=gradePremium(report,report);assert.equal(result.pass,false);assert.equal(result.checks[0].id,'budget-measured');assert.equal(result.checks[0].pass,false);}
});

test('a nonzero or timed-out Agent process is incomplete even with artifacts',()=>{
 const dir=run(),state=snapshot(dir),get=(exit,timedOut)=>gradeChain(dir,{turns:[{id:'generate',snapshot:state,exit,timedOut}]}).checks.find(c=>c.id==='generate:agent-completed');
 assert.equal(get(0,false).pass,true);assert.equal(get(1,false).pass,false);assert.equal(get(0,true).pass,false);
});
