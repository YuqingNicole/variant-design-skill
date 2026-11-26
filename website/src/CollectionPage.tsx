import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { SiteHeader, SiteFooter } from './SiteChrome';
import { t, type Localized } from './i18n/localized';
import { locales } from './i18n/locales';
import { useLocale } from './i18n/LocaleProvider';
import { localePath } from './i18n/locale-route';
import { isDraft, showDrafts, type Translations } from './i18n/translations';
import { references, referencesFor, referenceOf, mediaOf, ensure, subscribe, snapshot } from './reference-library';
import { ReferenceCover } from './InspirationPage';
import { proxied } from './image-proxy';
import { visibleCollections, collectionBySlug, collectionState, minimumReviewed, indexTranslations } from './collections';
import facetData from './reference-facets.json';
import type { ReferenceFacets } from './reference-facets';
import './content-pages.css';
import './collections.css';
const facets = facetData as Record<string, ReferenceFacets>;
const m = {
  index: { zh: '设计合集', en: 'Design collections' }, indexTitle: { zh: '设计合集 — Variant Design', en: 'Design collections — Variant Design' },
  indexIntro: { zh: '按行业、页面模式、交互技法和视觉风格整理的参考合集。每一条都附出处和我们的笔记。', en: 'References grouped by industry, page pattern, interaction technique and visual style, each with its source and our notes.' },
  all: { zh: '全部', en: 'All' }, more: { zh: '展开', en: 'More' }, less: { zh: '收起', en: 'Less' },
  draft: { zh: '预览：这一页的属性还是初稿，没有人打开作品核对过，正式站不会显示这一页。', en: 'Preview: the attributes on this page are drafts nobody has checked against the work yet. The live site does not show this page.' },
  yours: { zh: '做出你的版本', en: 'Make your version' }, yoursNote: { zh: '挑几条加入参考包，让 variant-design 技能在你自己的项目里生成 A/B/C 三个方向。', en: 'Pick a few for your reference pack and let the variant-design skill generate three A/B/C directions in your own project.' },
  draftTag: { zh: '初稿', en: 'draft' }, install: { zh: '安装技能', en: 'Install the skill' }, empty: { zh: '还没有可以公开的合集。', en: 'No collections are public yet.' },
} satisfies Record<string, Localized>;
// Who published it: the X handle for a post, the channel for a video, the host for a site.
const sourceOf = (r: { url: string; post?: { handle: string }; video?: { channel?: string } }) => r.post ? `@${r.post.handle}` : r.video?.channel ?? new URL(r.url).hostname.replace(/^www\./, '');
const count = { zh: (n: number) => `${n} 条参考`, en: (n: number) => `${n} references` };
const reviewedCount = { zh: (n: number) => `${n} 条已核对，满 ${minimumReviewed} 条才会上线`, en: (n: number) => `${n} reviewed; ${minimumReviewed} needed to go live` };

// Before the first render: the full records of the collection's members (the SSR build has them all).
// The index shows each collection's first member as its cover.
export function prepare(slug: string) { const c = collectionBySlug(slug);
  return ensure(c ? collectionState(c, facets, references).members : visibleCollections(facets, references, showDrafts).flatMap(x => x.items.slice(0, 1))); }

// Covers keep the shape of their media, clamped between 3:4 and 4:3, so the two-column feed staggers like a notes app;
// a site preview or analysis card is 4:3. Runtime-derived, hence inline.
const coverRatio = (id: string) => { const media = mediaOf(id); return media?.width && media.height ? Math.min(4 / 3, Math.max(3 / 4, media.width / media.height)) : 4 / 3; };
// The X avatar through the image proxy, then directly, then the first letter of the source (as the Inspiration cards do).
function Avatar({ id, label }: { id: string; label: string }) {
  const src = mediaOf(id)?.avatar, [tries, setTries] = useState(0);
  return src && tries < 2 ? <img className="collection-avatar" src={tries ? src : proxied(src, 640)} width="20" height="20" loading="lazy" decoding="async" alt="" referrerPolicy="no-referrer" onError={() => setTries(n => n + 1)}/>
    : <span className="collection-avatar" aria-hidden="true">{label.replace(/^@/, '').slice(0, 1).toUpperCase()}</span>;
}

export function CollectionPage({ slug = '' }: { slug?: string }) {
  const language = useLocale(); useSyncExternalStore(subscribe, snapshot, snapshot);
  const l = (k: keyof typeof m) => t(m[k], language), rows = referencesFor(language), [expanded, setExpanded] = useState(false);
  // Collection copy whose English is an unreviewed draft falls back to Chinese where drafts are hidden (production), as the
  // prerender does for those addresses; previews show the draft English.
  const copyIn = (item: { translations?: Translations }) => showDrafts || !isDraft(item, language) ? language : 'zh';
  const copy = (item: { translations?: Translations }, value: Localized) => { const at = copyIn(item); return at === language ? t(value, at) : <span lang="zh-CN">{t(value, at)}</span>; };
  const indexItem = { translations: indexTranslations };
  const list = visibleCollections(facets, rows, showDrafts), current = list.find(c => c.slug === slug);
  const title = current ? `${t(current.title, copyIn(current))} — Variant Design` : t(m.indexTitle, copyIn(indexItem));
  useEffect(() => { document.title = title; document.documentElement.lang = locales[language].htmlLang; }, [language, title]);
  // With 19 collections the current chip can sit past the phone's edge: centre it in the strip (sideways only, the page stays put).
  useEffect(() => { const strip = document.querySelector<HTMLElement>('.collection-channels > div'), on = strip?.querySelector<HTMLElement>('[aria-current="page"]');
    if (strip && on) strip.scrollLeft += on.getBoundingClientRect().left - strip.getBoundingClientRect().left - (strip.clientWidth - on.offsetWidth) / 2; }, [slug]);
  // Channels: every collection one tap away, the current one marked, scrolling sideways on a phone.
  const channels = <nav className="collection-channels" aria-label={l('index')}><div className="site-shell"><a href={localePath('/collections', language)} aria-current={current ? undefined : 'page'}>{l('all')}</a>
    {list.map(c => <a key={c.slug} href={localePath(`/collections/${c.slug}`, language)} aria-current={c.slug === slug ? 'page' : undefined}>{copy(c, c.short)}</a>)}</div></nav>;
  const intro = (text: ReactNode) => <><p className={`collection-intro${expanded ? ' is-open' : ''}`}>{text}</p><button type="button" className="collection-more" aria-expanded={expanded} onClick={() => setExpanded(v => !v)}>{l(expanded ? 'less' : 'more')}</button></>;
  return <main className="content-page collection-page"><SiteHeader language={language}/>
    {current ? <>
      <header className="content-hero site-shell collection-hero"><h1>{copy(current, current.title)}</h1>{intro(copy(current, current.intro))}</header>
      {channels}
      {!current.ready && <div className="site-shell"><p className="collection-draft" role="note">{l('draft')} {t(reviewedCount, language)(current.reviewed)}</p></div>}
      <ul className="site-shell collection-feed">{current.items.map(id => { const r = referenceOf(id); if (!r) return null; const source = sourceOf(r);
        // The whole card is one link to our notes (a large touch target); the source is one tap further, on that page.
        return <li key={id}><a className="collection-card" href={localePath(`/inspiration/${id}`, language)}>
          <span className="collection-cover" style={{ aspectRatio: coverRatio(id) }}><ReferenceCover item={r} locale={language}/></span>
          <span className="collection-title"><b>{r.name}</b> {t(r.focus, language)}</span>
          <span className="collection-foot"><Avatar id={id} label={source}/><span>{source}</span>{facets[id]?.status === 'draft' && <em>{l('draftTag')}</em>}</span></a></li>; })}</ul>
      <section className="site-shell collection-yours"><h2>{l('yours')}</h2><p>{l('yoursNote')}</p><a href={localePath('/docs/install', language)}>{l('install')}</a></section>
    </> : <>
      <header className="content-hero site-shell collection-hero"><h1>{copy(indexItem, m.index)}</h1><p className="collection-intro is-open">{copy(indexItem, m.indexIntro)}</p></header>
      {list.length ? <>{channels}<ul className="site-shell collection-feed">{list.map(c => { const first = referenceOf(c.items[0] ?? '');
        return <li key={c.slug}><a className="collection-card" href={localePath(`/collections/${c.slug}`, language)}>
          {first && <span className="collection-cover" style={{ aspectRatio: coverRatio(first.id) }}><ReferenceCover item={first} locale={language}/></span>}
          <span className="collection-title"><b>{copy(c, c.title)}</b></span>
          <span className="collection-foot"><span>{t(count, language)(c.items.length)}</span>{!c.ready && <em>{l('draftTag')}</em>}</span></a></li>; })}</ul></>
        : <p className="site-shell">{l('empty')}</p>}
    </>}
    <SiteFooter language={language}/></main>;
}
