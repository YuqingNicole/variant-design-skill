// The skill's own text is loaded by path: every file it names must ship with the skill,
// and every reference must be reachable from the router, or agents read nothing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true })
  .flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.md') ? [path.join(dir, e.name)] : []);
const docs = ['SKILL.md', ...walk('skills'), ...walk('references')];
const byName = new Map();
for (const file of docs) byName.set(path.basename(file), [...(byName.get(path.basename(file)) ?? []), file]);

// Markdown files named in backticks or link targets, plus any `references/` or `skills/` path in prose.
function mentions(file) {
  const text = fs.readFileSync(path.join(root, file), 'utf8'), found = new Set();
  for (const m of text.matchAll(/`([^`\s]+\.md)`|\]\(([^)\s:]+\.md)\)|(?<![\w/.:-])((?:references|skills)\/[\w./-]+\.md)/g)) found.add(m[1] ?? m[2] ?? m[3]);
  return [...found];
}
// Resolve a mention the way an agent would: from the skill root, relative to the file, or by a unique file name.
function resolve(file, target) {
  if (/^(references|skills)\//.test(target)) return docs.includes(target) ? target : null;
  for (const base of [path.dirname(file), 'references']) { const candidate = path.normalize(path.join(base, target)); if (docs.includes(candidate)) return candidate; }
  const named = byName.get(target);
  return named?.length === 1 ? named[0] : null;
}
const userProjectFile = target => /^variant-output\//.test(target) || target === 'SKILL.md';

test('every markdown file the skill names exists in the skill', () => {
  const broken = docs.flatMap(file => mentions(file).filter(t => !userProjectFile(t) && !resolve(file, t)).map(t => `${file} → ${t}`));
  assert.deepEqual(broken, []);
});

test('markdown links resolve from the file that contains them', () => {
  const broken = docs.flatMap(file => [...fs.readFileSync(path.join(root, file), 'utf8').matchAll(/\]\(([^)\s:#]+\.md)\)/g)]
    .filter(m => !docs.includes(path.normalize(path.join(path.dirname(file), m[1])))).map(m => `${file} → ${m[1]}`));
  assert.deepEqual(broken, []);
});

test('the skill names no repository-only files', () => {
  // Installed copies (the Codex plugin) ship only SKILL.md, skills/, references/, scripts/ and assets/, without tests.
  const shipped = docs.flatMap(file => [...fs.readFileSync(path.join(root, file), 'utf8').matchAll(/(?<![\w/.:-])((?:scripts|tests|website|docs|examples)\/[\w./-]+\.\w+)/g)]
    .map(m => m[1]).filter(t => !t.startsWith('scripts/') || t.endsWith('.test.mjs') || !fs.existsSync(path.join(root, t))).map(t => `${file} → ${t}`));
  assert.deepEqual(shipped, []);
});

test('every reference is reachable from the router', () => {
  const seen = new Set(['SKILL.md']), queue = ['SKILL.md'];
  while (queue.length) {
    const file = queue.shift();
    for (const t of mentions(file)) { const next = resolve(file, t); if (next && !seen.has(next)) { seen.add(next); queue.push(next); } }
  }
  assert.deepEqual(docs.filter(f => !seen.has(f)), []);
});
