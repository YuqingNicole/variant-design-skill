// The reference library split for the browser (TODO §6, 2026-11-13). The home script carries a light row per reference
// and the full records of the home's first page; the rest load one hashed chunk per section when the reader scrolls, sorts,
// searches or opens one. Served as virtual modules so src/inspiration-data.ts stays the single source (the batch scripts
// and tests read it as text) and Vite names each chunk by content. The SSR build gets every record up front, so the
// prerendered HTML does not change.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { importTs } from './ts-module.mjs';

const src = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src');
export const pageSize = 30;
// What the tabs, counts, sort orders, topics, pack and prev/next order need without the record itself.
export const rowFields = ['id', 'name', 'category', 'tag', 'source', 'addedAt', 'checkedAt', 'kind'];
// What a home card draws beyond its row (InspirationPage's card, cover and analysis card): the link, the focus line in the
// page's one language, and an X post's or YouTube video's own fields. The notes, the other language and the rest of the
// record arrive with the full record when the card is opened or searched (2026-11-28), so a long note does not grow the home.
export const cardFields = ['url', 'post', 'video'];
// The languages the home is served in, each with its fallback chain (src/i18n/locales.ts); a card carries the one text it shows.
export const cardLocales = { zh: ['zh'], en: ['en', 'zh'] };
export const cardOf = (r, locale) => ({ id: r.id, ...Object.fromEntries(cardFields.flatMap(k => r[k] === undefined ? [] : [[k, r[k]]])), focus: { zh: cardLocales[locale].map(l => r.focus[l]).find(Boolean) } });
// The index ships as columns, one array per row field, which gzips smaller than an object per row; `indexSource` rebuilds the rows.
export const indexSource = (index, topics) => `const c=${JSON.stringify(rowFields.map(k => index.map(r => r[k] ?? null)))},k=${JSON.stringify(rowFields)};export const index=c[0].map((_,i)=>{const r={};k.forEach((f,j)=>{if(c[j][i]!==null)r[f]=c[j][i]});return r});export const topics=${JSON.stringify(topics)};`;
const empty = { items: [], previews: {}, media: {} };

const block = (source, name) => { const start = source.indexOf(`export const ${name} = `); if (start < 0) throw new Error(`${name} is not in inspiration-data.ts`); const from = source.indexOf('[', start); return JSON.parse(source.slice(from, source.indexOf('\n];', from) + 2)); };
export const libraryFiles = ['inspiration-data.ts', 'link-previews.json', 'x-media.json'].map(f => path.join(src, f));
export function readLibrary(dir = src) {
  const source = fs.readFileSync(path.join(dir, 'inspiration-data.ts'), 'utf8'), json = f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  return { items: block(source, 'inspirationItems'), topics: block(source, 'inspirationTopics'), previews: json('link-previews.json'), media: json('x-media.json') };
}

// `first` is the home's default order (newest `addedAt` first, file order on ties, as InspirationPage sorts) cut at one page,
// leaving out what the home does not list (`onHome`: an own-page section such as Videos);
// each section chunk keeps file order and carries its own link previews and X media, so nothing per reference ships twice
// except the first page, which its section repeats.
export function splitReferences(items, sectionOf, { previews = {}, media = {}, onHome = () => true } = {}) {
  const part = list => ({ items: list, previews: Object.fromEntries(list.flatMap(r => previews[r.id] ? [[r.id, previews[r.id]]] : [])), media: Object.fromEntries(list.flatMap(r => media[r.id] ? [[r.id, media[r.id]]] : [])) });
  const sections = {};
  for (const r of items) (sections[sectionOf(r)] ??= []).push(r);
  return {
    index: items.map(r => Object.fromEntries(rowFields.map(k => [k, r[k]]))),
    first: part([...items].filter(onHome).sort((a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt)).slice(0, pageSize)),
    sections: Object.fromEntries(Object.entries(sections).map(([id, list]) => [id, part(list)])),
    all: part(items),
  };
}

const prefix = 'virtual:inspiration/', resolved = '\0' + prefix;
export const moduleSource = part => `export const items=${JSON.stringify(part.items)};export const previews=${JSON.stringify(part.previews)};export const media=${JSON.stringify(part.media)};`;
// A card's link preview is its picture and size; the title, description and date are for the detail, which has the full record.
const cardPreview = ({ image, width, height }) => ({ image, ...(width && height ? { width, height } : {}) });
export const cardsSource = (part, locale) => moduleSource({ ...part, items: part.items.map(r => cardOf(r, locale)), previews: Object.fromEntries(Object.entries(part.previews).map(([id, p]) => [id, cardPreview(p)])) });
export function inspirationPlugin() {
  let cache;
  const data = async () => cache ??= (async () => { const { sectionOf, pageOf } = await importTs(path.join(src, 'inspiration-sections.ts')); const lib = readLibrary(); return { ...splitReferences(lib.items, sectionOf, { ...lib, onHome: r => !pageOf(r) }), topics: lib.topics, sectionOf }; })();
  return {
    name: 'variant-inspiration-split',
    resolveId(id) { if (id.startsWith(prefix)) return '\0' + id; },
    watchChange(file) { if (libraryFiles.includes(file)) cache = undefined; },
    async load(id, options) {
      if (!id.startsWith(resolved)) return;
      for (const f of libraryFiles) this.addWatchFile(f);
      const what = id.slice(resolved.length), s = await data();
      if (what === 'index') return indexSource(s.index, s.topics);
      // The sections that hold a reference, for the site navigation, which links to a section only when it has a page.
      if (what === 'sections') return `export const active=${JSON.stringify([...new Set(s.index.map(r => s.sectionOf(r)))])};`;
      // The browser starts with no full record: the home's first page comes as cards (`cards`), the rest per section.
      if (what === 'initial') return moduleSource(options?.ssr ? s.all : empty);
      if (what === 'cards') return `export const loadCards=l=>({${Object.keys(cardLocales).map(l => `${JSON.stringify(l)}:()=>import(${JSON.stringify(`${prefix}cards-${l}`)})`).join(',')}})[l]?.()??Promise.resolve(${JSON.stringify(empty)});`;
      if (what.startsWith('cards-')) return cardsSource(options?.ssr ? empty : s.first, what.slice(6));
      // `first` is the first page's full records, for a card opened before its section is here; sections are named by id.
      if (what === 'loader') return `export const loadSection=id=>({${[...Object.keys(s.sections), 'first'].map(k => `${JSON.stringify(k)}:()=>import(${JSON.stringify(prefix + (k === 'first' ? k : `section-${k}`))})`).join(',')}})[id]?.()??Promise.resolve(${JSON.stringify(empty)});`;
      if (what === 'first') return moduleSource(s.first);
      if (what.startsWith('section-')) return moduleSource(s.sections[what.slice(8)] ?? empty);
      throw new Error(`Unknown module ${id}`);
    },
  };
}
