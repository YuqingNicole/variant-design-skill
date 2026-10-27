import { useEffect, useState } from 'react';
import type { Language } from './direction-engine';
import { SiteHeader, SiteFooter } from './SiteChrome';
import { DocsGuide } from './DocsGuide';
import './content-pages.css';
function PageFrame({children,title,language,setLanguage}:{children:React.ReactNode;title:string;language:Language;setLanguage:(v:Language)=>void}){
 useEffect(()=>{document.title=`${title} — Variant Design`;document.documentElement.lang=language==='zh'?'zh-CN':'en';localStorage.setItem('variant-language',language);document.querySelector('meta[name="description"]')?.setAttribute('content',title)},[title,language]);
 return <main className="content-page"><SiteHeader language={language} onLanguage={()=>setLanguage(language==='zh'?'en':'zh')}/>{children}<SiteFooter language={language}/></main>
}
// Docs page. The former study library and case pages became the direction library (LibraryPage).
export function ContentPages({page}:{page:'docs'}){
 const [language,setLanguage]=useState<Language>(()=>localStorage.getItem('variant-language')==='en'?'en':'zh');const zh=language==='zh';const title=zh?'安装与开始使用':'Install & get started';
 return <PageFrame title={title} language={language} setLanguage={setLanguage}>
 <header className="content-hero site-shell"><p className="content-kicker">GET STARTED / IN YOUR PROJECT</p><h1>{title}</h1><p>{zh?'安装、确认可用，然后在你的项目里走完一次：生成、比较、试改、撤回、接入。':'Install, confirm it works, then go through one full loop in your project: generate, compare, refine, undo, integrate.'}</p></header>
 {page==='docs'&&<DocsGuide language={language}/>}
 <section className="content-closing site-shell"><p className="content-kicker">MAKE IT YOURS</p><h2>{zh?'下一个案例，可以是你的项目。':'Your project could be next.'}</h2><a className="content-button" href="/">{zh?'先看方向库':'Explore the library'} ↗</a><a className="content-secondary" href="/pricing">{zh?'了解价格与计划':'Explore plans & pricing'} →</a></section>
 </PageFrame>
}
