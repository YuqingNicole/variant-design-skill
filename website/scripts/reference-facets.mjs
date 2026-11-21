// Facet report: how many references carry each facet value, and which values could back a collection page.
// node scripts/reference-facets.mjs [--minimum 6] [--drafts]   (--drafts counts draft values too, to plan the review)
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {importTs} from './ts-module.mjs';
import {referenceRecords} from './reference-records.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
export const facetsModule=await importTs(path.join(here,'../src/reference-facets.ts'));
export const facetsFile=path.join(here,'../src/reference-facets.json');
export const readFacets=(file=facetsFile)=>JSON.parse(fs.readFileSync(file,'utf8'));
// Every problem in the facet file against the published references: unknown values, missing or orphaned records.
export function facetFileProblems(all=readFacets(),ids=referenceRecords().published.map(r=>r.id)){
  const known=new Set(ids),out=Object.entries(all).flatMap(([id,f])=>facetsModule.facetProblems(id,f));
  for(const id of ids)if(!all[id])out.push(`${id}: no facets`);
  for(const id of Object.keys(all))if(!known.has(id))out.push(`${id}: facets for a reference that is not published`);
  return out;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
  const arg=process.argv.slice(2),minimum=Number(arg[arg.indexOf('--minimum')+1])||6,drafts=arg.includes('--drafts'),all=readFacets();
  const problems=facetFileProblems(all);if(problems.length){console.error(problems.join('\n'));process.exit(1)}
  const reviewed=Object.values(all).filter(f=>f.status==='reviewed').length;
  console.log(`${Object.keys(all).length} references, ${reviewed} reviewed. Counting ${drafts?'reviewed and draft':'reviewed'} values; a collection needs ${minimum}.`);
  let facet='';for(const r of facetsModule.collectionCandidates(all,minimum)){const n=drafts?r.reviewed+r.draft:r.reviewed;if(!n)continue;if(r.facet!==facet)console.log(`\n${facet=r.facet}`);console.log(`  ${n>=minimum?'✓':' '} ${r.value.padEnd(20)} ${String(n).padStart(3)}${drafts?`  (${r.reviewed} reviewed)`:''}`)}
}
