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
export const rowFields = ['id', 'name', 'category', 'tag', 'source', 'addedAt', 'checkedAt'];
const empty = { items: [], previews: {}, media: {} };

const block = (source, name) => { const start = source.indexOf(`export const ${name} = `); if (start < 0) throw new Error(`${name} is not in inspiration-data.ts`); const from = source.indexOf('[', start); return JSON.parse(source.slice(from, source.indexOf('\n];', from) + 2)); };
export const libraryFiles = ['inspiration-data.ts', 'link-previews.json', 'x-media.json'].map(f => path.join(src, f));
export function readLibrary(dir = src) {
  const source = fs.readFileSync(path.join(dir, 'inspiration-data.ts'), 'utf8'), json = f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  return { items: block(source, 'inspirationItems'), topics: block(source, 'inspirationTopics'), previews: json('link-previews.json'), media: json('x-media.json') };
}

// `first` is the home's default order (newest `addedAt` first, file order on ties, as InspirationPage sorts) cut at one page;
// each section chunk keeps file order and carries its own link previews and X media, so nothing per reference ships twice
// except the first page, which its section repeats.
export function splitReferences(items, sectionOf, { previews = {}, media = {} } = {}) {
  const part = list => ({ items: list, previews: Object.fromEntries(list.flatMap(r => previews[r.id] ? [[r.id, previews[r.id]]] : [])), media: Object.fromEntries(list.flatMap(r => media[r.id] ? [[r.id, media[r.id]]] : [])) });
  const sections = {};
  for (const r of items) (sections[sectionOf(r)] ??= []).push(r);
  return {
    index: items.map(r => Object.fromEntries(rowFields.map(k => [k, r[k]]))),
    first: part([...items].sort((a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt)).slice(0, pageSize)),
    sections: Object.fromEntries(Object.entries(sections).map(([id, list]) => [id, part(list)])),
    all: part(items),
  };
}

const prefix = 'virtual:inspiration/', resolved = '\0' + prefix;
export const moduleSource = part => `export const items=${JSON.stringify(part.items)};export const previews=${JSON.stringify(part.previews)};export const media=${JSON.stringify(part.media)};`;
export function inspirationPlugin() {
  let cache;
  const data = async () => cache ??= (async () => { const { sectionOf } = await importTs(path.join(src, 'inspiration-sections.ts')); const lib = readLibrary(); return { ...splitReferences(lib.items, sectionOf, lib), topics: lib.topics }; })();
  return {
    name: 'variant-inspiration-split',
    resolveId(id) { if (id.startsWith(prefix)) return '\0' + id; },
    watchChange(file) { if (libraryFiles.includes(file)) cache = undefined; },
    async load(id, options) {
      if (!id.startsWith(resolved)) return;
      for (const f of libraryFiles) this.addWatchFile(f);
      const what = id.slice(resolved.length), s = await data();
      if (what === 'index') return `export const index=${JSON.stringify(s.index)};export const topics=${JSON.stringify(s.topics)};`;
      if (what === 'initial') return moduleSource(options?.ssr ? s.all : s.first);
      if (what === 'loader') return `export const loadSection=id=>({${Object.keys(s.sections).map(k => `${JSON.stringify(k)}:()=>import(${JSON.stringify(`${prefix}section-${k}`)})`).join(',')}})[id]?.()??Promise.resolve(${JSON.stringify(empty)});`;
      if (what.startsWith('section-')) return moduleSource(s.sections[what.slice(8)] ?? empty);
      throw new Error(`Unknown module ${id}`);
    },
  };
}
