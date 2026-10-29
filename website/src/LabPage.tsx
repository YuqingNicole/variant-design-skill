import { useEffect, useState } from 'react';
import type { Language } from './direction-engine';
import { SiteHeader, SiteFooter } from './SiteChrome';
import './content-pages.css';
import './library.css';
type Copy = [string, string];
// Experiments kept available but no longer extended (RFC-002 §4).
const tools: { href: string; name: Copy; body: Copy }[] = [
  { href: '/lab/forma/', name: ['Forma 灵感工作台', 'Forma inspiration studio'], body: ['浏览虚构设计案例，收藏并导出参考，或在本地演示内容管理。数据只保存在当前浏览器。', 'Browse fictional design examples, save and export references, and try local content management. Data stays in this browser.'] },
  { href: '/lab/workbench', name: ['工作台', 'Workbench'], body: ['输入一个命题，比较三种设计合同，再生成选中的方向。需要网站配置模型。', 'Enter a brief, compare three design contracts, then generate the chosen direction. Needs a model configured on the site.'] },
  { href: '/lab/canvas', name: ['画布', 'Canvas'], body: ['从三个可编辑的落地页起点开始，直接改字、改样式、排序和导出 HTML。网页版的项目只保存在你的浏览器里。', 'Start from three editable landing layouts, then edit text and styles, reorder sections and export HTML. On the web, projects stay in your browser.'] },
];
export function LabPage() {
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem('variant-language') === 'en' ? 'en' : 'zh');
  const zh = language === 'zh', ix = zh ? 0 : 1;
  useEffect(() => { document.title = zh ? '实验室 — Variant Design' : 'Lab — Variant Design'; document.documentElement.lang = zh ? 'zh-CN' : 'en'; localStorage.setItem('variant-language', language); }, [language, zh]);
  return <main className="content-page library-page"><SiteHeader language={language} onLanguage={() => setLanguage(zh ? 'en' : 'zh')}/>
    <header className="content-hero site-shell"><p className="content-kicker">LAB / EXPERIMENTS</p><h1>{zh ? '实验室' : 'Lab'}</h1><p>{zh ? '这些是实验功能，会继续可用，但不再扩展。日常使用请在自己的项目里用技能。' : 'These experiments stay available but are no longer extended. For real work, use the skill in your own project.'}</p></header>
    <section className="site-shell library-feed"><div className="library-grid">{tools.map(t => <article key={t.href} className="library-card"><a href={t.href}><strong>{t.name[ix]} →</strong><span className="library-card-summary">{t.body[ix]}</span></a></article>)}</div></section>
    <SiteFooter language={language}/></main>;
}
