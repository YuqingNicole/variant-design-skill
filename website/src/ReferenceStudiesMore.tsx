import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Check, still, useStep, type Copy } from './study-kit';
import './reference-studies-more.css';
// One study per reference note ("研究什么"): the idea it points at, drawn with placeholder content.
type P={play:boolean;ix:number;interactive:boolean};
const T=(ix:number,zh:string,en:string)=>ix?en:zh;
const d=(ms:number)=>({'--d':`${ms}ms`}) as CSSProperties;
const L=({w,s}:{w:number;s?:CSSProperties})=><i className="rm-l" style={{width:`${w}%`,...s}}/>;
const Win=({children,className=''}:{children:ReactNode;className?:string})=><div className={`rm-win ${className}`}><p className="rm-chrome"><i/><i/><i/></p>{children}</div>;
// Types a string over `ms` once playing; with reduced motion shows it whole.
function useTyped(text:string,play:boolean,ms=1200,key=0){const [n,setN]=useState(text.length);
 useEffect(()=>{if(still()||!play){setN(text.length);return}setN(0);let i=0;const id=setInterval(()=>{i++;setN(i);if(i>=text.length)clearInterval(id)},ms/text.length);return()=>clearInterval(id)},[text,play,ms,key]);return text.slice(0,n)}

/* Landing */
function Linear({play,ix}:P){const step=useStep(play,4,1500);const cols:Copy[]=[['待办','Backlog'],['进行中','In progress'],['完成','Done']];
 return <div className="rm-linear"><div className={`rm-claim${step>=0?' in':''}`}><b>{T(ix,'为团队规划和构建产品','Plan and build products')}</b><L w={58}/></div>
  <Win className={step>=1?'in':''}><div className="rm-cols">{cols.map((c,i)=><div key={i}><small>{c[ix]}</small>{[0,1,2].map(k=><i key={k} className={step>=2&&i===Math.min(2,k+step-2)?'hot':''}/>)}</div>)}</div></Win></div>}
function Notion({play,ix}:P){const step=useStep(play,4,1600);const caps:Copy[]=[['文档','Docs'],['知识库','Wiki'],['项目','Projects'],['AI','AI']];
 return <div className="rm-notion"><b>{T(ix,'一个工作空间，分层讲清','One workspace, layer by layer')}</b><p className="rm-chips">{caps.map((c,i)=><span key={i} className={i===step?'on':''}>{c[ix]}</span>)}</p>
  <div className="rm-stack">{caps.map((c,i)=><div key={i} className={i===step?'on':i<step?'past':''} style={{'--i':i} as CSSProperties}><small>{c[ix]}</small><L w={70}/><L w={45}/></div>)}</div></div>}
function Cursor({play,ix}:P){const step=useStep(play,4,1400);const code=['function total(items) {','  let sum = 0','  for (const i of items) sum += i.price','  return sum','}'];
 return <div className="rm-cursor"><Win><pre>{code.map((c,i)=><code key={i} className={i===2&&step>=1?(step>=2?'added':'ghost'):''}>{i===2&&step<1?'  ':c}</code>)}</pre></Win>
  <div className="rm-chat"><p>{T(ix,'把求和改成循环写法','Rewrite the sum as a loop')}</p><p className={step>=1?'in':''}>{T(ix,'已改第 3 行','Changed line 3')}</p><span className={step>=2?'on':''}>{step>=3?<><Check/> {T(ix,'已接受','Accepted')}</>:T(ix,'接受','Accept')}</span></div></div>}
function V0({play,ix}:P){const step=useStep(play,4,1500);const ex:Copy[]=[['定价页','Pricing page'],['登录表单','Sign-in form'],['数据面板','Dashboard']];const pick=ex[1][ix];const typed=useTyped(step>=1?pick:'',play&&step>=1,600);
 return <div className="rm-v0"><div className="rm-input"><span>{step>=1?typed:<em>{T(ix,'想做什么？','What do you want to build?')}</em>}</span><b/></div><p className="rm-chips">{ex.map((e,i)=><span key={i} className={step>=1&&i===1?'on':''}>{e[ix]}</span>)}</p>
  <div className={`rm-gen${step>=3?' in':''}`}><div><L w={50}/><L w={80}/><L w={80}/><span/></div></div></div>}
function Lovable({play,ix}:P){return <div className="rm-lovable"><div className="rm-input big"><em>{T(ix,'描述你想做的应用…','Describe the app you want…')}</em><b/></div><small>{T(ix,'社区作品','From the community')}</small>
 <div className={`rm-gallery${play?'':' paused'}`}><div>{Array.from({length:10},(_,i)=><i key={i} className={`g${i%5}`}><b/></i>)}</div></div></div>}
function Impeccable({play,ix}:P){const step=useStep(play,4,1500);
 return <div className="rm-imp"><div className="rm-split" style={{'--x':`${[100,100,55,0][step]}%`} as CSSProperties}><div className="before"><b/><L w={70}/><L w={50}/><span/>{step>=1&&<><em style={{top:'18%',left:'12%'}}>1</em><em style={{top:'62%',left:'14%'}}>2</em></>}</div><div className="after"><b/><L w={70}/><L w={50}/><span/></div><i className="rm-handle"/></div>
  <p className="rm-cmd2"><code>/polish</code><span>{step>=2?T(ix,'修复 2 处：对比度、间距','2 fixes: contrast, spacing'):T(ix,'先标出问题','Mark the issues first')}</span></p></div>}
function Aesop({play,ix}:P){const step=useStep(play,3,1800);const cats:Copy[]=[['护肤','Skin'],['身体','Body'],['香氛','Fragrance']];
 return <div className="rm-aesop"><p className="rm-tabs">{cats.map((c,i)=><span key={i} className={i===step?'on':''}>{c[ix]}</span>)}</p><div className="rm-story"><b>{T(ix,'一段关于原料的叙事','A story about ingredients')}</b><L w={80}/><L w={65}/></div>
  <div className="rm-bottles" key={step}>{[0,1,2,3].map(i=><div key={i} style={d(i*90)}><i className={`b${(i+step)%3}`}/><L w={60}/><span>{T(ix,'加入购物袋','Add to bag')}</span></div>)}</div></div>}
function Teenage({play,ix}:P){const step=useStep(play,3,1700);
 return <div className="rm-te"><div className="rm-family">{[0,1,2].map(i=><div key={i} className={i===step?'on':''}><i/><small>{['OP–1','TX–6','EP–133'][i]}</small></div>)}</div>
  <p className="rm-acc"><small>{T(ix,'配件','Accessories')}</small>{[0,1,2,3].map(i=><i key={i} className={(i+step)%2===0?'on':''} style={d(i*60)}/>)}</p></div>}
function Nothing({play,ix}:P){const step=useStep(play,3,1800);const cats:Copy[]=[['手机','Phones'],['耳机','Audio'],['配件','Accessories']];
 return <div className="rm-nothing"><div className="rm-hero" key={step}><b>{[T(ix,'新品发布','New launch'),T(ix,'限时活动','Limited event'),T(ix,'系统更新','Software drop')][step]}</b><span>{T(ix,'了解更多','Learn more')}</span></div><p className="rm-dots">{[0,1,2].map(i=><i key={i} className={i===step?'on':''}/>)}</p>
  <p className="rm-chips">{cats.map((c,i)=><span key={i} className={i===step?'on':''}>{c[ix]}</span>)}</p><div className="rm-tiles">{[0,1,2,3].map(i=><i key={i} style={d(i*70)}/>)}</div></div>}
function Instrument({play,ix}:P){const step=useStep(play,3,1700);const svc:Copy[]=[['品牌','Brand'],['数字产品','Digital product'],['宣传','Campaigns']];
 return <div className="rm-instr"><ol>{svc.map((s,i)=><li key={i} className={i===step?'on':''}>{s[ix]}</li>)}</ol><div className="rm-proj">{[0,1,2,3,4,5].map(i=><i key={i} className={i%3===step?'on':''}/>)}</div></div>}
function Pentagram({play,ix}:P){const step=useStep(play,3,1900);const tags:Copy[]=[['全部','All'],['标识','Identity'],['出版','Publishing']];const rows=[['Harbour Museum',1],['Atlas Press',2],['Field Notes Co.',1],['City Transit',1],['Quarterly Review',2],['Lumen Hotels',1]] as const;
 return <div className="rm-penta"><p className="rm-chips">{tags.map((t,i)=><span key={i} className={i===step?'on':''}>{t[ix]}</span>)}</p><ul>{rows.filter(r=>step===0||r[1]===step).map(r=><li key={r[0]}><b>{r[0]}</b><span>{r[1]===1?tags[1][ix]:tags[2][ix]}</span></li>)}</ul></div>}
function Basic({play,ix}:P){const step=useStep(play,3,1900);
 return <div className="rm-basic"><b>{T(ix,'少而强','Few, strong')}</b><div>{[0,1,2].map(i=><i key={i} className={i===step?'on':''}><span>{['Aurora','Kite','Mono'][i]}</span></i>)}</div></div>}

/* Product */
function Figma({play,ix}:P){const step=useStep(play,4,1500);const zones:Copy[]=[['图层','Layers'],['画布','Canvas'],['属性','Properties'],['协作','Multiplayer']];
 return <div className="rm-figma"><p className="rm-zone">{zones[step][ix]}</p><div className="rm-editor"><aside className={step===0?'on':''}><L w={70}/><L w={55}/><L w={60}/></aside><main className={step===1||step===3?'on':''}><i className="frame"/>{step===3&&<><b className="cur a"/><b className="cur b"/></>}</main><aside className={step===2?'on':''}><L w={40}/><L w={80}/><L w={60}/></aside></div></div>}
function Framer({play,ix}:P){const step=useStep(play,3,1900);const phases:Copy[]=[['描述','Describe'],['在画布上改','Edit on canvas'],['发布','Publish']];
 return <div className="rm-framer"><p className="rm-steps">{phases.map((p,i)=><span key={i} className={i===step?'on':i<step?'done':''}>{p[ix]}</span>)}</p><div className="rm-stagebox">
  {step===0&&<div className="rm-input"><span>{T(ix,'一个咖啡馆的单页网站','A one-page site for a café')}</span><b/></div>}
  {step===1&&<Win><div className="rm-canvas2"><i className="sel"/><L w={60}/><L w={40}/></div></Win>}
  {step===2&&<p className="rm-live"><i/>cafe.example.site<span>{T(ix,'已上线','Live')}</span></p>}</div></div>}
function Wiki({play,ix}:P){const step=useStep(play,3,1700);
 return <div className="rm-wiki"><aside>{[0,1,2,3].map(i=><L key={i} w={[70,55,62,48][i]} s={i===step?{background:'var(--rm-brand)'}:undefined}/>)}</aside><div><b>{T(ix,'报销流程','Expense policy')}</b><p className={`rm-badge${step>=1?' on':''}`}><Check/> {T(ix,'已验证 · 负责人 Lin · 至 12 月','Verified · owner Lin · until Dec')}</p><L w={90}/><L w={80}/><L w={60}/></div></div>}
function Obsidian({play,ix}:P){const step=useStep(play,4,1300);const nodes=[[300,170],[170,90],[440,80],[150,260],[460,260],[310,320]];const edges=[[0,1],[0,2],[0,3],[0,4],[1,2],[4,5],[0,5]];const focus=step%nodes.length;
 return <div className="rm-obs"><svg viewBox="0 0 584 344">{edges.map(([a,b],i)=><line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} className={a===focus||b===focus?'on':''}/>)}{nodes.map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i===0?16:10} className={i===focus?'on':''}/>)}</svg><small>{T(ix,`第 ${focus+1} 篇笔记的反向链接`,`Backlinks of note ${focus+1}`)}</small></div>}
function LinearFeatures({play,ix}:P){const step=useStep(play,3,1700);
 return <div className="rm-tree"><p className="lvl0">{T(ix,'目标：秋季发布','Initiative: fall launch')}</p>{[0,1].map(pj=><div key={pj}><p className={`lvl1${step>=1?' in':''}`}>{T(ix,`项目 ${pj+1}`,`Project ${pj+1}`)}</p>{[0,1,2].map(k=><p key={k} className={`lvl2${step>=2?' in':''}`} style={d(k*80)}><i/>{T(ix,`任务 ${pj+1}.${k+1}`,`Issue ${pj+1}.${k+1}`)}</p>)}</div>)}</div>}
function Asana({play,ix}:P){const step=useStep(play,5,1100);
 return <div className="rm-asana"><div className="rm-goal"><b>{T(ix,'团队目标：新用户留存 +10%','Team goal: +10% new-user retention')}</b><p><i style={{width:`${step*25}%`}}/></p><span>{step*25}%</span></div>{[0,1,2,3].map(i=><p key={i} className={`rm-task${i<step?' done':''}`}><em>{i<step&&<Check/>}</em>{T(ix,['改进引导邮件','新手清单','流失调研','第二周提醒'][i],['Improve onboarding email','Starter checklist','Churn interviews','Week-two nudge'][i])}</p>)}</div>}
function PostHog({play,ix}:P){const step=useStep(play,4,1500);const bars=[100,72,48,31];
 return <div className="rm-ph"><div className="rm-input"><span>{T(ix,'多少人完成了注册？','How many finish sign-up?')}</span><b/></div><div className="rm-funnel">{bars.map((b,i)=><div key={i} className={step===3&&i===2?'pick':''}><i style={{height:`${step>=1?b:0}%`,...d(i*90)}}/><small>{b}%</small></div>)}</div>
  <p className={`rm-drill${step>=3?' in':''}`}>{T(ix,'第 3 步流失的 52 人 → 查看录屏','52 people dropped at step 3 → view recordings')}</p></div>}
function Plausible({play,ix}:P){const [n,setN]=useState(12480);useEffect(()=>{if(still()||!play){setN(12480);return}let raf=0;const t0=performance.now();const f=(t:number)=>{const p=Math.min(1,(t-t0)/1400);setN(Math.round(12480*(1-Math.pow(1-p,3))));if(p<1)raf=requestAnimationFrame(f)};raf=requestAnimationFrame(f);return()=>cancelAnimationFrame(raf)},[play]);
 return <div className="rm-plaus"><p className="rm-kpis"><span><small>{T(ix,'访客','Visitors')}</small><b>{n.toLocaleString('en-US')}</b></span><span><small>{T(ix,'跳出率','Bounce')}</small><b>38%</b></span><span><small>{T(ix,'停留','Visit')}</small><b>1m 52s</b></span></p>
  <svg viewBox="0 0 584 120" className={play&&!still()?'anim':''}><path d="M0 100 L60 80 L120 88 L180 60 L240 66 L300 40 L360 52 L420 30 L480 36 L584 14" pathLength={1}/></svg>
  <div className="rm-sources">{[[T(ix,'搜索','Search'),82],[T(ix,'直接访问','Direct'),54],[T(ix,'社交','Social'),31]].map(([l,w])=><p key={l as string}><i style={{width:`${w}%`}}/><span>{l}</span></p>)}</div></div>}

/* Flow */
function FirstPage({play,ix}:P){const step=useStep(play,4,1500);const title=useTyped(T(ix,'第一页','My first page'),play&&step>=1,700);
 return <div className="rm-first"><aside><p className={step===0?'on':''}>{T(ix,'新建页面','New page')}</p><L w={60}/><L w={50}/></aside><div><b className={step>=1?'in':''}>{step>=1?title:T(ix,'无标题','Untitled')}</b>{step>=2&&<p className="rm-slash"><code>/</code>{[[T(ix,'待办清单','To-do list')],[T(ix,'标题','Heading')],[T(ix,'表格','Table')]].map(([o],i)=><span key={i} className={i===0?'on':''}>{o}</span>)}</p>}{step>=3&&<p className="rm-todo"><em/>{T(ix,'写下第一件事','Write the first thing')}</p>}</div></div>}
function NewProject({play,ix}:P){const step=useStep(play,5,1100);const fields:Copy[]=[['名称','Name'],['负责人','Lead'],['目标日期','Target date']];const vals:Copy[]=[['新版结账','New checkout'],['Mia','Mia'],['12 月 15 日','Dec 15']];
 return <div className="rm-np"><div className={`rm-form${step>=4?' done':''}`}>{fields.map((f,i)=><p key={i}><small>{f[ix]}</small><span>{step>i?vals[i][ix]:''}</span></p>)}<b>{T(ix,'创建项目','Create project')}</b></div>
  <div className={`rm-plist${step>=4?' in':''}`}><p><b>{vals[0][ix]}</b><span>Mia · {vals[2][ix]}</span><i><em/></i></p><p><b>{T(ix,'搜索改版','Search revamp')}</b><span>Jo</span><i><em style={{width:'60%'}}/></i></p></div></div>}
function History({play,ix}:P){const step=useStep(play,4,1500);const vs:Copy[]=[['现在','Now'],['下午 3:10 · 改了按钮','3:10 pm · button change'],['上午 11:02 · 换了配色','11:02 am · new palette']];const at=Math.min(step,2);
 return <div className="rm-hist"><div className={`rm-canvas3 v${at}`}><i/><b/><span/>{step>0&&<em>{T(ix,'正在查看旧版本','Viewing an earlier version')}</em>}</div><ol>{vs.map((v,i)=><li key={i} className={i===at?'on':''}>{v[ix]}</li>)}</ol><p className={`rm-restore${step>=3?' in':''}`}>{T(ix,'恢复此版本？当前版本会保留在历史里','Restore this version? The current one stays in history')}</p></div>}
function Export({play,ix}:P){const step=useStep(play,3,1700);const fmts=['PNG','SVG','PDF'];const sizes=['1.2 MB','86 KB','340 KB'];
 return <div className="rm-export"><div className="rm-panel"><small>{T(ix,'导出','Export')}</small><p>{fmts.map((f,i)=><span key={f} className={i===step?'on':''}>{f}</span>)}</p><p><span className="on">2×</span><span>1×</span></p><b>{T(ix,'导出所选','Export selection')}</b></div>
  <div className="rm-file" key={step}><i>{fmts[step]}</i><p>{T(ix,'首页-设计','home-design')}.{fmts[step].toLowerCase()}</p><small>{sizes[step]} · {step===1?T(ix,'矢量，可无损缩放','vector, scales cleanly'):step===2?T(ix,'可打印','print-ready'):T(ix,'2 倍像素','2× pixels')}</small></div></div>}

export const moreStudies:Record<string,{title:Copy;render:(p:P)=>ReactNode}>={
 linear:{title:['主张 → 产品界面 → 任务在流程里移动','Claim → product view → work moving through states'],render:p=><Linear {...p}/>},
 notion:{title:['能力逐层展开，一次只讲一层','Capabilities unfold one layer at a time'],render:p=><Notion {...p}/>},
 cursor:{title:['在真实代码里提出修改、接受','A suggested change in real code, then accepted'],render:p=><Cursor {...p}/>},
 v0:{title:['点一个示例就开始输入，接着出结果','Pick an example, it fills the input, a result appears'],render:p=><V0 {...p}/>},
 lovable:{title:['先给输入框，再让社区作品滚动给灵感','Input first, then a scrolling community gallery'],render:p=><Lovable {...p}/>},
 impeccable:{title:['标出问题 → 一条命令 → 前后对照','Mark issues → one command → before and after'],render:p=><Impeccable {...p}/>},
 aesop:{title:['分类切换、叙事和购买入口并排','Category tabs, a story and a buy action side by side'],render:p=><Aesop {...p}/>},
 teenage:{title:['选中一件产品，它的配件跟着亮起','Select a product and its accessories light up'],render:p=><Teenage {...p}/>},
 nothing:{title:['活动轮播 → 品类 → 单品','Campaign carousel → category → product'],render:p=><Nothing {...p}/>},
 instrument:{title:['每项服务都指向支撑它的项目','Each service points at the projects that prove it'],render:p=><Instrument {...p}/>},
 pentagram:{title:['大索引按类型筛选后重新排列','A large index reflows when filtered'],render:p=><Pentagram {...p}/>},
 basic:{title:['大字品牌表达，少量项目轮流放大','Big brand type, a few projects take turns'],render:p=><Basic {...p}/>},
 figma:{title:['编辑器的四组能力依次点亮','The editor\'s four groups light up in turn'],render:p=><Figma {...p}/>},
 framer:{title:['描述 → 在画布上改 → 发布上线','Describe → edit on canvas → publish'],render:p=><Framer {...p}/>},
 wiki:{title:['页面带验证状态、负责人和有效期','Pages show verification, owner and expiry'],render:p=><Wiki {...p}/>},
 obsidian:{title:['在关系图里切换焦点笔记','Moving focus across the note graph'],render:p=><Obsidian {...p}/>},
 'linear-features':{title:['目标 → 项目 → 任务逐层展开','Initiative → projects → issues unfold'],render:p=><LinearFeatures {...p}/>},
 asana:{title:['任务完成推动团队目标进度','Finished tasks move the team goal'],render:p=><Asana {...p}/>},
 posthog:{title:['提一个问题 → 漏斗 → 下钻到流失的人','Ask → funnel → drill into who dropped'],render:p=><PostHog {...p}/>},
 plausible:{title:['一屏三项核心指标，其余往下放','Three core numbers on one screen, the rest below'],render:p=><Plausible {...p}/>},
 'first-page':{title:['新建 → 起标题 → 用 / 插入第一个块','New → title → insert a first block with /'],render:p=><FirstPage {...p}/>},
 'new-project':{title:['表单只问后续工作要用的字段，建好就进列表','The form asks only what later work needs, then lists it'],render:p=><NewProject {...p}/>},
 history:{title:['查看旧版本和恢复是两步，恢复前先说明后果','Viewing and restoring are separate; restore explains itself'],render:p=><History {...p}/>},
 export:{title:['换格式时，先告诉你会得到什么文件','Changing format tells you what file you will get'],render:p=><Export {...p}/>},
};
