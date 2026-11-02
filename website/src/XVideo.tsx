import { useEffect, useRef, useState } from 'react';
import xMedia from './x-media.json';
// The video of a shared X post, streamed from video.twimg.com (address read by scripts/x-media.mjs) and played
// muted on a loop while on screen. Nothing is hosted here; if X refuses or the file is gone, the poster stays.
export type XMedia={video:string;poster:string;width:number;height:number;avatar:string|null;fetchedAt:string};
export const mediaOf=(id:string):XMedia|undefined=>(xMedia as Record<string,XMedia>)[id];
// video.twimg.com refuses requests carrying another site's referrer, and <video> has no per-element
// referrerpolicy, so the document drops it before the first video loads (outbound links already use noreferrer).
function dropReferrer(){if(document.querySelector('meta[name="referrer"]'))return;const m=document.createElement('meta');m.name='referrer';m.content='no-referrer';document.head.appendChild(m)}
export function XVideo({media}:{media:XMedia}){const ref=useRef<HTMLVideoElement>(null);const [failed,setFailed]=useState(false);
 useEffect(()=>{const v=ref.current;if(!v)return;dropReferrer();
  // Without IntersectionObserver the poster stays and no file attaches.
  if(typeof IntersectionObserver==='undefined')return;
  // The file attaches only as the card nears the screen, so a long tab does not open every video at once.
  let visible=false;const play=()=>{if(visible&&v.getAttribute('src'))v.play().catch(()=>{});else v.pause()};
  const near=new IntersectionObserver(([e])=>{if(e.isIntersecting){v.src=media.video;near.disconnect();play()}},{rootMargin:'600px 0px'});near.observe(v);
  // Reduced motion keeps the poster; otherwise play only while at least a quarter of the card is visible.
  const io=matchMedia('(prefers-reduced-motion: reduce)').matches?null:new IntersectionObserver(([e])=>{visible=e.isIntersecting;play()},{threshold:.25});io?.observe(v);
  return()=>{near.disconnect();io?.disconnect();v.pause();v.removeAttribute('src');v.load()}},[media.video]);
 return failed?<img className="insp-vcard-media" src={media.poster} width={media.width} height={media.height} alt="" referrerPolicy="no-referrer"/>
  :<video ref={ref} className="insp-vcard-media" poster={media.poster} width={media.width} height={media.height} muted loop playsInline preload="metadata" onError={()=>setFailed(true)}/>}
