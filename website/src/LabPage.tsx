import { t, type Localized } from './i18n/localized';
import { useEffect, useState } from 'react';
import type { Language } from './direction-engine';
import { SiteHeader, SiteFooter } from './SiteChrome';
import './content-pages.css';
import './library.css';
const m={labVariantDesign:{zh:'实验室 — Variant Design',en:'Lab — Variant Design'},
 lab:{zh:'实验室',en:'Lab'},
 theseExperimentsStayAvailable:{zh:'这些是实验功能，会继续可用，但不再扩展。日常使用请在自己的项目里用技能。',en:'These experiments stay available but are no longer extended. For real work, use the skill in your own project.'}} satisfies Record<string,Localized>;
// Experiments kept available but no longer extended (RFC-002 §4).
const tools: { href: string; name: Localized; body: Localized }[] = [
  { href: '/lab/forma/', name: {zh:'Forma 灵感工作台',en:'Forma inspiration studio'}, body: {zh:'浏览虚构设计案例，收藏并导出参考，或在本地演示内容管理。数据只保存在当前浏览器。',en:'Browse fictional design examples, save and export references, and try local content management. Data stays in this browser.'} },
  { href: '/lab/workbench', name: {zh:'工作台',en:'Workbench'}, body: {zh:'输入一个命题，比较三种设计合同，再生成选中的方向。需要网站配置模型。',en:'Enter a brief, compare three design contracts, then generate the chosen direction. Needs a model configured on the site.'} },
  { href: '/lab/canvas', name: {zh:'画布',en:'Canvas'}, body: {zh:'从三个可编辑的落地页起点开始，直接改字、改样式、排序和导出 HTML。网页版的项目只保存在你的浏览器里。',en:'Start from three editable landing layouts, then edit text and styles, reorder sections and export HTML. On the web, projects stay in your browser.'} },
];
export function LabPage() {
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem('variant-language') === 'en' ? 'en' : 'zh');
  const zh = language === 'zh';
  useEffect(() => { document.title = t(m.labVariantDesign,language); document.documentElement.lang = t({zh:'zh-CN',en:'en'},language); localStorage.setItem('variant-language', language); }, [language, zh]);
  return <main className="content-page library-page"><SiteHeader language={language} onLanguage={() => setLanguage(t({zh:'en',en:'zh'},language))}/>
    <header className="content-hero site-shell"><h1>{t(m.lab,language)}</h1><p>{t(m.theseExperimentsStayAvailable,language)}</p></header>
    <section className="site-shell library-feed"><div className="library-grid">{tools.map(tool => <article key={tool.href} className="library-card"><a href={tool.href}><strong>{t(tool.name,language)} →</strong><span className="library-card-summary">{t(tool.body,language)}</span></a></article>)}</div></section>
    <SiteFooter language={language}/></main>;
}
