#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export function localFile(root, relative) {
  if (typeof relative !== 'string' || relative.split(/[\\/]/).some(part => !part || part === '.' || part === '..')) throw new Error('Use normalized relative file paths.');
  const base = fs.realpathSync(root);
  const target = path.resolve(base, relative);
  if (path.isAbsolute(relative) || !target.startsWith(base + path.sep)) throw new Error(`Invalid owned path: ${relative}`);
  // Reject symlinks, including directory symlinks, before reading or replacing.
  let current = base;
  for (const part of path.relative(base, target).split(path.sep)) {
    current = path.join(current, part);
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) throw new Error(`Symlink not allowed: ${relative}`);
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
function outsideZone(source, zone) {
  if (!/^[\w-]+$/.test(zone)) throw new Error('Invalid zone name.');
  const pairs = [
    [`<!-- zone:${zone}:start -->`, `<!-- zone:${zone}:end -->`],
    [`{/* zone:${zone}:start */}`, `{/* zone:${zone}:end */}`],
    [`/* zone:${zone}:start */`, `/* zone:${zone}:end */`],
  ];
  for (const [start, end] of pairs) {
    if (!source.includes(start)) continue;
    if (source.split(start).length !== 2 || source.split(end).length !== 2) throw new Error('Zone markers must be unique.');
    const left = source.indexOf(start) + start.length, right = source.indexOf(end);
    if (right < left) throw new Error('Invalid zone boundaries.');
    return [source.slice(0, left), source.slice(right)];
  }
  return null;
}
function snapshot(root, id, state, files) {
  const key = `.history/${id}/${randomUUID()}.json`;
  const file = localFile(root, key);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const data = { variant: state.variants[id], files };
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
export function applyVariant(root, id, candidate, change) {
  const state = readContext(root), files = owned(state, id), variant = state.variants[id];
  if (!change.summary) throw new Error('Change summary required.');
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
  if (state.designSystem?.confirmed && change.tokens && JSON.stringify(change.tokens) !== JSON.stringify(variant.tokens)) {
    throw new Error('Locked design tokens cannot change during variation.');
  }
  const key = snapshot(root, id, state, before);
  state.variants[id] = { ...variant, tokens: change.tokens ?? variant.tokens,
    comparison: change.comparison ?? variant.comparison,
    version: variant.version + 1, undo: [...(variant.undo ?? []), key],
    history: [...(variant.history ?? []), { action: 'apply', version: variant.version + 1, snapshot: key, summary: change.summary, zone: change.zone, at: new Date().toISOString() }] };
  state.activeVariant = id;
  transaction(root, state, before, after);
  return state;
}
export function undoVariant(root, id) {
  const state = readContext(root), files = owned(state, id), variant = state.variants[id];
  const stack = [...(variant.undo ?? [])], key = stack.pop();
  if (!key) throw new Error(`No earlier revision for ${id}.`);
  const saved = JSON.parse(fs.readFileSync(localFile(root, key), 'utf8'));
  if (JSON.stringify(Object.keys(saved.files).sort()) !== JSON.stringify([...files].sort())) throw new Error('Snapshot file set differs; recover manually.');
  const before = Object.fromEntries(files.map(file => [file, fs.readFileSync(localFile(root, file)).toString('base64')]));
  const recovery = snapshot(root, id, state, before);
  state.variants[id] = { ...saved.variant, version: variant.version + 1, undo: stack,
    history: [...variant.history, { action: 'undo', version: variant.version + 1, snapshot: recovery, restored: key, at: new Date().toISOString() }] };
  state.activeVariant = id;
  transaction(root, state, before, saved.files);
  return state;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [action, root = 'variant-output', id, candidate, metadata] = process.argv.slice(2);
  try {
    if (action === 'apply') applyVariant(root, id, candidate, JSON.parse(fs.readFileSync(metadata, 'utf8')));
    else if (action === 'undo') undoVariant(root, id);
    else if (action === 'select') { const state = readContext(root); owned(state, id); state.selectedVariant = id; writeContext(root, state); }
    else throw new Error('Usage: variant-history.mjs apply <output> A|B|C <candidate-dir> <change.json> | undo/select <output> A|B|C');
    console.log(`${action} ${id}: saved`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
