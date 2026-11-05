// Build and editorial tooling read exactly the same validated records as the client.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {importTs} from './ts-module.mjs';
export const model=await importTs(fileURLToPath(new URL('../src/submission-model.ts',import.meta.url)));
export const registryFile=fileURLToPath(new URL('../src/authorized-references.json',import.meta.url));
export function readRegistry(file=registryFile){return model.parseRegistry(JSON.parse(fs.readFileSync(file,'utf8')))}
export function baseReferences(){const source=fs.readFileSync(new URL('../src/inspiration-data.ts',import.meta.url),'utf8'),start=source.indexOf('[',source.indexOf('export const inspirationItems = '));return JSON.parse(source.slice(start,source.indexOf('\n];',start)+2))}
export function referenceRecords(file=registryFile){const records=readRegistry(file),links=baseReferences(),ids=new Set(links.map(r=>r.id));for(const r of records){if(ids.has(r.id))throw new Error(`Reference id already exists: ${r.id}`);ids.add(r.id)}return {published:[...links,...records.filter(r=>r.status==='published')],withdrawn:records.filter(r=>r.status==='withdrawn')}}
