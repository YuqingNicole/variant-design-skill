#!/usr/bin/env node
// Grades one agent run on a fixture project: the product promises a user would check by hand.
// Usage: node evals/grade.mjs <project> [--fixture <name>] [--transcript <file>] [--json]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkDelivery, declaredFonts, systemDrift } from '../scripts/delivery-check.mjs';
import { checkSystem } from '../scripts/ds-check.mjs';
import { tokenMap } from '../scripts/ds-tokens.mjs';
import { systemIdentity } from '../scripts/variant-history.mjs';
import { gradePremium } from './premium.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
// Files an agent may create in a user's project; everything tracked at the baseline must stay byte-identical.
const allowed = /^(variant-output|\.variant-work|\.claude|\.agents|\.codex|dist|node_modules)(\/|$)/;
// Preview shells the skill's own scripts write (comparison page, per-variant preview entries), not the agent's design work.
const generated = /(^|\/)(_static|_preview|\.preview|\.history|\.snapshots|node_modules)(\/|$)|(^|\/)_compare\.html$/;
// Framework preview adapters the skill tells agents to create, such as a Next.js `app/variant-preview/` route.
const adapter = /(^|\/)\(?_?variant[\w-]*\)?\//;

export const loadFixture = name => JSON.parse(fs.readFileSync(path.join(here, 'fixtures', name, 'fixture.json'), 'utf8'));
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' });
const first = value => String(value).split(',')[0].trim().replace(/^['"]|['"]$/g, '').toLowerCase();

function untouched(project, allowedTracked = new Set()) {
  const problems = [], notes = [];
  for (const line of git(project, 'status', '--porcelain', '--untracked-files=all').split('\n').filter(Boolean)) {
    const status = line.slice(0, 2), file = line.slice(3).replace(/^"|"$/g, '');
    if (status === '??') { if (allowed.test(file)) continue; if (adapter.test(file)) notes.push(`warning: preview adapter created at ${file}`); else problems.push(`created ${file} outside variant-output/`); continue; }
    if (allowedTracked.has(file)) continue;
    // Adding ignore lines for the skill's working folders is fine; changing anything else is not.
    if (file === '.gitignore' && git(project, 'diff', '--unified=0', '--', '.gitignore').split('\n').filter(l => /^[-+](?![-+])/.test(l)).every(l => l.startsWith('+'))) continue;
    problems.push(`${status.trim() === 'D' ? 'deleted' : 'changed'} ${file}`);
  }
  return { problems, notes };
}

function quality(output) {
  if (!fs.existsSync(output)) return { errors: [], warnings: [], habits: [] };
  let report;
  try { report = JSON.parse(execFileSync(process.execPath, [path.join(repo, 'scripts/quality-gate.mjs'), output, '--json'], { encoding: 'utf8' })); }
  catch (error) { report = JSON.parse(error.stdout); }
  const own = report.findings.filter(f => !generated.test(path.relative(output, path.resolve(f.file)).split(path.sep).join('/')));
  const list = severity => own.filter(f => f.severity === severity).map(f => `${f.rule} ${path.basename(f.file)}:${f.line}`);
  return { errors: list('error'), warnings: list('warning'), habits: list('review') };
}

function ownedSources(output, context) {
  const files = Object.values(context?.variants ?? {}).flatMap(v => v.files ?? []);
  return files.map(f => path.join(output, f)).filter(f => fs.existsSync(f)).map(f => [path.relative(output, f), fs.readFileSync(f, 'utf8')]);
}

const variants = dir => [...new Set([dir, fs.realpathSync(dir)])];

// Which copies of the skill the agent read. A run that read another copy did not test this tree.
// `install` is the copy under test when it lives outside the project, as a Claude Code plugin install does.
export function skillCopies(transcript, project, install) {
  if (!transcript || !fs.existsSync(transcript)) return null;
  // file:// links (a preview path in the agent's report) name the same files.
  const text = fs.readFileSync(transcript, 'utf8').replace(/\\\//g, '/').replace(/file:\/\/(?=\/)/g, '');
  const roots = variants(project);
  const hits = [...text.matchAll(/(?<![^\s"'`\\=:;(])([^\s"'`\\=:;()]*)skills\/variant-design(?=[/\s"'`\\;])/g)].map(m => m[1] + 'skills/variant-design');
  // Relative paths (`cat .claude/skills/...`) resolve inside the project, where the agent runs.
  const inside = hits.filter(h => !/^[~/$]/.test(h) || roots.some(r => h.startsWith(r + '/')));
  if (!install || roots.some(r => install.startsWith(r + '/'))) return { project: inside.length, other: [...new Set(hits.filter(h => !inside.includes(h)))] };
  // A plugin is read from its marketplace folder (a local directory marketplace) or from <config>/plugins/cache/<marketplace>/<plugin>/<version>.
  // Any other cached version, or any skill folder, is another copy.
  const own = variants(install), mine = own.reduce((n, dir) => n + text.split(dir).length - 1, 0);
  const plugin = [...text.matchAll(/[^\s"'`\\=:;()]*plugins\/cache\/variant-design\/variant-design\/[^/\s"'`\\;)]+/g)].map(m => m[0]);
  return { project: mine, other: [...new Set([...hits, ...plugin.filter(p => !own.includes(p))])] };
}

// Which skill text the agent loaded: the progressive-disclosure cost of a run.
export function skillReading(transcript, project, install = ['.claude', '.agents', '.codex'].map(d => path.join(project, d, 'skills/variant-design')).find(d => fs.existsSync(d))) {
  if (!transcript || !fs.existsSync(transcript) || !install) return null;
  const events = fs.readFileSync(transcript, 'utf8').split('\n').flatMap(l => { try { return [JSON.parse(l)]; } catch { return []; } });
  // Only what the agent asked for (reads and commands, not files it wrote), with skill-relative paths after `cd` into the install.
  let asked = events.flatMap(e => e.type === 'assistant' ? (e.message?.content ?? []).filter(c => c.type === 'tool_use' && !['Write', 'Edit', 'MultiEdit'].includes(c.name)).map(c => JSON.stringify(c.input)) : e.type === 'item.started' && e.item?.type === 'command_execution' ? [e.item.command] : e.type === 'tool_call' && !['write', 'edit'].includes(e.tool) ? [JSON.stringify(e.input)] : []).join('\n');
  // Agents often alias the install (`S=.claude/skills/variant-design; cat $S/SKILL.md`).
  // An install outside the project reads as the skill folder, so its aliases (`S=/path/to/marketplace`) expand below.
  for (const dir of variants(install)) asked = asked.replaceAll(dir, 'skills/variant-design');
  for (const [, name, value] of asked.matchAll(/\b(\w+)=["']?([^\s"';]*skills\/variant-design)\b/g)) asked = asked.replaceAll(`\${${name}}`, value).replaceAll(`$${name}`, value);
  const files = new Set(events.some(e => (e.type === 'assistant' && e.message?.content?.some(c => c.type === 'tool_use' && c.name === 'Skill')) || (e.type === 'tool_call' && e.tool === 'skill')) ? ['SKILL.md'] : []);
  for (const m of asked.matchAll(/(?:skills\/variant-design\/|(?<![\w./-]))((?:SKILL\.md)|(?:skills|references)\/[\w./-]+?\.md)/g)) if (fs.existsSync(path.join(install, m[1]))) files.add(m[1]);
  const words = [...files].reduce((sum, f) => sum + fs.readFileSync(path.join(install, f), 'utf8').split(/\s+/).filter(Boolean).length, 0);
  return { files: [...files].sort(), words };
}

export function usage(transcript) {
  if (!transcript || !fs.existsSync(transcript)) return {};
  const events = fs.readFileSync(transcript, 'utf8').split('\n').flatMap(l => { try { return [JSON.parse(l)]; } catch { return []; } });
  const result = events.findLast(e => e.type === 'result');
  if (result) return { costUsd: result.total_cost_usd, turns: result.num_turns, durationSec: Math.round((result.duration_ms ?? 0) / 1000) };
  // Codex reports per turn; DeepSeek Harness per model step (totalTokens includes cache reads, as Codex's input_tokens does).
  const tokens = events.reduce((sum, e) => sum + (e.type === 'turn.completed' ? (e.usage?.input_tokens ?? 0) + (e.usage?.output_tokens ?? 0) : e.type === 'status' && e.phase === 'step_end' ? e.usage?.totalTokens ?? 0 : 0), 0);
  return tokens ? { tokens } : {};
}

export function grade(project, { fixture = {}, transcript, install } = {}) {
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
  // Generator habits on a product page: eyebrow labels, decorative zero-padded numbers, direction names in the UI.
  add('generator-habits', q.habits.length === 0, q.habits);
  if (fixture.locked) {
    const locked = fixture.locked.fonts.map(first), problems = [];
    if (!context?.designSystem?.confirmed) problems.push('the brand lock was not recorded as a confirmed design system');
    else if (context.designSystem.file !== fixture.locked.file) problems.push(`locked file recorded as ${context.designSystem.file}, not ${fixture.locked.file}`);
    for (const [file, source] of ownedSources(output, context)) for (const font of declaredFonts(source)) if (!locked.includes(font.toLowerCase())) problems.push(`${file} declares "${font}"`);
    add('brand-kept', problems.length === 0, problems);
  }
  const copies = skillCopies(transcript, project, install);
  if (copies) add('skill-under-test', copies.project > 0 && copies.other.length === 0, [`read the copy under test ${copies.project} time(s)`, ...copies.other.map(o => `also referenced ${o}`)]);
  return { pass: checks.every(c => c.pass), checks, usage: usage(transcript), reading: skillReading(transcript, project, install), recommendation: context?.recommendation?.variant ?? null };
}

// Multi-turn fixtures (`turns` in fixture.json): each turn is a fresh agent process, so state can only come from the files.
// The runner records a snapshot after every turn; each turn is graded against the snapshots before it.
const ds = ['design-system.css', 'design-system-preview.html', 'DESIGN.md'];
export function snapshot(project) {
  const output = path.join(project, 'variant-output'), files = {};
  let context = null;
  try { context = JSON.parse(fs.readFileSync(path.join(output, '.variant-context.json'), 'utf8')); } catch {}
  const walk = dir => { for (const e of fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : []) {
    const full = path.join(dir, e.name), rel = path.relative(project, full).split(path.sep).join('/');
    if (e.isDirectory()) { if (!generated.test(rel + '/')) walk(full); } else if (e.isFile() && !generated.test(rel) && !rel.endsWith('.variant-context.json')) files[rel] = crypto.createHash('sha1').update(fs.readFileSync(full)).digest('hex');
  } };
  walk(output);
  const system = context?.designSystem?.confirmed ? [context.designSystem.file, ...(context.designSystem.extensions ?? [])].map(f => path.join(project, f)).filter(f => fs.existsSync(f)).map(f => fs.readFileSync(f, 'utf8')).join('\n') : null;
  const read = rel => fs.readFileSync(path.join(project, rel), 'utf8');
  // How far each variant sits from the confirmed system: colors and lengths it does not define.
  const drift = system ? Object.fromEntries(Object.entries(context.variants ?? {}).map(([id, v]) => [id, (v.files ?? []).map(f => `variant-output/${f}`).filter(f => files[f]).reduce((n, f) => { const d = systemDrift(read(f), system); return n + d.colors.length + d.lengths.length; }, 0)])) : null;
  const delivery = context ? checkDelivery(output, { project }) : null;
  const draft = path.join(output, 'design-system.css'), brand = context?.designSystem?.confirmed && context.designSystem.file !== 'variant-output/design-system.css' ? context.designSystem.file : null;
  const systemDraft = fs.existsSync(draft) ? { source: fs.readFileSync(draft, 'utf8'), ...(brand && fs.existsSync(path.join(project, brand)) ? { brandSource: read(brand) } : {}) } : null;
  let systemDigest = null;
  try { if (context?.designSystem?.confirmed) systemDigest = systemIdentity(context, project); } catch {}
  return { context, files, drift, systemDraft, systemDigest, delivery: delivery && { errors: delivery.errors, warnings: delivery.warnings }, quality: quality(output).errors, habits: quality(output).habits };
}

const owned = (snap, id) => Object.fromEntries((snap.context?.variants?.[id]?.files ?? []).map(f => [f, snap.files[`variant-output/${f}`] ?? null]));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const changed = (before, after, ids) => ids.filter(id => !same(owned(before, id), owned(after, id)));

const turnChecks = {
  generate: (now, _, add) => {
    add('generated', !!now.context, now.context ? [] : ['no variant-output/.variant-context.json']);
    add('not-selected', now.context?.selectedVariant == null, now.context?.selectedVariant ? [`selectedVariant is ${now.context.selectedVariant}`] : []);
  },
  pick: (now, [prev], add, project) => {
    add('picked', now.context?.selectedVariant === 'B', [`selectedVariant is ${now.context?.selectedVariant ?? 'empty'}`]);
    const edited = changed(prev, now, ['A', 'B', 'C']);
    add('pick-is-not-an-edit', !edited.length && now.context?.variants?.B?.version === prev.context?.variants?.B?.version, edited.map(id => `${id} files changed`));
    const missing = ds.filter(f => !now.files[`variant-output/${f}`]);
    add('ds-drafted', !missing.length, missing.map(f => `no variant-output/${f}`));
    add('ds-waits-for-user', same(now.context?.designSystem ?? null, prev.context?.designSystem ?? null), now.context?.designSystem ? [`designSystem written before ds confirm: ${JSON.stringify(now.context.designSystem)}`] : []);
    const text = now.systemDraft?.source ?? '', brand = now.systemDraft?.brandSource;
    const sources = [...(brand ? [{ source: brand, origin: 'brand' }] : []), text], audit = checkSystem(sources), tokens = tokenMap(sources);
    const issues = audit.issues.filter(i => tokens.get(i.text)?.origin !== 'brand'), unverified = audit.unverified.filter(i => tokens.get(i.text)?.origin !== 'brand');
    add('ds-contrast', !issues.length && !unverified.length, [...issues.map(i => `${i.text} on ${i.surface} is ${i.ratio}:1`), ...unverified.map(i => `${i.text}: unverified — ${i.reason}`)]);
    add('ds-layers', !audit.layers.length, audit.layers.map(i => `${i.token}: ${i.reason}`));
    // references/design-system/system-decisions.md §1 and §4: decisions open the file; every semantic color says where it is used.
    // @import and @charset must come first in CSS, so the decisions comment may follow them.
    const head = text.replace(/^(\s*@(import|charset)[^;]*;)+/, '').match(/^\s*\/\*[\s\S]*?\*\//)?.[0] ?? '';
    add('ds-decisions', /decision|决策/i.test(head) || (head.match(/^\s*(\/\*\s*)?\d\.\s/gm) ?? []).length >= 2, head ? [] : ['design-system.css does not open with a comment']);
    const colors = [...tokenMap([text]).values()].filter(t => t.layer === 'semantic' && t.name.startsWith('--color-')), bare = colors.filter(t => !t.use).map(t => t.name);
    add('ds-use-notes', (colors.length > 0 || !!brand) && !bare.length, bare.length ? [`no use note: ${bare.join(', ')}`] : colors.length || brand ? [] : ['no --color-* tokens']);
  },
  confirm: (now, [prev], add, project) => {
    const d = now.context?.designSystem;
    add('ds-confirmed', d?.confirmed === true && d.source === 'B' && fs.existsSync(path.join(project, d.file ?? '')), [`designSystem: ${JSON.stringify(d ?? null)}`]);
    const binding = now.context?.variants?.B?.systemBinding;
    add('ds-registered', !!d?.digest && d.digest === now.systemDigest && binding?.status === 'pending' && binding.digest === d.digest, [`binding: ${JSON.stringify(binding ?? null)}`]);
    let groups = 0;
    try { groups = Object.keys(JSON.parse(fs.readFileSync(path.join(project, 'variant-output/design-system.tokens.json'), 'utf8'))).filter(k => !k.startsWith('$')).length; } catch {}
    add('tokens-exported', groups > 0, groups ? [`${groups} token groups`] : ['no readable variant-output/design-system.tokens.json']);
    const edited = changed(prev, now, ['A', 'B', 'C']);
    const metadataChanged = ['A', 'B', 'C'].filter(id => ['tokens', 'version', 'undo'].some(key => !same(now.context?.variants?.[id]?.[key], prev.context?.variants?.[id]?.[key])));
    add('confirm-is-not-an-edit', !edited.length && !metadataChanged.length && now.context?.selectedVariant === 'B', [...edited.map(id => `${id} files changed`), ...metadataChanged.map(id => `${id} tokens/version/undo changed`)]);
  },
  apply: (now, [prev], add) => {
    const binding = now.context?.variants?.B?.systemBinding;
    add('system-adopted', binding?.status === 'applied' && !!now.systemDigest && binding.digest === now.systemDigest, [`binding: ${JSON.stringify(binding ?? null)}`]);
    const b = now.context?.variants?.B, before = prev.context?.variants?.B;
    add('applied', (b?.version ?? 0) > (before?.version ?? 0) && now.context?.activeVariant === 'B' && now.context?.selectedVariant === 'B', [`B v${before?.version} → v${b?.version}, active ${now.context?.activeVariant}, selected ${now.context?.selectedVariant}`]);
    const edited = changed(prev, now, ['A', 'C']), system = now.context?.designSystem?.file;
    add('apply-stays-in-B', !edited.length && (!system || now.files[system] === prev.files[system]) && same(now.context?.designSystem, prev.context?.designSystem), [...edited.map(id => `${id} files changed`), ...(system && now.files[system] !== prev.files[system] ? [`${system} changed`] : [])]);
    add('drift-reduced', now.drift?.B != null && prev.drift?.B != null && (now.drift.B === 0 || now.drift.B < prev.drift.B), [`B off-system values: ${prev.drift?.B ?? '?'} → ${now.drift?.B ?? '?'}`]);
  },
  undo: (now, [prev, beforeApply], add) => {
    const restored = same(owned(now, 'B'), owned(beforeApply, 'B')) && ['tokens', 'systemBinding'].every(key => same(now.context?.variants?.B?.[key], beforeApply.context?.variants?.B?.[key]));
    add('undone', restored && now.context?.selectedVariant === 'B', [restored ? 'B files, tokens and binding match the snapshot before apply ds B' : 'B files, tokens or binding differ from the snapshot before apply ds B', `selected ${now.context?.selectedVariant}`]);
    const edited = changed(prev, now, ['A', 'C']);
    add('undo-stays-in-B', !edited.length && same(now.context?.designSystem, prev.context?.designSystem), edited.map(id => `${id} files changed`));
  },
  component: (now, [prev], add, project) => {
    const system = now.context?.designSystem;
    const fresh = Object.keys(now.files).filter(f => !(f in prev.files) && /\.(html|css|tsx|jsx|vue|svelte)$/.test(f));
    add('component-built', fresh.length > 0, fresh.length ? fresh : ['no new component file in variant-output/']);
    const source = system?.confirmed ? [system.file, ...(system.extensions ?? [])].map(f => fs.readFileSync(path.join(project, f), 'utf8')).join('\n') : '';
    const drift = fresh.flatMap(f => { const d = systemDrift(fs.readFileSync(path.join(project, f), 'utf8'), source); return [...d.colors, ...d.lengths, ...d.primitives.map(p => `primitive ${p}`), ...d.components.map(p => `component token outside owning CSS ${p}`)].map(v => `${f}: ${v}`); });
    add('component-on-system', fresh.length > 0 && !!source && !drift.length, drift.length ? drift.slice(0, 12) : []);
    const edited = changed(prev, now, ['A', 'B', 'C']);
    add('component-leaves-variants', !edited.length && same(now.context?.designSystem, prev.context?.designSystem) && now.context?.selectedVariant === 'B', edited.map(id => `${id} files changed`));
  },
  premium: (now, [prev], add) => {
    const b = now.context?.variants?.B;
    add('refined', (b?.version ?? 0) > (prev.context?.variants?.B?.version ?? 0) && now.context?.activeVariant === 'B', ['B must have a new recorded refinement revision']);
    add('not-selected', now.context?.selectedVariant === prev.context?.selectedVariant, [`selectedVariant: ${now.context?.selectedVariant ?? 'empty'}`]);
    const edited = changed(prev, now, ['A', 'C']);
    const sameOthers = ['A', 'C'].every(id => same(now.context?.variants?.[id], prev.context?.variants?.[id]));
    add('stays-in-B', !edited.length && sameOthers && same(now.context?.designSystem, prev.context?.designSystem), [...edited.map(id => `${id} changed`), ...(!sameOthers ? ['A/C metadata changed'] : [])]);
  },
};

// turns: [{id, snapshot, transcript}] in run order; `snapshots` before the first turn is the empty project.
export function gradeChain(project, { turns, install, fixture = {}, initial, measurements } = {}) {
  const checks = [], start = initial ?? { context: null, files: {}, drift: null };
  turns.forEach((turn, i) => {
    const add = (id, pass, details = []) => checks.push({ id: `${turn.id}:${id}`, pass, details });
    const now = turn.snapshot, history = [i ? turns[i - 1].snapshot : start, ...turns.slice(0, i).reverse().slice(1).map(t => t.snapshot)];
    if (turn.exit !== undefined) add('agent-completed', turn.exit === 0 && !turn.timedOut, [`exit ${turn.exit}; timed out: ${Boolean(turn.timedOut)}`]);
    if (turn.id === 'premium' && turn.transcript) {
      const reading = skillReading(turn.transcript, project, install), required = ['references/workflow/adjective-translation.md', 'skills/variant-generate/actions.md'];
      add('adjective-route', required.every(file => reading?.files.includes(file)), required.filter(file => !reading?.files.includes(file)).map(file => `not read: ${file}`));
    }
    add('delivery-check', !!now.delivery && !now.delivery.errors.length, now.delivery ? [...now.delivery.errors, ...now.delivery.warnings.map(w => `warning: ${w}`)] : ['skipped']);
    if (fixture.locked) {
      const ds = now.context?.designSystem, locked = fixture.locked.fonts.map(first), problems = [];
      if (!ds?.confirmed || ds.file !== fixture.locked.file) problems.push(`expected confirmed brand file ${fixture.locked.file}`);
      if (!ds?.fonts?.length || ds.fonts.some(f => !locked.includes(first(f)))) problems.push('recorded system fonts do not preserve the brand');
      for (const [id, v] of Object.entries(now.context?.variants ?? {})) if (!v.tokens?.fonts?.length || v.tokens.fonts.some(f => !locked.includes(first(f)))) problems.push(`variant ${id} does not preserve the brand fonts`);
      add('brand-kept', !problems.length, problems);
    }
    if (['generate', 'component', 'premium'].includes(turn.id)) add('quality-gate', !now.quality.length, now.quality);
    if (turn.id === 'generate') add('generator-habits', !now.habits?.length, now.habits ?? []);
    turnChecks[turn.id]?.(now, history, add, project);
  });
  if (fixture.styleBudget) {
    const measured = gradePremium(measurements?.before, measurements?.after);
    for (const c of measured.checks) checks.push({ ...c, id: `premium:${c.id}` });
    checks.push({ id: 'premium:one-undo', pass: measurements?.undo?.pass === true, details: measurements?.undo?.details ?? ['No host undo check'] });
  }
  const allowedTracked = fixture.styleBudget ? new Set(['variant-output/.variant-context.json', ...(start.context?.variants?.B?.files ?? []).map(f => `variant-output/${f}`)]) : new Set();
  const outside = untouched(project, allowedTracked);
  checks.push({ id: 'project-untouched', pass: !outside.problems.length, details: [...outside.problems, ...outside.notes] });
  const copies = turns.map(t => skillCopies(t.transcript, project, install)).filter(Boolean);
  if (copies.length) checks.push({ id: 'skill-under-test', pass: copies.every(c => c.project > 0 && !c.other.length), details: copies.flatMap((c, i) => [`${turns[i].id}: read the copy under test ${c.project} time(s)`, ...c.other.map(o => `${turns[i].id}: also referenced ${o}`)]) });
  const usages = turns.map(t => usage(t.transcript)), sum = key => usages.some(u => u[key] != null) ? usages.reduce((n, u) => n + (u[key] ?? 0), 0) : undefined;
  const readings = turns.map(t => ({ turn: t.id, ...skillReading(t.transcript, project, install) }));
  return { pass: checks.every(c => c.pass), checks, reading: { words: readings.reduce((n, r) => n + (r.words ?? 0), 0), files: [...new Set(readings.flatMap(r => r.files ?? []))], turns: readings }, usage: { costUsd: sum('costUsd'), turns: sum('turns'), tokens: sum('tokens') }, recommendation: turns[0]?.snapshot.context?.recommendation?.variant ?? null };
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  const args = process.argv.slice(2), opt = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
  const project = args.find((a, i) => !a.startsWith('--') && !['--fixture', '--transcript', '--install'].includes(args[i - 1]));
  if (!project) { console.error('Usage: node evals/grade.mjs <project> [--fixture <name>] [--transcript <file>] [--install <skill dir outside the project>] [--json]'); process.exit(2); }
  const result = grade(path.resolve(project), { fixture: opt('--fixture') ? loadFixture(opt('--fixture')) : {}, transcript: opt('--transcript'), install: opt('--install') && path.resolve(opt('--install')) });
  if (args.includes('--json')) console.log(JSON.stringify(result, null, 2));
  else { for (const c of result.checks) { console.log(`${c.pass ? '✓' : '✗'} ${c.id}`); for (const d of c.details) console.log(`    ${d}`); } if (result.reading) console.log(`skill text read: ${result.reading.words} words in ${result.reading.files.length} files`); }
  process.exitCode = result.pass ? 0 : 1;
}
