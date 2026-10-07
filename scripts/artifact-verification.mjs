#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { readContext, localFile } from './variant-history.mjs';
import { scanSource } from './quality-gate.mjs';

const runtimeChecks = ['brand', 'keyboard-focus', 'reduced-motion', 'scope-preservation', 'project-checks'];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function sorted(value) {
  if (Array.isArray(value)) return value.map(sorted);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, sorted(value[key])]));
  return value;
}
const identity = value => hash(JSON.stringify(sorted(value)));
function capture(root, id, project, dependencies) {
  const state = readContext(root), variant = state.variants?.[id];
  if (!['A','B','C'].includes(id) || !variant?.files?.length || !variant.files.includes(variant.entry)) throw new Error('Invalid registered variant.');
  const output = fs.realpathSync(root), projectPath = fs.realpathSync(project);
  if (!output.startsWith(projectPath + path.sep)) throw new Error('Project must contain output.');
  const sources = Object.fromEntries(variant.files.map(file => [file, fs.readFileSync(localFile(root,file))]));
  const shared = [...new Set([...dependencies, ...(state.designSystem?.file ? [state.designSystem.file] : []), ...['package.json','package-lock.json','pnpm-lock.yaml','yarn.lock'].filter(file=>fs.existsSync(localFile(projectPath,file)))])].sort();
  const fingerprint = { output, project:projectPath, id, version:variant.version,
    entry:variant.entry, tokens:variant.tokens, comparison:variant.comparison,
    taskContract:state.taskContract, designSystem:state.designSystem,
    files:Object.fromEntries(Object.entries(sources).map(([file,bytes])=>[file,hash(bytes)])),
    dependencies:Object.fromEntries(shared.map(file=>[file,hash(fs.readFileSync(localFile(projectPath,file)))])) };
  return {fingerprint, sources};
}
function validateCheck(check) {
  if (!check || !runtimeChecks.includes(check.id) || !['passed','failed','unverified','not-applicable'].includes(check.status) || typeof check.reason !== 'string' || !check.reason.trim()) throw new Error('Each runtime check needs a known id, status and reason.');
  if (['passed','failed'].includes(check.status) && (!check.tool?.name || !check.tool?.version || !check.evidence?.length || !check.environment || typeof check.environment !== 'object')) throw new Error('Observed checks require tool/version, environment and evidence.');
  return check;
}
// Capture before running checks: never attach old observations to a freshly read revision.
export async function verifyArtifact(root, id, options = {}, runChecks) {
  const project = options.projectRoot ?? path.dirname(path.resolve(root));
  const dependencies = options.dependencies ?? [];
  if (!Array.isArray(dependencies) || dependencies.some(file=>typeof file !== 'string')) throw new Error('Dependencies must be relative project paths.');
  const startedAt = new Date().toISOString();
  const {fingerprint,sources} = capture(root,id,project,dependencies);
  const findings = Object.entries(sources).flatMap(([file,bytes]) => /\.(html|css|scss|js|jsx|ts|tsx|vue|svelte|astro)$/.test(file) ? scanSource(bytes.toString(),file) : []);
  let observed = [];
  try { observed = runChecks ? await runChecks() : []; }
  catch (error) { observed = runtimeChecks.map(id=>({id,status:'unverified',reason:`Runner failed: ${error.message}`})); }
  if (!Array.isArray(observed) || new Set(observed.map(check=>check.id)).size !== observed.length) throw new Error('Runtime checks must be a unique array.');
  observed.forEach(validateCheck);
  const checks = runtimeChecks.map(id=>observed.find(check=>check.id===id) ?? {id,status:'unverified',reason:'No observation supplied; this check has not run.'});
  let unchanged=false;
  try { unchanged=identity(capture(root,id,project,dependencies).fingerprint)===identity(fingerprint); } catch {}
  const report = {schemaVersion:1,id:randomUUID(),startedAt,finishedAt:new Date().toISOString(),
    fingerprint, dependencies, coverage:{mode:'declared-files',limitation:'Only owned files, registered design system, package manifests and explicitly listed dependencies are tracked. Environment changes require a new run.'},
    static:{status:findings.some(f=>f.severity==='error')?'failed':findings.length?'unverified':'passed',tool:{name:'variant-quality-gate',version:hash(fs.readFileSync(new URL('./quality-gate.mjs',import.meta.url)))},findings},
    checks, changedDuringRun:!unchanged};
  const file=localFile(root,`.verification/${id}/${report.id}.json`);
  fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n',{flag:'wx',flush:true});
  return {file,...inspectVerification(root,file)};
}
export function inspectVerification(root, file) {
  const relative=path.relative(fs.realpathSync(root),path.resolve(file));
  if (!relative.startsWith('.verification'+path.sep)) throw new Error('Report must be inside output/.verification.');
  const report=JSON.parse(fs.readFileSync(localFile(root,relative),'utf8'));
  if (report.schemaVersion!==1 || !report.fingerprint || !Array.isArray(report.dependencies) || !Array.isArray(report.checks) || report.checks.length!==runtimeChecks.length || new Set(report.checks.map(c=>c.id)).size!==runtimeChecks.length) throw new Error('Invalid verification report.');
  report.checks.forEach(validateCheck);
  let current=false,reason='Files, dependencies, constraints or revision changed.';
  try {current=identity(capture(root,report.fingerprint.id,report.fingerprint.project,report.dependencies).fingerprint)===identity(report.fingerprint);}catch(error){reason=error.message;}
  if(report.changedDuringRun)current=false;
  if(report.static?.tool?.version!==hash(fs.readFileSync(new URL('./quality-gate.mjs',import.meta.url)))){current=false;reason='Static checker implementation changed; run verification again.';}
  const status=!current?'stale':report.static.status==='failed'||report.checks.some(c=>c.status==='failed')?'failed':report.static.status!=='passed'||report.checks.some(c=>c.status==='unverified')?'unverified':'passed';
  return {status,reason:current?'Result applies only to the recorded checks and environment.':reason,report};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(fs.realpathSync(process.argv[1])).href){
  const [action,root,idOrFile,config]=process.argv.slice(2);
  try{
    const result=action==='run'?await verifyArtifact(root,idOrFile,config?JSON.parse(fs.readFileSync(config,'utf8')):{}):action==='status'?inspectVerification(root,idOrFile):null;
    if(!result)throw new Error('Usage: artifact-verification.mjs run <output> A|B|C [config.json] | status <output> <report-file>');
    console.log(JSON.stringify(result,null,2));process.exitCode=result.status==='passed'?0:2;
  }catch(error){console.error(error.message);process.exitCode=1;}
}
