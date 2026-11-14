import { useEffect, useState } from 'react';
import changelog from '../../CHANGELOG.md?raw';
import currentVersionFile from '../../VERSION?raw';
import { SiteHeader, SiteFooter } from './SiteChrome';
import { inline, parseChangelog, releaseId, packageVersion, splitItem, monthOf, formatDate, formatMonth, type Block } from './changelog';
import { changelogZh } from './changelog-zh';
import { t, type Localized } from './i18n/localized';
import { useLocale } from './i18n/LocaleProvider';
import { localePath } from './i18n/locale-route';
import './content-pages.css';

const m = {
  title: { zh: '更新记录', en: 'Changelog' },
  current: { zh: '当前', en: 'Current' },
  intro: { zh: '技能每个版本改了什么；网站的改动标着它自己的包版本。来源是仓库里的 CHANGELOG.md，更新方法见安装指南。', en: 'What changed in each version of the skill; the website’s changes carry their own package version. From CHANGELOG.md in the repository; see the install guide for how to update.' },
  timeline: { zh: '按月浏览', en: 'By month' },
  unreleasedTitle: { zh: '未发布', en: 'Unreleased' },
  unreleased: { zh: '技能 {version} 之后的改动，下一个版本发布时归入版本号；其中网站的改动已经上线。', en: 'Changes since skill {version}; they get a version number at the next release. The website changes listed here are already live.' },
  show: { zh: '只看', en: 'Show' },
  all: { zh: '全部', en: 'All' },
  skill: { zh: '技能', en: 'Skill' },
  website: { zh: '网站', en: 'Website' },
  package: { zh: '网站包', en: 'Website package' },
  source: { zh: '在 GitHub 上查看 CHANGELOG.md', en: 'View CHANGELOG.md on GitHub' },
  start: { zh: '安装并开始使用', en: 'Install and get started' },
} satisfies Record<string, Localized>;
type Lang = Parameters<typeof t>[1];
type Show = 'all' | 'skill' | 'website';
const releases = parseChangelog(changelog);
const currentVersion = currentVersionFile.trim();
const Text = ({ value }: { value: string }) => <>{inline(value).map((part, i) => 'code' in part ? <code key={i}>{part.code}</code> : part.text)}</>;

// A release is its summary (the text before the first heading) and its items in the order written. Each item keeps its English
// text beside the shown one (the Website area and package versions are read off the English markers), its label as the title,
// and a tag: the package version under "Website", the area name elsewhere.
type Item = { en: string; title: string | null; body: string; website: boolean; tag: string };
function itemsOf(blocks: Block[], zh: string[] | undefined, language: Lang) {
  const lede: string[] = [], items: Item[] = [];
  let area: string | undefined, website = false, version: string | null = null;
  blocks.forEach((b, i) => {
    const text = zh?.[i] ?? b.text;
    if (b.kind === 'heading') { area = text; website = b.text === 'Website'; version = null; return; }
    if (area === undefined && b.kind === 'text') { lede.push(text); return; }
    if (website) version = packageVersion(b.text) ?? version;
    items.push({ en: b.text, ...splitItem(text), website, tag: website && version ? `${t(m.package, language)} ${version}` : area ?? '' });
  });
  return { lede, items };
}
// Years and months with a release, newest first; the unreleased group sits at the top of the newest year.
function timeline(language: Lang) {
  const years: { year: string; entries: { key: string; href: string; label: string }[] }[] = [];
  const newest = monthOf(releases.find(r => r.date)?.date ?? null)?.slice(0, 4) ?? String(new Date().getFullYear());
  for (const r of releases) {
    const month = monthOf(r.date), key = month ?? 'unreleased', year = month?.slice(0, 4) ?? newest;
    let group = years.find(y => y.year === year);
    if (!group) years.push(group = { year, entries: [] });
    if (!group.entries.some(e => e.key === key)) group.entries.push({ key, href: `#${releaseId(r.version)}`, label: month ? formatMonth(month, language) : t(m.unreleasedTitle, language) });
  }
  return years;
}

export function ChangelogPage() {
  const language = useLocale(), title = t(m.title, language), years = timeline(language);
  const [show, setShow] = useState<Show>('all');
  const [active, setActive] = useState(() => years[0]?.entries[0]?.key ?? '');
  useEffect(() => { document.title = `${title} — Variant Design`; document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'; }, [title, language]);
  // The timeline follows the reader: the first release block inside the top two fifths of the viewport names the current month.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const seen = new Map<Element, boolean>();
    const io = new IntersectionObserver(entries => {
      for (const e of entries) seen.set(e.target, e.isIntersecting);
      const first = [...document.querySelectorAll<HTMLElement>('.changelog-release')].find(s => seen.get(s));
      if (first) setActive(first.dataset.month!);
    }, { rootMargin: '0px 0px -60% 0px' });
    document.querySelectorAll('.changelog-release').forEach(s => io.observe(s));
    return () => io.disconnect();
  }, [show]);
  return <main className="content-page changelog-page"><SiteHeader language={language}/>
    <header className="content-hero site-shell"><h1>{title}</h1><p>{t(m.intro, language)}</p></header>
    <div className="site-shell docs-layout">
      <aside aria-label={t(m.timeline, language)}>{years.map(y => <div key={y.year} className="changelog-year"><b>{y.year}</b>
        {y.entries.map(e => <a key={e.key} href={e.href} className={e.key === active ? 'changelog-nav-current' : undefined} aria-current={e.key === active ? 'location' : undefined}>{e.label}</a>)}</div>)}</aside>
      <div className="content-reading">
        <div className="changelog-filters" role="group" aria-label={t(m.show, language)}>{(['all', 'skill', 'website'] as const).map(k => <button key={k} type="button" aria-pressed={show === k} onClick={() => setShow(k)}>{t(m[k], language)}</button>)}</div>
        {releases.map(r => {
          const zh = language === 'zh' ? changelogZh[r.version] : undefined, { lede, items } = itemsOf(r.blocks, zh?.blocks, language);
          const shown = show === 'all' ? items : items.filter(it => it.website === (show === 'website'));
          if (!shown.length) return null;
          const isCurrent = r.version === currentVersion, unreleased = !r.date;
          return <section id={releaseId(r.version)} key={r.version} className="changelog-release" data-month={monthOf(r.date) ?? 'unreleased'}>
            {r.date && <p className="changelog-date"><time dateTime={r.date}>{formatDate(r.date, language)}</time></p>}
            <h2 className="changelog-heading">{unreleased ? zh?.title ?? t(m.unreleasedTitle, language) : r.version}</h2>
            {!unreleased && <p className="changelog-tags"><span className="changelog-pill">{t(m.skill, language)}</span>{isCurrent && <span className="changelog-current">{t(m.current, language)}</span>}</p>}
            {lede.map(p => <p key={p} className="changelog-lede"><Text value={p}/></p>)}
            {unreleased && <p className="changelog-note">{t(m.unreleased, language).replace('{version}', currentVersion)}</p>}
            <ul className="changelog-grid">{shown.map(it => <li key={it.en} className="changelog-item">{it.title && <h3><Text value={it.title}/></h3>}<p><Text value={it.body}/></p><small>{it.tag}</small></li>)}</ul>
          </section>;
        })}
        <p className="content-link"><a href="https://github.com/YuqingNicole/variant-design-skill/blob/master/CHANGELOG.md" target="_blank" rel="noreferrer">{t(m.source, language)} ↗</a></p></div></div>
    <section className="content-closing site-shell"><a className="content-button" href={localePath('/docs/install', language)}>{t(m.start, language)} ↗</a></section>
    <SiteFooter language={language}/></main>;
}
