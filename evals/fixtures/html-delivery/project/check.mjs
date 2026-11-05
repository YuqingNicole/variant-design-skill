import fs from 'node:fs';
import vm from 'node:vm';
for(const file of process.argv.slice(2)){const source=fs.readFileSync(file,'utf8');if(!source.includes('<title>')||!source.includes('<html'))throw Error(`Missing document structure: ${file}`);for(const match of source.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);console.log(`Document/script syntax checked: ${file}`);}
