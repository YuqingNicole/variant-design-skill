import { useEffect, useState } from 'react';
import type { Language } from './direction-engine';
import { t, type Localized } from './i18n/localized';
import { SiteHeader, SiteFooter } from './SiteChrome';
import './content-pages.css';
// Brand sponsorship (RFC-003 step 7). No prices or traffic figures until there is real data to quote.
const contact='https://github.com/YuqingNicole/variant-design-skill/issues/new?template=sponsorship.md';
const m={
 title:{zh:'赞助 Variant Design',en:'Sponsor Variant Design'},
 lead:{zh:'Variant Design 是给用 AI 做产品的人的设计导航：精选外部参考、实测过的设计技能和真实的 A/B/C 案例。品牌可以赞助，把产品介绍给这群读者。',en:'Variant Design is a design navigation site for people who build products with AI: curated external references, design skills that were actually run, and real A/B/C cases. Brands can sponsor it to reach these readers.'},
 audience:{zh:'读者是谁',en:'Who reads it'},
 traffic:{zh:'访问量和来源还在积累，这里不写数字。洽谈时我们提供当时的真实数据和统计口径。',en:'Traffic is still building, so no figures are listed here. When we talk, we share the current real numbers and how they are counted.'},
 rules:{zh:'赞助规则',en:'Sponsorship rules'},
 how:{zh:'怎么联系',en:'How to get in touch'},
 cta:{zh:'在 GitHub 发起赞助咨询 ↗',en:'Start a sponsorship inquiry on GitHub ↗'},
 metaTitle:{zh:'赞助 — Variant Design',en:'Sponsor — Variant Design'},
 metaDescription:{zh:'品牌赞助 Variant Design 的方式与规则：明确标注，与编辑精选分开。',en:'How brands can sponsor Variant Design: clearly labelled and kept apart from editorial picks.'},
} satisfies Record<string,Localized>;
const readers:Localized[]=[
 {zh:'用 Codex、Claude Code 等 Agent 做网页和产品界面的开发者与设计师。',en:'Developers and designers building sites and product interfaces with agents such as Codex and Claude Code.'},
 {zh:'在找设计参考、想在自己项目里比较几种方向的人。',en:'People looking for design references who want to compare directions in their own project.'},
];
const rules:Localized[]=[
 {zh:'赞助内容一律标注“赞助”，链接带 rel="sponsored"。',en:'Sponsored content is always labelled “Sponsored”, and its links carry rel="sponsored".'},
 {zh:'赞助与编辑精选分开：不影响灵感参考、技能和案例的收录、排序和笔记，也不出售评测或推荐。',en:'Sponsorship is separate from editorial picks: it does not affect which references, skills or cases are included, their order or our notes, and reviews or recommendations are not for sale.'},
 {zh:'只接受与设计、开发或 AI 工具相关、且不误导读者的产品。',en:'Only products related to design, development or AI tools, and nothing that misleads readers.'},
 {zh:'不向赞助方提供读者的个人数据。',en:'No personal data about readers is shared with sponsors.'},
];
const steps:Localized[]=[
 {zh:'用下面的链接开一个「赞助咨询」Issue，写明品牌、想介绍的产品和希望的时间。',en:'Open a “Sponsorship inquiry” issue with the link below, with your brand, the product and the timing you have in mind.'},
 {zh:'我们回复当时的真实访问数据、可用的位置和方式。网站目前还没有赞助位，位置在洽谈时一起确定。',en:'We reply with current traffic data and the placements and formats available. The site has no sponsor placements yet; they are agreed as part of the conversation.'},
];
export function SponsorPage(){
 const [language,setLanguage]=useState<Language>(()=>localStorage.getItem('variant-language')==='en'?'en':'zh');const zh=language==='zh';const l=(k:keyof typeof m)=>t(m[k],language);
 useEffect(()=>{document.title=l('metaTitle');document.documentElement.lang=zh?'zh-CN':'en';localStorage.setItem('variant-language',language);document.querySelector('meta[name="description"]')?.setAttribute('content',l('metaDescription'));},[language,zh]);
 return <main className="content-page sponsor-page"><SiteHeader language={language} onLanguage={()=>setLanguage(zh?'en':'zh')}/>
  <header className="content-hero site-shell"><h1>{l('title')}</h1><p>{l('lead')}</p></header>
  <section className="content-reading site-shell">
   <h2>{l('audience')}</h2><ul>{readers.map(r=><li key={r.zh}>{t(r,language)}</li>)}</ul><p>{l('traffic')}</p>
   <h2>{l('rules')}</h2><ul className="sponsor-rules">{rules.map(r=><li key={r.zh}>{t(r,language)}</li>)}</ul>
   <h2>{l('how')}</h2><ol>{steps.map(s=><li key={s.zh}>{t(s,language)}</li>)}</ol>
   <a href={contact} target="_blank" rel="noreferrer">{l('cta')}</a>
  </section><SiteFooter language={language}/></main>;
}
