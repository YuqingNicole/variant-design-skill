import { useEffect, useState } from 'react';
import type { Language } from './direction-engine';
import { SiteHeader, SiteFooter } from './SiteChrome';
import { repository } from './library-data';
import './content-pages.css';
import './library.css';
type Copy = [string, string];
// Skills directory (RFC-002 P4). Only skills we actually ran in throwaway projects, with public records.
export const skills: { id: string; name: string; source: string; summary: Copy; tried: Copy; install: string; records: { label: Copy; href: string }[] }[] = [
  { id: 'variant-design', name: 'variant-design', source: 'YuqingNicole/variant-design-skill',
    summary: ['把一个任务做成 A/B/C 三个可比较的方向，支持局部修改、快照撤回和可回滚的接入；可以从方向库的方向卡开始。', 'Turns one brief into three comparable directions in your project, with scoped edits, undo snapshots and integration you can roll back; can start from a direction card in this library.'],
    tried: ['在 Claude Code 和 Codex 的一次性项目里跑过完整流程（生成、局部修改、撤回、接入），以及从方向卡出三版；品牌锁定的项目都守住了字体和颜色。Codex 沙箱里浏览器检查受限，记录中已注明。', 'Run end to end in throwaway projects with Claude Code and Codex (generate, scoped edit, undo, integrate) and from a direction card; brand-locked projects kept their fonts and colors. Codex sandboxes limit browser checks, as the records note.'],
    install: 'npx skills add YuqingNicole/variant-design-skill -a claude-code -a codex',
    records: [
      { label: ['CLI 实测（2026-10-26）', 'CLI dogfood (2026-10-26)'], href: `${repository}/blob/master/docs/research/2026-10-26-cli-dogfood.md` },
      { label: ['方向库作品实测', 'Direction library runs'], href: `${repository}/blob/master/docs/research/2026-10-27-direction-library-dogfood.md` },
      { label: ['方向卡实测', 'Direction card runs'], href: `${repository}/blob/master/docs/research/2026-10-27-direction-card-dogfood.md` },
    ] },
];
export function SkillsPage() {
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem('variant-language') === 'en' ? 'en' : 'zh');
  const zh = language === 'zh', ix = zh ? 0 : 1;
  useEffect(() => { document.title = zh ? '设计技能 — Variant Design' : 'Design skills — Variant Design'; document.documentElement.lang = zh ? 'zh-CN' : 'en'; localStorage.setItem('variant-language', language); }, [language, zh]);
  return <main className="content-page library-page"><SiteHeader language={language} onLanguage={() => setLanguage(zh ? 'en' : 'zh')}/>
    <header className="content-hero site-shell"><p className="content-kicker">SKILLS / TRIED IN REAL PROJECTS</p><h1>{zh ? '设计技能' : 'Design skills'}</h1>
      <p>{zh ? '只收录我们在一次性项目里实际跑过、并公开了记录的设计交付技能。目前只有一个通过。没试过的技能，不会因为热门就列在这里。' : 'Only design-delivery skills we have actually run in throwaway projects, with public records. One qualifies so far. Popularity alone does not get a skill listed here.'}</p></header>
    <section className="site-shell library-feed skills-list">{skills.map(s => <article key={s.id} className="skills-entry">
      <h2>{s.name}<small>{s.source}</small></h2><p>{s.summary[ix]}</p>
      <dl><dt>{zh ? '我们怎么试的' : 'How we tried it'}</dt><dd>{s.tried[ix]}</dd><dt>{zh ? '安装' : 'Install'}</dt><dd><code>{s.install}</code><span>{zh ? '装到当前项目的 .agents/skills，并为 Claude Code 建软链接。也可以用 git clone 完整仓库，见' : 'Installs into this project’s .agents/skills and links it for Claude Code. A full git clone also works; see'} <a href="/docs">{zh ? '安装说明' : 'the docs'}</a>{zh ? '。' : '.'}</span></dd>
        <dt>{zh ? '公开记录' : 'Public records'}</dt><dd className="skills-records">{s.records.map(r => <a key={r.href} href={r.href} target="_blank" rel="noreferrer">{r.label[ix]} ↗</a>)}</dd></dl></article>)}
      <p className="library-more"><a href="/submit">{zh ? '推荐一个技能：我们实测后再决定是否收录 →' : 'Suggest a skill: we list it only after trying it →'}</a></p></section>
    <SiteFooter language={language}/></main>;
}
