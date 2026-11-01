import { useEffect, useRef, useState } from 'react';
import { formatDate } from './i18n/format';
import type { Locale } from './i18n/locales';
import { t, type Localized } from './i18n/localized';
// A shared X post. The text, author and date (from X's oEmbed, stored with the entry) render first, so the post
// reads even where x.com is unreachable. The full post, with its media, loads only when the visitor asks, through
// X's own embed widget: nothing from the post is hosted here.
export type Post={id:string;author:string;handle:string;date:string;lang:string;text:string;hasMedia:boolean};
type Twttr={widgets:{createTweet:(id:string,el:HTMLElement,opts:Record<string,unknown>)=>Promise<HTMLElement|undefined>}};
let widgets:Promise<Twttr>|null=null;
const m={shown:{zh:'原帖由 X 的官方嵌入组件显示，内容来自 x.com。',en:'Shown by X’s official embed; content comes from x.com.'},loading:{zh:'正在从 x.com 加载…',en:'Loading from x.com…'},
 loadMedia:{zh:'加载 X 原帖（含视频或图片）',en:'Load the post from X (with its media)'},load:{zh:'加载 X 原帖',en:'Load the post from X'},failed:{zh:'没能连上 x.com，可以直接打开原帖。',en:'Could not reach x.com; open the post directly.'},
 notice:{zh:'点击后会从 x.com 加载内容，X 可能记录这次访问。',en:'This loads content from x.com, which may record the visit.'},open:{zh:'在 X 上打开',en:'Open on X'}} satisfies Record<string,Localized>;
// X's embed takes its own language codes.
const xLang:Record<Locale,string>={zh:'zh-cn',en:'en'};
function loadWidgets(){const w=window as Window&{twttr?:Twttr};if(w.twttr?.widgets)return Promise.resolve(w.twttr);
 return widgets??=new Promise<Twttr>((resolve,reject)=>{const s=document.createElement('script');s.src='https://platform.twitter.com/widgets.js';s.async=true;s.charset='utf-8';
  s.onload=()=>{const t=(window as Window&{twttr?:Twttr}).twttr;t?.widgets?resolve(t):reject(new Error('no widgets'))};s.onerror=()=>{widgets=null;reject(new Error('blocked'))};document.head.appendChild(s)})}
export function XPost({post,url,locale}:{post:Post;url:string;locale:Locale}){const l=(k:keyof typeof m)=>t(m[k],locale);const box=useRef<HTMLDivElement>(null);const [state,setState]=useState<'idle'|'loading'|'shown'|'failed'>('idle');
 useEffect(()=>()=>{box.current?.replaceChildren()},[post.id]);
 async function show(){if(!box.current)return;setState('loading');
  try{const t=await Promise.race([loadWidgets(),new Promise<never>((_,no)=>setTimeout(()=>no(new Error('timeout')),8000))]);box.current.replaceChildren();
   const el=await Promise.race([t.widgets.createTweet(post.id,box.current,{dnt:true,align:'center',conversation:'none',lang:xLang[locale]}),new Promise<undefined>(ok=>setTimeout(()=>ok(undefined),15000))]);
   if(el)setState('shown');else{box.current?.replaceChildren();setState('failed')}}catch{setState('failed')}}
 const date=formatDate(post.date,locale);
 return <figure className="x-post"><div ref={box} className="x-post-embed" hidden={state==='idle'||state==='failed'}/>
  {state!=='shown'&&<blockquote cite={url} lang={post.lang}><p>{post.text}</p><footer><b>{post.author}</b> <span>@{post.handle} · {date}</span></footer></blockquote>}
  <figcaption>{state==='shown'?l('shown')
   :<><button type="button" onClick={show} disabled={state==='loading'}>{state==='loading'?l('loading'):l(post.hasMedia?'loadMedia':'load')}</button>
    <span>{l(state==='failed'?'failed':'notice')}</span>
    <a href={url} target="_blank" rel="noreferrer">{l('open')}</a></>}</figcaption></figure>}
