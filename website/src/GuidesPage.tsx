import { useEffect, useState } from 'react';
import type { Language } from './direction-engine';
import { SiteHeader, SiteFooter } from './SiteChrome';
import { guides, guideRoute } from './guides-content';
import { docsArticles } from './docs-articles';
import { t, type Localized } from './i18n/localized';
import './content-pages.css';
import { useLocale } from './i18n/LocaleProvider';
import { localePath } from './i18n/locale-route';
import { isDraft, showDrafts } from './i18n/translations';

const m = {
  title: { zh: '指南', en: 'Guides' },
  intro: { zh: '用 AI 做界面时常见问题的回答。开头直接给结论，后面是步骤和实测记录。', en: 'Answers to common questions about designing interfaces with AI. Each starts with the answer, then gives steps and recorded runs.' },
  missing: { zh: '页面不存在', en: 'Not found' },
  back: { zh: '返回指南', en: 'Back to guides' },
  start: { zh: '安装并开始使用', en: 'Install and get started' },
  updated: { zh: '发布于', en: 'Published' },
} satisfies Record<string, Localized>;

const hub = {
  title: { zh: '文档', en: 'Docs' },
  intro: { zh: '怎样用 AI 做出高质量的界面：从安装技能，到比较方向、检查结果、定动效规则和测量页面。每篇都来自我们实际跑过的记录，并写明没有验证的部分。', en: 'How to make good interfaces with AI: from installing the skill to comparing directions, checking the result, setting motion rules and measuring the page. Each article comes from runs we actually did and says what was not verified.' },
  installTitle: { zh: '安装与开始使用', en: 'Install and get started' },
  installBody: { zh: '安装技能，确认可用，然后在你的项目里走完一次：生成、比较、试改、撤回、接入。', en: 'Install the skill, confirm it works, then go through one full loop in your project: generate, compare, refine, undo, integrate.' },
  startLabel: { zh: '从这里开始', en: 'Start here' },
  articleLabel: { zh: '文章', en: 'Article' },
  answersLabel: { zh: '速查', en: 'Quick reference' },
  answers: { zh: '常见问题的回答', en: 'Quick answers' },
  answersBody: { zh: '比较方向、撤回修改、避免千篇一律、选择 Git 还是快照、给参考标明来源。', en: 'Comparing directions, undoing changes, avoiding generic results, Git or snapshots, and sourcing references.' },
} satisfies Record<string, Localized>;

export function GuidesPage({ slug, base = '/guides' }: { slug?: string; base?: '/guides' | '/docs' }) {
  const language = useLocale();
  const pool = base === '/docs' ? docsArticles : guides;
  const visible = pool.filter(g => showDrafts || !isDraft(g, language));
  const guide = visible.find(g => g.slug === slug), known = !slug || !!guide;
  const title = guide ? t(guide.title, language) : t(known ? (base === '/docs' ? hub.title : m.title) : m.missing, language);
  useEffect(() => {
    document.title = `${title} — Variant Design`; document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  }, [title, language]);
  return <main className="content-page"><SiteHeader language={language}/>
    {guide ? <>
      <header className="content-hero site-shell guide-hero"><p className="content-back"><a href={localePath(base,language)}>{t(base === '/docs' ? hub.title : m.title, language)}</a></p><h1>{title}</h1><p>{t(guide.answer, language)}</p><small>{t(m.updated, language)} {guide.publishedAt}</small></header>
      <div className="site-shell docs-layout"><aside>{guide.sections.map(s => <a key={s.id} href={`#${s.id}`}>{t(s.heading, language)}</a>)}</aside>
        <div className="content-reading">{guide.sections.map(s => <section id={s.id} key={s.id}><h2>{t(s.heading, language)}</h2>
          {s.body.map(p => <p key={p.zh}>{t(p, language)}</p>)}
          {s.list && <ul>{s.list.map(item => <li key={item.zh}>{t(item, language)}</li>)}</ul>}
          {s.code && <pre className="guide-code"><code>{t(s.code, language)}</code></pre>}
          {s.link && <p className="content-link"><a href={localePath(s.link.href,language)}>{t(s.link.label, language)} →</a></p>}
        </section>)}</div></div>
      <section className="content-closing site-shell"><a className="content-button" href={localePath('/docs/install',language)}>{t(m.start, language)} ↗</a><a className="content-secondary" href={localePath(base,language)}>{t(base === '/docs' ? hub.title : m.back, language)} →</a></section>
    </> : <>
      <header className="content-hero site-shell"><h1>{title}</h1>{known ? <p>{t(base === '/docs' ? hub.intro : m.intro, language)}</p> : <p><a href={localePath(base,language)}>{t(m.back, language)}</a></p>}</header>
      {known && <section className={`site-shell guide-list${base === '/docs' ? ' docs-hub' : ''}`}>
        {base === '/docs' && <article className="docs-start"><small>{t(hub.startLabel, language)}</small><h2><a href={localePath('/docs/install',language)}>{t(hub.installTitle, language)}</a></h2><p>{t(hub.installBody, language)}</p></article>}
        {visible.map(g => <article key={g.slug} className={base === '/docs' ? 'docs-card' : undefined}>{base === '/docs' && <small>{t(hub.articleLabel, language)} · {g.publishedAt}</small>}<h2><a href={localePath(guideRoute(g),language)}>{t(g.title, language)}</a></h2><p>{t(g.answer, language)}</p></article>)}
        {base === '/docs' && <article className="docs-answers"><small>{t(hub.answersLabel, language)}</small><h2><a href={localePath('/guides',language)}>{t(hub.answers, language)}</a></h2><p>{t(hub.answersBody, language)}</p></article>}
      </section>}
    </>}
    <SiteFooter language={language}/></main>;
}
