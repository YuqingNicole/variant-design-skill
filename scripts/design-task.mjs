import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { inspectProfile } from './project-profile.mjs';
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const text = value => typeof value === 'string' && value.trim().length > 0;
const requireValue = (condition, message) => { if (!condition) throw new Error(message); };
function validateBrief(brief, profile) {
  requireValue(brief && ['goal','audience','route','coreTask'].every(key => text(brief[key])), 'Task goal, audience, route and coreTask are required');
  for (const key of ['allowedFiles','preserve','acceptance','unknowns','brandConstraints']) requireValue(Array.isArray(brief[key]), `${key} must be an array`);
  requireValue(brief.allowedFiles.length > 0 && brief.allowedFiles.every(file => Object.hasOwn(profile.dependencyScope.files,file)), 'Allowed files must be inspected files');
  for (const key of ['preserve','acceptance']) requireValue(brief[key].length > 0 && brief[key].every(text), `${key} must have explicit criteria`);
  requireValue(brief.brandConstraints.every(item => text(item.rule) && text(item.evidence)), 'Brand rules require evidence or explicit user instruction');
  requireValue(brief.unknowns.every(item => text(item.reason) && typeof item.blocking === 'boolean'), 'Unknowns require reasons and blocking flags');
  requireValue(Array.isArray(brief.discoveryReview) && brief.discoveryReview.length === profile.unknowns.length, 'Review every discovery unknown');
  if (brief.designReferences !== undefined) {
    requireValue(Array.isArray(brief.designReferences), 'designReferences must be an array');
    const ids = new Set();
    for (const ref of brief.designReferences) {
      requireValue(ref && ['id','title','borrow','rationale','constraints'].every(key => text(ref[key])), 'Design references require identity, borrowing intent, rationale and constraints');
      requireValue(!ids.has(ref.id), 'Duplicate design reference id'); ids.add(ref.id);
      let url;
      try { url = new URL(ref.url); } catch { throw new Error('Reference requires a valid source URL'); }
      requireValue(['https:','http:'].includes(url.protocol) && !url.username && !url.password, 'Reference URL must be HTTP(S) without credentials');
      requireValue(['inspiration','code','asset'].includes(ref.usage), 'Reference usage must distinguish inspiration from reuse');
      requireValue(Array.isArray(ref.directions) && ref.directions.length > 0 && new Set(ref.directions).size === ref.directions.length && ref.directions.every(id => ['A','B','C'].includes(id)), 'Reference must name target directions');
      requireValue(ref.review && ['unverified','verified'].includes(ref.review.status), 'Reference needs an explicit review state');
      if (ref.review.status === 'verified') requireValue(text(ref.review.evidence) && text(ref.review.checkedAt) && Number.isFinite(Date.parse(ref.review.checkedAt)), 'Verified references require dated evidence');
      if (ref.usage !== 'inspiration') requireValue(ref.license && ['unknown','permitted','restricted'].includes(ref.license.status) && text(ref.license.evidence), 'Code and assets require an explicit license assessment');
    }
  }
  profile.unknowns.forEach((item,index) => {
    const review = brief.discoveryReview[index];
    requireValue(review?.index === index && text(review.reason) && ['resolved','unresolved'].includes(review.status) && typeof review.blocking === 'boolean', 'Discovery review requires status, reason and blocking flag');
    if (review.status === 'resolved') requireValue(text(review.evidence), 'Resolved unknown requires evidence');
    requireValue(!(item.code === 'runtime-unobserved' && review.status === 'resolved'), 'Runtime evidence belongs in observations');
  });
}
export function createTask(profile, brief) {
  requireValue(inspectProfile(profile).status === 'current-within-declared-scope', 'Project profile is stale');
  validateBrief(brief,profile);
  return {schemaVersion:1,id:randomUUID(),version:1,createdAt:new Date().toISOString(),profileDigest:digest(profile),brief:structuredClone(brief),readiness:brief.unknowns.some(x=>x.blocking) || brief.discoveryReview.some(x=>x.status==='unresolved' && x.blocking) ? 'blocked' : 'ready-for-candidate-work',limitations:['Readiness reflects the reviewed brief, not runtime verification or write authorization.']};
}
export function inspectTask(task, profile) {
  requireValue(task?.schemaVersion === 1 && text(task.id) && task.version === 1,'Unsupported task schema');
  validateBrief(task.brief,profile);
  const result = inspectProfile(profile);
  return {status:task.profileDigest !== digest(profile) || result.status === 'stale' ? 'stale' : 'current-within-declared-scope', profile:result, runtime:'unverified'};
}
function conditionsValid(c) {
  return c && ['url','browser','language','theme','dataState','interactionState'].every(k=>text(c[k])) && Number.isInteger(c.viewport?.width) && c.viewport.width > 0 && Number.isInteger(c.viewport?.height) && c.viewport.height > 0 && ['reduce','no-preference'].includes(c.reducedMotion);
}
// Adapter executes real observations; this helper does not simulate browser evidence.
export async function observeTask(task, profile, observe) {
  requireValue(inspectTask(task,profile).status === 'current-within-declared-scope','Task/profile is stale');
  const report = {schemaVersion:1,id:randomUUID(),taskId:task.id,taskDigest:digest(task),profileDigest:digest(profile),startedAt:new Date().toISOString(),status:'unverified',checks:[],conditions:null,reason:'No runtime adapter provided'};
  if (observe) {
    try {
      const result = await observe();
      requireValue(conditionsValid(result?.conditions),'Incomplete observation conditions');
      requireValue(Array.isArray(result.checks) && result.checks.length > 0,'No observed checks');
      const ids = new Set();
      for (const check of result.checks) {
        requireValue(text(check.id) && !ids.has(check.id) && ['passed','failed','unverified'].includes(check.status) && text(check.reason),'Invalid or duplicate observed check');
        ids.add(check.id);
        if (check.status !== 'unverified') requireValue(text(check.tool) && text(check.toolVersion) && text(check.evidence),'Observed results require tool/version/evidence');
      }
      report.conditions = structuredClone(result.conditions);
      report.checks = structuredClone(result.checks);
      report.status = result.checks.some(x=>x.status==='failed') ? 'failed' : result.checks.some(x=>x.status==='unverified') ? 'unverified' : 'passed-within-observed-scope';
      report.reason = 'Trusted adapter observations only; unlisted behavior is not verified';
    } catch { report.reason = 'Runtime adapter failed or returned invalid evidence'; }
  }
  report.completedAt = new Date().toISOString();
  try {
    if (inspectTask(task,profile).status === 'stale' || report.taskDigest !== digest(task) || report.profileDigest !== digest(profile)) report.status = 'stale';
  } catch { report.status = 'stale'; }
  return report;
}
export function inspectObservation(report,task,profile) {
  requireValue(report?.schemaVersion===1 && text(report.id) && ['stale','failed','unverified','passed-within-observed-scope'].includes(report.status),'Unsupported observation');
  const stale = report.taskId!==task.id || report.taskDigest!==digest(task) || report.profileDigest!==digest(profile) || inspectTask(task,profile).status==='stale';
  return {status:stale?'stale':report.status, runtimeFreshness:'not-established',reason:'Source binding does not establish current browser, data or environment state'};
}
if (process.argv[1] && import.meta.url===pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  try {
    const [command,profilePath,inputPath] = process.argv.slice(2);
    const profile=JSON.parse(fs.readFileSync(profilePath,'utf8'));
    const input=JSON.parse(fs.readFileSync(inputPath,'utf8'));
    const result=command==='create'?createTask(profile,input):command==='status'?inspectTask(input,profile):(()=>{throw new Error('Use create <profile> <brief> or status <profile> <task>');})();
    console.log(JSON.stringify(result,null,2));
    if(result.status==='stale' || result.readiness==='blocked') process.exitCode=2;
  } catch {console.error('Task operation failed: check schema, evidence, inspected scope and profile freshness.');process.exitCode=1;}
}
