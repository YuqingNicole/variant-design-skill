import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const project=process.cwd(),entry=process.argv[2]??'index.html',diagnostics=[...JSON.parse(fs.readFileSync('project-health.json','utf8')).failures];
const safe=file=>{const full=path.resolve(project,file);if(!full.startsWith(project+path.sep))throw Error('Resource left project');return full};
const source=fs.readFileSync(safe(entry),'utf8');
if(!source.includes('<html')||!source.includes('<title>'))diagnostics.push({id:'document-structure',message:'Missing document structure',file:entry});
let inline=0;
for(const match of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
 const src=/\bsrc=["']([^"']+)["']/.exec(match[1]),module=/type=["']module["']/.test(match[1]);
 const file=src?path.relative(project,path.resolve(path.dirname(safe(entry)),decodeURIComponent(src[1].split(/[?#]/)[0]))).split(path.sep).join('/'):entry;
 if(module){diagnostics.push({id:'unsupported-module:'+file,message:'This original checker covers classic scripts only',file});continue}
 try{const code=src?fs.readFileSync(safe(file),'utf8'):match[2];new vm.Script(code,{filename:file})}catch(error){diagnostics.push({id:'script-syntax:'+file+':'+inline,message:error.message,file})}inline++;
}
console.log(JSON.stringify({schemaVersion:1,diagnostics}));process.exitCode=diagnostics.length?1:0;
