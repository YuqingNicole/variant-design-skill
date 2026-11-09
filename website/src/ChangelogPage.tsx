import { useEffect } from 'react';
import changelog from '../../CHANGELOG.md?raw';
import currentVersionFile from '../../VERSION?raw';
import { SiteHeader, SiteFooter } from './SiteChrome';
import { inline, parseChangelog, releaseId, type Block } from './changelog';
import { changelogZh } from './changelog-zh';
import { t, type Localized } from './i18n/localized';
import { useLocale } from './i18n/LocaleProvider';
import { localePath } from './i18n/locale-route';
import './content-pages.css';

const m = {
  title: { zh: '更新记录', en: 'Changelog' },
  current: { zh: '当前', en: 'Current' },
  intro: { zh: '技能每个版本改了什么。来源是仓库里的 CHANGELOG.md；更新方法见安装指南。', en: 'What changed in each version of the skill, from CHANGELOG.md in the repository. See the install guide for how to update.' },
  source: { zh: '在 GitHub 上查看 CHANGELOG.md', en: 'View CHANGELOG.md on GitHub' },
  start: { zh: '安装并开始使用', en: 'Install and get started' },
} satisfies Record<string, Localized>;
const releases = parseChangelog(changelog);
const currentVersion = currentVersionFile.trim();
const Text = ({ value }: { value: string }) => <>{inline(value).map((part, i) => 'code' in part ? <code key={i}>{part.code}</code> : part.text)}</>;

// Groups blocks under their headings, so each section renders as a heading and one list.
function sections(blocks: Block[], zh?: string[]) {
  const out: { heading?: string; text: string[]; items: string[] }[] = [{ text: [], items: [] }];
  blocks.forEach((b, i) => {
    const value = zh?.[i] ?? b.text;
    if (b.kind === 'heading') out.push({ heading: value, text: [], items: [] });
    else (b.kind === 'item' ? out.at(-1)!.items : out.at(-1)!.text).push(value);
  });
  return out.filter(s => s.heading || s.text.length || s.items.length);
}

export function ChangelogPage() {
  const language = useLocale(), title = t(m.title, language);
  useEffect(() => { document.title = `${title} — Variant Design`; document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'; }, [title, language]);
  return <main className="content-page"><SiteHeader language={language}/>
    <header className="content-hero site-shell"><h1>{title}</h1><p>{t(m.intro, language)}</p></header>
    <div className="site-shell docs-layout"><aside>{releases.map(r => { const isCurrent = r.version === currentVersion; return <a key={r.version} className={isCurrent ? 'changelog-nav-current' : undefined} aria-current={isCurrent ? 'location' : undefined} href={`#${releaseId(r.version)}`}><span>{language === 'zh' ? changelogZh[r.version]?.title ?? r.version : r.version}</span>{isCurrent && <small className="changelog-current">{t(m.current, language)}</small>}</a>; })}</aside>
      <div className="content-reading">{releases.map(r => {
        const zh = language === 'zh' ? changelogZh[r.version] : undefined;
        const isCurrent = r.version === currentVersion;
        return <section id={releaseId(r.version)} key={r.version}><h2 className="changelog-heading">{zh?.title ?? r.version}{isCurrent && <small className="changelog-current">{t(m.current, language)}</small>}{r.date && <time className="changelog-date" dateTime={r.date}>{r.date}</time>}</h2>
          {sections(r.blocks, zh?.blocks).map((s, i) => <div key={i}>{s.heading && <h3>{s.heading}</h3>}
            {s.text.map(p => <p key={p}><Text value={p}/></p>)}
            {s.items.length > 0 && <ul>{s.items.map(item => <li key={item}><Text value={item}/></li>)}</ul>}</div>)}
        </section>;
      })}
      <p className="content-link"><a href="https://github.com/YuqingNicole/variant-design-skill/blob/master/CHANGELOG.md" target="_blank" rel="noreferrer">{t(m.source, language)} ↗</a></p></div></div>
    <section className="content-closing site-shell"><a className="content-button" href={localePath('/docs/install', language)}>{t(m.start, language)} ↗</a></section>
    <SiteFooter language={language}/></main>;
}
