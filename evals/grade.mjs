#!/usr/bin/env node
// Grades one agent run on a fixture project: the product promises a user would check by hand.
// Usage: node evals/grade.mjs <project> [--fixture <name>] [--transcript <file>] [--json]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkDelivery, declaredFonts } from '../scripts/delivery-check.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
// Files an agent may create in a user's project; everything tracked at the baseline must stay byte-identical.
const allowed = /^(variant-output|\.variant-work|\.claude|\.agents|\.codex|dist|node_modules)(\/|$)/;
const generated = /(^|\/)(_static|\.preview|\.history|\.snapshots|node_modules)(\/|$)/;
// Framework preview adapters the skill tells agents to create, such as a Next.js `app/variant-preview/` route.
const adapter = /(^|\/)\(?_?variant[\w-]*\)?\//;

export const loadFixture = name => JSON.parse(fs.readFileSync(path.join(here, 'fixtures', name, 'fixture.json'), 'utf8'));
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' });
const first = value => String(value).split(',')[0].trim().replace(/^['"]|['"]$/g, '').toLowerCase();

function untouched(project) {
  const problems = [], notes = [];
  for (const line of git(project, 'status', '--porcelain', '--untracked-files=all').split('\n').filter(Boolean)) {
    const status = line.slice(0, 2), file = line.slice(3).replace(/^"|"$/g, '');
    if (status === '??') { if (allowed.test(file)) continue; if (adapter.test(file)) notes.push(`warning: preview adapter created at ${file}`); else problems.push(`created ${file} outside variant-output/`); continue; }
    // Adding ignore lines for the skill's working folders is fine; changing anything else is not.
    if (file === '.gitignore' && git(project, 'diff', '--unified=0', '--', '.gitignore').split('\n').filter(l => /^[-+](?![-+])/.test(l)).every(l => l.startsWith('+'))) continue;
    problems.push(`${status.trim() === 'D' ? 'deleted' : 'changed'} ${file}`);
  }
  return { problems, notes };
}

function quality(output) {
  if (!fs.existsSync(output)) return { errors: 0, warnings: [] };
  let report;
  try { report = JSON.parse(execFileSync(process.execPath, [path.join(repo, 'scripts/quality-gate.mjs'), output, '--json'], { encoding: 'utf8' })); }
  catch (error) { report = JSON.parse(error.stdout); }
  const own = report.findings.filter(f => !generated.test(path.relative(output, path.resolve(f.file)).split(path.sep).join('/')));
  return { errors: own.filter(f => f.severity === 'error').map(f => `${f.rule} ${path.basename(f.file)}:${f.line}`), warnings: own.filter(f => f.severity === 'warning').map(f => `${f.rule} ${path.basename(f.file)}:${f.line}`) };
}

function ownedSources(output, context) {
  const files = Object.values(context?.variants ?? {}).flatMap(v => v.files ?? []);
  return files.map(f => path.join(output, f)).filter(f => fs.existsSync(f)).map(f => [path.relative(output, f), fs.readFileSync(f, 'utf8')]);
}

// Which copies of the skill the agent read. A run that read another copy did not test this tree.
export function skillCopies(transcript, project) {
  if (!transcript || !fs.existsSync(transcript)) return null;
  const text = fs.readFileSync(transcript, 'utf8').replace(/\\\//g, '/');
  const roots = [...new Set([project, fs.realpathSync(project)])];
  const hits = [...text.matchAll(/(?<![^\s"'`\\=:;(])([^\s"'`\\=:;()]*)skills\/variant-design(?=[/\s"'`\\;])/g)].map(m => m[1] + 'skills/variant-design');
  // Relative paths (`cat .claude/skills/...`) resolve inside the project, where the agent runs.
  const inside = hits.filter(h => !/^[~/$]/.test(h) || roots.some(r => h.startsWith(r + '/')));
  return { project: inside.length, other: [...new Set(hits.filter(h => !inside.includes(h)))] };
}

// Which skill text the agent loaded: the progressive-disclosure cost of a run.
export function skillReading(transcript, project) {
  if (!transcript || !fs.existsSync(transcript)) return null;
  const install = ['.claude', '.agents', '.codex'].map(d => path.join(project, d, 'skills/variant-design')).find(d => fs.existsSync(d));
  if (!install) return null;
  const events = fs.readFileSync(transcript, 'utf8').split('\n').flatMap(l => { try { return [JSON.parse(l)]; } catch { return []; } });
  // Only what the agent asked for (reads and commands, not files it wrote), with skill-relative paths after `cd` into the install.
  let asked = events.flatMap(e => e.type === 'assistant' ? (e.message?.content ?? []).filter(c => c.type === 'tool_use' && !['Write', 'Edit', 'MultiEdit'].includes(c.name)).map(c => JSON.stringify(c.input)) : e.type === 'item.started' && e.item?.type === 'command_execution' ? [e.item.command] : []).join('\n');
  // Agents often alias the install (`S=.claude/skills/variant-design; cat $S/SKILL.md`).
  for (const [, name, value] of asked.matchAll(/\b(\w+)=["']?([^\s"';]*skills\/variant-design)\b/g)) asked = asked.replaceAll(`\${${name}}`, value).replaceAll(`$${name}`, value);
  const files = new Set(events.some(e => e.type === 'assistant' && e.message?.content?.some(c => c.type === 'tool_use' && c.name === 'Skill')) ? ['SKILL.md'] : []);
  for (const m of asked.matchAll(/(?:skills\/variant-design\/|(?<![\w./-]))((?:SKILL\.md)|(?:skills|references)\/[\w./-]+?\.md)/g)) if (fs.existsSync(path.join(install, m[1]))) files.add(m[1]);
  const words = [...files].reduce((sum, f) => sum + fs.readFileSync(path.join(install, f), 'utf8').split(/\s+/).filter(Boolean).length, 0);
  return { files: [...files].sort(), words };
}

export function usage(transcript) {
  if (!transcript || !fs.existsSync(transcript)) return {};
  const events = fs.readFileSync(transcript, 'utf8').split('\n').flatMap(l => { try { return [JSON.parse(l)]; } catch { return []; } });
  const result = events.findLast(e => e.type === 'result');
  if (result) return { costUsd: result.total_cost_usd, turns: result.num_turns, durationSec: Math.round((result.duration_ms ?? 0) / 1000) };
  const tokens = events.filter(e => e.type === 'turn.completed').reduce((sum, e) => sum + (e.usage?.input_tokens ?? 0) + (e.usage?.output_tokens ?? 0), 0);
  return tokens ? { tokens } : {};
}

export function grade(project, { fixture = {}, transcript } = {}) {
  const output = path.join(project, 'variant-output');
  let context = null;
  try { context = JSON.parse(fs.readFileSync(path.join(output, '.variant-context.json'), 'utf8')); } catch {}
  const checks = [];
  const add = (id, pass, details = []) => checks.push({ id, pass, details });

  add('generated', !!context, context ? [] : ['no variant-output/.variant-context.json']);
  const delivery = context ? checkDelivery(output, { project }) : { errors: ['skipped'], warnings: [] };
  add('delivery-check', delivery.errors.length === 0, [...delivery.errors, ...delivery.warnings.map(w => `warning: ${w}`)]);
  add('not-selected', context ? context.selectedVariant == null : false, context?.selectedVariant != null ? [`selectedVariant is ${context.selectedVariant}; the prompt asked not to pick`] : []);
  const outside = untouched(project);
  add('project-untouched', outside.problems.length === 0, [...outside.problems, ...outside.notes]);
  const q = quality(output);
  add('quality-gate', q.errors.length === 0, [...q.errors, ...q.warnings.map(w => `warning: ${w}`)]);
  if (fixture.locked) {
    const locked = fixture.locked.fonts.map(first), problems = [];
    if (!context?.designSystem?.confirmed) problems.push('the brand lock was not recorded as a confirmed design system');
    else if (context.designSystem.file !== fixture.locked.file) problems.push(`locked file recorded as ${context.designSystem.file}, not ${fixture.locked.file}`);
    for (const [file, source] of ownedSources(output, context)) for (const font of declaredFonts(source)) if (!locked.includes(font.toLowerCase())) problems.push(`${file} declares "${font}"`);
    add('brand-kept', problems.length === 0, problems);
  }
  const copies = skillCopies(transcript, project);
  if (copies) add('skill-under-test', copies.project > 0 && copies.other.length === 0, [`read the project copy ${copies.project} time(s)`, ...copies.other.map(o => `also referenced ${o}`)]);
  return { pass: checks.every(c => c.pass), checks, usage: usage(transcript), reading: skillReading(transcript, project), recommendation: context?.recommendation?.variant ?? null };
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  const args = process.argv.slice(2), opt = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
  const project = args.find((a, i) => !a.startsWith('--') && !['--fixture', '--transcript'].includes(args[i - 1]));
  if (!project) { console.error('Usage: node evals/grade.mjs <project> [--fixture <name>] [--transcript <file>] [--json]'); process.exit(2); }
  const result = grade(path.resolve(project), { fixture: opt('--fixture') ? loadFixture(opt('--fixture')) : {}, transcript: opt('--transcript') });
  if (args.includes('--json')) console.log(JSON.stringify(result, null, 2));
  else { for (const c of result.checks) { console.log(`${c.pass ? '✓' : '✗'} ${c.id}`); for (const d of c.details) console.log(`    ${d}`); } if (result.reading) console.log(`skill text read: ${result.reading.words} words in ${result.reading.files.length} files`); }
  process.exitCode = result.pass ? 0 : 1;
}
