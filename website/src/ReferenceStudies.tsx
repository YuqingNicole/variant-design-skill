import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Check, still, useStep, type Copy } from './study-kit';
import { moreStudies } from './ReferenceStudiesMore';
import './reference-studies.css';
// Our own motion studies of the one interaction that carries each reference's homepage. Placeholder content,
// our palette, no code or assets from the sources. Each draws on a 640×400 stage scaled to its frame.
// Autoplaying stages are pictures to assistive tech; the interactive canvas stays a labelled group.
function Stage({children,label,interactive,play}:{children:ReactNode;label:string;interactive:boolean;play:boolean}){const ref=useRef<HTMLDivElement>(null);const [scale,setScale]=useState(1);
 useEffect(()=>{const el=ref.current;if(!el)return;const fit=()=>setScale(el.clientWidth/640);fit();if(typeof ResizeObserver==='undefined')return;const ro=new ResizeObserver(fit);ro.observe(el);return()=>ro.disconnect()},[]);
 return <div ref={ref} className={`rs-frame${play?"":" rs-rest"}`} role={interactive?'group':'img'} aria-label={label}><div className="rs-stage" style={{transform:`scale(${scale})`}} aria-hidden={interactive?undefined:true} inert={!interactive}>{children}</div></div>}

const stages:Copy[]=[['找线索','Find leads'],['推进交易','Move deals'],['跟进邮件','Follow up'],['预测收入','Forecast'],['续约扩展','Expand']];
function Stages({play,ix}:{play:boolean;ix:number}){const step=useStep(play,stages.length,2200,1);
 return <div className="rs-stages">{<ol>{stages.map((s,i)=><li key={i} className={i===step?'on':''}><em>0{i+1}</em>{s[ix]}</li>)}</ol>}
  <div className="rs-stages-view" key={step}>
   {step===0&&<div className="rs-rows">{[88,72,64,51,40].map((w,i)=><p key={i} style={{'--d':`${i*70}ms`} as CSSProperties}><i/><b style={{width:`${w}%`}}/><span>{96-i*9}</span></p>)}</div>}
   {step===1&&<div className="rs-board">{[3,2,2].map((n,c)=><div key={c}>{Array.from({length:n},(_,i)=><i key={i} style={{'--d':`${(c*2+i)*70}ms`} as CSSProperties}/>)}</div>)}</div>}
   {step===2&&<div className="rs-mail"><b/><b/><p>{Array.from({length:5},(_,i)=><i key={i} style={{'--d':`${i*90}ms`,width:`${92-i*11}%`} as CSSProperties}/>)}</p><span/></div>}
   {step===3&&<div className="rs-chart">{[30,42,38,55,61,74,82].map((h,i)=><i key={i} style={{'--h':h/100,'--d':`${i*60}ms`} as CSSProperties}/>)}</div>}
   {step===4&&<div className="rs-accounts">{[0,1,2,3].map(i=><p key={i} style={{'--d':`${i*80}ms`} as CSSProperties}><i/><b/><span className={i===1?'warn':''}/></p>)}</div>}
  </div></div>}

const quotes:Copy[]=[['“月底对账从三天变成一个下午。”','“Month-end close went from three days to one afternoon.”'],['“我们终于知道每一笔钱花在哪。”','“We finally know where every dollar goes.”'],['“审批不再卡在邮件里。”','“Approvals stopped getting stuck in email.”']];
function Proof({play,ix}:{play:boolean;ix:number}){const step=useStep(play,3,2600,0);const [n,setN]=useState(48200);
 useEffect(()=>{if(still()||!play){setN(48200);return}let raf=0;const t0=performance.now();const f=(t:number)=>{const p=Math.min(1,(t-t0)/1500);setN(Math.round(48200*(1-Math.pow(1-p,3))));if(p<1)raf=requestAnimationFrame(f)};raf=requestAnimationFrame(f);return()=>cancelAnimationFrame(raf)},[play]);
 return <div className="rs-proof"><p className="rs-proof-num"><b>{n.toLocaleString('en-US')}</b><span>{ix?'teams already switched':'个团队已经换过来'}</span></p>
  <div className={`rs-marquee${play?'':' paused'}`}><div>{['Northwind','Acme','Globex','Initech','Umbrella','Hooli','Northwind','Acme','Globex','Initech','Umbrella','Hooli'].map((l,i)=><span key={i}>{l}</span>)}</div></div>
  <div className="rs-proof-stats">{[['−38%',ix?'spend':'支出'],['4.2×',ix?'faster close':'对账速度'],['0',ix?'lost receipts':'丢失票据']].map(([v,l])=><p key={l}><b>{v}</b><span>{l}</span></p>)}</div>
  <blockquote key={step}>{quotes[step][ix]}</blockquote></div>}

function Booking({play,ix}:{play:boolean;ix:number}){const step=useStep(play,4,1500,3);const day=14,slot=2;const slots=['09:00','10:30','13:00','15:30'];
 return <div className="rs-book"><div className="rs-cal"><p>{ix?'November':'十一月'}</p><div>{Array.from({length:30},(_,i)=><i key={i} className={[i%7>4?'off':'',step>=1&&i+1===day?'on':''].join(' ')}>{i+1}</i>)}</div></div>
  <div className={`rs-slots${step>=2?' in':''}`}>{slots.map((s,i)=><span key={s} className={step>=3&&i===slot?'on':''} style={{'--d':`${i*70}ms`} as CSSProperties}>{s}</span>)}</div>
  <p className={`rs-toast${step>=3?' in':''}`}><b><Check/></b>{ix?`Booked · Nov ${day}, ${slots[slot]}`:`已预约 · 11 月 ${day} 日 ${slots[slot]}`}</p></div>}

const buildLines:Copy[]=[['读取提示','Reading prompt'],['搭场景和图层','Laying out scene'],['加状态机','Adding state machine'],['绑定数据','Binding data'],['导出到 Web','Shipping to web']];
function Build({play,ix}:{play:boolean;ix:number}){const step=useStep(play,7,900,6);const prompt=ix?'Make a loading toggle that bounces':'做一个会弹跳的加载开关';const typed=Math.min(prompt.length,Math.round(prompt.length*Math.min(1,(step+1)/2)));
 return <div className="rs-build"><div className="rs-prompt"><span>{prompt.slice(0,typed)}</span><i/></div>
  <div className="rs-term">{buildLines.map((l,i)=><p key={i} className={step>=i+2?'in':''}><em>{step>i+2?<Check/>:<i/>}</em>{l[ix]}</p>)}</div>
  <div className={`rs-preview${step>=6?' live':''}`}><i/><b/></div></div>}

function Canvas({play,ix,interactive}:{play:boolean;ix:number;interactive:boolean}){const step=useStep(play,4,1300,3);const [paths,setPaths]=useState<string[]>([]);const drawing=useRef(false);const [copied,setCopied]=useState(false);const dots=useId().replace(/:/g,'');
 const at=(e:React.PointerEvent<SVGSVGElement>)=>{const r=e.currentTarget.getBoundingClientRect();return `${((e.clientX-r.left)/r.width*584).toFixed(1)} ${((e.clientY-r.top)/r.height*272).toFixed(1)}`};
 return <div className="rs-canvas"><p className="rs-cmd"><code>npm create canvas-app</code><button type="button" tabIndex={interactive?0:-1} onClick={()=>{navigator.clipboard?.writeText('npm create canvas-app').catch(()=>{});setCopied(true)}}>{copied?(ix?'Copied':'已复制'):(ix?'Copy':'复制')}</button></p>
  <svg viewBox="0 0 584 272" className={interactive?'draw':''} onPointerDown={e=>{if(!interactive)return;drawing.current=true;e.currentTarget.setPointerCapture(e.pointerId);setPaths(p=>[...p,`M${at(e)}`])}} onPointerMove={e=>{if(!drawing.current)return;const pt=at(e);setPaths(p=>[...p.slice(0,-1),`${p[p.length-1]} L${pt}`])}} onPointerUp={()=>{drawing.current=false}}>
   <defs><pattern id={dots} width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" className="rs-dots"/></pattern></defs><rect width="584" height="272" fill={`url(#${dots})`}/>
   {step>=0&&<rect x="60" y="60" width="150" height="90" rx="8" className="rs-shape in"/>}
   {step>=1&&<path d="M215 105 C 280 105, 300 170, 360 170" className="rs-arrow in"/>}
   {step>=2&&<ellipse cx="430" cy="170" rx="70" ry="45" className="rs-shape in"/>}
   {step>=3&&<path d="M90 230 c 30 -30 60 30 90 0 s 60 30 90 0" className="rs-ink in" pathLength={1}/>}
   {paths.map((d,i)=><path key={i} d={d} className="rs-user"/>)}
   <g className="rs-cursor" style={{transform:`translate(${[150,330,470,210][step]}px,${[110,170,180,240][step]}px)`}}><path d="M0 0 L0 16 L4 12 L8 20 L11 19 L7 11 L13 11 Z"/></g>
  </svg>{interactive&&<span className="rs-hint">{ix?'Draw on the canvas':'在画布上画一笔'}</span>}</div>}

const slideTones=['a','b','c','d','e','f'];
function Mosaic({play,ix}:{play:boolean;ix:number}){const step=useStep(play,3,1800,2);
 return <div className="rs-mosaic"><p className="rs-gen"><span>{ix?'Q3 review for the board, 8 slides':'给董事会的第三季度回顾，8 页'}</span><b className={step>=1?'busy':''}>{step>=2?(ix?'Done':'完成'):(ix?'Generate':'生成')}</b></p>
  <div className={`rs-cols${play?'':' paused'}`}>{[0,1,2].map(c=><div key={c} className={c===1?'up':'down'}><div>{[...slideTones,...slideTones].map((t,i)=><i key={i} className={`t-${t}`}><b/><span/></i>)}</div></div>)}</div></div>}

export const referenceStudies:Record<string,{title:Copy;render:(p:{play:boolean;ix:number;interactive:boolean})=>ReactNode}>={
 attio:{title:['分阶段切换：每个阶段换一张产品画面','Stage tabs that swap the product view'],render:p=><Stages {...p}/>},
 ramp:{title:['数字递增、客户墙滚动、证言轮换','Count-up numbers, a scrolling logo wall, rotating quotes'],render:p=><Proof {...p}/>},
 'cal-com':{title:['选日期 → 出时段 → 预约确认','Pick a day → slots appear → booking confirmed'],render:p=><Booking {...p}/>},
 rive:{title:['输入提示 → 逐步构建 → 预览跑起来','Prompt → step-by-step build → live preview'],render:p=><Build {...p}/>},
 tldraw:{title:['复制安装命令，画布上直接画','Copy the install command, draw right on the canvas'],render:p=><Canvas {...p}/>},
 ...moreStudies,
 pitch:{title:['产出先行：幻灯片缩略图滚动拼贴','Output first: a scrolling mosaic of slides'],render:p=><Mosaic {...p}/>},
};
// Frames another demo (such as PaperWidgets) on the same scaled stage.
export function StudyFrame({label,play,children}:{label:string;play:boolean;children:ReactNode}){return <Stage label={label} interactive={false} play={play}>{children}</Stage>}
export function ReferenceStudy({id,zh,play,interactive=false}:{id:string;zh:boolean;play:boolean;interactive?:boolean}){const study=referenceStudies[id];if(!study)return null;const ix=zh?0:1;
 return <Stage label={study.title[ix]} interactive={interactive} play={play}>{study.render({play,ix,interactive})}</Stage>}
