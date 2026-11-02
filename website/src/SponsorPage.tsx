import { useEffect, useState } from 'react';
import type { Language } from './direction-engine';
import { t, type Localized } from './i18n/localized';
import { SiteHeader, SiteFooter } from './SiteChrome';
import './content-pages.css';
// Brand sponsorship (RFC-003 step 7). No prices or traffic figures until there is real data to quote.
const contact='https://github.com/YuqingNicole/variant-design-skill/issues/new?template=sponsorship.md';
const m={
 title:{zh:'赞助 Variant Design',en:'Sponsor Variant Design'},
 lead:{zh:'给用 AI 做产品的人的设计导航。品牌可以赞助，把产品介绍给这群读者。',en:'A design navigation site for people who build products with AI. Brands can sponsor it to reach these readers.'},
 cta:{zh:'发起赞助咨询',en:'Start an inquiry'},
 toRules:{zh:'先看赞助规则',en:'Read the rules first'},
 audience:{zh:'读者是谁',en:'Who reads it'},
 traffic:{zh:'访问量和来源还在积累，这里不写数字。洽谈时我们提供当时的真实数据和统计口径。',en:'Traffic is still building, so no figures are listed here. When we talk, we share the current real numbers and how they are counted.'},
 rules:{zh:'赞助规则',en:'Sponsorship rules'},
 how:{zh:'怎么联系',en:'How to get in touch'},
 metaTitle:{zh:'赞助 — Variant Design',en:'Sponsor — Variant Design'},
 metaDescription:{zh:'品牌赞助 Variant Design 的方式与规则：明确标注，与编辑精选分开。',en:'How brands can sponsor Variant Design: clearly labelled and kept apart from editorial picks.'},
} satisfies Record<string,Localized>;
type Row={title:Localized;text:Localized;code?:string};
const readers:Row[]=[
 {title:{zh:'用 Agent 做产品',en:'Building with agents'},text:{zh:'用 Codex、Claude Code 等 Agent 做网页和产品界面的开发者与设计师。',en:'Developers and designers building sites and product interfaces with agents such as Codex and Claude Code.'}},
 {title:{zh:'找参考、比方向',en:'Comparing directions'},text:{zh:'在找设计参考、想在自己项目里比较几种方向的人。',en:'People looking for design references who want to compare directions in their own project.'}},
];
const rules:Row[]=[
 {title:{zh:'明确标注',en:'Clearly labelled'},text:{zh:'赞助内容一律标注“赞助”，链接带',en:'Sponsored content is always labelled “Sponsored”, and its links carry'},code:'rel="sponsored"'},
 {title:{zh:'与精选分开',en:'Apart from editorial'},text:{zh:'不影响灵感参考、技能和案例的收录、排序和笔记，也不出售评测或推荐。',en:'It does not affect which references, skills or cases are included, their order or our notes. Reviews and recommendations are not for sale.'}},
 {title:{zh:'只收相关产品',en:'Relevant products only'},text:{zh:'只接受与设计、开发或 AI 工具相关、且不误导读者的产品。',en:'Only products related to design, development or AI tools, and nothing that misleads readers.'}},
 {title:{zh:'不给读者数据',en:'No reader data'},text:{zh:'不向赞助方提供读者的个人数据。',en:'No personal data about readers is shared with sponsors.'}},
];
const steps:Row[]=[
 {title:{zh:'发起咨询',en:'Open an inquiry'},text:{zh:'开一个「赞助咨询」Issue，写明品牌、想介绍的产品和希望的时间。',en:'Open a “Sponsorship inquiry” issue with your brand, the product and the timing you have in mind.'}},
 {title:{zh:'我们回复',en:'We reply'},text:{zh:'附上当时的真实访问数据、可用的位置和方式。网站目前还没有赞助位，位置在洽谈时一起确定。',en:'With current traffic data and the placements and formats available. The site has no sponsor placements yet; they are agreed as part of the conversation.'}},
];
function Rows({rows,language,className,ordered}:{rows:Row[];language:Language;className?:string;ordered?:boolean}){
 const items=rows.map(r=><li key={r.title.en}><strong>{t(r.title,language)}</strong><p>{t(r.text,language)}{r.code&&<> <code>{r.code}</code>{language==='zh'?'。':'.'}</>}</p></li>);
 return ordered?<ol className={`sponsor-rows ${className??''}`}>{items}</ol>:<ul className={`sponsor-rows ${className??''}`}>{items}</ul>;
}
export function SponsorPage(){
 const [language,setLanguage]=useState<Language>(()=>localStorage.getItem('variant-language')==='en'?'en':'zh');const zh=language==='zh';const l=(k:keyof typeof m)=>t(m[k],language);
 useEffect(()=>{document.title=l('metaTitle');document.documentElement.lang=zh?'zh-CN':'en';localStorage.setItem('variant-language',language);document.querySelector('meta[name="description"]')?.setAttribute('content',l('metaDescription'));},[language,zh]);
 const inquiry=<a className="home-action-primary" href={contact} target="_blank" rel="noreferrer">{l('cta')}</a>;
 return <main className="content-page sponsor-page"><SiteHeader language={language} onLanguage={()=>setLanguage(zh?'en':'zh')}/>
  <header className="content-hero site-shell sponsor-hero"><h1>{l('title')}</h1><p>{l('lead')}</p><div className="home-actions">{inquiry}<a className="home-action-secondary" href="#rules">{l('toRules')}</a></div></header>
  <section className="site-shell sponsor-section" aria-labelledby="sponsor-audience"><h2 id="sponsor-audience">{l('audience')}</h2><div><Rows rows={readers} language={language}/><p className="sponsor-note">{l('traffic')}</p></div></section>
  <section className="site-shell sponsor-section" id="rules" aria-labelledby="sponsor-rules"><h2 id="sponsor-rules">{l('rules')}</h2><Rows rows={rules} language={language} className="sponsor-rules"/></section>
  <section className="site-shell sponsor-section" aria-labelledby="sponsor-how"><h2 id="sponsor-how">{l('how')}</h2><div><Rows rows={steps} language={language} ordered/><div className="home-actions">{inquiry}</div></div></section>
  <SiteFooter language={language}/></main>;
}
