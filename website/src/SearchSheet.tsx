// Phone search, the way notes apps do it: the home shows only a search icon; tapping it opens this full-screen sheet with the
// field focused, the search history and suggested collections and topics. Submitting filters the home feed (the same `q` the
// desktop field sets) and closes the sheet; the sort sits above the results (InspirationPage). Loaded on demand from InspirationPage, so the home bundle stays the same.
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

const historyKey = 'variant-design:search-history', historyMax = 12, historyFolded = 6;
const m = {
  dialog: { zh: '搜索参考', en: 'Search references' }, placeholder: { zh: '搜索作品、风格或品牌', en: 'Search work, styles or brands' },
  back: { zh: '返回', en: 'Back' }, submit: { zh: '搜索', en: 'Search' }, recent: { zh: '历史记录', en: 'History' },
  clear: { zh: '清空历史记录', en: 'Clear history' }, more: { zh: '展开全部历史记录', en: 'Show all history' }, less: { zh: '收起历史记录', en: 'Show less history' },
  suggested: { zh: '推荐搜索', en: 'Suggested' },
} satisfies Record<string, Localized>;

export function readHistory(): string[] {
  try { const v = JSON.parse(localStorage.getItem(historyKey) ?? '[]'); return Array.isArray(v) ? v.filter(x => typeof x === 'string').slice(0, historyMax) : []; } catch { return []; }
}
// Newest first, without repeats (case-insensitive), at most twelve.
export function remember(list: string[], q: string) {
  const v = q.trim(); if (!v) return list;
  return [v, ...list.filter(x => x.toLowerCase() !== v.toLowerCase())].slice(0, historyMax);
}
const save = (list: string[]) => { try { if (list.length) localStorage.setItem(historyKey, JSON.stringify(list)); else localStorage.removeItem(historyKey); } catch { /* private mode: history just is not kept */ } };
const Glyph = ({ d }: { d: string }) => <svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;
const glyphs = { back: 'M10 3 5 8l5 5', trash: 'M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5M7 7v4M9 7v4', down: 'M4 6l4 4 4-4', up: 'M4 10l4-4 4 4' };

// Laid out like a notes app's search page: back arrow, the field with its own Search button, the history as chips folded to
// two rows, and suggestions as a two-column list. The suggestions are this site's collections and topics, the same for
// everyone: there is no search-popularity data, so nothing is marked hot and nothing claims to be a guess about the reader.
export function SearchSheet({ language, query, topics, onSearch, onTopic, onClose }: {
  language: Locale; query: string; topics: { id: string; title: Localized }[];
  onSearch: (q: string) => void; onTopic: (id: string) => void; onClose: () => void;
}) {
  const l = (k: keyof typeof m) => t(m[k], language), input = useRef<HTMLInputElement>(null), root = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(query), [history, setHistory] = useState(readHistory), [unfolded, setUnfolded] = useState(false);
  const collections = visibleCollections(facetData as Record<string, ReferenceFacets>, referencesFor(language), showDrafts).filter(c => showDrafts || !isDraft(c, language));
  // A modal: focus starts in the field, Tab and Shift+Tab wrap inside the sheet, Escape closes it, and focus returns to what
  // opened it (the search icon) when it closes.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !root.current) return;
      const items = [...root.current.querySelectorAll<HTMLElement>('input,button,a[href]')].filter(el => !el.hasAttribute('disabled'));
      const first = items[0], last = items.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden';// the feed must not scroll under the sheet
    addEventListener('keydown', onKey);
    return () => { removeEventListener('keydown', onKey); document.body.style.overflow = overflow; if (before?.isConnected) before.focus({ preventScroll: true }); };
  }, []);
  const run = (q: string) => { if (!q.trim()) return; const next = remember(history, q); setHistory(next); save(next); onSearch(q.trim()); };
  const shownHistory = unfolded ? history : history.slice(0, historyFolded);
  // Rendered on <body>: the home's frosted panel (backdrop-filter) would otherwise be the containing block of a fixed element,
  // leaving the sky around the sheet and the tab bar on top of it.
  return createPortal(<div ref={root} className="search-sheet content-page" role="dialog" aria-modal="true" aria-label={l('dialog')}>
    <form className="search-sheet-bar" role="search" onSubmit={e => { e.preventDefault(); run(value); }}>
      <button type="button" className="search-sheet-back" aria-label={l('back')} onClick={onClose}><Glyph d={glyphs.back}/></button>
      <div className="search-sheet-field">
        <input ref={input} type="search" enterKeyHint="search" value={value} onChange={e => setValue(e.target.value)} placeholder={l('placeholder')} aria-label={l('dialog')}/>
        <button type="submit">{l('submit')}</button>
      </div>
    </form>
    <div className="search-sheet-body">
      {history.length > 0 && <section><header><h2>{l('recent')}</h2><button type="button" className="search-sheet-icon" aria-label={l('clear')} onClick={() => { setHistory([]); save([]); setUnfolded(false); }}><Glyph d={glyphs.trash}/></button></header>
        <div className="search-chips">{shownHistory.map(h => <button key={h} type="button" onClick={() => run(h)}>{h}</button>)}
          {history.length > historyFolded && <button type="button" className="search-chip-fold" aria-label={l(unfolded ? 'less' : 'more')} aria-expanded={unfolded} onClick={() => setUnfolded(v => !v)}><Glyph d={unfolded ? glyphs.up : glyphs.down}/></button>}</div></section>}
      {(collections.length > 0 || topics.length > 0) && <section><header><h2>{l('suggested')}</h2></header>
        <ul className="search-suggestions">
          {collections.map(c => <li key={c.slug}><a href={localePath(`/collections/${c.slug}`, language)}>{t(c.short, language)}</a></li>)}
          {topics.map(tp => <li key={tp.id}><button type="button" onClick={() => onTopic(tp.id)}>{t(tp.title, language)}</button></li>)}
        </ul></section>}
    </div>
  </div>, document.body);
}
