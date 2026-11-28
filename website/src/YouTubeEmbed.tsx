import { useState } from 'react';
// A YouTube video in the library. Nothing is hosted here: the cards show YouTube's own thumbnail (i.ytimg.com), and the player
// (youtube-nocookie.com, YouTubePlayer.tsx) loads only when the visitor presses play, so opening a reference sends nothing to YouTube but the picture.
export type YouTubeVideo={platform:'youtube';id:string;channel:string;channelUrl:string|null;date?:string;seconds?:number};
export const isYouTube=(value:unknown):value is YouTubeVideo=>Boolean(value&&typeof value==='object'&&(value as YouTubeVideo).platform==='youtube'&&typeof (value as YouTubeVideo).id==='string');
// mqdefault is 16:9 with no black bars; maxresdefault exists only for HD uploads, so the detail falls back to it.
export const youtubeThumb=(id:string,size:'mqdefault'|'maxresdefault'|'hqdefault'='mqdefault')=>`https://i.ytimg.com/vi/${id}/${size}.jpg`;
// A video added by address alone has no recorded length; the badge and the length are then left out.
export const formatLength=(seconds?:number)=>seconds?`${Math.floor(seconds/60)}:${String(Math.round(seconds%60)).padStart(2,'0')}`:'';
// The card picture. A thumbnail that cannot load gives way to the caller's fallback instead of a broken image.
export function YouTubeThumb({video,fallback}:{video:YouTubeVideo;fallback:React.ReactNode}){const [failed,setFailed]=useState(false);
 if(failed)return <>{fallback}</>;
 return <><img className="insp-vcard-media" style={{['--ar' as string]:'320/180'}} src={youtubeThumb(video.id)} width={320} height={180} alt="" loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>{video.seconds&&<span className="insp-play" aria-hidden="true">{formatLength(video.seconds)}</span>}</>}
