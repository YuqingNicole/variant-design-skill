import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { grade, loadFixture, skillCopies, skillReading, usage } from './grade.mjs';

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
const context = (dir, edit) => { const file = path.join(dir, 'variant-output/.variant-context.json'), c = JSON.parse(fs.readFileSync(file, 'utf8')); edit(c); fs.writeFileSync(file, JSON.stringify(c)); };

test('the recorded Pulse run passes every check', () => {
  const r = result(() => {});
  assert.deepEqual(r.checks.filter(c => !c.pass), []);
  assert.deepEqual(r.checks.map(c => c.id), ['generated', 'delivery-check', 'not-selected', 'project-untouched', 'quality-gate', 'brand-kept']);
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
  fs.writeFileSync(transcript, [read(`${dir}/.claude/skills/variant-design/SKILL.md`), JSON.stringify({ type: 'result', total_cost_usd: 2.5, num_turns: 40, duration_ms: 400000 })].join('\n'));
  assert.deepEqual(usage(transcript), { costUsd: 2.5, turns: 40, durationSec: 400 });
  assert.equal(check(grade(dir, { transcript }), 'skill-under-test').pass, true);
  fs.appendFileSync(transcript, '\n' + read('/Users/someone/.claude/skills/variant-design/SKILL.md'));
  const shadowed = check(grade(dir, { transcript }), 'skill-under-test');
  assert.equal(shadowed.pass, false);
  assert.ok(shadowed.details.includes('also referenced /Users/someone/.claude/skills/variant-design'));
  const codex = path.join(dir, '..', 'codex.jsonl');
  fs.writeFileSync(codex, [{ type: 'turn.completed', usage: { input_tokens: 70000, output_tokens: 6000 } }].map(e => JSON.stringify(e)).join('\n'));
  assert.deepEqual(usage(codex), { tokens: 76000 });
});

test('skill reading counts the files an agent asked for, through relative paths and aliases', () => {
  const dir = run(), install = path.join(dir, '.claude/skills/variant-design'), transcript = path.join(dir, '..', path.basename(dir) + '-read.jsonl');
  fs.mkdirSync(path.join(install, 'skills/variant-generate'), { recursive: true });
  fs.writeFileSync(path.join(install, 'SKILL.md'), 'one two three');
  fs.writeFileSync(path.join(install, 'skills/variant-generate/SKILL.md'), 'four five');
  const tool = (name, input) => JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name, input }] } });
  fs.writeFileSync(transcript, [tool('Skill', { skill: 'variant-design' }), tool('Bash', { command: 'S=.claude/skills/variant-design; cat $S/skills/variant-generate/SKILL.md $S/references/missing.md' })].join('\n'));
  assert.deepEqual(skillReading(transcript, dir), { files: ['SKILL.md', 'skills/variant-generate/SKILL.md'], words: 5 });
  assert.deepEqual(skillCopies(transcript, dir), { project: 1, other: [] });
  fs.appendFileSync(transcript, '\n' + tool('Bash', { command: 'cd .claude/skills/variant-design && cat SKILL.md skills/variant-generate/SKILL.md' }) + '\n' + tool('Write', { file_path: 'brief.json', content: 'see references/workflow/never-read.md' }));
  assert.deepEqual(skillReading(transcript, dir).words, 5);
});
