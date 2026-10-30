import { useEffect, useState } from 'react';
import type { Language } from './direction-engine';
import { transition } from './view-transition';
import './site-system.css';
const repo='https://github.com/YuqingNicole/variant-design-skill';
// IPA Font License 1.0 requires a way back to the original IPA font; see public/fonts/LICENSES.txt.
const fontNote={zhisong:['标题字体霞鹜新致宋，衍生自 IPA 字体，按 IPA Font License 1.0 使用。','Headings use LXGW Neo ZhiSong, derived from the IPA fonts under IPA Font License 1.0.'],ipa:['标题现用本机安装的 IPA 原版字体，未安装时显示系统宋体。','Headings now use your installed original IPA font, or a system serif if it is not installed.'],toIpa:['改用 IPA 原版字体','Use the original IPA font'],toZhisong:['改回霞鹜新致宋','Switch back to LXGW Neo ZhiSong'],licenses:['字体许可','Font licenses']};
const ipaFontKey='variant-heading-font';
function FontNote({language}:{language:Language}){
 const i=language==='zh'?0:1;
 const [ipa,setIpa]=useState(()=>{try{return localStorage.getItem(ipaFontKey)==='ipa'}catch{return false}});
 useEffect(()=>{document.documentElement.toggleAttribute('data-ipa-font',ipa);try{if(ipa)localStorage.setItem(ipaFontKey,'ipa');else localStorage.removeItem(ipaFontKey)}catch{/* storage blocked: the choice lasts for this page */}},[ipa]);
 return <p className="site-font-note">{fontNote[ipa?'ipa':'zhisong'][i]}<button type="button" onClick={()=>transition(()=>{document.documentElement.toggleAttribute('data-ipa-font',!ipa);setIpa(!ipa)})}>{fontNote[ipa?'toZhisong':'toIpa'][i]}</button><a href="/fonts/LICENSES.txt">{fontNote.licenses[i]}</a></p>;
}
export function SiteHeader({language,onLanguage,page='home'}:{language:Language;onLanguage:()=>void;page?:'home'|'pricing'|'library'|'inspiration'}){
 const zh=language==='zh';
 return <nav className="site-nav site-shell" aria-label={zh?'主导航':'Main navigation'}><a className="site-wordmark" href="/" aria-label="Variant Design"><img className="site-brandmark" src="/variant-mark.svg" width="40" height="40" alt=""/> variant<span className="site-wordmark-light">design</span></a><div className="site-nav-links"><a href="/inspiration" aria-current={page==='inspiration'?'page':undefined}>{zh?'设计参考':'References'}</a><a href="/#works" aria-current={page==='library'?'page':undefined}>{zh?'作品案例':'Cases'}</a><a href="/skills">{zh?'技能':'Skills'}</a><a href="/about">{zh?'关于':'About'}</a><a href="/pricing" aria-current={page==='pricing'?'page':undefined}>{zh?'价格':'Pricing'}</a><a href="/docs">{zh?'开始使用':'Get started'}</a></div><button className="site-language" aria-label={zh?'切换到英文':'Switch to Chinese'} onClick={()=>transition(onLanguage)}>{zh?'EN':'中文'}</button></nav>
}
export function SiteFooter({language}:{language:Language}){const zh=language==='zh';return <footer className="site-footer site-shell"><a className="site-footer-brand" href="/" aria-label="Variant Design"><img className="site-brandmark" src="/variant-mark.svg" width="28" height="28" alt=""/><span>variant design <span className="site-credit">/ Yuqing Nicole</span></span></a><div><a href={repo} target="_blank" rel="noreferrer">GitHub ↗</a><a href="/about">{zh?'关于':'About'}</a><a href="/inspiration">{zh?'灵感参考':'Inspiration'}</a><a href="/submit">{zh?'投稿与授权':'Submissions'}</a><a href="/docs">{zh?'安装使用':'Docs'}</a><a href="/lab">{zh?'实验室':'Lab'}</a><a href="/pricing">{zh?'价格':'Pricing'}</a></div><FontNote language={language}/></footer>}
