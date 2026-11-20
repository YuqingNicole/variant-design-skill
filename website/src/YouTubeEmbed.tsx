import { useState } from 'react';
import type { Locale } from './i18n/locales';
import { t, type Localized } from './i18n/localized';
// A YouTube video in the library. Nothing is hosted here: the cards show YouTube's own thumbnail (i.ytimg.com), and the player
// (youtube-nocookie.com) loads only when the visitor presses play, so opening a reference sends nothing to YouTube but the picture.
export type YouTubeVideo={platform:'youtube';id:string;channel:string;channelUrl:string|null;date?:string;seconds?:number};
export const isYouTube=(value:unknown):value is YouTubeVideo=>Boolean(value&&typeof value==='object'&&(value as YouTubeVideo).platform==='youtube'&&typeof (value as YouTubeVideo).id==='string');
// mqdefault is 16:9 with no black bars; maxresdefault exists only for HD uploads, so the detail falls back to it.
export const youtubeThumb=(id:string,size:'mqdefault'|'maxresdefault'|'hqdefault'='mqdefault')=>`https://i.ytimg.com/vi/${id}/${size}.jpg`;
const m={play:{zh:'播放',en:'Play'},notice:{zh:'点击播放后会从 youtube.com 加载播放器，YouTube 可能记录这次访问。',en:'Pressing play loads the player from youtube.com, which may record the visit.'},
 open:{zh:'在 YouTube 上打开',en:'Open on YouTube'},by:{zh:'频道',en:'Channel'}} satisfies Record<string,Localized>;
// A video added by address alone has no recorded length; the badge and the length are then left out.
const formatLength=(seconds?:number)=>seconds?`${Math.floor(seconds/60)}:${String(Math.round(seconds%60)).padStart(2,'0')}`:'';
// The card picture. A thumbnail that cannot load gives way to the caller's fallback instead of a broken image.
export function YouTubeThumb({video,fallback}:{video:YouTubeVideo;fallback:React.ReactNode}){const [failed,setFailed]=useState(false);
 if(failed)return <>{fallback}</>;
 return <><img className="insp-vcard-media" src={youtubeThumb(video.id)} width={320} height={180} alt="" loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>{video.seconds&&<span className="insp-play" aria-hidden="true">{formatLength(video.seconds)}</span>}</>}
export function YouTubeEmbed({video,title,url,locale}:{video:YouTubeVideo;title:string;url:string;locale:Locale}){const l=(k:keyof typeof m)=>t(m[k],locale);const [playing,setPlaying]=useState(false),[tries,setTries]=useState(0);
 const sizes=['maxresdefault','hqdefault'] as const;
 return <figure className="yt-embed">
  <div className="yt-embed-frame">{playing
   ?<iframe src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&playsinline=1&hl=${locale==='zh'?'zh-CN':'en'}`} title={title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>
   :<button type="button" onClick={()=>setPlaying(true)} aria-label={`${l('play')}：${title}`}>{tries<sizes.length&&<img src={youtubeThumb(video.id,sizes[tries])} alt="" referrerPolicy="no-referrer" onLoad={e=>{if(e.currentTarget.naturalWidth<=120)setTries(n=>n+1)}} onError={()=>setTries(n=>n+1)}/>}<span className="yt-embed-play" aria-hidden="true"/></button>}</div>
  <figcaption>{!playing&&<span>{l('notice')}</span>}<span>{l('by')}：{video.channelUrl?<a href={video.channelUrl} target="_blank" rel="noreferrer">{video.channel}</a>:video.channel}{video.seconds?` · ${formatLength(video.seconds)}`:''}</span><a href={url} target="_blank" rel="noreferrer">{l('open')}</a></figcaption>
 </figure>}
