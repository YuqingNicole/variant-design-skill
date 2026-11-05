#!/usr/bin/env node
// Preview ownership is established before writing, never inferred from an existing directory.
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { localFile } from './variant-history.mjs';

const metadata = '.variant-work/preview-files';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const need = (test, message) => { if (!test) throw new Error(message); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const groupName = group => { need(typeof group === 'string' && /^[a-z0-9][a-z0-9-]{0,95}$/.test(group), 'Use a short lowercase preview group name'); return group; };
const groupPath = group => `${metadata}/${groupName(group)}`;
function targetName(relative) {
  need(typeof relative === 'string' && !relative.includes('\\'), 'Use normalized project-relative preview paths');
  need(!path.isAbsolute(relative) && !relative.split('/').some(part => !part || part === '.' || part === '..'), 'Use normalized project-relative preview paths');
  need(!relative.split('/').some(part => ['.git', 'node_modules', '.history', '.integrations', '.verification', '.deliveries', '.variant-context.json'].includes(part)) && relative !== metadata && !relative.startsWith(metadata + '/'), 'Protected preview target');
  return relative;
}
const target = (project, relative) => localFile(project, targetName(relative));
function inspect(project, relative, content = false) {
  const file = target(project, relative);
  let stat;
  try { stat = fs.lstatSync(file, { bigint: true }); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  need(stat.isFile() && stat.nlink === 1n, `Preview target must be a regular, unlinked file: ${relative}`);
  need(stat.birthtimeNs > 0n, `Filesystem does not provide preview creation identity: ${relative}`);
  const bytes = fs.readFileSync(file);
  return { sha256: hash(bytes), mode: Number(stat.mode & 0o777n), identity: { dev: String(stat.dev), ino: String(stat.ino), birthtimeNs: String(stat.birthtimeNs) }, ...(content ? { content: bytes.toString('base64') } : {}) };
}
const fingerprint = ({ sha256, mode, identity }) => ({ sha256, mode, identity });
const matches = (actual, expected) => actual && same(fingerprint(actual), fingerprint(expected));
function persist(project, relative, value) {
  const file = localFile(project, relative), text = json(value);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, { flag: 'wx', flush: true });
  need(fs.readFileSync(file, 'utf8') === text, `Preview record verification failed: ${relative}`);
  return hash(text);
}
function replace(project, relative, bytes, mode, absent = false, internal = false) {
  const resolve = internal ? localFile : target, file = resolve(project, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = resolve(project, `${relative}.${randomUUID()}.tmp`);
  try {
    fs.writeFileSync(temporary, bytes, { flag: 'wx', flush: true, mode }); fs.chmodSync(temporary, mode);
    need(fs.lstatSync(temporary, { bigint: true }).birthtimeNs > 0n, `Filesystem does not provide preview creation identity: ${relative}`);
    // An exclusive hard link publishes a fresh file without replacing a late-arriving file.
    if (absent) fs.linkSync(temporary, file); else fs.renameSync(temporary, file);
  } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
}
function locked(project, action) {
  const base = fs.realpathSync(project), lock = localFile(base, `${metadata}/.lock`);
  fs.mkdirSync(path.dirname(lock), { recursive: true });
  try { fs.mkdirSync(lock); } catch (error) { if (error.code === 'EEXIST') throw new Error('Another preview operation holds the lock; inspect the owning process before manual recovery'); throw error; }
  try { return action(base); } finally { fs.rmdirSync(lock); }
}
function paths(project, files) {
  need(Array.isArray(files) && files.length && new Set(files).size === files.length, 'List unique preview file paths');
  for (const file of files) targetName(file);
  return [...files].sort();
}
function prepare(project, group, files) {
  const list = paths(project, files);
  for (const file of list) need(inspect(project, file) === null, `Preserve existing preview file: ${file}; choose a fresh path`);
  const plan = { schemaVersion: 1, project, group: groupName(group), createdAt: new Date().toISOString(), files: list };
  persist(project, `${groupPath(group)}/plan.json`, plan);
  return { plan: `${groupPath(group)}/plan.json`, ...plan };
}
function readPlan(project, group) {
  const file = `${groupPath(group)}/plan.json`, raw = fs.readFileSync(localFile(project, file)), plan = JSON.parse(raw);
  need(plan.schemaVersion === 1 && plan.project === project && plan.group === group, 'Preview plan belongs to another project or group');
  paths(project, plan.files);
  return { plan, sha256: hash(raw) };
}
function readReceipt(project, file) {
  need(typeof file === 'string' && file.startsWith(metadata + '/'), 'Receipt must be inside project/.variant-work/preview-files');
  const raw = fs.readFileSync(localFile(project, file)), receipt = JSON.parse(raw);
  need(receipt.schemaVersion === 1 && receipt.project === project && receipt.files && !Array.isArray(receipt.files), 'Invalid preview ownership receipt');
  const base = groupPath(receipt.group), plan = readPlan(project, receipt.group);
  need(file.startsWith(base + '/') && receipt.planSha256 === plan.sha256, 'Preview plan or receipt changed');
  for (const [relative, record] of Object.entries(receipt.files)) {
    targetName(relative);
    need(record && /^[a-f0-9]{64}$/.test(record.sha256) && record.sha256 === hash(Buffer.from(record.content, 'base64')) && Number.isInteger(record.mode) && record.mode >= 0 && record.mode <= 0o777 && record.identity && ['dev', 'ino', 'birthtimeNs'].every(key => typeof record.identity[key] === 'string' && /^\d+$/.test(record.identity[key])) && BigInt(record.identity.birthtimeNs) > 0n, 'Invalid preview file record');
  }
  const pointer = JSON.parse(fs.readFileSync(localFile(project, `${base}/current.json`)));
  need(pointer.receipt === file && pointer.sha256 === hash(raw), 'Stale or changed preview receipt; preserve files and use the current receipt');
  return receipt;
}
function finish(project, group, records, planSha256, operation) {
  const file = `${groupPath(group)}/${randomUUID()}.receipt.json`;
  const receipt = { schemaVersion: 1, project, group, at: new Date().toISOString(), planSha256, ...(operation ? { operation } : {}), files: records };
  const sha256 = persist(project, file, receipt), pointer = `${groupPath(group)}/current.json`;
  replace(project, pointer, Buffer.from(json({ receipt: file, sha256 })), 0o600, !fs.existsSync(localFile(project, pointer)), true);
  readReceipt(project, file);
  return { receipt: file, project, group, files: Object.keys(records) };
}
export const preparePreview = (project, group, files) => locked(project, base => prepare(base, group, files));
export const readPreviewReceipt = (project, file) => readReceipt(fs.realpathSync(project), file);
export const sealPreview = (project, group) => locked(project, base => {
  const { plan, sha256 } = readPlan(base, group);
  need(!fs.readdirSync(localFile(base, groupPath(group))).some(file => file.endsWith('.receipt.json')), 'Preview group is already sealed; do not re-adopt changed files');
  const records = Object.fromEntries(plan.files.map(file => { const record = inspect(base, file, true); need(record, `Missing prepared preview file: ${file}`); return [file, record]; }));
  for (const [file, record] of Object.entries(records)) need(matches(inspect(base, file), record), `Preview changed while sealing: ${file}`);
  return finish(base, group, records, sha256);
});

export const publishPreview = (project, group, files) => locked(project, base => {
  need(files && typeof files === 'object' && !Array.isArray(files), 'Need a complete preview path-to-bytes map');
  const list = paths(base, Object.keys(files)), next = Object.fromEntries(list.map(file => { need(typeof files[file] === 'string' || Buffer.isBuffer(files[file]), 'Preview bytes must be strings or buffers'); return [file, Buffer.from(files[file])]; }));
  const pointerFile = localFile(base, `${groupPath(group)}/current.json`);
  const prior = fs.existsSync(pointerFile) ? readReceipt(base, JSON.parse(fs.readFileSync(pointerFile)).receipt).files : (prepare(base, group, list), {});
  const { sha256 } = readPlan(base, group), all = [...new Set([...Object.keys(prior), ...list])].sort(), before = {};
  for (const file of all) {
    const actual = inspect(base, file, true);
    need(actual === null || (prior[file] && matches(actual, prior[file])), `Preview conflict: ${file}; preserve user work and choose a fresh output path`);
    before[file] = actual;
  }
  const operation = `${groupPath(group)}/${randomUUID()}.operation.json`;
  persist(base, operation, { schemaVersion: 1, project: base, at: new Date().toISOString(), action: 'publish', before, after: Object.fromEntries(list.map(file => [file, { content: next[file].toString('base64'), sha256: hash(next[file]) }])) });
  const written = [];
  try {
    for (const file of all) {
      const old = before[file], bytes = next[file];
      need(old ? matches(inspect(base, file), old) : inspect(base, file) === null, `Preview changed before writing: ${file}`);
      if (bytes && (!old || hash(bytes) !== old.sha256)) { const item = { file, after: undefined }; written.push(item); replace(base, file, bytes, old?.mode ?? 0o644, !old); item.after = inspect(base, file); }
      else if (!bytes && old) { written.push({ file, after: null }); fs.unlinkSync(target(base, file)); }
    }
    const records = Object.fromEntries(list.map(file => [file, inspect(base, file, true)]));
    for (const file of list) need(records[file]?.sha256 === hash(next[file]), `Published preview differs: ${file}`);
    return finish(base, group, records, sha256, operation);
  } catch (error) {
    const conflicts = [];
    for (const { file, after } of written.reverse()) {
      try {
        const actual = inspect(base, file);
        if (before[file] ? matches(actual, before[file]) : actual === null) continue;
        if (after === undefined) { conflicts.push(file); continue; }
        if (after ? !matches(actual, after) : actual !== null) { conflicts.push(file); continue; }
        const old = before[file];
        if (old) replace(base, file, Buffer.from(old.content, 'base64'), old.mode, actual === null); else if (actual) fs.unlinkSync(target(base, file));
      } catch { conflicts.push(file); }
    }
    let recovered;
    if (!conflicts.length) {
      try { recovered = finish(base, group, Object.fromEntries(all.filter(file => before[file]).map(file => [file, inspect(base, file, true)])), sha256, operation).receipt; }
      catch (failure) { conflicts.push(`ownership record: ${failure.message}`); }
    }
    throw new Error(`Preview publish failed: ${error.message}. Backup: ${operation}. Recovery conflicts: ${conflicts.join(', ') || 'none'}.${recovered ? ` Recovered ownership: ${recovered}.` : ' Preserve this group; use a fresh group/path after review.'}`);
  }
});

export const cleanupPreview = (project, receiptFile) => locked(project, base => {
  const receipt = readReceipt(base, receiptFile), before = {}, missing = [], conflicts = [];
  for (const [file, record] of Object.entries(receipt.files)) {
    try { const actual = inspect(base, file, true); if (!actual) missing.push(file); else if (matches(actual, record)) before[file] = actual; else conflicts.push(file); }
    catch { conflicts.push(file); }
  }
  const operation = `${groupPath(receipt.group)}/${randomUUID()}.cleanup.json`;
  persist(base, operation, { schemaVersion: 1, project: base, at: new Date().toISOString(), action: 'cleanup', receipt: receiptFile, before, missing, conflicts });
  const removed = [], errors = [];
  for (const [file, record] of Object.entries(before)) {
    try { if (!matches(inspect(base, file), record)) { conflicts.push(file); continue; } fs.unlinkSync(target(base, file)); removed.push(file); }
    catch (error) { errors.push({ file, error: error.message }); }
  }
  const result = { project: base, receipt: receiptFile, operation, removed, missing, conflicts, errors };
  persist(base, `${operation}.result.json`, result);
  return result;
});

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  const [command, project = '.', group, pathsFile] = process.argv.slice(2);
  try {
    let result;
    if (command === 'prepare') result = preparePreview(project, group, JSON.parse(fs.readFileSync(pathsFile, 'utf8')));
    else if (command === 'seal') result = sealPreview(project, group);
    else if (command === 'publish') {
      const base = fs.realpathSync(project), relative = path.relative(base, path.resolve(pathsFile)).split(path.sep).join('/');
      need(relative.startsWith('.variant-work/'), 'Stage preview updates inside project/.variant-work');
      const stage = localFile(base, relative), files = {};
      const walk = (directory, prefix = '') => { for (const entry of fs.readdirSync(directory, { withFileTypes: true })) { const name = prefix ? `${prefix}/${entry.name}` : entry.name, file = localFile(stage, name); if (entry.isDirectory()) walk(file, name); else { need(entry.isFile() && fs.statSync(file).nlink === 1, 'Stage only regular preview files'); files[name] = fs.readFileSync(file); } } };
      walk(stage); result = publishPreview(project, group, files);
    }
    else if (command === 'cleanup') result = cleanupPreview(project, group);
    else throw new Error('Usage: preview-files.mjs prepare <project> <new-group> <paths.json> | seal <project> <group> | publish <project> <group> <staging-dir> | cleanup <project> <receipt-relative-path>');
    console.log(json(result));
    if (result.conflicts?.length || result.errors?.length) process.exitCode = 2;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
