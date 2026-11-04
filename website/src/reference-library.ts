import { inspirationItems as links } from './inspiration-data';
import records from './authorized-references.json';
import { parseRegistry, type Authorized, type Withdrawn } from './submission-model';
import { isDraft, showDrafts } from './i18n/translations';
import type { Locale } from './i18n/locales';
export type Reference=(typeof links[number])|Authorized;
const registry=parseRegistry(records);
const ids=new Set(links.map(r=>r.id));for(const r of registry){if(ids.has(r.id))throw new Error(`Reference id already exists: ${r.id}`);ids.add(r.id)}
export const authorizedReferences=registry.filter((r):r is Authorized=>r.status==='published');
export const withdrawnReferences=registry.filter((r):r is Withdrawn=>r.status==='withdrawn');
export const inspirationItems:Reference[]=[...links,...authorizedReferences];
export const referencesFor=(locale:Locale)=>inspirationItems.filter(r=>showDrafts||!isDraft(permissionOf(r)??{},locale));
export const permissionOf=(item:Reference)=>item.source==='permission'?(item as Authorized):undefined;
