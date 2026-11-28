import { useState } from 'react';
import type { Locale } from './i18n/locales';
import { t, type Localized } from './i18n/localized';
import { formatLength, youtubeThumb, type YouTubeVideo } from './YouTubeEmbed';
// A YouTube video's detail: its thumbnail until the visitor presses play, then youtube-nocookie.com's player (YouTubeEmbed.tsx).
// Loaded with the detail (detail-media.ts), not with the home's cards.
const m={play:{zh:'播放',en:'Play'},notice:{zh:'点击播放后会从 youtube.com 加载播放器，YouTube 可能记录这次访问。',en:'Pressing play loads the player from youtube.com, which may record the visit.'},
 open:{zh:'在 YouTube 上打开',en:'Open on YouTube'},by:{zh:'频道',en:'Channel'}} satisfies Record<string,Localized>;
export function YouTubeEmbed({video,title,url,locale}:{video:YouTubeVideo;title:string;url:string;locale:Locale}){const l=(k:keyof typeof m)=>t(m[k],locale);const [playing,setPlaying]=useState(false),[tries,setTries]=useState(0);
 const sizes=['maxresdefault','hqdefault'] as const;
 return <figure className="yt-embed">
  <div className="yt-embed-frame">{playing
   ?<iframe src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&playsinline=1&hl=${locale==='zh'?'zh-CN':'en'}`} title={title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>
   :<button type="button" onClick={()=>setPlaying(true)} aria-label={`${l('play')}：${title}`}>{tries<sizes.length&&<img src={youtubeThumb(video.id,sizes[tries])} alt="" referrerPolicy="no-referrer" onLoad={e=>{if(e.currentTarget.naturalWidth<=120)setTries(n=>n+1)}} onError={()=>setTries(n=>n+1)}/>}<span className="yt-embed-play" aria-hidden="true"/></button>}</div>
  <figcaption>{!playing&&<span>{l('notice')}</span>}<span>{l('by')}：{video.channelUrl?<a href={video.channelUrl} target="_blank" rel="noreferrer">{video.channel}</a>:video.channel}{video.seconds?` · ${formatLength(video.seconds)}`:''}</span><a href={url} target="_blank" rel="noreferrer">{l('open')}</a></figcaption>
 </figure>}
