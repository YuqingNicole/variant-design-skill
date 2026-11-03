import { t, type Localized } from './i18n/localized';
import { locales } from './i18n/locales';
import { useEffect, useState } from 'react';
import type { Language } from './direction-engine';
import { SiteHeader, SiteFooter } from './SiteChrome';
import { DocsGuide } from './DocsGuide';
import './content-pages.css';
import { useLocale } from './i18n/LocaleProvider';
import { localePath } from './i18n/locale-route';
const m={installGetStarted:{zh:'安装与开始使用',en:'Install & get started'},
 installConfirmItWorks:{zh:'安装、确认可用，然后在你的项目里走完一次：生成、比较、试改、撤回、接入。',en:'Install, confirm it works, then go through one full loop in your project: generate, compare, refine, undo, integrate.'},
 yourProjectCouldBe:{zh:'下一个案例，可以是你的项目。',en:'Your project could be next.'},
 exploreTheLibrary:{zh:'先看 A/B/C 案例',en:'See the A/B/C cases'},
 explorePlansPricing:{zh:'了解价格与计划',en:'Explore plans & pricing'}} satisfies Record<string,Localized>;
function PageFrame({children,title,language}:{children:React.ReactNode;title:string;language:Language}){
 useEffect(()=>{document.title=`${title} — Variant Design`;document.documentElement.lang=locales[language].htmlLang;document.querySelector('meta[name="description"]')?.setAttribute('content',title)},[title,language]);
 return <main className="content-page"><SiteHeader language={language}/>{children}<SiteFooter language={language}/></main>
}
// Docs page. The former study library and case pages became the direction library (LibraryPage).
export function ContentPages({page}:{page:'docs'}){
 const language = useLocale();const title=t(m.installGetStarted,language);
 return <PageFrame title={title} language={language}>
 <header className="content-hero site-shell"><h1>{title}</h1><p>{t(m.installConfirmItWorks,language)}</p></header>
 {page==='docs'&&<DocsGuide language={language}/>}
 <section className="content-closing site-shell"><h2>{t(m.yourProjectCouldBe,language)}</h2><a className="content-button" href={localePath('/cases',language)}>{t(m.exploreTheLibrary,language)} ↗</a><a className="content-secondary" href={localePath('/pricing',language)}>{t(m.explorePlansPricing,language)} →</a></section>
 </PageFrame>
}
