import { useEffect, useState } from 'react';
import type { Language } from './direction-engine';
import { SiteHeader, SiteFooter } from './SiteChrome';
import { guides } from './guides-content';
import { t, type Localized } from './i18n/localized';
import './content-pages.css';

const m = {
  title: { zh: '指南', en: 'Guides' },
  intro: { zh: '用 AI 做界面时常见问题的回答。开头直接给结论，后面是步骤和实测记录。', en: 'Answers to common questions about designing interfaces with AI. Each starts with the answer, then gives steps and recorded runs.' },
  missing: { zh: '页面不存在', en: 'Not found' },
  back: { zh: '返回指南', en: 'Back to guides' },
  start: { zh: '安装并开始使用', en: 'Install and get started' },
  updated: { zh: '发布于', en: 'Published' },
} satisfies Record<string, Localized>;

export function GuidesPage({ slug }: { slug?: string }) {
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem('variant-language') === 'en' ? 'en' : 'zh');
  const guide = guides.find(g => g.slug === slug), known = !slug || !!guide;
  const title = guide ? t(guide.title, language) : t(known ? m.title : m.missing, language);
  useEffect(() => {
    document.title = `${title} — Variant Design`; document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    localStorage.setItem('variant-language', language);
  }, [title, language]);
  return <main className="content-page"><SiteHeader language={language} onLanguage={() => setLanguage(language === 'zh' ? 'en' : 'zh')}/>
    {guide ? <>
      <header className="content-hero site-shell guide-hero"><p className="content-back"><a href="/guides">{t(m.title, language)}</a></p><h1>{title}</h1><p>{t(guide.answer, language)}</p><small>{t(m.updated, language)} {guide.publishedAt}</small></header>
      <div className="site-shell docs-layout"><aside>{guide.sections.map(s => <a key={s.id} href={`#${s.id}`}>{t(s.heading, language)}</a>)}</aside>
        <div className="content-reading">{guide.sections.map(s => <section id={s.id} key={s.id}><h2>{t(s.heading, language)}</h2>
          {s.body.map(p => <p key={p.zh}>{t(p, language)}</p>)}
          {s.list && <ul>{s.list.map(item => <li key={item.zh}>{t(item, language)}</li>)}</ul>}
          {s.code && <pre className="guide-code"><code>{t(s.code, language)}</code></pre>}
          {s.link && <p><a href={s.link.href}>{t(s.link.label, language)} →</a></p>}
        </section>)}</div></div>
      <section className="content-closing site-shell"><a className="content-button" href="/docs">{t(m.start, language)} ↗</a><a className="content-secondary" href="/guides">{t(m.back, language)} →</a></section>
    </> : <>
      <header className="content-hero site-shell"><h1>{title}</h1>{known ? <p>{t(m.intro, language)}</p> : <p><a href="/guides">{t(m.back, language)}</a></p>}</header>
      {known && <section className="site-shell guide-list">{guides.map(g => <article key={g.slug}><h2><a href={`/guides/${g.slug}`}>{t(g.title, language)}</a></h2><p>{t(g.answer, language)}</p></article>)}</section>}
    </>}
    <SiteFooter language={language}/></main>;
}
