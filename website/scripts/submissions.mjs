#!/usr/bin/env node
// Editorial operations are local. A candidate never publishes until a maintainer admits it after checking the grant.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {model,registryFile,referenceRecords} from './reference-records.mjs';
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
function regular(file){const dir=path.dirname(path.resolve(file));if(fs.realpathSync(dir)!==dir)throw new Error('Symlinked registry directory refused');if(fs.existsSync(file)&&(!fs.lstatSync(file).isFile()||fs.lstatSync(file).isSymbolicLink()))throw new Error('Registry must be a regular file')}
export function writeRegistry(file,change){file=path.resolve(file);regular(file);const lock=file+'.lock';let fd;try{fd=fs.openSync(lock,'wx')}catch{throw new Error('Registry is locked; no write performed')}
 let temp;try{const before=fs.readFileSync(file,'utf8'),records=model.parseRegistry(JSON.parse(before)),next=model.parseRegistry(change(records)),text=JSON.stringify(next,null,2)+'\n';
  const backups=path.join(file===registryFile?path.dirname(path.dirname(file)):path.dirname(file),'.variant-work','submissions');for(const dir of [path.dirname(backups),backups]){if(fs.existsSync(dir)){if(!fs.lstatSync(dir).isDirectory()||fs.lstatSync(dir).isSymbolicLink())throw new Error('Symlinked backup directory refused')}else fs.mkdirSync(dir)}const backup=path.join(backups,randomUUID()+'.json');fs.writeFileSync(backup,before,{flag:'wx'});if(fs.readFileSync(backup,'utf8')!==before)throw new Error('Backup verification failed');
  if(fs.readFileSync(file,'utf8')!==before)throw new Error('Registry changed during preparation; no write performed');temp=file+'.'+randomUUID()+'.tmp';const out=fs.openSync(temp,'wx');try{fs.writeFileSync(out,text);fs.fsyncSync(out)}finally{fs.closeSync(out)}if(fs.readFileSync(temp,'utf8')!==text)throw new Error('Candidate verification failed');if(fs.readFileSync(file,'utf8')!==before)throw new Error('Registry changed before apply; no write performed');fs.renameSync(temp,file);temp=undefined;if(fs.readFileSync(file,'utf8')!==text)throw new Error('Registry verification failed');return {records:next,backup};
 }finally{if(temp&&fs.existsSync(temp))fs.unlinkSync(temp);fs.closeSync(fd);fs.unlinkSync(lock)}
}
export function admit(file,candidate){model.parseRegistry([candidate]);if(candidate.status!=='published')throw new Error('Only reviewed published candidates can be admitted');const existing=referenceRecords(file);if([...existing.published,...existing.withdrawn].some(r=>r.id===candidate.id))throw new Error(`Reference id already exists: ${candidate.id}`);return writeRegistry(file,records=>{if(records.some(r=>r.id===candidate.id))throw new Error('Duplicate reference');return [...records,candidate]})}
export function withdraw(file,id,notice){return writeRegistry(file,records=>{const r=records.find(r=>r.id===id);if(!r||r.status!=='published')throw new Error('Published authorized reference not found');return records.map(item=>item.id===id?model.withdrawReference(item,notice):item)})}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const [command,...args]=process.argv.slice(2),at=args.indexOf('--registry'),file=at>=0?path.resolve(args[at+1]):registryFile;
  if(command==='check'){const records=referenceRecords(file);console.log(`References: ${records.published.length} published, ${records.withdrawn.length} withdrawn`)}
  else if(command==='review'){const candidate=model.reviewSubmission(read(args[0]),read(args[1]));const out=args.indexOf('--output');if(out<0)throw new Error('review needs --output <candidate.json>');fs.writeFileSync(args[out+1],JSON.stringify(candidate,null,2)+'\n',{flag:'wx'});console.log(`Candidate ${candidate.id} prepared; not admitted. Verify grant and review metadata before admit.`)}
  else if(command==='admit'){const result=admit(file,read(args[0]));console.log(`Admitted locally; backup ${result.backup}. Publish through code review.`)}
  else if(command==='withdraw'){const result=withdraw(file,args[0],read(args[1]));console.log(`Withdrawn locally; backup ${result.backup}. Deploy the removal before further verification.`)}
  else throw new Error('Usage: submissions.mjs check | review <submission.json> <editorial.json> --output <candidate.json> | admit <candidate.json> | withdraw <id> <notice.json> [--registry <file>]');
 }catch(error){console.error(error.message);process.exitCode=1}
}
