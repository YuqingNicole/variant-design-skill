import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { formatDate } from './i18n/format';
import type { Locale } from './i18n/locales';
import { t, type Localized } from './i18n/localized';
// A shared X post. The text, author and date (from X's oEmbed, stored with the entry) render first, so the post
// reads even where x.com is unreachable. The full post, with its video, loads through X's own embed widget, on
// open with `autoload` or when the visitor asks: nothing from the post is hosted here.
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
  s.onload=()=>{const t=(window as Window&{twttr?:Twttr}).twttr;if(t?.widgets)resolve(t);else{widgets=null;reject(new Error('no widgets'))}};s.onerror=()=>{widgets=null;reject(new Error('blocked'))};document.head.appendChild(s)})}
export function XPost({post,url,locale,autoload=false}:{post:Post;url:string;locale:Locale;autoload?:boolean}){const l=(k:keyof typeof m)=>t(m[k],locale);const box=useRef<HTMLDivElement>(null);const [state,setState]=useState<'idle'|'loading'|'shown'|'failed'>('idle');
 // `run` is bumped on every load and unmount, so an embed that resolves late (React re-running effects, a fast
 // switch to another post) is discarded instead of stacking a second player.
 const run=useRef(0);
 useEffect(()=>{if(autoload)void show();return()=>{run.current++;box.current?.replaceChildren()}},[post.id]);
 async function show(){if(!box.current)return;const id=++run.current;setState('loading');
  try{const t=await Promise.race([loadWidgets(),new Promise<never>((_,no)=>setTimeout(()=>no(new Error('timeout')),8000))]);if(id!==run.current||!box.current)return;box.current.replaceChildren();
   const el=await Promise.race([t.widgets.createTweet(post.id,box.current,{dnt:true,align:'center',conversation:'none',lang:xLang[locale]}),new Promise<undefined>(ok=>setTimeout(()=>ok(undefined),15000))]);
   if(id!==run.current){el?.remove();return}
   if(el)flushSync(()=>setState('shown')); // the stored text goes in the frame the embed arrives, so the page moves once, not twice
   else{box.current?.replaceChildren();setState('failed')}}catch{if(id===run.current)setState('failed')}}
 const date=formatDate(post.date,locale);
  // The stored text comes first and the embed below it: when the embed grows, it pushes down only what is under it.
 return <figure className="x-post">
  {state!=='shown'&&<blockquote cite={url} lang={post.lang}>{post.text&&<p>{post.text}</p>}<footer><b>{post.author}</b> <span>@{post.handle} · {date}</span></footer></blockquote>}
  <div ref={box} className="x-post-embed" hidden={state==='idle'||state==='failed'}/>
  <figcaption>{state==='shown'?l('shown')
   :<><button type="button" onClick={show} disabled={state==='loading'}>{state==='loading'?l('loading'):l(post.hasMedia?'loadMedia':'load')}</button>
    <span>{l(state==='failed'?'failed':'notice')}</span>
    <a href={url} target="_blank" rel="noreferrer">{l('open')}</a></>}</figcaption></figure>}
