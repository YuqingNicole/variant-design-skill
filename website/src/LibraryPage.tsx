import { t, type Localized } from './i18n/localized';
import { locales } from './i18n/locales';
import { useEffect, useState } from 'react';
import type { Language } from './direction-engine';
import { SiteHeader, SiteFooter } from './SiteChrome';
import { HomeCase } from './HomeCase';
import { HomeDirectories, HomeHero } from './HomeNavigation';
import { cardUrl, categories, coverDirection, entries, evidenceUrl, mediaUrl, type Direction, type Entry } from './library-data';
import { inspirationItems } from './inspiration-data';
import './content-pages.css';
import './library.css';
import { useLocale } from './i18n/LocaleProvider';
import { localePath } from './i18n/locale-route';
const m={compareThreeDirectionsFor:{zh:'同一个任务，比较三个方向的取舍。',en:'Compare three directions for the same brief.'},
 oneBriefThreeDirections:{zh:'一个任务，三种方向。',en:'One brief, three directions.'},
 exploreOurCasesWith:{zh:'浏览我们制作的案例：每个方向都说明优化、取舍和适用场景。技能产出与概念作品分别标注。',en:'Explore our cases, with each direction’s priorities, tradeoffs and fit. Skill outputs and concept studies are labeled separately.'},
 categories:{zh:'作品分类',en:'Categories'},
 all:{zh:'全部',en:'All'},
 nothingInThisCategory:{zh:'这个分类还没有作品。',en:'Nothing in this category yet.'},
 submissionsPermissions:{zh:'投稿与授权',en:'Submissions & permissions'},
 copiedPasteItInto:{zh:'已复制，粘贴到你项目里的 Claude Code 或 Codex。',en:'Copied. Paste it into Claude Code or Codex in your project.'},
 couldNotCopyAutomatically:{zh:'无法自动复制，请在文本框里选中后手动复制。',en:'Could not copy automatically. Select the text and copy it.'},
 tryItInYour:{zh:'在你的项目里试试',en:'Try it in your project'},
 installTheSkillThen:{zh:'先安装技能，然后把这条指令粘贴给你项目里的 agent。它会读取方向卡，再按你项目自己的品牌和数据出三版。',en:'Install the skill, then paste this into the agent in your project. It reads the card, then makes three versions with your own brand and data.'},
 install:{zh:'安装说明 →',en:'Install →'},
 promptForYourAgent:{zh:'给 agent 的指令',en:'Prompt for your agent'},
 copyPrompt:{zh:'复制指令',en:'Copy prompt'},
 viewTheCardJson:{zh:'查看方向卡 JSON ↗',en:'View the card JSON ↗'},
 library:{zh:'作品',en:'Library'},
 by:{zh:'作者',en:'By'},
 brief:{zh:'任务',en:'Brief'},
 chooseADirection:{zh:'选择方向',en:'Choose a direction'},
 recommended:{zh:'推荐',en:'Recommended'},
 openTheInteractiveVersion:{zh:'打开可交互版本 ↗',en:'Open the interactive version ↗'},
 optimizes:{zh:'优化',en:'Optimizes'},
 tradesOff:{zh:'取舍',en:'Trades off'},
 bestFor:{zh:'适合',en:'Best for'},
 aRecommendationIsNot:{zh:'推荐不等于选定：在你自己的项目里，由你决定。',en:'A recommendation is not a choice: in your project, you decide.'},
 theDirectionNotesAnd:{zh:'三个方向的说明和推荐与技能当时的产出记录逐字一致。',en:'The direction notes and recommendation match the skill’s recorded output word for word.'},
 viewTheOutputRecord:{zh:'查看产出记录 ↗',en:'View the output record ↗'},
 conceptStudyMadeBy:{zh:'概念作品：由我们手工制作，用于展示风格跨度，不是技能的产出。',en:'Concept study: made by hand to show stylistic range, not produced by the skill.'},
 moreEntries:{zh:'更多作品',en:'More entries'},
 variantDesignDirectionLibrary:{zh:'Variant Design 方向库',en:'Variant Design direction library'},
 variantDesignADesign:{zh:'Variant Design — 设计导航，只收核对过的',en:'Variant Design — a design guide, checked before it’s listed'},
 notFoundVariantDesign:{zh:'页面不存在 — Variant Design',en:'Not found — Variant Design'},
 notFound:{zh:'页面不存在',en:'Not found'},
 backToTheLibrary:{zh:'回到作品',en:'Back to the library'}} satisfies Record<string,Localized>;
export type LibraryView = { kind: 'feed' } | { kind: 'category'; id: string } | { kind: 'entry'; slug: string };
const sourceLabel = (e: Entry, language: Language) => t(e.source === 'own' ? e.kind === 'verified' ? { zh: '技能产出 · 已验证', en: 'Made with the skill · verified' } : { zh: '概念作品', en: 'Concept study' } : e.source === 'permission' ? { zh: '授权投稿', en: 'Licensed submission' } : { zh: '外部参考', en: 'External reference' }, language);
const categoryName = (id: string, language: Language) => { const name = categories.find(c => c.id === id)?.name; return name ? t(name, language) : id; };

function Card({ entry, language }: { entry: Entry; language: Language }) {
  // All three directions at a glance: the recommended one large, the other two beside it.
  const cover = coverDirection(entry), trio = [cover, ...entry.directions.filter(d => d !== cover)];
  return <article className="library-card"><a href={localePath(`/d/${entry.slug}`,language)}>
    <span className="library-card-image library-card-trio">{trio.map((d, i) => { const image = d.media[0];
      return <span key={d.id} className="library-card-panel"><img src={mediaUrl(entry, image.file)} width={image.width} height={image.height} alt={i ? '' : t(image.alt,language)} loading="lazy" decoding="async"/><small>{d.id}</small></span>; })}</span>
    <span className="library-card-meta">{categoryName(entry.category, language)} · {sourceLabel(entry, language)}</span>
    <strong>{t(entry.title,language)}</strong><span className="library-card-summary">{t(entry.summary,language)}</span>
  </a></article>;
}

function Feed({ category, language }: { category?: string; language: Language }) {
  const shown = entries.filter(e => !category || e.category === category), used = categories.filter(c => entries.some(e => e.category === c.id));
  return <>
    {category ? <header className="content-hero site-shell library-hero">
      <h1>{categoryName(category, language)}</h1><p>{t(m.compareThreeDirectionsFor,language)}</p></header>
      : <HomeHero language={language}/>}
    {!category && <HomeCase language={language}/>}
    <section className="site-shell library-feed" id="works">
      {!category && <div className="library-feed-heading"><div><h2>{t(m.oneBriefThreeDirections,language)}</h2></div><p>{t(m.exploreOurCasesWith,language)}</p></div>}
      <nav className="content-filters" aria-label={t(m.categories,language)}><a href={localePath('/',language)} aria-current={!category ? 'page' : undefined}>{t(m.all,language)}</a>{used.map(c => <a key={c.id} href={localePath(`/c/${c.id}`,language)} aria-current={category === c.id ? 'page' : undefined}>{t(c.name,language)}</a>)}</nav>
      {shown.length ? <div className="library-grid">{shown.map(e => <Card key={e.slug} entry={e} language={language}/>)}</div> : <p className="library-empty">{t(m.nothingInThisCategory,language)}</p>}
      <p className="library-more"><a href={localePath('/inspiration',language)}>{t({zh:`外部参考：${inspirationItems.length} 个只附链接的公开设计`,en:`External references: ${inspirationItems.length} public designs, linked only`},language)}</a> <a href={localePath('/submit',language)}>{t(m.submissionsPermissions,language)}</a></p>
    </section>
    {!category && <HomeDirectories language={language}/>}</>;
}

// Prompt for the user's own agent; the skill reads the card with scripts/direction-card.mjs.
const tryPrompt = (entry: Entry, d: Direction, language: Language) => t({zh:`用 variant-design 技能，参考方向卡 ${cardUrl(entry)} 里的 ${d.id} 方向（${d.name.zh}），给我项目里对应的页面出 A/B/C 三版：A 贴近这个方向，B 和 C 作为对照。先检查我项目的品牌和设计系统，它们优先于方向卡；只借鉴结构和取舍，不复制卡片里的截图和文案。给出有理由的推荐，但不要替我选定。`,en:`Use the variant-design skill with direction ${d.id} (${d.name.en}) from the direction card ${cardUrl(entry)}. Make A/B/C for the matching page in my project: A follows this direction, B and C are contrasts. Check my project's brand and design system first; they outrank the card. Borrow structure and tradeoffs only, never the card's screenshots or copy. Recommend one with reasons, but do not choose for me.`},language);
function TryIt({ entry, direction, language }: { entry: Entry; direction: Direction; language: Language }) {
  const [status, setStatus] = useState(''), prompt = tryPrompt(entry, direction, language);
  useEffect(() => setStatus(''), [prompt]);
  async function copy() { try { await navigator.clipboard.writeText(prompt); setStatus(t(m.copiedPasteItInto,language)); } catch { setStatus(t(m.couldNotCopyAutomatically,language)); } }
  return <section className="library-try" aria-labelledby="try-title"><h2 id="try-title">{t(m.tryItInYour,language)}</h2>
    <p>{t(m.installTheSkillThen,language)} <a href={localePath('/docs',language)}>{t(m.install,language)}</a></p>
    <textarea readOnly aria-label={t(m.promptForYourAgent,language)} value={prompt} rows={4} onFocus={e => e.currentTarget.select()}/>
    <div><button onClick={copy}>{t(m.copyPrompt,language)}</button><a href={cardUrl(entry)} target="_blank" rel="noreferrer">{t(m.viewTheCardJson,language)}</a></div>
    <p role="status">{status}</p></section>;
}

function Detail({ entry, language }: { entry: Entry; language: Language }) {
  const initial = new URLSearchParams(location.search).get('direction');
  const [active, setActive] = useState(() => entry.directions.find(d => d.id === initial)?.id ?? coverDirection(entry).id);
  const direction = entry.directions.find(d => d.id === active)!, image = direction.media[0], evidence = evidenceUrl(entry);
  const choose = (id: typeof active) => { setActive(id); history.replaceState(null, '', localePath(`/d/${entry.slug}?direction=${id}`, language)); };
  const related = entries.filter(e => e.slug !== entry.slug && e.category === entry.category).concat(entries.filter(e => e.slug !== entry.slug && e.category !== entry.category)).slice(0, 3);
  return <>
    <header className="content-hero site-shell library-detail-hero"><p className="content-back"><a href={localePath('/',language)}>{t(m.library,language)}</a> / <a href={localePath(`/c/${entry.category}`,language)}>{categoryName(entry.category, language)}</a></p>
      <h1>{t(entry.title,language)}</h1><p>{t(entry.summary,language)}</p>
      <p className="library-source"><span data-kind={entry.kind ?? entry.source}>{sourceLabel(entry, language)}</span> {t(m.by,language)} <a href={entry.credit.url} target="_blank" rel="noreferrer">{entry.credit.name}</a> · {entry.publishedAt}</p></header>
    <section className="site-shell library-detail">
      <div className="library-brief"><b>{t(m.brief,language)}</b><p>{t(entry.brief,language)}</p></div>
      <div className="library-tabs" role="group" aria-label={t(m.chooseADirection,language)}>{entry.directions.map(d => <button key={d.id} aria-pressed={d.id === active} onClick={() => choose(d.id)}><b>{d.id}</b>{t(d.name,language)}{entry.recommendation?.variant === d.id && <small>{t(m.recommended,language)}</small>}</button>)}</div>
      <figure className="library-figure"><img key={direction.id} src={mediaUrl(entry, image.file)} width={image.width} height={image.height} alt={t(image.alt,language)}/><figcaption>{direction.id} · {t(direction.name,language)}{direction.preview && <> · <a href={direction.preview + (direction.preview.includes('?') ? '&' : '?') + `language=${language}`} target="_blank" rel="noreferrer">{t(m.openTheInteractiveVersion,language)}</a></>}</figcaption></figure>
      <dl className="library-comparison"><div><dt>{t(m.optimizes,language)}</dt><dd>{t(direction.comparison.optimizes,language)}</dd></div><div><dt>{t(m.tradesOff,language)}</dt><dd>{t(direction.comparison.tradeoff,language)}</dd></div><div><dt>{t(m.bestFor,language)}</dt><dd>{t(direction.comparison.bestFor,language)}</dd></div></dl>
      <TryIt entry={entry} direction={direction} language={language}/>
      {entry.recommendation && <aside className="library-recommendation"><b>{t({zh:`推荐 ${entry.recommendation.variant}`,en:`Recommends ${entry.recommendation.variant}`},language)}</b><p>{t(entry.recommendation.reason,language)}</p><small>{t(m.aRecommendationIsNot,language)}</small></aside>}
      <p className="library-evidence">{evidence ? <>{t(m.theDirectionNotesAnd,language)} <a href={evidence} target="_blank" rel="noreferrer">{t(m.viewTheOutputRecord,language)}</a></> : entry.kind === 'concept' ? (t(m.conceptStudyMadeBy,language)) : null}</p>
      {related.length > 0 && <section className="library-related"><h2>{t(m.moreEntries,language)}</h2><div className="library-grid">{related.map(e => <Card key={e.slug} entry={e} language={language}/>)}</div></section>}
    </section></>;
}

export function LibraryPage({ view }: { view: LibraryView }) {
  const language = useLocale();
  const entry = view.kind === 'entry' ? entries.find(e => e.slug === view.slug) : undefined;
  const known = view.kind === 'feed' || (view.kind === 'category' && categories.some(c => c.id === view.id)) || !!entry;
  useEffect(() => {
    document.documentElement.lang = locales[language].htmlLang;
    const site = t(m.variantDesignDirectionLibrary,language);
    document.title = entry ? `${t(entry.title,language)} — ${site}` : view.kind === 'category' && known ? `${categoryName(view.id, language)} — ${site}` : known ? (t(m.variantDesignADesign,language)) : (t(m.notFoundVariantDesign,language));
  }, [language, entry, view, known]);
  return <main className="content-page library-page"><SiteHeader language={language} page="library"/>
    {!known ? <header className="content-hero site-shell"><h1>{t(m.notFound,language)}</h1><p><a href={localePath('/',language)}>{t(m.backToTheLibrary,language)}</a></p></header>
      : entry ? <Detail entry={entry} language={language}/> : <Feed category={view.kind === 'category' ? view.id : undefined} language={language}/>}
    <SiteFooter language={language}/></main>;
}
