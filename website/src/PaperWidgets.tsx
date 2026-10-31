import { useEffect, useRef, useState, type CSSProperties } from 'react';
import './paper-widgets.css';
// Our own study of a public post's motion idea (paper widgets in a bento grid): staggered entry,
// numbers counting up, a ticking timer and a toggle that turns its card dark. No third-party code or media.
const still=()=>typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function useCount(target:number,run:number,ms=1400){const [v,setV]=useState(target);useEffect(()=>{if(still()){setV(target);return}let raf=0;const t0=performance.now();const step=(t:number)=>{const p=Math.min(1,(t-t0)/ms);setV(Math.round(target*(1-Math.pow(1-p,3))));if(p<1)raf=requestAnimationFrame(step)};setV(0);raf=requestAnimationFrame(step);return()=>cancelAnimationFrame(raf)},[target,run,ms]);return v}
const copy={zh:{city:'上海',clear:'晴',playing:'正在播放',track:'低潮',artist:'纸上乐队',timer:'专注计时',deep:'深度工作',steps:'步数',goal:'目标 10,000',battery:'电量',devices:['手机','手表','耳机'],day:'星期五',month:'十月',events:[['10:00','设计评审'],['12:30','和 Ana 午饭'],['16:00','方向比较']],focus:'专注模式',on:'开',off:'关',hint:'点按切换',replay:'重播动效',play:'播放',pause:'暂停'},
 en:{city:'Shanghai',clear:'Clear',playing:'Now playing',track:'Low Tide',artist:'Paper Band',timer:'Focus timer',deep:'Deep work',steps:'Steps',goal:'Goal 10,000',battery:'Battery',devices:['Phone','Watch','Buds'],day:'Friday',month:'October',events:[['10:00','Design review'],['12:30','Lunch with Ana'],['16:00','Compare directions']],focus:'Focus',on:'On',off:'Off',hint:'Tap to toggle',replay:'Replay motion',play:'Play',pause:'Pause'}};
const bars=[.42,.68,.5,.82,.6,.74,.95];
export function PaperWidgets({zh}:{zh:boolean}){const c=zh?copy.zh:copy.en;
 const ref=useRef<HTMLDivElement>(null);const [run,setRun]=useState(0);const [seen,setSeen]=useState(false);const [focus,setFocus]=useState(false);const [playing,setPlaying]=useState(true);const [left,setLeft]=useState(25*60);
 useEffect(()=>{const el=ref.current;if(!el||typeof IntersectionObserver==='undefined'){setSeen(true);return}const io=new IntersectionObserver(([e])=>{if(e.isIntersecting){setSeen(true);io.disconnect()}},{threshold:.35});io.observe(el);return()=>io.disconnect()},[]);
 useEffect(()=>{if(!seen)return;const id=setInterval(()=>setLeft(s=>s>0?s-1:25*60),1000);return()=>clearInterval(id)},[seen]);
 const live=seen?run+1:0;const temp=useCount(seen?18:0,live,900),steps=useCount(seen?8240:0,live),cells=[64,38,91];
 const mm=String(Math.floor(left/60)).padStart(2,'0'),ss=String(left%60).padStart(2,'0');
 return <div ref={ref} className={`paper-widgets${seen?' is-in':''}`} key={run}>
  <section className="pw-card pw-weather"><small>{c.city} · H 21° L 12°</small><b>{temp}°</b><span>{c.clear}</span><svg viewBox="0 0 100 40" aria-hidden="true"><path d="M4 38 Q50 -14 96 38" className="pw-track"/><path d="M4 38 Q50 -14 96 38" className="pw-arc" pathLength={1}/></svg></section>
  <section className="pw-card pw-music"><div className="pw-art" aria-hidden="true"><i/></div><div><small>{c.playing} {playing&&<em className="pw-eq" aria-hidden="true"><i/><i/><i/></em>}</small><b>{c.track}</b><span>{c.artist}</span><div className={`pw-progress${playing?'':' is-paused'}`}><i/></div><button type="button" onClick={()=>setPlaying(p=>!p)} aria-label={playing?c.pause:c.play}>{playing?'❚❚':'▶'}</button></div></section>
  <section className="pw-card pw-timer"><small>{c.timer}</small><svg viewBox="0 0 100 100" aria-hidden="true">{Array.from({length:60},(_,i)=><line key={i} x1="50" y1="6" x2="50" y2="12" transform={`rotate(${i*6} 50 50)`} className={i<Math.ceil(left/25)?'on':''}/>)}</svg><b aria-live="off">{mm}:{ss}</b><span>{c.deep}</span></section>
  <section className="pw-card pw-steps"><small>{c.steps}</small><b>{steps.toLocaleString('en-US')}</b><span>{c.goal}</span><div className="pw-bars" aria-hidden="true">{bars.map((h,i)=><i key={i} style={{'--h':h,'--d':`${i*60}ms`} as CSSProperties} className={i===bars.length-1?'is-today':''}/>)}</div></section>
  <section className="pw-card pw-battery"><small>{c.battery}</small>{c.devices.map((d,i)=><div key={d}><span>{d}</span><i style={{'--w':cells[i]/100,'--d':`${i*90}ms`} as CSSProperties}/><em>{cells[i]}%</em></div>)}</section>
  <section className="pw-card pw-calendar"><div><small>{c.day}</small><b>31</b><span>{c.month}</span></div><ol>{c.events.map(([t,e],i)=><li key={t} style={{'--d':`${300+i*90}ms`} as CSSProperties}><time>{t}</time>{e}</li>)}</ol></section>
  <button type="button" className={`pw-card pw-focus${focus?' is-on':''}`} aria-pressed={focus} onClick={()=>setFocus(f=>!f)}><small>{c.focus}</small><b>{focus?c.on:c.off}</b><span>{c.hint}</span><i aria-hidden="true"/></button>
  <button type="button" className="pw-replay" onClick={()=>{setSeen(true);setRun(r=>r+1)}}>↺ {c.replay}</button>
 </div>}
