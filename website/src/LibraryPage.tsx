import { useEffect, useState } from 'react';
import type { Language } from './direction-engine';
import { SiteHeader, SiteFooter } from './SiteChrome';
import { cardUrl, categories, coverDirection, entries, evidenceUrl, mediaUrl, type Direction, type Entry } from './library-data';
import './content-pages.css';
import './library.css';
export type LibraryView = { kind: 'feed' } | { kind: 'category'; id: string } | { kind: 'entry'; slug: string };
const sourceLabel = (e: Entry, ix: number) => (e.source === 'own' ? e.kind === 'verified' ? ['技能产出 · 已验证', 'Made with the skill · verified'] : ['概念作品', 'Concept study'] : e.source === 'permission' ? ['授权投稿', 'Licensed submission'] : ['外部参考', 'External reference'])[ix];
const categoryName = (id: string, ix: number) => categories.find(c => c.id === id)?.name[ix] ?? id;

function Card({ entry, ix }: { entry: Entry; ix: number }) {
  const cover = coverDirection(entry), image = cover.media[0];
  return <article className="library-card"><a href={`/d/${entry.slug}`}>
    <span className="library-card-image"><img src={mediaUrl(entry, image.file)} width={image.width} height={image.height} alt={image.alt[ix]} loading="lazy" decoding="async"/><small>A · B · C</small></span>
    <span className="library-card-meta">{categoryName(entry.category, ix)} · {sourceLabel(entry, ix)}</span>
    <strong>{entry.title[ix]}</strong><span className="library-card-summary">{entry.summary[ix]}</span>
  </a></article>;
}

function Feed({ category, ix, zh }: { category?: string; ix: number; zh: boolean }) {
  const shown = entries.filter(e => !category || e.category === category), used = categories.filter(c => entries.some(e => e.category === c.id));
  return <>
    <header className="content-hero site-shell library-hero"><p className="content-kicker">DIRECTION LIBRARY</p>
      <h1>{category ? categoryName(category, ix) : zh ? <>一个任务，<br/>三个方向。</> : <>One brief.<br/>Three directions.</>}</h1>
      <p>{zh ? '每件作品都是同一个任务的 A/B/C 三个方向，写明各自优化什么、牺牲什么、适合什么场景。看到合适的，就在你自己的项目里出三版。' : 'Each entry is one brief with three directions, each stating what it optimizes, what it trades off and where it fits. When one fits, make three of your own in your project.'}</p></header>
    <section className="site-shell library-feed">
      <nav className="content-filters" aria-label={zh ? '作品分类' : 'Categories'}><a href="/" aria-current={!category ? 'page' : undefined}>{zh ? '全部' : 'All'}</a>{used.map(c => <a key={c.id} href={`/c/${c.id}`} aria-current={category === c.id ? 'page' : undefined}>{c.name[ix]}</a>)}</nav>
      {shown.length ? <div className="library-grid">{shown.map(e => <Card key={e.slug} entry={e} ix={ix}/>)}</div> : <p className="library-empty">{zh ? '这个分类还没有作品。' : 'Nothing in this category yet.'}</p>}
      <p className="library-more"><a href="/inspiration">{zh ? '外部参考：24 个只附链接的公开设计 →' : 'External references: 24 public designs, linked only →'}</a> <a href="/submit">{zh ? '投稿与授权 →' : 'Submissions & permissions →'}</a></p>
    </section></>;
}

// Prompt for the user's own agent; the skill reads the card with scripts/direction-card.mjs.
const tryPrompt = (entry: Entry, d: Direction, zh: boolean) => zh
  ? `用 variant-design 技能，参考方向卡 ${cardUrl(entry)} 里的 ${d.id} 方向（${d.name[0]}），给我项目里对应的页面出 A/B/C 三版：A 贴近这个方向，B 和 C 作为对照。先检查我项目的品牌和设计系统，它们优先于方向卡；只借鉴结构和取舍，不复制卡片里的截图和文案。给出有理由的推荐，但不要替我选定。`
  : `Use the variant-design skill with direction ${d.id} (${d.name[1]}) from the direction card ${cardUrl(entry)}. Make A/B/C for the matching page in my project: A follows this direction, B and C are contrasts. Check my project's brand and design system first; they outrank the card. Borrow structure and tradeoffs only, never the card's screenshots or copy. Recommend one with reasons, but do not choose for me.`;
function TryIt({ entry, direction, zh }: { entry: Entry; direction: Direction; zh: boolean }) {
  const [status, setStatus] = useState(''), prompt = tryPrompt(entry, direction, zh);
  useEffect(() => setStatus(''), [prompt]);
  async function copy() { try { await navigator.clipboard.writeText(prompt); setStatus(zh ? '已复制，粘贴到你项目里的 Claude Code 或 Codex。' : 'Copied. Paste it into Claude Code or Codex in your project.'); } catch { setStatus(zh ? '无法自动复制，请在文本框里选中后手动复制。' : 'Could not copy automatically. Select the text and copy it.'); } }
  return <section className="library-try" aria-labelledby="try-title"><h2 id="try-title">{zh ? '在你的项目里试试' : 'Try it in your project'}</h2>
    <p>{zh ? '先安装技能，然后把这条指令粘贴给你项目里的 agent。它会读取方向卡，再按你项目自己的品牌和数据出三版。' : 'Install the skill, then paste this into the agent in your project. It reads the card, then makes three versions with your own brand and data.'} <a href="/docs">{zh ? '安装说明 →' : 'Install →'}</a></p>
    <textarea readOnly aria-label={zh ? '给 agent 的指令' : 'Prompt for your agent'} value={prompt} rows={4} onFocus={e => e.currentTarget.select()}/>
    <div><button onClick={copy}>{zh ? '复制指令' : 'Copy prompt'}</button><a href={cardUrl(entry)} target="_blank" rel="noreferrer">{zh ? '查看方向卡 JSON ↗' : 'View the card JSON ↗'}</a></div>
    <p role="status">{status}</p></section>;
}

function Detail({ entry, ix, zh }: { entry: Entry; ix: number; zh: boolean }) {
  const initial = new URLSearchParams(location.search).get('direction');
  const [active, setActive] = useState(() => entry.directions.find(d => d.id === initial)?.id ?? coverDirection(entry).id);
  const direction = entry.directions.find(d => d.id === active)!, image = direction.media[0], evidence = evidenceUrl(entry);
  const choose = (id: typeof active) => { setActive(id); history.replaceState(null, '', `/d/${entry.slug}?direction=${id}`); };
  const related = entries.filter(e => e.slug !== entry.slug && e.category === entry.category).concat(entries.filter(e => e.slug !== entry.slug && e.category !== entry.category)).slice(0, 3);
  return <>
    <header className="content-hero site-shell library-detail-hero"><p className="content-back"><a href="/">{zh ? '作品' : 'Library'}</a> / <a href={`/c/${entry.category}`}>{categoryName(entry.category, ix)}</a></p>
      <h1>{entry.title[ix]}</h1><p>{entry.summary[ix]}</p>
      <p className="library-source"><span data-kind={entry.kind ?? entry.source}>{sourceLabel(entry, ix)}</span> {zh ? '作者' : 'By'} <a href={entry.credit.url} target="_blank" rel="noreferrer">{entry.credit.name}</a> · {entry.publishedAt}</p></header>
    <section className="site-shell library-detail">
      <div className="library-brief"><b>{zh ? '任务' : 'Brief'}</b><p>{entry.brief[ix]}</p></div>
      <div className="library-tabs" role="group" aria-label={zh ? '选择方向' : 'Choose a direction'}>{entry.directions.map(d => <button key={d.id} aria-pressed={d.id === active} onClick={() => choose(d.id)}><b>{d.id}</b>{d.name[ix]}{entry.recommendation?.variant === d.id && <small>{zh ? '推荐' : 'Recommended'}</small>}</button>)}</div>
      <figure className="library-figure"><img key={direction.id} src={mediaUrl(entry, image.file)} width={image.width} height={image.height} alt={image.alt[ix]}/><figcaption>{direction.id} · {direction.name[ix]}{direction.preview && <> · <a href={direction.preview + (direction.preview.includes('?') ? '&' : '?') + `language=${zh ? 'zh' : 'en'}`} target="_blank" rel="noreferrer">{zh ? '打开可交互版本 ↗' : 'Open the interactive version ↗'}</a></>}</figcaption></figure>
      <dl className="library-comparison"><div><dt>{zh ? '优化' : 'Optimizes'}</dt><dd>{direction.comparison.optimizes[ix]}</dd></div><div><dt>{zh ? '取舍' : 'Trades off'}</dt><dd>{direction.comparison.tradeoff[ix]}</dd></div><div><dt>{zh ? '适合' : 'Best for'}</dt><dd>{direction.comparison.bestFor[ix]}</dd></div></dl>
      <TryIt entry={entry} direction={direction} zh={zh}/>
      {entry.recommendation && <aside className="library-recommendation"><b>{zh ? `推荐 ${entry.recommendation.variant}` : `Recommends ${entry.recommendation.variant}`}</b><p>{entry.recommendation.reason[ix]}</p><small>{zh ? '推荐不等于选定：在你自己的项目里，由你决定。' : 'A recommendation is not a choice: in your project, you decide.'}</small></aside>}
      <p className="library-evidence">{evidence ? <>{zh ? '三个方向的说明和推荐与技能当时的产出记录逐字一致。' : 'The direction notes and recommendation match the skill’s recorded output word for word.'} <a href={evidence} target="_blank" rel="noreferrer">{zh ? '查看产出记录 ↗' : 'View the output record ↗'}</a></> : entry.kind === 'concept' ? (zh ? '概念作品：由我们手工制作，用于展示风格跨度，不是技能的产出。' : 'Concept study: made by hand to show stylistic range, not produced by the skill.') : null}</p>
      {related.length > 0 && <section className="library-related"><h2>{zh ? '更多作品' : 'More entries'}</h2><div className="library-grid">{related.map(e => <Card key={e.slug} entry={e} ix={ix}/>)}</div></section>}
    </section></>;
}

export function LibraryPage({ view }: { view: LibraryView }) {
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem('variant-language') === 'en' ? 'en' : 'zh');
  const zh = language === 'zh', ix = zh ? 0 : 1;
  const entry = view.kind === 'entry' ? entries.find(e => e.slug === view.slug) : undefined;
  const known = view.kind === 'feed' || (view.kind === 'category' && categories.some(c => c.id === view.id)) || !!entry;
  useEffect(() => {
    document.documentElement.lang = zh ? 'zh-CN' : 'en'; localStorage.setItem('variant-language', language);
    const site = zh ? 'Variant Design 方向库' : 'Variant Design direction library';
    document.title = entry ? `${entry.title[ix]} — ${site}` : view.kind === 'category' && known ? `${categoryName(view.id, ix)} — ${site}` : known ? site : (zh ? '页面不存在 — Variant Design' : 'Not found — Variant Design');
  }, [language, zh, ix, entry, view, known]);
  return <main className="content-page library-page"><SiteHeader language={language} onLanguage={() => setLanguage(zh ? 'en' : 'zh')} page="library"/>
    {!known ? <header className="content-hero site-shell"><h1>{zh ? '页面不存在' : 'Not found'}</h1><p><a href="/">{zh ? '回到作品' : 'Back to the library'}</a></p></header>
      : entry ? <Detail entry={entry} ix={ix} zh={zh}/> : <Feed category={view.kind === 'category' ? view.id : undefined} ix={ix} zh={zh}/>}
    <SiteFooter language={language}/></main>;
}
