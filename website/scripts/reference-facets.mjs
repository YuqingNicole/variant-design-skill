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
// Every problem in the facet file against the published references: unknown values and orphaned records. A reference
// without a record is allowed: the weekly jobs (X, Threads, galleries) add references without facets, and such a
// reference simply belongs to no collection until someone gives it facets. `missingFacets` lists them for the report.
export function facetFileProblems(all=readFacets(),ids=referenceRecords().published.map(r=>r.id)){
  const known=new Set(ids),out=Object.entries(all).flatMap(([id,f])=>facetsModule.facetProblems(id,f));
  for(const id of Object.keys(all))if(!known.has(id))out.push(`${id}: facets for a reference that is not published`);
  return out;
}
export const missingFacets=(all=readFacets(),ids=referenceRecords().published.map(r=>r.id))=>ids.filter(id=>!all[id]);
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
  const arg=process.argv.slice(2),minimum=Number(arg[arg.indexOf('--minimum')+1])||6,drafts=arg.includes('--drafts'),all=readFacets();
  const problems=facetFileProblems(all);if(problems.length){console.error(problems.join('\n'));process.exit(1)}
  const reviewed=Object.values(all).filter(f=>f.status==='reviewed').length,missing=missingFacets(all);
  if(missing.length)console.log(`${missing.length} published references have no facets yet: ${missing.join(', ')}`);
  // Which records the local model drafted (scripts/jev-facets.mjs), with its probability, so its guesses can be checked.
  const jev=Object.entries(all).filter(([,f])=>f.draftedBy==='jev');
  if(jev.length){console.log(`${jev.length} drafted by Jev (${jev.filter(([,f])=>f.status==='reviewed').length} reviewed since):`);for(const[id,f]of jev)console.log(`  ${f.status==='reviewed'?'✓':'·'} ${id.padEnd(28)} dark ${Math.round(f.jev.dark*100)}%${f.styles.includes('dark')?' → dark':''}`)}
  console.log(`${Object.keys(all).length} references, ${reviewed} reviewed. Counting ${drafts?'reviewed and draft':'reviewed'} values; a collection needs ${minimum}.`);
  let facet='';for(const r of facetsModule.collectionCandidates(all,minimum)){const n=drafts?r.reviewed+r.draft:r.reviewed;if(!n)continue;if(r.facet!==facet)console.log(`\n${facet=r.facet}`);console.log(`  ${n>=minimum?'✓':' '} ${r.value.padEnd(20)} ${String(n).padStart(3)}${drafts?`  (${r.reviewed} reviewed)`:''}`)}
}
