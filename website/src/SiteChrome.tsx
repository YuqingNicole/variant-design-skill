import type { Language } from './direction-engine';
import './site-system.css';
const repo='https://github.com/YuqingNicole/variant-design-skill';
export function SiteHeader({language,onLanguage,page='home'}:{language:Language;onLanguage:()=>void;page?:'home'|'pricing'}){
 const zh=language==='zh';
 return <nav className="site-nav site-shell" aria-label={zh?'主导航':'Main navigation'}><a className="site-wordmark" href="/" aria-label="Variant Design"><span aria-hidden="true">▧</span> variant<span className="site-wordmark-light">design</span></a><div className="site-nav-links"><a href="/#canvas">{zh?'看方案':'Explore'}</a><a href="/pricing" aria-current={page==='pricing'?'page':undefined}>{zh?'价格':'Pricing'}</a><a href="/#guided-demo">{zh?'开始使用':'Get started'}</a></div><button className="site-language" aria-label={zh?'切换到英文':'Switch to Chinese'} onClick={onLanguage}>{zh?'EN':'中文'}</button></nav>
}
export function SiteFooter({language}:{language:Language}){const zh=language==='zh';return <footer className="site-footer site-shell"><a href="/">variant design / Yuqing Nicole</a><div><a href={repo} target="_blank" rel="noreferrer">GitHub ↗</a><a href="/workbench">{zh?'在线实验室':'Online lab'}</a><a href="/pricing">{zh?'价格':'Pricing'}</a></div></footer>}
