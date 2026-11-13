// The reference library as the browser sees it (TODO §6, 2026-11-13). `references` is a light row per published reference:
// enough for the tabs, counts, sort orders, topics, the pack and the prev/next order. Full records sit in a store that starts
// with the home's first page (every record in the SSR build, so the prerendered HTML is complete) and fills one section at a
// time from hashed chunks; scripts/inspiration-split.mjs serves both from inspiration-data.ts.
import type { inspirationItems as links, inspirationTopics as topicList } from './inspiration-data';
import { index, topics } from 'virtual:inspiration/index';
import * as initial from 'virtual:inspiration/initial';
import { loadSection } from 'virtual:inspiration/loader';
import records from './authorized-references.json';
import { parseRegistry, type Authorized, type Withdrawn } from './submission-model';
import { isDraft, showDrafts, type Translations } from './i18n/translations';
import { sectionOf } from './inspiration-sections';
import type { Locale } from './i18n/locales';
import type { XMedia } from './XVideo';
export type Link=typeof links[number];
export type Reference=Link|Authorized;
export type Row=Pick<Link,'id'|'name'|'category'|'tag'|'source'|'addedAt'|'checkedAt'>&{translations?:Translations};
// The preview a site publishes for shared links (scripts/link-preview.mjs).
export type Preview={image:string;title:string;description:string;lang:string;fetchedAt:string};
export const inspirationTopics:typeof topicList=topics;
const registry=parseRegistry(records);
const ids=new Set(index.map(r=>r.id));for(const r of registry){if(ids.has(r.id))throw new Error(`Reference id already exists: ${r.id}`);ids.add(r.id)}
export const authorizedReferences=registry.filter((r):r is Authorized=>r.status==='published');
export const withdrawnReferences=registry.filter((r):r is Withdrawn=>r.status==='withdrawn');
export const references:Row[]=[...index,...authorizedReferences];
export const referencesFor=(locale:Locale)=>references.filter(r=>showDrafts||!isDraft(r,locale));
export const permissionOf=(item:{source:string})=>item.source==='permission'?(item as Authorized):undefined;

const store=new Map<string,Reference>(),previews:Record<string,Preview>={},media:Record<string,XMedia>={};
const take=(part:{items:Link[];previews:Record<string,Preview>;media:Record<string,XMedia>})=>{for(const r of part.items)store.set(r.id,r);Object.assign(previews,part.previews);Object.assign(media,part.media)};
take(initial);for(const r of authorizedReferences)store.set(r.id,r);
export const referenceOf=(id:string)=>store.get(id);
export const previewOf=(id:string):Preview|undefined=>previews[id];
export const mediaOf=(id:string):XMedia|undefined=>media[id];
export const loadedReferences=()=>references.flatMap(r=>store.get(r.id)??[]);
export const loaded=(ids:Iterable<string>)=>{for(const id of ids)if(rows.has(id)&&!store.has(id))return false;return true};
const rows=new Map(references.map(r=>[r.id,r])),loading=new Map<string,Promise<void>>(),listeners=new Set<()=>void>();
let version=0;
export const subscribe=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn)}};
export const snapshot=()=>version;
// A section is fetched once; a failed fetch is forgotten so the next request tries again, and nothing renders for its records until then.
function load(section:string){let p=loading.get(section);if(!p){p=loadSection(section).then(part=>{take(part);version++;listeners.forEach(fn=>fn())},()=>{loading.delete(section)});loading.set(section,p)}return p}
// Resolves once every listed id that has a row has its record.
export function ensure(ids:Iterable<string>){const sections=new Set<string>();for(const id of ids){const row=rows.get(id);if(row&&!store.has(id))sections.add(sectionOf(row))}return Promise.all([...sections].map(load)).then(()=>{})}
export const ensureAll=()=>ensure(rows.keys());
