import { Fragment, useEffect } from 'react';
import changelog from '../../CHANGELOG.md?raw';
import currentVersionFile from '../../VERSION?raw';
import { SiteHeader, SiteFooter } from './SiteChrome';
import { inline, parseChangelog, releaseId, packageGroups, withoutPackageLead, type Block } from './changelog';
import { changelogZh } from './changelog-zh';
import { t, type Localized } from './i18n/localized';
import { useLocale } from './i18n/LocaleProvider';
import { localePath } from './i18n/locale-route';
import './content-pages.css';

const m = {
  title: { zh: '更新记录', en: 'Changelog' },
  current: { zh: '当前', en: 'Current' },
  intro: { zh: '技能每个版本改了什么，网站的改动按它自己的版本号分组。来源是仓库里的 CHANGELOG.md；更新方法见安装指南。', en: 'What changed in each version of the skill, with the website’s changes grouped under its own version numbers. From CHANGELOG.md in the repository; see the install guide for how to update.' },
  versions: { zh: '版本', en: 'Versions' },
  unreleased: { zh: '技能 {version} 之后的改动，下一个版本发布时归入版本号；其中网站的改动已经上线。', en: 'Changes since skill {version}; they get a version number at the next release. The website changes listed here are already live.' },
  package: { zh: '网站包', en: 'Website package' },
  source: { zh: '在 GitHub 上查看 CHANGELOG.md', en: 'View CHANGELOG.md on GitHub' },
  start: { zh: '安装并开始使用', en: 'Install and get started' },
} satisfies Record<string, Localized>;
const releases = parseChangelog(changelog);
const currentVersion = currentVersionFile.trim();
const Text = ({ value }: { value: string }) => <>{inline(value).map((part, i) => 'code' in part ? <code key={i}>{part.code}</code> : part.text)}</>;

// A release is its summary (the text before the first heading) and one area per heading, holding paragraphs and lists in the
// order written. Items keep their English text beside the shown one: the Website area is grouped on the English markers.
type Item = { en: string; text: string };
type Part = { kind: 'text'; text: string } | { kind: 'list'; items: Item[] };
type Area = { heading?: string; website: boolean; parts: Part[] };
function sections(blocks: Block[], zh?: string[]) {
  const lede: string[] = [], areas: Area[] = [];
  blocks.forEach((b, i) => {
    const text = zh?.[i] ?? b.text;
    if (b.kind === 'heading') { areas.push({ heading: text, website: b.text === 'Website', parts: [] }); return; }
    if (!areas.length && b.kind === 'text') { lede.push(text); return; }
    if (!areas.length) areas.push({ website: false, parts: [] });
    const parts = areas.at(-1)!.parts, last = parts.at(-1);
    if (b.kind === 'text') parts.push({ kind: 'text', text });
    else if (last?.kind === 'list') last.items.push({ en: b.text, text });
    else parts.push({ kind: 'list', items: [{ en: b.text, text }] });
  });
  return { lede, areas };
}
const List = ({ items, trim }: { items: Item[]; trim?: boolean }) => <ul>{items.map(item => <li key={item.en}><Text value={trim ? withoutPackageLead(item.text) : item.text}/></li>)}</ul>;

export function ChangelogPage() {
  const language = useLocale(), title = t(m.title, language);
  useEffect(() => { document.title = `${title} — Variant Design`; document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'; }, [title, language]);
  const name = (version: string) => language === 'zh' ? changelogZh[version]?.title ?? version : version;
  return <main className="content-page changelog-page"><SiteHeader language={language}/>
    <header className="content-hero site-shell"><h1>{title}</h1><p>{t(m.intro, language)}</p></header>
    <div className="site-shell docs-layout"><aside aria-label={t(m.versions, language)}>{releases.map(r => { const isCurrent = r.version === currentVersion; return <a key={r.version} className={isCurrent ? 'changelog-nav-current' : undefined} aria-current={isCurrent ? 'location' : undefined} href={`#${releaseId(r.version)}`}><span>{name(r.version)}{isCurrent && <small className="changelog-current">{t(m.current, language)}</small>}</span>{r.date && <time className="changelog-nav-date" dateTime={r.date}>{r.date}</time>}</a>; })}</aside>
      <div className="content-reading">{releases.map(r => {
        const zh = language === 'zh' ? changelogZh[r.version] : undefined, { lede, areas } = sections(r.blocks, zh?.blocks);
        const isCurrent = r.version === currentVersion, unreleased = !r.date && !/^\d/.test(r.version);
        return <section id={releaseId(r.version)} key={r.version} className="changelog-release"><h2 className="changelog-heading">{zh?.title ?? r.version}{isCurrent && <small className="changelog-current">{t(m.current, language)}</small>}{r.date && <time className="changelog-date" dateTime={r.date}>{r.date}</time>}</h2>
          {lede.map(p => <p key={p} className="changelog-lede"><Text value={p}/></p>)}
          {unreleased && <p className="changelog-note">{t(m.unreleased, language).replace('{version}', currentVersion)}</p>}
          {areas.map((a, i) => <div key={i} className="changelog-area">{a.heading && <h3>{a.heading}</h3>}
            {a.parts.map((p, j) => p.kind === 'text' ? <p key={j}><Text value={p.text}/></p>
              : a.website ? <Fragment key={j}>{packageGroups(p.items).map(g => <div key={g.version ?? 'loose'} className="changelog-package" id={g.version ? `web-${g.version.replace(/\./g, '-')}` : undefined}>{g.version && <h4><b>{g.version}</b><span>{t(m.package, language)}</span></h4>}<List items={g.items} trim/></div>)}</Fragment>
              : <List key={j} items={p.items}/>)}
          </div>)}
        </section>;
      })}
      <p className="content-link"><a href="https://github.com/YuqingNicole/variant-design-skill/blob/master/CHANGELOG.md" target="_blank" rel="noreferrer">{t(m.source, language)} ↗</a></p></div></div>
    <section className="content-closing site-shell"><a className="content-button" href={localePath('/docs/install', language)}>{t(m.start, language)} ↗</a></section>
    <SiteFooter language={language}/></main>;
}
