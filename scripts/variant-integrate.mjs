#!/usr/bin/env node
// Integrate one variant into the target project with a recorded backup, and roll it back
// without discarding edits made after integration. Integration never selects a winner.
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { localFile, readContext, withHistoryLock } from './variant-history.mjs';
import { collectProjectDependencies } from './project-dependencies.mjs';

const digest = content => createHash('sha256').update(content).digest('hex');
const blocked = ['.git', 'node_modules', '.variant-work'];

function atomic(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.' + randomUUID() + '.tmp';
  try { fs.writeFileSync(tmp, content); fs.renameSync(tmp, file); }
  finally { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); }
}
function staged(dir, prefix = '') {
  return fs.readdirSync(path.join(dir, prefix), { withFileTypes: true }).flatMap(entry => {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Symlink not allowed in staging: ${relative}`);
    return entry.isDirectory() ? staged(dir, relative) : [relative];
  });
}
function roots(output, project) {
  const out = fs.realpathSync(output), base = fs.realpathSync(project);
  if (!out.startsWith(base + path.sep)) throw new Error('Project root must contain variant output.');
  return { out, base, outRelative: path.relative(base, out).split(path.sep).join('/') };
}
function recordFile(output, id) {
  if (!/^[\w-]+$/.test(id)) throw new Error('Invalid integration id.');
  return localFile(output, `.integrations/${id}.json`);
}
function sourceIdentity(output, variant, project) {
  const state=readContext(output),source=state.variants?.[variant];
  if (!['A','B','C'].includes(variant) || !source?.files?.length) throw new Error('Register variant A/B/C first.');
  const extensions=state.designSystem?.extensions;
  if (extensions!==undefined && (!Array.isArray(extensions) || extensions.some(file=>typeof file!=='string' || !file.trim()))) throw new Error('System extensions must be relative file paths.');
  const prefix = path.relative(project, output).split(path.sep).join('/');
  const dependencyClosure = collectProjectDependencies(project, [...new Set([...source.files.map(file => `${prefix}/${file}`), ...(state.designSystem?.file ? [state.designSystem.file] : []), ...(extensions ?? [])])]);
  return {version:source.version,entry:source.entry,tokens:source.tokens,comparison:source.comparison,
    ...(source.systemBinding!==undefined ? {systemBinding:source.systemBinding} : {}),
    taskContract:state.taskContract,designSystem:state.designSystem,
    designSystemHash:state.designSystem?.file?digest(fs.readFileSync(localFile(project,state.designSystem.file))):null,
    ...(extensions!==undefined ? {designSystemExtensionHashes:Object.fromEntries(extensions.map(file=>[file,digest(fs.readFileSync(localFile(project,file)))]))} : {}),
    files:Object.fromEntries([...source.files].sort().map(file=>[file,digest(fs.readFileSync(localFile(output,file)))])), dependencyClosure};
}
function targetPath(base,outRelative,file) {
  if (file===outRelative || file.startsWith(outRelative+'/') || blocked.some(dir=>file===dir || file.startsWith(dir+'/'))) throw new Error(`Refusing to integrate into protected path: ${file}`);
  return localFile(base,file);
}
function targetHash(file) { return fs.existsSync(file)?digest(fs.readFileSync(file)):null; }
function persistNew(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const text = JSON.stringify(value, null, 2) + '\n', tmp = file + '.' + randomUUID() + '.tmp';
  try {
    fs.writeFileSync(tmp, text, { flag: 'wx', flush: true });
    // Publish complete bytes without replacing an existing recovery record.
    fs.linkSync(tmp, file);
  } finally { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); }
  if (fs.readFileSync(file, 'utf8') !== text) throw new Error('Recovery record verification failed.');
}
function recoveryFile(output, id) { return localFile(output, `.integrations/recovery/${id}.json`); }
function readBackup(output, id, project) {
  const { out, base, outRelative } = roots(output, project), file = recordFile(out, id);
  const bytes = fs.readFileSync(file), record = JSON.parse(bytes);
  const validDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
  if (record.schemaVersion !== 1 || record.id !== id || record.project !== base || !['A','B','C'].includes(record.variant) ||
      !Array.isArray(record.files) || !record.files.length || new Set(record.files.map(e => e.path)).size !== record.files.length ||
      !(record.rolledBackAt === null || validDate(record.rolledBackAt)) ||
      (Object.hasOwn(record, 'appliedAt') && !(record.appliedAt === null || validDate(record.appliedAt)))) throw new Error('Invalid integration backup.');
  for (const entry of record.files) {
    targetPath(base, outRelative, entry.path);
    if (!/^[a-f0-9]{64}$/.test(entry.after?.sha256) || !['create','overwrite','unchanged'].includes(entry.action) ||
        (entry.action === 'create' ? entry.before !== null : !entry.before || typeof entry.before.content !== 'string' ||
          digest(Buffer.from(entry.before.content, 'base64')) !== entry.before.sha256 ||
          (entry.action === 'unchanged') !== (entry.before.sha256 === entry.after.sha256))) throw new Error(`Invalid backup bytes or action: ${entry.path}`);
  }
  return { out, base, file, record, backupHash: digest(bytes) };
}
function recoveryIntent(backup, create) {
  const { out, record, backupHash } = backup, file = recoveryFile(out, record.id);
  if (!fs.existsSync(file)) {
    if (!create) return false;
    persistNew(file, { schemaVersion: 1, integrationId: record.id, backupHash, at: new Date().toISOString() });
  }
  const intent = JSON.parse(fs.readFileSync(file));
  if (intent.schemaVersion !== 1 || intent.integrationId !== record.id || intent.backupHash !== backupHash) throw new Error('Recovery intent differs from integration backup; nothing was restored.');
  return true;
}
function restoreBackup(backup) {
  const { base, file, record } = backup, changed = record.files.filter(e => e.action !== 'unchanged');
  const known = entry => { const hash = targetHash(localFile(base, entry.path)); return hash === (entry.before?.sha256 ?? null) || hash === entry.after.sha256; };
  const drift = changed.filter(entry => !known(entry)).map(entry => entry.path);
  if (drift.length) throw new Error(`Recovery conflict; nothing was restored: ${drift.join(', ')}`);
  recoveryIntent(backup, true);
  for (const entry of changed) {
    // Recheck before each replacement; the directory lock does not lock external editors.
    if (!known(entry)) throw new Error(`Recovery interrupted by later edit: ${entry.path}. Backup retained; retry recover after reconciling.`);
    const target = localFile(base, entry.path);
    if (targetHash(target) === (entry.before?.sha256 ?? null)) continue;
    if (entry.before) atomic(target, Buffer.from(entry.before.content, 'base64')); else fs.rmSync(target);
  }
  record.rolledBackAt = new Date().toISOString();
  atomic(file, JSON.stringify(record, null, 2) + '\n');
  return record;
}
function planPath(base,file,project) {
  const relative=path.relative(path.resolve(project),path.resolve(file));
  if (!relative.startsWith('.variant-work'+path.sep)) throw new Error('Integration plan must be inside project/.variant-work.');
  return localFile(base,relative);
}

function prepareUnlocked(output,variant,targets,planFile,project=path.dirname(path.resolve(output))) {
  const {out,base,outRelative}=roots(output,project);
  const source=sourceIdentity(out,variant,base);
  if (!Array.isArray(targets) || !targets.length || targets.some(file=>typeof file!=='string') || new Set(targets).size!==targets.length) throw new Error('List unique project-relative target files before preparing integration.');
  const plan={schemaVersion:1,output:out,project:base,variant,source,
    targets:Object.fromEntries([...targets].sort().map(file=>[file,targetHash(targetPath(base,outRelative,file))]))};
  const file=planPath(base,planFile,project);fs.mkdirSync(path.dirname(file),{recursive:true});
  const text=JSON.stringify(plan,null,2)+'\n';fs.writeFileSync(file,text,{flag:'wx',flush:true});
  if(fs.readFileSync(file,'utf8')!==text) throw new Error('Integration plan verification failed.');
  return plan;
}

function integrateUnlocked(output, variant, staging, project = path.dirname(path.resolve(output)), planFile) {
  const state = readContext(output);
  if (!state.variants?.[variant]) throw new Error('Register variant A/B/C first.');
  const { out, base, outRelative } = roots(output, project);
  const stage = fs.realpathSync(staging);
  if (stage === out || stage.startsWith(out + path.sep)) throw new Error('Staging must be outside variant output.');
  const files = staged(stage);
  if (!files.length) throw new Error('Staging directory is empty.');
  const entries = files.map(file => {
    const target = targetPath(base,outRelative,file), next = fs.readFileSync(path.join(stage, file));
    const exists = fs.existsSync(target), prior = exists ? fs.readFileSync(target) : null;
    if (exists && !fs.statSync(target).isFile()) throw new Error(`Target is not a file: ${file}`);
    const action = !exists ? 'create' : digest(prior) === digest(next) ? 'unchanged' : 'overwrite';
    return { path: file, action, before: prior && { sha256: digest(prior), content: prior.toString('base64') }, after: { sha256: digest(next) }, next };
  });
  if (!planFile) throw new Error('Prepare a new integration plan before generating staging files. Missing integration baseline.');
  const plan=JSON.parse(fs.readFileSync(planPath(base,planFile,project),'utf8'));
  if(plan.schemaVersion!==1 || plan.output!==out || plan.project!==base || plan.variant!==variant || !plan.targets || !plan.source) throw new Error('Invalid integration plan or different project/variant.');
  const check=()=>{
    const conflict=message=>{throw new Error(`Integration conflict: ${message}. Current files are unchanged; keep staging and prepare a new plan before reconciling.`);};
    if(JSON.stringify([...files].sort())!==JSON.stringify(Object.keys(plan.targets).sort())) conflict('target file set changed');
    for(const entry of entries) if(targetHash(localFile(base,entry.path))!==plan.targets[entry.path]) conflict(`target changed: ${entry.path}`);
    if(JSON.stringify(sourceIdentity(out,variant,base))!==JSON.stringify(plan.source)) conflict('source revision, contents or constraints changed (including shared dependencies)');
  };
  check();
  const id = `${new Date().toISOString().replace(/[:.]/g, '-')}-${variant}`;
  const record = { schemaVersion: 1, id, variant, version: state.variants[variant].version, at: new Date().toISOString(),
    selectedVariant: state.selectedVariant ?? null, source:plan.source, project:base,
    files: entries.map(({ next, ...entry }) => entry), appliedAt: null, rolledBackAt: null };
  // Persist the backup before touching any project file.
  const file = recordFile(output, id);
  persistNew(file, record);
  try {
    check();
    for (const entry of entries.filter(item => item.action !== 'unchanged')) {
      if (targetHash(localFile(base, entry.path)) !== (entry.before?.sha256 ?? null)) throw new Error(`Integration target changed during apply: ${entry.path}`);
      atomic(localFile(base, entry.path), entry.next);
    }
    record.appliedAt = new Date().toISOString();
    atomic(file, JSON.stringify(record, null, 2) + '\n');
  } catch (error) {
    try { restoreBackup(readBackup(out, id, base)); }
    catch (recovery) { throw new Error(`Integration interrupted: ${error.message}. Recovery failed: ${recovery.message}. Backup retained at ${file}. Recover: node ${fileURLToPath(import.meta.url)} recover ${out} ${id} ${base}`); }
    throw new Error(`Integration failed: ${error.message}. Original targets restored; backup retained at ${file}.`);
  }
  return record;
}

function rollbackUnlocked(output, id, project = path.dirname(path.resolve(output))) {
  const backup = readBackup(output, id, project), { base, record } = backup;
  if (record.rolledBackAt) throw new Error(`Integration ${id} was already rolled back.`);
  if (record.appliedAt === null || recoveryIntent(backup, false)) throw new Error(`Integration or rollback was interrupted; use recover ${output} ${id}.`);
  const changed = record.files.filter(entry => entry.action !== 'unchanged');
  // Refuse before writing anything if the user edited an integrated file afterwards.
  const drift = changed.filter(entry => {
    const target = localFile(base, entry.path);
    return !fs.existsSync(target) || digest(fs.readFileSync(target)) !== entry.after.sha256;
  }).map(entry => entry.path);
  if (drift.length) throw new Error(`Files changed after integration; nothing was rolled back: ${drift.join(', ')}`);
  return restoreBackup(backup);
}

function recoverUnlocked(output, id, project = path.dirname(path.resolve(output))) {
  const backup = readBackup(output, id, project), { record } = backup;
  if (record.rolledBackAt) throw new Error(`Integration ${id} was already rolled back.`);
  if (record.appliedAt !== null && !recoveryIntent(backup, false)) throw new Error('Completed integration requires rollback; recover cannot bypass later-edit protection.');
  return restoreBackup(backup);
}

export const prepareIntegration=(output,...args)=>withHistoryLock(output,()=>prepareUnlocked(output,...args));
export const integrateVariant=(output,...args)=>withHistoryLock(output,()=>integrateUnlocked(output,...args));
export const rollbackIntegration=(output,...args)=>withHistoryLock(output,()=>rollbackUnlocked(output,...args));
export const recoverIntegration=(output,...args)=>withHistoryLock(output,()=>recoverUnlocked(output,...args));

export function listIntegrations(output) {
  const dir = localFile(output, '.integrations');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(name => name.endsWith('.json')).sort().map(name => {
    const { id, variant, version, at, files, appliedAt, rolledBackAt } = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
    return { id, variant, version, at, files: files.map(entry => `${entry.action} ${entry.path}`), ...(appliedAt !== undefined ? { appliedAt } : {}), rolledBackAt };
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  const [command, output = 'variant-output', ...rest] = process.argv.slice(2);
  const self = path.relative(process.cwd(), fileURLToPath(import.meta.url));
  try {
    if (command === 'prepare') {
      const [variant,targetsFile,planFile,project]=rest;
      if(!targetsFile || !planFile) throw new Error('Provide a JSON array of target paths and a new plan path.');
      console.log(JSON.stringify(prepareIntegration(output,variant,JSON.parse(fs.readFileSync(targetsFile,'utf8')),planFile,project),null,2));
    } else if (command === 'apply') {
      const [variant, staging, planFile, project] = rest;
      if (!variant || !staging) throw new Error('Missing variant or staging directory.');
      const record = integrateVariant(output, variant, staging, project, planFile);
      console.log(`Integrated ${record.variant} revision ${record.version} as ${record.id}`);
      console.log(`Dependency coverage: ${record.source.dependencyClosure.coverage.status}; ${record.source.dependencyClosure.coverage.unknowns.length} unresolved item(s). Integration is not a runtime acceptance.`);
      for (const entry of record.files) console.log(`  ${entry.action.padEnd(9)} ${entry.path}`);
      console.log(`Roll back: node ${self} rollback ${output} ${record.id}${project ? ` ${project}` : ''}`);
    } else if (command === 'rollback' || command === 'recover') {
      const [id, project] = rest;
      if (!id) throw new Error('Missing integration id.');
      const record = command === 'recover' ? recoverIntegration(output, id, project) : rollbackIntegration(output, id, project);
      console.log(`Rolled back ${record.id}: ${record.files.filter(entry => entry.action !== 'unchanged').map(entry => entry.path).join(', ')}`);
    } else if (command === 'list') console.log(JSON.stringify(listIntegrations(output), null, 2));
    else throw new Error(`Usage: ${self} prepare <output> A|B|C <targets.json> <new-plan.json> [project-root] | apply <output> A|B|C <staging-dir> <plan.json> [project-root] | rollback|recover <output> <integration-id> [project-root] | list <output>`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
