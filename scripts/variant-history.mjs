#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { tokenMap } from './ds-tokens.mjs';
import { color } from './ds-export.mjs';

export function localFile(root, relative) {
  if (typeof relative !== 'string' || relative.split(/[\\/]/).some(part => !part || part === '.' || part === '..')) throw new Error('Use normalized relative file paths.');
  const base = fs.realpathSync(root);
  const target = path.resolve(base, relative);
  if (path.isAbsolute(relative) || !target.startsWith(base + path.sep)) throw new Error(`Invalid owned path: ${relative}`);
  // Reject symlinks, including directory symlinks, before reading or replacing.
  let current = base;
  for (const part of path.relative(base, target).split(path.sep)) {
    current = path.join(current, part);
    try { if (fs.lstatSync(current).isSymbolicLink()) throw new Error(`Symlink not allowed: ${relative}`); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return target;
}
export function readContext(root) {
  const state = JSON.parse(fs.readFileSync(localFile(root, '.variant-context.json'), 'utf8'));
  if (state.schemaVersion !== 2) throw new Error('Migrate context to schemaVersion 2 first; legacy picked is ambiguous.');
  return state;
}
function atomic(file, content) {
  const tmp = file + '.' + randomUUID() + '.tmp';
  try { fs.writeFileSync(tmp, content); fs.renameSync(tmp, file); }
  finally { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); }
}
function writeContext(root, state) {
  atomic(localFile(root, '.variant-context.json'), JSON.stringify(state, null, 2) + '\n');
}
function owned(state, id) {
  if (!['A', 'B', 'C'].includes(id) || !state.variants?.[id]) throw new Error('Register variant A/B/C first.');
  const files = state.variants[id].files;
  if (!Array.isArray(files) || !files.length || new Set(files).size !== files.length) throw new Error('Variant needs unique owned files.');
  for (const file of files) {
    if (file.startsWith('.') || file === 'design-system.css') throw new Error('Context, history, and shared DS cannot be variant-owned.');
    for (const [other, variant] of Object.entries(state.variants)) {
      if (other !== id && variant.files.includes(file)) throw new Error(`Shared file cannot be overwritten: ${file}`);
    }
  }
  return files;
}
const baselineName = '.candidate-baseline.json';
const digest = content => createHash('sha256').update(content).digest('hex');
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
const same = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
function constraints(state, id) {
  const { entry, tokens, comparison, systemBinding } = state.variants[id];
  return { entry, tokens, comparison, ...(systemBinding !== undefined ? { systemBinding } : {}), designSystem: state.designSystem ?? null, taskContract: state.taskContract ?? null };
}
function projectRoot(root, project) {
  const target = fs.realpathSync(project);
  if (!fs.realpathSync(root).startsWith(target + path.sep)) throw new Error('Project root must contain variant output.');
  return target;
}
function designSystemDigest(state, project) {
  return state.designSystem?.file ? digest(fs.readFileSync(localFile(project, state.designSystem.file))) : null;
}
function systemFiles(state, project) {
  const ds = state.designSystem;
  if (!ds?.file) return {};
  const files = [ds.file, ...(ds.extensions ?? [])];
  if (new Set(files).size !== files.length) throw new Error('Design system needs unique main/extension files.');
  return Object.fromEntries(files.map(file => [file, digest(fs.readFileSync(localFile(project, file)))]));
}
export const systemIdentity = (state, project) => digest(JSON.stringify(canonical({ files: Object.entries(systemFiles(state, project)), fonts: state.designSystem?.fonts ?? [] })));
const metadata = variant => ({ tokens: variant.tokens, comparison: variant.comparison, ...(variant.systemBinding !== undefined ? { systemBinding: variant.systemBinding } : {}) });
function conflict(details) {
  throw new Error(`Candidate conflict: ${details}. Current files are unchanged. Keep this candidate and its baseline; compare/reconcile your edits, then prepare a NEW candidate from current output. Do not replace the old baseline.`);
}
function verifyBaseline(root, id, candidate, state) {
  let saved;
  try { saved = JSON.parse(fs.readFileSync(localFile(candidate, baselineName), 'utf8')); }
  catch { throw new Error('Missing or invalid candidate baseline. Run prepare into a NEW directory before editing; preserve legacy candidates for manual comparison.'); }
  if (saved?.schemaVersion !== 1 || !saved.files || typeof saved.files !== 'object' || Array.isArray(saved.files) || !Number.isInteger(saved.version) || !saved.constraints || typeof saved.projectRoot !== 'string') throw new Error('Invalid candidate baseline; prepare a new candidate.');
  if (saved.output !== fs.realpathSync(root) || saved.variant !== id) conflict('different project or variant');
  const project = projectRoot(root, saved.projectRoot);
  const files = owned(state, id);
  if (!same(Object.keys(saved.files).sort(), [...files].sort())) conflict('owned file set changed');
  if (saved.version !== state.variants[id].version) conflict('variant version changed');
  if (!same(saved.constraints, constraints(state, id))) conflict('entry, tokens, comparison, design system or task constraints changed');
  for (const file of files) {
    const record = saved.files[file];
    if (!record || typeof record.content !== 'string' || !/^[a-f0-9]{64}$/.test(record.sha256) || digest(Buffer.from(record.content, 'base64')) !== record.sha256) throw new Error(`Invalid candidate baseline content: ${file}`);
    let current;
    try { current = digest(fs.readFileSync(localFile(root, file))); }
    catch (error) { if (error.code === 'ENOENT') conflict(`file missing: ${file}`); throw error; }
    if (current !== record.sha256) conflict(`file changed: ${file}`);
  }
  let ds;
  try { ds = designSystemDigest(state, project); }
  catch (error) { if (error.code === 'ENOENT') conflict('design system file missing'); throw error; }
  if (ds !== saved.designSystemDigest) conflict('design system file content changed');
  if (saved.designSystemFiles) {
    if (!same(saved.designSystemFiles, systemFiles(state, project))) conflict('design system extension content changed');
  } else if (state.designSystem?.extensions?.length) throw new Error('Legacy candidate baseline does not cover system extensions; preserve it and prepare a NEW candidate.');
  return project;
}
export function prepareVariant(root, id, destination, project = path.dirname(path.resolve(root))) {
  return withLock(root, () => {
    const state = readContext(root), files = owned(state, id);
    const base = projectRoot(root, project);
    if (!Number.isInteger(state.variants[id].version) || state.variants[id].version < 1) throw new Error('Variant version must be a positive integer.');
    const records = Object.fromEntries(files.map(file => {
      const bytes = fs.readFileSync(localFile(root, file));
      return [file, { sha256: digest(bytes), content: bytes.toString('base64') }];
    }));
    const target = path.join(fs.realpathSync(path.dirname(path.resolve(destination))), path.basename(destination));
    const output = fs.realpathSync(root);
    if (target === output || target.startsWith(output + path.sep)) throw new Error('Candidate must be outside variant output.');
    const baseline = { schemaVersion: 1, output, projectRoot: base, variant: id, version: state.variants[id].version,
      constraints: constraints(state, id), designSystemDigest: designSystemDigest(state, base), designSystemFiles: systemFiles(state, base), files: records };
    // Never retrofit a baseline onto an existing candidate, even an empty directory.
    fs.mkdirSync(target);
    try {
      for (const [file, record] of Object.entries(records)) {
        const dest = localFile(target, file); fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, Buffer.from(record.content, 'base64'), { flag: 'wx' });
      }
      fs.writeFileSync(localFile(target, baselineName), JSON.stringify(baseline, null, 2) + '\n', { flag: 'wx', flush: true });
      verifyBaseline(root, id, target, readContext(root));
    } catch (error) {
      // Retain partial copies for inspection; an unusable baseline cannot be applied.
      const manifest = localFile(target, baselineName);
      if (fs.existsSync(manifest)) fs.unlinkSync(manifest);
      throw error;
    }
    return target;
  });
}
function outsideZone(source, zone) {
  if (!/^[\w-]+$/.test(zone)) throw new Error('Invalid zone name.');
  // One file may mark the same zone in several places, e.g. hero markup plus its <style> rules.
  // Each marker style (HTML, JSX, CSS/JS) may appear once; everything outside every pair is fixed.
  const marker = new RegExp(`<!-- zone:${zone}:(start|end) -->|\\{/\\* zone:${zone}:(start|end) \\*/\\}|/\\* zone:${zone}:(start|end) \\*/`, 'g');
  const found = [...source.matchAll(marker)].map(m => ({ edge: m[1] ?? m[2] ?? m[3], style: m[1] ? 'html' : m[2] ? 'jsx' : 'code', at: m.index, end: m.index + m[0].length }));
  if (!found.length) return null;
  const outside = [];
  let cursor = 0;
  const styles = new Set();
  for (let i = 0; i < found.length; i += 2) {
    const [start, end] = [found[i], found[i + 1]];
    if (start.edge !== 'start' || end?.edge !== 'end' || start.style !== end.style) throw new Error('Invalid zone boundaries.');
    if (styles.has(start.style)) throw new Error('Zone markers must be unique.');
    styles.add(start.style);
    outside.push(source.slice(cursor, start.end));
    cursor = end.at;
  }
  outside.push(source.slice(cursor));
  return outside;
}
function snapshot(root, id, state, files, expectedAfter, expectedMetadata, request) {
  const key = `.history/${id}/${randomUUID()}.json`;
  const file = localFile(root, key);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const data = { variant: state.variants[id], files, expectedAfter, expectedMetadata, ...(request ? { request } : {}) };
  fs.writeFileSync(file, JSON.stringify(data, null, 2), { flag: 'wx', flush: true });
  if (fs.readFileSync(file, 'utf8') !== JSON.stringify(data, null, 2)) throw new Error('Snapshot verification failed.');
  return key;
}
function transaction(root, state, before, after) {
  // Validate/read everything first. Roll back ordinary write failures; snapshots also
  // support manual recovery after a process or machine crash between file renames.
  try {
    for (const [file, content] of Object.entries(after)) atomic(localFile(root, file), Buffer.from(content, 'base64'));
    writeContext(root, state);
  } catch (error) {
    for (const [file, content] of Object.entries(before)) atomic(localFile(root, file), Buffer.from(content, 'base64'));
    throw error;
  }
}
function alignedTokens(state, change, project) {
  const ds = state.designSystem;
  if (!ds?.confirmed || !ds.file) throw new Error('System application requires a confirmed system file.');
  if (!ds.digest || ds.digest !== systemIdentity(state, project)) throw new Error('Confirmed system identity is missing or changed; use confirm-system for the explicitly approved current system before preparing a new candidate.');
  const tokens = change.tokens;
  if (!tokens || !Array.isArray(tokens.fonts) || !same(tokens.fonts, ds.fonts)) throw new Error('System application fonts must match the confirmed system; supply the complete aligned tokens record.');
  const records = tokenMap([ds.file, ...(ds.extensions ?? [])].map(file => fs.readFileSync(localFile(project, file), 'utf8')));
  const resolve = (value, seen = new Set()) => {
    if (typeof value !== 'string') return null;
    const ref = value.match(/^var\(\s*(--[\w-]+)\s*\)$/)?.[1];
    if (!ref) return color(value);
    const token = records.get(ref);
    if (!token || token.values.length !== 1 || seen.has(ref)) return null;
    return resolve(token.value, new Set([...seen, ref]));
  };
  const colors = [...records.values()].map(t => t.values.length === 1 ? resolve(t.value) : null).filter(Boolean);
  if (tokens.colors !== undefined && (!tokens.colors || typeof tokens.colors !== 'object' || Array.isArray(tokens.colors))) throw new Error('System colors must be a named object.');
  for (const [name, value] of Object.entries(tokens.colors ?? {})) {
    const parsed = resolve(value);
    if (!parsed || !colors.some(c => same(c, parsed))) throw new Error(`Color ${name} is not a resolved color of the confirmed system.`);
  }
  return tokens;
}
function applyUnlocked(root, id, candidate, change, adoptSystem = false) {
  const state = readContext(root), files = owned(state, id), variant = state.variants[id];
  if (!change.summary) throw new Error('Change summary required.');
  if (change.request !== undefined && (typeof change.request !== 'string' || !change.request)) throw new Error('Change request must be a non-empty string.');
  const project = verifyBaseline(root, id, candidate, state);
  if (adoptSystem) alignedTokens(state, change, project);
  const before = {}, after = {};
  for (const file of files) {
    before[file] = fs.readFileSync(localFile(root, file)).toString('base64');
    after[file] = fs.readFileSync(localFile(candidate, file)).toString('base64');
  }
  if (change.zone) {
    let found = false;
    for (const file of files) {
      const old = outsideZone(Buffer.from(before[file], 'base64').toString(), change.zone);
      const next = outsideZone(Buffer.from(after[file], 'base64').toString(), change.zone);
      if (old) {
        found = true;
        if (JSON.stringify(old) !== JSON.stringify(next)) throw new Error(`Outside-zone changes rejected: ${file}`);
      } else if (before[file] !== after[file]) throw new Error(`Unscoped file changed: ${file}`);
    }
    if (!found) throw new Error('Zone not found.');
  }
  if (!adoptSystem && state.designSystem?.confirmed && change.tokens && JSON.stringify(change.tokens) !== JSON.stringify(variant.tokens)) {
    throw new Error('Locked design tokens cannot change during variation.');
  }
  // Recheck immediately before snapshot/commit; external editors do not honor our lock.
  const latest = readContext(root);
  verifyBaseline(root, id, candidate, latest);
  if (!same(state, latest)) conflict('context changed during apply');
  const systemBinding = adoptSystem ? { status: 'applied', digest: systemIdentity(state, project) } : variant.systemBinding;
  const next = { ...variant, tokens: change.tokens ?? variant.tokens, comparison: change.comparison ?? variant.comparison, ...(systemBinding !== undefined ? { systemBinding } : {}) };
  const key = snapshot(root, id, state, before, after, metadata(next), change.request);
  state.variants[id] = { ...next,
    version: variant.version + 1, undo: [...(variant.undo ?? []), key],
    history: [...(variant.history ?? []), { action: 'apply', version: variant.version + 1, snapshot: key, summary: change.summary, zone: change.zone, ...(change.request ? { request: change.request } : {}), at: new Date().toISOString() }] };
  state.activeVariant = id;
  transaction(root, state, before, after);
  return state;
}
function undoUnlocked(root, id) {
  const state = readContext(root), files = owned(state, id), variant = state.variants[id];
  const stack = [...(variant.undo ?? [])], key = stack.pop();
  if (!key) throw new Error(`No earlier revision for ${id}.`);
  const load = snapshotKey => JSON.parse(fs.readFileSync(localFile(root, snapshotKey), 'utf8'));
  // Applies that share a request id are one user action, so undo reverts all of them together.
  const latest = load(key), restored = [key];
  let saved = latest;
  while (latest.request && stack.length) {
    const previous = load(stack.at(-1));
    if (previous.request !== latest.request) break;
    saved = previous; restored.unshift(stack.pop());
  }
  if (JSON.stringify(Object.keys(saved.files).sort()) !== JSON.stringify([...files].sort())) throw new Error('Snapshot file set differs; recover manually.');
  const before = Object.fromEntries(files.map(file => [file, fs.readFileSync(localFile(root, file)).toString('base64')]));
  if (!latest.expectedAfter) throw new Error("Legacy snapshot has no edit baseline; recover into a separate directory and compare before restoring.");
  if (files.some(file => before[file] !== latest.expectedAfter[file])) throw new Error("Files changed since the saved revision; preserve your edits and reconcile before undo.");
  if (JSON.stringify(latest.expectedMetadata) !== JSON.stringify(metadata(variant))) throw new Error("Variant metadata changed since the saved revision; reconcile before undo.");
  const recovery = snapshot(root, id, state, before);
  state.variants[id] = { ...saved.variant, version: variant.version + 1, undo: stack,
    history: [...variant.history, { action: 'undo', version: variant.version + 1, snapshot: recovery, restored: key,
      ...(restored.length > 1 ? { request: latest.request, restoredSnapshots: restored } : {}), at: new Date().toISOString() }] };
  state.activeVariant = id;
  transaction(root, state, before, saved.files);
  return state;
}
export function recoverVariant(root, id, destination) {
  const state = readContext(root), files = owned(state, id), key = state.variants[id].undo?.at(-1);
  if (!key) throw new Error(`No earlier revision for ${id}.`);
  const saved = JSON.parse(fs.readFileSync(localFile(root, key), 'utf8'));
  if (JSON.stringify(Object.keys(saved.files).sort()) !== JSON.stringify([...files].sort())) throw new Error('Snapshot file set differs; recover manually.');
  // Never reuse an existing directory: recovery cannot overwrite live artifacts.
  const target = path.resolve(destination);
  const source = fs.realpathSync(root);
  if (target === source || target.startsWith(source + path.sep)) throw new Error('Recovery must be outside variant output.');
  fs.mkdirSync(target);
  for (const file of files) {
    const output = localFile(target, file);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, Buffer.from(saved.files[file], 'base64'), { flag: 'wx' });
  }
  fs.writeFileSync(path.join(target, 'recovered-variant.json'), JSON.stringify(saved.variant, null, 2), { flag: 'wx' });
  return target;
}
function withLock(root, action) {
  const lock = localFile(root, '.variant-lock');
  try { fs.mkdirSync(lock); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error('Another history operation holds .variant-lock. If it crashed, inspect snapshots and files before removing the lock.');
    throw error;
  }
  try { return action(); }
  finally { fs.rmdirSync(lock); }
}
export { withLock as withHistoryLock };
export const applyVariant = (root, id, candidate, change) => withLock(root, () => applyUnlocked(root, id, candidate, change));
export const applySystemVariant = (root, id, candidate, change) => withLock(root, () => applyUnlocked(root, id, candidate, change, true));
export const confirmSystem = (root, definition, project = path.dirname(path.resolve(root))) => withLock(root, () => {
  const before = fs.readFileSync(localFile(root, '.variant-context.json'), 'utf8'), state = readContext(root), base = projectRoot(root, project);
  if (!definition || typeof definition !== 'object' || Array.isArray(definition) || !definition.file || !Array.isArray(definition.fonts) || !definition.fonts.length || definition.fonts.some(f => typeof f !== 'string' || !f.trim())) throw new Error('System confirmation needs a file and non-empty fonts.');
  if (definition.extensions !== undefined && (!Array.isArray(definition.extensions) || definition.extensions.some(f => typeof f !== 'string'))) throw new Error('System extensions must be file paths.');
  const prior = state.designSystem, brand = prior?.confirmed && prior.file && prior.file !== 'variant-output/design-system.css';
  if (brand && (definition.file !== prior.file || !same(definition.fonts, prior.fonts))) throw new Error('A locked brand file and its fonts cannot be replaced by system confirmation.');
  if (definition.source) { owned(state, definition.source); if (state.selectedVariant !== definition.source) throw new Error('Pick the source direction explicitly before confirming its derived system.'); }
  const ds = { ...definition, confirmed: true, confirmedAt: new Date().toISOString() }, next = { ...state, designSystem: ds };
  const files = systemFiles(next, base), sources = Object.keys(files).map(f => fs.readFileSync(localFile(base, f), 'utf8'));
  ds.digest = systemIdentity(next, base);
  if (brand) {
    const names = tokenMap([sources[0]]);
    for (const source of sources.slice(1)) for (const name of tokenMap([source]).keys()) if (names.has(name)) throw new Error(`System extension redefines locked brand token ${name}.`);
  }
  if (ds.source) {
    const binding = { status: 'pending', digest: systemIdentity(next, base) }, variant = state.variants[ds.source];
    next.variants = { ...state.variants, [ds.source]: { ...variant, systemBinding: variant.systemBinding?.status === 'applied' && variant.systemBinding.digest === binding.digest ? variant.systemBinding : binding } };
  }
  const backup = localFile(root, `.history/system/${randomUUID()}.json`), saved = JSON.stringify({ context: before, files }, null, 2);
  fs.mkdirSync(path.dirname(backup), { recursive: true }); fs.writeFileSync(backup, saved, { flag: 'wx', flush: true });
  if (fs.readFileSync(backup, 'utf8') !== saved) throw new Error('System confirmation backup verification failed.');
  if (fs.readFileSync(localFile(root, '.variant-context.json'), 'utf8') !== before || !same(files, systemFiles(next, base))) throw new Error('System or context changed before confirmation; no write performed.');
  writeContext(root, next);
  return next;
});
export const undoVariant = (root, id) => withLock(root, () => undoUnlocked(root, id));
export const selectVariant = (root, id) => withLock(root, () => {
  const state = readContext(root); owned(state, id); state.selectedVariant = id; writeContext(root, state); return state;
});
if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  const [action, root = 'variant-output', id, candidate, metadata] = process.argv.slice(2);
  try {
    if (action === 'prepare') { if (!candidate) throw new Error('New candidate directory required.'); prepareVariant(root, id, candidate, metadata); }
    else if (action === 'apply') applyVariant(root, id, candidate, JSON.parse(fs.readFileSync(metadata, 'utf8')));
    else if (action === 'apply-system') applySystemVariant(root, id, candidate, JSON.parse(fs.readFileSync(metadata, 'utf8')));
    else if (action === 'confirm-system') confirmSystem(root, JSON.parse(fs.readFileSync(id, 'utf8')), candidate);
    else if (action === 'undo') undoVariant(root, id);
    else if (action === 'select') selectVariant(root, id);
    else if (action === 'recover') { if (!candidate) throw new Error('Recovery directory required.'); recoverVariant(root, id, candidate); }
    else throw new Error('Usage: variant-history.mjs prepare <output> A|B|C <new-candidate-dir> [project-root] | apply/apply-system <output> A|B|C <candidate-dir> <change.json> | confirm-system <output> <system.json> [project-root] | undo/select <output> A|B|C | recover <output> A|B|C <new-directory>');
    console.log(`${action} ${id}: saved`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
