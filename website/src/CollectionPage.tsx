import { useEffect, useSyncExternalStore } from 'react';
import { SiteHeader, SiteFooter } from './SiteChrome';
import { t, type Localized } from './i18n/localized';
import { locales } from './i18n/locales';
import { useLocale } from './i18n/LocaleProvider';
import { localePath } from './i18n/locale-route';
import { showDrafts } from './i18n/translations';
import { references, referencesFor, referenceOf, ensure, subscribe, snapshot } from './reference-library';
import { visibleCollections, collectionBySlug, collectionState, minimumReviewed } from './collections';
import facetData from './reference-facets.json';
import type { ReferenceFacets } from './reference-facets';
import './content-pages.css';
import './collections.css';
const facets = facetData as Record<string, ReferenceFacets>;
const m = {
  index: { zh: '设计合集', en: 'Design collections' }, indexTitle: { zh: '设计合集 — Variant Design', en: 'Design collections — Variant Design' },
  indexIntro: { zh: '按行业、页面模式、交互技法和视觉风格整理的参考合集。每一条都附出处和我们的笔记。', en: 'References grouped by industry, page pattern, interaction technique and visual style, each with its source and our notes.' },
  crumbs: { zh: '路径', en: 'Breadcrumb' }, home: { zh: '灵感', en: 'Inspiration' }, study: { zh: '研究什么', en: 'Study' }, apply: { zh: '用在哪里', en: 'Apply' },
  details: { zh: '查看笔记', en: 'Read the notes' }, visit: { zh: '访问原站', en: 'Visit source' },
  draft: { zh: '预览：这一页的属性还是初稿，没有人打开作品核对过，正式站不会显示这一页。', en: 'Preview: the attributes on this page are drafts nobody has checked against the work yet. The live site does not show this page.' },
  yours: { zh: '做出你的版本', en: 'Make your version' }, yoursNote: { zh: '挑几条加入参考包，让 variant-design 技能在你自己的项目里生成 A/B/C 三个方向。', en: 'Pick a few for your reference pack and let the variant-design skill generate three A/B/C directions in your own project.' },
  draftTag: { zh: '初稿', en: 'draft' }, install: { zh: '安装技能', en: 'Install the skill' }, empty: { zh: '还没有可以公开的合集。', en: 'No collections are public yet.' },
} satisfies Record<string, Localized>;
const count = { zh: (n: number) => `${n} 条参考`, en: (n: number) => `${n} references` };
const reviewedCount = { zh: (n: number) => `${n} 条已核对，满 ${minimumReviewed} 条才会上线`, en: (n: number) => `${n} reviewed; ${minimumReviewed} needed to go live` };

// Before the first render: the full records of the collection's members (the SSR build has them all).
export function prepare(slug: string) { const c = collectionBySlug(slug); return c ? ensure(collectionState(c, facets, references).members) : Promise.resolve(); }

export function CollectionPage({ slug = '' }: { slug?: string }) {
  const language = useLocale(); useSyncExternalStore(subscribe, snapshot, snapshot);
  const l = (k: keyof typeof m) => t(m[k], language), rows = referencesFor(language);
  const list = visibleCollections(facets, rows, showDrafts), current = list.find(c => c.slug === slug);
  const title = current ? `${t(current.title, language)} — Variant Design` : l('indexTitle');
  useEffect(() => { document.title = title; document.documentElement.lang = locales[language].htmlLang; }, [language, title]);
  const crumbs = <nav className="collection-crumbs" aria-label={l('crumbs')}><a href={localePath('/', language)}>{l('home')}</a> / {current ? <a href={localePath('/collections', language)}>{l('index')}</a> : l('index')}</nav>;
  return <main className="content-page collection-page"><SiteHeader language={language}/>
    {current ? <>
      <header className="content-hero site-shell">{crumbs}<h1>{t(current.title, language)}</h1><p>{t(current.intro, language)}</p></header>
      {!current.ready && <div className="site-shell"><p className="collection-draft" role="note">{l('draft')} {t(reviewedCount, language)(current.reviewed)}</p></div>}
      <section className="site-shell collection-grid">{current.items.map(id => { const r = referenceOf(id); if (!r) return null;
        return <article key={id}><small>{r.tag}{facets[id]?.status === 'draft' ? ` · ${l('draftTag')}` : ''}</small><h2><a href={localePath(`/inspiration/${id}`, language)}>{r.name}</a></h2>
          <dl><dt>{l('study')}</dt><dd>{t(r.focus, language)}</dd><dt>{l('apply')}</dt><dd>{t(r.application, language)}</dd></dl>
          <p><a href={localePath(`/inspiration/${id}`, language)}>{l('details')}</a> · <a href={r.url} target="_blank" rel="noreferrer">{l('visit')} ↗</a></p></article>; })}</section>
      <section className="site-shell collection-yours"><h2>{l('yours')}</h2><p>{l('yoursNote')}</p><a href={localePath('/docs/install', language)}>{l('install')}</a></section>
    </> : <>
      <header className="content-hero site-shell">{crumbs}<h1>{l('index')}</h1><p>{l('indexIntro')}</p></header>
      <section className="site-shell collection-grid">{list.length ? list.map(c => <article key={c.slug}><small>{t(count, language)(c.items.length)}{c.ready ? '' : ` · ${l('draftTag')}`}</small>
        <h2><a href={localePath(`/collections/${c.slug}`, language)}>{t(c.title, language)}</a></h2><p>{t(c.intro, language)}</p></article>) : <p>{l('empty')}</p>}</section>
    </>}
    <SiteFooter language={language}/></main>;
}
