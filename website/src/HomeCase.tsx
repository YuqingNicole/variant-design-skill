import { useState } from 'react';
import { entries, mediaUrl } from './library-data';
import type { Language } from './direction-engine';

export function HomeCase({ language }: { language: Language }) {
 const zh=language==='zh', ix=zh?0:1, entry=entries.find(item=>item.slug==='pulse');
 const [active,setActive]=useState<'A'|'B'|'C'>('A');
 if(!entry)return null;
 const direction=entry.directions.find(item=>item.id===active)!;
 const image=direction.media[0];
 return <section className="site-shell home-case" aria-labelledby="home-case-title">
  <div className="home-case-header"><div><h2 id="home-case-title">{zh?'同一个任务，试试三种解法。':'One brief. Three ways to solve it.'}</h2></div><p>{zh?'点击 A、B、C，比较不同方向如何安排同一份信息。':'Choose A, B or C to see how each direction organizes the same information.'}</p></div>
  <div className="home-case-brief"><span>{zh?'任务':'Brief'}</span><p>{entry.brief[ix]}</p><a href="/d/pulse">{zh?'查看完整案例与产出记录':'View the case and output record'}</a></div>
  <div className="home-case-stage"><div className="home-case-controls" role="group" aria-label={zh?'比较设计方向':'Compare design directions'}>{entry.directions.map(item=><button key={item.id} type="button" aria-pressed={item.id===active} onClick={()=>setActive(item.id)}><span>{item.id}</span><strong>{item.name[ix]}</strong></button>)}</div>
   <div className="home-case-display"><figure><img src={mediaUrl(entry,image.file)} width={image.width} height={image.height} alt={image.alt[ix]}/><figcaption>{zh?'技能产出记录 · Pulse':'Recorded skill output · Pulse'} / {direction.id}</figcaption></figure>
    <div className="home-case-notes" aria-live="polite"><p className="home-case-index">{direction.id} / {direction.name[ix]}</p><dl><div><dt>{zh?'重点':'Priority'}</dt><dd>{direction.comparison.optimizes[ix]}</dd></div><div><dt>{zh?'取舍':'Tradeoff'}</dt><dd>{direction.comparison.tradeoff[ix]}</dd></div><div><dt>{zh?'适合':'Best for'}</dt><dd>{direction.comparison.bestFor[ix]}</dd></div></dl><a href={`/d/pulse?direction=${direction.id}`}>{zh?'深入看这个方向':'Explore this direction'}</a></div>
   </div></div>
  <p className="home-case-disclosure">{zh?'此处展示已记录的技能产出，参考包到此案例的完整链路尚未作为同一实验验证。':'This is recorded skill output. The full path from a reference pack to this case has not been validated as one experiment.'}</p>
 </section>;
}
