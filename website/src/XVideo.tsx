import { type ReactNode, useEffect, useRef, useState } from 'react';
import xMedia from './x-media.json';
// The video of a shared X post, streamed from video.twimg.com (address read by scripts/x-media.mjs) and played
// muted on a loop while on screen. Nothing is hosted here; if X refuses or the file is gone, the poster stays,
// and if the poster cannot load either (X blocked on this network) the caller's fallback replaces the card.
export type XMedia={video:string;poster:string;width:number;height:number;avatar:string|null;fetchedAt:string};
export type VideoMedia=Pick<XMedia,'video'|'poster'|'width'|'height'>;
// Feed cards are about 300px wide, so X's small size (680px) is enough even at 2x; as WebP it is about a third of the original JPEG.
// Only X's own image host understands the size and format parameters; any other poster address is used as it is.
export const sizedPoster=(url:string)=>{try{const u=new URL(url);return u.hostname==='pbs.twimg.com'&&!u.search?`${url}?format=webp&name=small`:url}catch{return url}};
export const mediaOf=(id:string):XMedia|undefined=>(xMedia as Record<string,XMedia>)[id];
// video.twimg.com refuses requests carrying another site's referrer, and <video> has no per-element
// referrerpolicy, so the document drops it before the first video loads (outbound links already use noreferrer).
function dropReferrer(){if(document.querySelector('meta[name="referrer"]'))return;const m=document.createElement('meta');m.name='referrer';m.content='no-referrer';document.head.appendChild(m)}
export function XVideo({media,fallback}:{media:VideoMedia;fallback?:ReactNode}){const poster=sizedPoster(media.poster);const ref=useRef<HTMLVideoElement>(null);const [failed,setFailed]=useState(false);const [posterFailed,setPosterFailed]=useState(false);
 // <video poster> reports no load error, so the poster is probed once on its own (the browser reuses the response).
 useEffect(()=>{if(!fallback)return;let live=true;const img=new Image();img.referrerPolicy='no-referrer';img.onerror=()=>{if(live)setPosterFailed(true)};img.src=poster;return()=>{live=false;img.onerror=null}},[poster,Boolean(fallback)]);
 useEffect(()=>{const v=ref.current;if(!v)return;dropReferrer();
  if(typeof IntersectionObserver==='undefined')return;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');let visible=false;
  const play=()=>{if(visible&&!motion.matches&&!document.hidden&&v.getAttribute('src'))v.play().catch(()=>{});else v.pause()};
  const attach=()=>{if(!motion.matches&&!v.getAttribute('src'))v.src=media.video;play()};
  const near=new IntersectionObserver(([e])=>{if(e.isIntersecting&&!motion.matches)attach()},{rootMargin:'600px 0px'});near.observe(v);
  const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting&&e.intersectionRatio>=.25;if(visible)attach();else play()},{threshold:[0,.25]});io.observe(v);
  const preference=()=>{if(motion.matches){v.pause();v.removeAttribute('src');v.load()}else{near.unobserve(v);near.observe(v);if(visible)attach()}};
  motion.addEventListener('change',preference);document.addEventListener('visibilitychange',play);
  return()=>{near.disconnect();io.disconnect();motion.removeEventListener('change',preference);document.removeEventListener('visibilitychange',play);v.pause();v.removeAttribute('src');v.load()}},[media.video]);
 if(posterFailed&&fallback)return <>{fallback}</>;
 return failed?<img className="insp-vcard-media" src={poster} width={media.width} height={media.height} alt="" referrerPolicy="no-referrer" onError={fallback?()=>setPosterFailed(true):undefined}/>
  :<video ref={ref} className="insp-vcard-media" poster={poster} width={media.width} height={media.height} muted loop playsInline preload="metadata" onError={()=>setFailed(true)}/>}
