import { t, type Localized } from './i18n/localized';
import { useState } from 'react';
import { entries, mediaUrl } from './library-data';
import type { Language } from './direction-engine';
const m={oneBriefThreeWays:{zh:'同一个任务，试试三种解法。',en:'One brief. Three ways to solve it.'},
 chooseABOr:{zh:'点击 A、B、C，比较不同方向如何安排同一份信息。',en:'Choose A, B or C to see how each direction organizes the same information.'},
 brief:{zh:'任务',en:'Brief'},
 viewTheCaseAnd:{zh:'查看完整案例与产出记录',en:'View the case and output record'},
 compareDesignDirections:{zh:'比较设计方向',en:'Compare design directions'},
 recordedSkillOutputPulse:{zh:'技能产出记录 · Pulse',en:'Recorded skill output · Pulse'},
 priority:{zh:'重点',en:'Priority'},
 tradeoff:{zh:'取舍',en:'Tradeoff'},
 bestFor:{zh:'适合',en:'Best for'},
 exploreThisDirection:{zh:'深入看这个方向',en:'Explore this direction'},
 thisIsRecordedSkill:{zh:'此处展示已记录的技能产出，参考包到此案例的完整链路尚未作为同一实验验证。',en:'This is recorded skill output. The full path from a reference pack to this case has not been validated as one experiment.'}} satisfies Record<string,Localized>;

export function HomeCase({ language }: { language: Language }) {
 const entry=entries.find(item=>item.slug==='pulse');
 const [active,setActive]=useState<'A'|'B'|'C'>('A');
 if(!entry)return null;
 const direction=entry.directions.find(item=>item.id===active)!;
 const image=direction.media[0];
 return <section className="site-shell home-case" aria-labelledby="home-case-title">
  <div className="home-case-header"><div><h2 id="home-case-title">{t(m.oneBriefThreeWays,language)}</h2></div><p>{t(m.chooseABOr,language)}</p></div>
  <div className="home-case-brief"><span>{t(m.brief,language)}</span><p>{t(entry.brief,language)}</p><a href="/d/pulse">{t(m.viewTheCaseAnd,language)}</a></div>
  <div className="home-case-stage"><div className="home-case-controls" role="group" aria-label={t(m.compareDesignDirections,language)}>{entry.directions.map(item=><button key={item.id} type="button" aria-pressed={item.id===active} onClick={()=>setActive(item.id)}><span>{item.id}</span><strong>{t(item.name,language)}</strong></button>)}</div>
   <div className="home-case-display"><figure><img src={mediaUrl(entry,image.file)} width={image.width} height={image.height} alt={t(image.alt,language)}/><figcaption>{t(m.recordedSkillOutputPulse,language)} / {direction.id}</figcaption></figure>
    <div className="home-case-notes" aria-live="polite"><p className="home-case-index">{direction.id} / {t(direction.name,language)}</p><dl><div><dt>{t(m.priority,language)}</dt><dd>{t(direction.comparison.optimizes,language)}</dd></div><div><dt>{t(m.tradeoff,language)}</dt><dd>{t(direction.comparison.tradeoff,language)}</dd></div><div><dt>{t(m.bestFor,language)}</dt><dd>{t(direction.comparison.bestFor,language)}</dd></div></dl><a href={`/d/pulse?direction=${direction.id}`}>{t(m.exploreThisDirection,language)}</a></div>
   </div></div>
  <p className="home-case-disclosure">{t(m.thisIsRecordedSkill,language)}</p>
 </section>;
}
