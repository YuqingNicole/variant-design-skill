// The reference library as the browser sees it (TODO §6, 2026-11-13). `references` is a light row per published reference:
// enough for the tabs, counts, sort orders, topics, the pack and the prev/next order. Full records sit in a store that fills
// one section at a time from hashed chunks (every record is there from the start in the SSR build, so the prerendered HTML is
// complete). The home's first page arrives first as cards: a row plus what its card draws, in the page's language
// (`useCards`, 2026-11-28); a card's full record, notes included, comes when it is opened or searched.
// scripts/inspiration-split.mjs serves all of it from inspiration-data.ts.
import type { inspirationItems as links, inspirationTopics as topicList } from './inspiration-data';
import { index, topics } from 'virtual:inspiration/index';
import * as initial from 'virtual:inspiration/initial';
import { loadSection } from 'virtual:inspiration/loader';
import { loadCards } from 'virtual:inspiration/cards';
import records from './authorized-references.json';
import { parseRegistry, type Authorized, type RegistryRecord, type Withdrawn } from './submission-model';
import { isDraft, showDrafts, type Translations } from './i18n/translations';
import { sectionOf } from './inspiration-sections';
import type { Locale } from './i18n/locales';
import type { XMedia } from './XVideo';
export type Link=typeof links[number];
export type Reference=Link|Authorized;
export type Row=Pick<Link,'id'|'name'|'category'|'tag'|'source'|'addedAt'|'checkedAt'>&Partial<Pick<Link,'kind'>>&{translations?:Translations};
// What a card draws: its row, its link, its focus line (only the page's language, under the source key) and a post's or video's fields.
export type Card=Row&Pick<Link,'url'|'focus'>&{post?:unknown;video?:unknown};
// The preview a site publishes for shared links (scripts/link-preview.mjs).
// width and height are the image's own, read when the preview was stored (scripts/image-size.mjs); older entries may lack them.
export type Preview={image:string;title:string;description:string;lang:string;fetchedAt:string;width?:number;height?:number};
export const inspirationTopics:typeof topicList=topics;
// The SSR build checks the registry (a bad record fails the build); the browser trusts the file that check passed, so the
// home's script does not carry the checker (2026-11-28).
const registry=import.meta.env.SSR?parseRegistry(records):records as RegistryRecord[];
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
const cards=new Map<string,Card>();
// The full record when it is here, else the card; enough to draw a grid card, never a detail, a brief or a search.
export const cardOf=(id:string):Reference|Card|undefined=>store.get(id)??cards.get(id);
// The home's first page as cards, fetched once; main.tsx starts it beside the page's script so it is not a second round trip.
let cardsLoading:Promise<void>|undefined;
// A card's preview is only its picture (scripts/inspiration-split.mjs), so it never replaces one a full record brought.
export const useCards=(locale:Locale)=>cardsLoading??=loadCards(locale).then(part=>{for(const c of part.items as unknown as Card[]){const row=rows.get(c.id);if(row)cards.set(c.id,{...row,...c});if(store.has(c.id))continue;if(part.previews[c.id])previews[c.id]=part.previews[c.id];if(part.media[c.id])media[c.id]=part.media[c.id]}version++;listeners.forEach(fn=>fn())},()=>{cardsLoading=undefined});
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
// Resolves once every listed id that has a row has its record. A first-page card whose section is not otherwise asked for
// fetches the first page's records (one small chunk) rather than its whole section.
export function ensure(ids:Iterable<string>){const sections=new Set<string>(),first:Row[]=[];
 for(const id of ids){const row=rows.get(id);if(!row||store.has(id))continue;if(cards.has(id))first.push(row);else sections.add(sectionOf(row))}
 const covered=(r:Row)=>sections.has(sectionOf(r))||loading.has(sectionOf(r));
 if(first.every(covered))for(const r of first)sections.add(sectionOf(r));else sections.add('first');
 return Promise.all([...sections].map(load)).then(()=>{})}
export const ensureAll=()=>ensure(rows.keys());
