#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { readContext, localFile } from './variant-history.mjs';
import { scanSource } from './quality-gate.mjs';
import { collectProjectDependencies } from './project-dependencies.mjs';

const runtimeChecks = ['brand', 'keyboard-focus', 'reduced-motion', 'scope-preservation', 'project-checks'];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function sorted(value) {
  if (Array.isArray(value)) return value.map(sorted);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, sorted(value[key])]));
  return value;
}
const identity = value => hash(JSON.stringify(sorted(value)));
const checkerIdentity = () => Object.fromEntries(['artifact-verification.mjs','browser-verification.mjs','verification-plan.mjs','project-dependencies.mjs','dependency-references.mjs'].map(file=>[file,hash(fs.readFileSync(new URL(file,import.meta.url)))]));
function capture(root, id, project, dependencies, inputs = []) {
  const state = readContext(root), variant = state.variants?.[id];
  if (!['A','B','C'].includes(id) || !variant?.files?.length || !variant.files.includes(variant.entry)) throw new Error('Invalid registered variant.');
  const output = fs.realpathSync(root), projectPath = fs.realpathSync(project);
  if (!output.startsWith(projectPath + path.sep)) throw new Error('Project must contain output.');
  const sources = Object.fromEntries(variant.files.map(file => [file, fs.readFileSync(localFile(root,file))]));
  const extensions=state.designSystem?.extensions;
  if (extensions!==undefined && (!Array.isArray(extensions) || extensions.some(file=>typeof file!=='string' || !file.trim()))) throw new Error('System extensions must be relative file paths.');
  const systemFiles=[...(state.designSystem?.file ? [state.designSystem.file] : []), ...(extensions??[])];
  const shared = [...new Set([...dependencies, ...systemFiles, ...['package.json','package-lock.json','pnpm-lock.yaml','yarn.lock'].filter(file=>fs.existsSync(localFile(projectPath,file)))])].sort();
  const prefix = path.relative(projectPath, output).split(path.sep).join('/');
  const dependencyClosure = collectProjectDependencies(projectPath, [...new Set([...variant.files.map(file => `${prefix}/${file}`), ...shared])]);
  const fingerprint = { output, project:projectPath, id, version:variant.version,
    entry:variant.entry, tokens:variant.tokens, comparison:variant.comparison,
    taskContract:state.taskContract, designSystem:state.designSystem,
    ...(variant.systemBinding ? {systemBinding:variant.systemBinding} : {}),
    files:Object.fromEntries(Object.entries(sources).map(([file,bytes])=>[file,hash(bytes)])),
    dependencies:Object.fromEntries([...new Set([...shared, ...Object.keys(dependencyClosure.files)])].sort().map(file=>[file,hash(fs.readFileSync(localFile(projectPath,file)))])), dependencyClosure };
  if (inputs.length) {
    if (inputs.length > 128) throw new Error('At most 128 observation input files.');
    let total = 0;
    fingerprint.inputs = Object.fromEntries([...new Set(inputs)].sort().map(file => {
      const full = localFile(projectPath, file), stat = fs.lstatSync(full);
      if (!stat.isFile() || stat.nlink !== 1 || stat.size > 16 * 1024 * 1024 || (total += stat.size) > 64 * 1024 * 1024 || file.split('/').some(part => part === '.git' || part === 'node_modules' || /^\.env(?:\.|$)/.test(part))) throw new Error('Observation inputs must be bounded regular project files, excluding private environment and tool directories.');
      return [file, hash(fs.readFileSync(full))];
    }));
  }
  return {fingerprint, sources};
}
export function fingerprintArtifact(root, id, options = {}) {
  const dependencies = options.dependencies ?? [];
  if (!Array.isArray(dependencies) || dependencies.some(file => typeof file !== 'string')) throw new Error('Dependencies must be relative project paths.');
  const inputs = options.inputs ?? [];
  if (!Array.isArray(inputs) || inputs.some(file => typeof file !== 'string')) throw new Error('Inputs must be relative project paths.');
  return capture(root, id, options.projectRoot ?? path.dirname(path.resolve(root)), dependencies, inputs).fingerprint;
}
function validateCheck(check) {
  if (!check || !runtimeChecks.includes(check.id) || !['passed','failed','unverified','not-applicable'].includes(check.status) || typeof check.reason !== 'string' || !check.reason.trim()) throw new Error('Each runtime check needs a known id, status and reason.');
  if (['passed','failed'].includes(check.status) && (!check.tool?.name || !check.tool?.version || !check.evidence?.length || !check.environment || typeof check.environment !== 'object')) throw new Error('Observed checks require tool/version, environment and evidence.');
  if (check.diagnostics !== undefined) {
    const validText = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
    if (check.status !== 'failed' || !Array.isArray(check.diagnostics) || !check.diagnostics.length || check.diagnostics.length > 256 || new Set(check.diagnostics.map(d => d?.id)).size !== check.diagnostics.length) throw new Error('Failed diagnostics need 1–256 unique ids.');
    for (const d of check.diagnostics) {
      if (!d || typeof d !== 'object' || Array.isArray(d) || Object.keys(d).some(key => !['id','message','file','line','column'].includes(key)) || !validText(d.id,256) || !validText(d.message,4096)) throw new Error('Diagnostic needs a bounded id and actual message.');
      if (d.file !== undefined && (!validText(d.file,1024) || path.isAbsolute(d.file) || d.file.includes('\\') || d.file.split('/').some(part => !part || part === '.' || part === '..'))) throw new Error('Diagnostic file must be project-relative.');
      for (const key of ['line','column']) if (d[key] !== undefined && (!Number.isSafeInteger(d[key]) || d[key] < 1)) throw new Error('Diagnostic positions must be positive integers.');
    }
  }
  return check;
}
// Capture before running checks: never attach old observations to a freshly read revision.
export async function verifyArtifact(root, id, options = {}, runChecks) {
  const project = options.projectRoot ?? path.dirname(path.resolve(root));
  const dependencies = options.dependencies ?? [];
  if (!Array.isArray(dependencies) || dependencies.some(file=>typeof file !== 'string')) throw new Error('Dependencies must be relative project paths.');
  const inputs = options.inputs ?? [];
  if (!Array.isArray(inputs) || inputs.some(file=>typeof file !== 'string')) throw new Error('Inputs must be relative project paths.');
  const startedAt = new Date().toISOString();
  const {fingerprint,sources} = capture(root,id,project,dependencies,inputs);
  const findings = Object.entries(sources).flatMap(([file,bytes]) => /\.(html|css|scss|js|jsx|ts|tsx|vue|svelte|astro)$/.test(file) ? scanSource(bytes.toString(),file) : []);
  let observed = [];
  try { observed = runChecks ? await runChecks() : []; }
  catch (error) { observed = runtimeChecks.map(id=>({id,status:'unverified',reason:`Runner failed: ${error.message}`})); }
  if (!Array.isArray(observed) || new Set(observed.map(check=>check.id)).size !== observed.length) throw new Error('Runtime checks must be a unique array.');
  observed.forEach(validateCheck);
  const checks = runtimeChecks.map(id=>observed.find(check=>check.id===id) ?? {id,status:'unverified',reason:'No observation supplied; this check has not run.'});
  let unchanged=false;
  try { unchanged=identity(capture(root,id,project,dependencies,inputs).fingerprint)===identity(fingerprint); } catch {}
  const report = {schemaVersion:1,id:randomUUID(),startedAt,finishedAt:new Date().toISOString(),
    fingerprint, dependencies, ...(inputs.length ? {inputs} : {}), coverage:{mode:'static-closure-and-declared-files',...fingerprint.dependencyClosure.coverage},
    static:{status:findings.some(f=>f.severity==='error')?'failed':findings.some(f=>f.severity==='warning')?'unverified':'passed',tool:{name:'variant-quality-gate',version:hash(fs.readFileSync(new URL('./quality-gate.mjs',import.meta.url)))},findings},
    checks, checkerIdentity:checkerIdentity(), plan:options.plan ?? null, changedDuringRun:!unchanged};
  const file=localFile(root,`.verification/${id}/${report.id}.json`);
  fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n',{flag:'wx',flush:true});
  return {file,...inspectVerification(root,file)};
}
export function inspectVerification(root, file) {
  const relative=path.relative(fs.realpathSync(root),path.resolve(file));
  if (!relative.startsWith('.verification'+path.sep)) throw new Error('Report must be inside output/.verification.');
  const report=JSON.parse(fs.readFileSync(localFile(root,relative),'utf8'));
  if (report.schemaVersion!==1 || !report.fingerprint || !Array.isArray(report.dependencies) || !Array.isArray(report.checks) || report.checks.length!==runtimeChecks.length || new Set(report.checks.map(c=>c.id)).size!==runtimeChecks.length) throw new Error('Invalid verification report.');
  if (report.inputs !== undefined && (!Array.isArray(report.inputs) || report.inputs.some(file => typeof file !== 'string'))) throw new Error('Invalid observation input list.');
  report.checks.forEach(validateCheck);
  let current=false,reason='Files, dependencies, constraints or revision changed.';
  try {current=identity(capture(root,report.fingerprint.id,report.fingerprint.project,report.dependencies,report.inputs ?? []).fingerprint)===identity(report.fingerprint);}catch(error){reason=error.message;}
  if(report.changedDuringRun)current=false;
  if(report.static?.tool?.version!==hash(fs.readFileSync(new URL('./quality-gate.mjs',import.meta.url)))){current=false;reason='Static checker implementation changed; run verification again.';}
  if(report.checkerIdentity && identity(report.checkerIdentity)!==identity(checkerIdentity())){current=false;reason='Verification implementation changed; run verification again.';}
  const partial = report.fingerprint.dependencyClosure?.coverage.status !== 'within-supported-static-syntax';
  const status=!current?'stale':report.static.status==='failed'||report.checks.some(c=>c.status==='failed')?'failed':partial||report.static.status!=='passed'||report.checks.some(c=>c.status==='unverified')?'unverified':'passed';
  return {status,reason:current ? partial ? 'Recorded observations retained; dependency coverage has unresolved items. Review coverage and rerun after resolving them.' : 'Result applies only to the recorded checks, dependency scope and environment.' : reason,report};
}

// Compare actual observations, never re-label an earlier failure as a passing result.
// Changed diagnostics remain new-or-changed; a failed check alone is not proof of the same bug.
export function compareVerificationReports(before, after) {
  if (before.fingerprint.project!==after.fingerprint.project || before.fingerprint.output!==after.fingerprint.output || before.fingerprint.id!==after.fingerprint.id) throw new Error('Compare reports for the same project and variant.');
  const failures=report=>[
    ...report.static.findings.filter(f=>f.severity==='error').map(f=>({kind:'static',finding:f,tool:report.static.tool})),
    ...report.checks.filter(c=>c.status==='failed').flatMap(c=>c.diagnostics ? c.diagnostics.map(diagnostic=>({kind:'runtime',id:c.id,reason:c.reason,evidence:c.evidence,tool:c.tool,environment:c.environment,diagnostic})) : [{kind:'runtime',id:c.id,reason:c.reason,evidence:c.evidence,tool:c.tool,environment:c.environment}])
  ];
  before.checks.forEach(validateCheck); after.checks.forEach(validateCheck);
  const key = f => f.diagnostic ? {kind:f.kind,id:f.id,diagnostic:f.diagnostic,tool:f.tool,environment:f.environment} : f;
  const prior=failures(before),current=failures(after);
  return {before:before.id,after:after.id,failures:current.map(f=>({...f,classification:prior.some(p=>identity(key(p))===identity(key(f)))?'observed-before':'new-or-changed'})),
    limitation:'Identical recorded diagnostics only; not proof of cause, unchanged environment or complete regression coverage.'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(fs.realpathSync(process.argv[1])).href){
  const [action,root,idOrFile,config]=process.argv.slice(2);
  try{
    const result=action==='run'?await verifyArtifact(root,idOrFile,config?JSON.parse(fs.readFileSync(config,'utf8')):{}):action==='status'?inspectVerification(root,idOrFile):null;
    if(!result)throw new Error('Usage: artifact-verification.mjs run <output> A|B|C [config.json] | status <output> <report-file>');
    console.log(JSON.stringify(result,null,2));process.exitCode=result.status==='passed'?0:2;
  }catch(error){console.error(error.message);process.exitCode=1;}
}
