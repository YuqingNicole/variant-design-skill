// Phone search, the way notes apps do it: the home shows only a search icon; tapping it opens this full-screen sheet with the
// field focused, the search history and suggested collections and topics. Submitting filters the home feed (the same `q` the
// desktop field sets) and closes the sheet; the sort sits above the results (InspirationPage). Loaded on demand from InspirationPage,
// so the home bundle stays the same. Recent searches stay in this browser only (localStorage) and can be cleared. A submitted term
// is counted (search-stats.ts: term, time and language only) to build the trending list.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { t, type Localized } from './i18n/localized';
import { localePath } from './i18n/locale-route';
import { showDrafts, isDraft } from './i18n/translations';
import type { Locale } from './i18n/locales';
import { referencesFor, loadedReferences } from './reference-library';
import { logSearch, topSearches, type Trending } from './search-stats';
import { guessFromHistory, inLibrary } from './search-suggest';
import { facetVocabulary } from './reference-facets';
import { visibleCollections } from './collections';
import facetData from './reference-facets.json';
import type { ReferenceFacets } from './reference-facets';

const historyKey = 'variant-design:search-history', historyMax = 12, historyFolded = 6;
const m = {
  dialog: { zh: '搜索参考', en: 'Search references' }, placeholder: { zh: '搜索作品、风格或品牌', en: 'Search work, styles or brands' },
  back: { zh: '返回', en: 'Back' }, submit: { zh: '搜索', en: 'Search' }, recent: { zh: '历史记录', en: 'History' },
  clear: { zh: '清空历史记录', en: 'Clear history' }, more: { zh: '展开全部历史记录', en: 'Show all history' }, less: { zh: '收起历史记录', en: 'Show less history' },
  suggested: { zh: '推荐搜索', en: 'Suggested' }, guess: { zh: '猜你想搜', en: 'You might like' }, trending: { zh: '热搜榜', en: 'Trending' }, hot: { zh: '热', en: 'Hot' },
  trendingNote: { zh: '最近 7 天的搜索次数', en: 'Searches in the past 7 days' },
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

// Laid out like a notes app's search page: back arrow, the field with its own Search button, the history as chips folded to two
// rows, then "You might like" (collections and topics related to this browser's history, worked out here), "Trending" (the
// past week's most searched terms that match the library, at least three searches each; hidden until there are three such
// terms) and "Suggested" (the rest of the collections and topics, the same for everyone).
export function SearchSheet({ language, query, topics, onSearch, onTopic, onClose }: {
  language: Locale; query: string; topics: { id: string; title: Localized }[];
  onSearch: (q: string) => void; onTopic: (id: string) => void; onClose: () => void;
}) {
  const l = (k: keyof typeof m) => t(m[k], language), input = useRef<HTMLInputElement>(null), root = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(query), [history, setHistory] = useState(readHistory), [unfolded, setUnfolded] = useState(false);
  const rows = referencesFor(language), collections = visibleCollections(facetData as Record<string, ReferenceFacets>, rows, showDrafts).filter(c => showDrafts || !isDraft(c, language));
  const vocab = facetVocabulary as unknown as Record<string, Record<string, { zh: string; en: string }>>;
  const guesses = guessFromHistory(history, collections, topics, vocab).slice(0, 6);
  const guessed = new Set(guesses.map(g => g.kind === 'collection' ? `c:${g.item.slug}` : `t:${g.item.id}`));
  const [trending, setTrending] = useState<Trending[]>([]);
  useEffect(() => {
    let live = true;
    const texts = [...rows.flatMap(r => [r.name, r.tag]), ...loadedReferences().flatMap(r => [r.focus.zh, r.focus.en, r.application.zh, r.application.en]),
      ...collections.flatMap(c => [c.short.zh, c.short.en, c.title.zh, c.title.en]), ...Object.values(vocab).flatMap(v => Object.values(v).flatMap(x => [x.zh, x.en]))];
    topSearches().then(list => { if (live) setTrending(list.filter(x => inLibrary(x.term, texts)).slice(0, 10)); });
    return () => { live = false; };
  }, []);
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
  const run = (q: string) => { if (!q.trim()) return; const next = remember(history, q); setHistory(next); save(next); logSearch(q.trim(), language === 'en' ? 'en' : 'zh'); onSearch(q.trim()); };
  const suggestion = (key: string, node: ReactNode) => <li key={key}>{node}</li>;
  const collectionLink = (c: { slug: string; short: { zh: string; en: string } }) => suggestion(`c:${c.slug}`, <a href={localePath(`/collections/${c.slug}`, language)}>{t(c.short, language)}</a>);
  const topicButton = (tp: { id: string; title: Localized }) => suggestion(`t:${tp.id}`, <button type="button" onClick={() => onTopic(tp.id)}>{t(tp.title, language)}</button>);
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
      {guesses.length > 0 && <section><header><h2>{l('guess')}</h2></header>
        <ul className="search-suggestions">{guesses.map(g => g.kind === 'collection' ? collectionLink(g.item) : topicButton(g.item))}</ul></section>}
      {trending.length >= 3 && <section aria-describedby="search-trending-note"><header><h2>{l('trending')}</h2><small id="search-trending-note" className="search-sheet-note">{l('trendingNote')}</small></header>
        <ol className="search-trending">{trending.map((x, i) => <li key={x.term}><button type="button" onClick={() => run(x.term)}>
          <span className="search-rank" data-top={i < 3 || undefined}>{i + 1}</span><span className="search-term">{x.term}</span>{i < 3 && <em className="search-hot">{l('hot')}</em>}</button></li>)}</ol></section>}
      {(collections.length > 0 || topics.length > 0) && <section><header><h2>{l('suggested')}</h2></header>
        <ul className="search-suggestions">{collections.filter(c => !guessed.has(`c:${c.slug}`)).map(collectionLink)}{topics.filter(tp => !guessed.has(`t:${tp.id}`)).map(topicButton)}</ul></section>}
    </div>
  </div>, document.body);
}
