// Phone search, the way notes apps do it: the home shows only a search icon; tapping it opens this full-screen sheet with the
// field focused, recent searches, collections and topics to try, and the sort. Submitting filters the home feed (the same
// `q` the desktop field sets) and closes the sheet. Loaded on demand from InspirationPage, so the home bundle stays the same.
// Recent searches stay in this browser only (localStorage) and can be cleared; nothing is sent anywhere.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { t, type Localized } from './i18n/localized';
import { localePath } from './i18n/locale-route';
import { showDrafts, isDraft } from './i18n/translations';
import type { Locale } from './i18n/locales';
import { referencesFor } from './reference-library';
import { visibleCollections } from './collections';
import facetData from './reference-facets.json';
import type { ReferenceFacets } from './reference-facets';

const historyKey = 'variant-design:search-history', historyMax = 8;
const m = {
  dialog: { zh: '搜索参考', en: 'Search references' }, placeholder: { zh: '搜索作品、风格或品牌', en: 'Search work, styles or brands' },
  cancel: { zh: '取消', en: 'Cancel' }, recent: { zh: '最近搜索', en: 'Recent searches' }, clear: { zh: '清空', en: 'Clear' },
  collections: { zh: '设计合集', en: 'Design collections' }, topics: { zh: '专题', en: 'Topics' }, sort: { zh: '排序', en: 'Sort' },
  local: { zh: '只保存在这个浏览器里。', en: 'Kept in this browser only.' },
} satisfies Record<string, Localized>;

export function readHistory(): string[] {
  try { const v = JSON.parse(localStorage.getItem(historyKey) ?? '[]'); return Array.isArray(v) ? v.filter(x => typeof x === 'string').slice(0, historyMax) : []; } catch { return []; }
}
// Newest first, without repeats (case-insensitive), at most eight.
export function remember(list: string[], q: string) {
  const v = q.trim(); if (!v) return list;
  return [v, ...list.filter(x => x.toLowerCase() !== v.toLowerCase())].slice(0, historyMax);
}
const save = (list: string[]) => { try { if (list.length) localStorage.setItem(historyKey, JSON.stringify(list)); else localStorage.removeItem(historyKey); } catch { /* private mode: history just is not kept */ } };

type Option = { value: string; label: string };
export function SearchSheet({ language, query, sort, sortOptions, topics, onSearch, onTopic, onSort, onClose }: {
  language: Locale; query: string; sort: string; sortOptions: Option[]; topics: { id: string; title: Localized }[];
  onSearch: (q: string) => void; onTopic: (id: string) => void; onSort: (value: string) => void; onClose: () => void;
}) {
  const l = (k: keyof typeof m) => t(m[k], language), input = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(query), [history, setHistory] = useState(readHistory);
  const collections = visibleCollections(facetData as Record<string, ReferenceFacets>, referencesFor(language), showDrafts).filter(c => showDrafts || !isDraft(c, language));
  useEffect(() => {
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden';// the feed must not scroll under the sheet
    addEventListener('keydown', onKey); return () => { removeEventListener('keydown', onKey); document.body.style.overflow = overflow; };
  }, []);
  const run = (q: string) => { const next = remember(history, q); setHistory(next); save(next); onSearch(q.trim()); };
  // Rendered on <body>: the home's frosted panel (backdrop-filter) would otherwise be the containing block of a fixed element,
  // leaving the sky around the sheet and the tab bar on top of it.
  return createPortal(<div className="search-sheet content-page" role="dialog" aria-modal="true" aria-label={l('dialog')}>
    <form className="search-sheet-bar" role="search" onSubmit={e => { e.preventDefault(); run(value); }}>
      <input ref={input} type="search" enterKeyHint="search" value={value} onChange={e => setValue(e.target.value)} placeholder={l('placeholder')} aria-label={l('dialog')}/>
      <button type="button" onClick={onClose}>{l('cancel')}</button>
    </form>
    <div className="search-sheet-body">
      {history.length > 0 && <section><header><h2>{l('recent')}</h2><button type="button" onClick={() => { setHistory([]); save([]); }}>{l('clear')}</button></header>
        <div className="search-chips">{history.map(h => <button key={h} type="button" onClick={() => run(h)}>{h}</button>)}</div><p className="search-sheet-note">{l('local')}</p></section>}
      <section><header><h2>{l('sort')}</h2></header>
        <div className="search-chips" role="radiogroup" aria-label={l('sort')}>{sortOptions.map(o => <button key={o.value} type="button" role="radio" aria-checked={sort === o.value} onClick={() => onSort(o.value)}>{o.label}</button>)}</div></section>
      {collections.length > 0 && <section><header><h2>{l('collections')}</h2></header>
        <div className="search-chips">{collections.map(c => <a key={c.slug} href={localePath(`/collections/${c.slug}`, language)}>{t(c.short, language)}</a>)}</div></section>}
      {topics.length > 0 && <section><header><h2>{l('topics')}</h2></header>
        <div className="search-chips">{topics.map(tp => <button key={tp.id} type="button" onClick={() => onTopic(tp.id)}>{t(tp.title, language)}</button>)}</div></section>}
    </div>
  </div>, document.body);
}
