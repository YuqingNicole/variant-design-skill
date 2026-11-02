import { t, type Localized } from './i18n/localized';
import { useState } from 'react';
import type { Language } from './direction-engine';
import './capability-showcase.css';
const m={overview:{zh:'增长概览',en:'Overview'},
 channels:{zh:'渠道表现',en:'Channels'},
 activity:{zh:'活动记录',en:'Activity'},
 threeChannelsOneGrowth:{zh:'三个渠道，同一个增长目标。',en:'Three channels. One growth goal.'},
 weeklyReport:{zh:'本周概览',en:'Weekly report'},
 revenue:{zh:'总收入',en:'Revenue'},
 sessions:{zh:'访问次数',en:'Sessions'},
 needsAttention:{zh:'需关注渠道',en:'Needs attention'},
 cumulativeRevenue:{zh:'累计收入趋势',en:'Cumulative revenue'},
 thisWeek:{zh:'本周收入',en:'this week'},
 needsAttention2:{zh:'需要关注',en:'NEEDS ATTENTION'},
 revenueIsBelowLast:{zh:'收入低于上周，转化率为 1.9%。先检查这个渠道。',en:'Revenue is below last week. Conversion is 1.9%. Start your review here.'},
 revenue2:{zh:'当前收入',en:'Revenue'},
 priority013Channels:{zh:'优先级 01 / 共 3 个渠道',en:'Priority 01 / 3 channels'},
 vsLastWeek:{zh:'较上周',en:'vs last week'},
 conversion:{zh:'转化率',en:'Conversion'},
 selectAChannelTo:{zh:'选择渠道，查看证据',en:'Select a channel to inspect'},
 revenue3:{zh:'收入',en:'Revenue'},
 sourceSampleChannelSummary:{zh:'来源：示例渠道汇总表',en:'Source: sample channel summary'},
 sameReportingPeriodAs:{zh:'统计区间与上方报表一致',en:'Same reporting period as overview'},
 sampleDataForDesign:{zh:'示例数据 · 用于比较设计取舍',en:'SAMPLE DATA · FOR DESIGN COMPARISON'},
 oneDatasetThreeWays:{zh:'同一份数据，三种决策方式。',en:'One dataset. Three ways to decide.'},
 surfaceASignalCompare:{zh:'把异常放大、把渠道并排，或把证据展开。布局改变的是用户先看什么、下一步做什么。',en:'Surface a signal, compare channels, or inspect the evidence. Layout changes what people see and do first.'},
 paidSocialIsDown:{zh:'付费社交转化下降，优先检查投放。',en:'Paid social is down. Review campaigns first.'},
 knowWhatNeedsYour:{zh:'先处理值得关注的变化。',en:'Know what needs your attention.'},
 typeColorOtherRegions:{zh:'字体、配色与其他区域保持不变',en:'TYPE, COLOR & OTHER REGIONS PRESERVED'},
 aFocusedEditA:{zh:'只改标题，看见修改边界。',en:'A focused edit. A visible boundary.'},
 makeTheHeadlineMore:{zh:'试着让标题更具体。只有选中区域改变，下方数据与导航保持原样。',en:'Make the headline more specific. Only the selected region changes; metrics and navigation stay intact.'},
 exampleEditApplied:{zh:'已应用示例修改',en:'Example edit applied'},
 tryTheHeadlineEdit:{zh:'试改这个标题 ↗',en:'Try the headline edit ↗'},
 interactiveExample:{zh:'本页交互示例',en:'INTERACTIVE EXAMPLE'},
 originalHeadline:{zh:'原始标题',en:'Original headline'},
 scopedEdit:{zh:'局部试改',en:'Scoped edit'},
 headlineEditedOtherRegions:{zh:'已修改标题，其他区域不变',en:'Headline edited; other regions preserved'},
 tryTheEditIn:{zh:'点击左侧按钮，试改标题',en:'Try the edit in the previous panel'},
 aWayBackWhen:{zh:'不满意，回到上一个版本。',en:'A way back, when you need it.'},
 v01IsPreservedUndo:{zh:'v01 已保留。撤回会恢复原始标题，不会改变三版选择。',en:'v01 is preserved. Undo restores the original headline without selecting a direction.'},
 currentlyAtV01This:{zh:'当前为 v01。这里演示标题状态恢复；项目文件的快照由安装后的技能处理。',en:'Currently at v01. This demonstrates headline state restoration; the installed skill handles project snapshots.'},
 undoExampleEdit:{zh:'↶ 撤回示例修改',en:'↶ Undo example edit'}} satisfies Record<string,Localized>;
export type ShowcaseDirection = 'A' | 'B' | 'C';
const channels = [
  { name:'Organic search',sessions:'24,820',rate:'4.8%',revenue:'$18,640',delta:'+12.6%',values:[34,45,39,58,52,70,64,88,79,96],color:'#647e61' },
  { name:'Direct',sessions:'18,460',rate:'5.2%',revenue:'$16,280',delta:'+8.2%',values:[36,32,46,42,57,53,69,66,80,85],color:'#a5b691' },
  { name:'Paid social',sessions:'12,380',rate:'1.9%',revenue:'$7,420',delta:'−18.4%',values:[78,82,71,77,62,68,50,53,39,33],color:'#ce9178' },
];
function Spark({values,color}:{values:number[];color:string}) {return <svg viewBox="0 0 300 110" aria-hidden="true"><path d="M0 105H300M0 55H300M0 5H300" fill="none" stroke="#e8eae4"/><polyline points={values.map((n,i)=>`${i*300/(values.length-1)},${105-n}`).join(' ')} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/></svg>}
export function CapabilityShowcase({direction='A',language='zh'}:{direction?:ShowcaseDirection;language?:Language}) {
 const zh=language==='zh'; const [selected,setSelected]=useState(2); const row=channels[selected];
 const titles=t({zh:['先处理值得关注的变化。','把增长，放在一起比较。','每个判断，都有迹可循。'],en:['Know what needs your attention.','Put growth in perspective.','Follow the evidence.']},language);
 return <div className={`cap-app cap-${direction}`} data-showcase-direction={direction}>
 <aside className="cap-rail"><div className="cap-logo">◒ <strong>Forma</strong></div><span className="cap-workspace">STUDIO WORKSPACE ⌄</span><div className="cap-menu"><span>◫　{t(m.overview,language)}</span><span>▥　{t(m.channels,language)}</span><span>◷　{t(m.activity,language)}</span></div><div className="cap-team"><i>JL</i><span>Jamie Lee<small>Studio team</small></span></div></aside>
 <div className="cap-body"><div className="cap-topline"><span>Workspace / Growth overview</span><span>Oct 01 — Oct 07, 2026</span></div><header className="cap-heading"><div><p>YOUR WEEK, IN FOCUS</p><h2>{titles[['A','B','C'].indexOf(direction)]}</h2><span>{t(m.threeChannelsOneGrowth,language)}</span></div><span className="cap-period">{t(m.weeklyReport,language)}</span></header>
 <div className="cap-stats"><div><span>{t(m.revenue,language)}</span><strong>$42,340 <small>↗ 4.0%</small></strong><i>vs. previous week</i></div><div><span>{t(m.sessions,language)}</span><strong>55,660 <small>↗ 9.2%</small></strong><i>across 3 channels</i></div><div><span>{t(m.needsAttention,language)}</span><strong>01 <small className="cap-negative">Paid social</small></strong><i>revenue −18.4%</i></div></div>
 {direction==='A'?<div className="cap-overview"><section className="cap-chart"><div className="cap-panel-title"><h3>{t(m.cumulativeRevenue,language)}</h3><span>01 — 07 OCT</span></div><div className="cap-chart-total">$42,340 <span>{t(m.thisWeek,language)}</span></div><div className="cap-large-chart"><div className="cap-axis"><span>40k</span><span>20k</span><span>0</span></div><Spark values={[10,22,38,51,65,79,100]} color="#647e61"/></div><div className="cap-chart-dates"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></section><section className="cap-alert"><span>↘ {t(m.needsAttention2,language)}</span><h3>Paid social</h3><strong>−18.4<small>%</small></strong><p>{t(m.revenueIsBelowLast,language)}</p><div><span>{t(m.revenue2,language)}</span><b>$7,420</b></div><small>{t(m.priority013Channels,language)}</small></section></div>:direction==='B'?<div className="cap-channel-cards">{channels.map(c=><section key={c.name}><i style={{background:c.color}}/><h3>{c.name}</h3><strong>{c.revenue}</strong><span className={c.delta.startsWith('−')?'cap-negative':'cap-positive'}>{c.delta} {t(m.vsLastWeek,language)}</span><Spark values={c.values} color={c.color}/><div><span>{t(m.conversion,language)}</span><b>{c.rate}</b></div><div><span>{t(m.sessions,language)}</span><b>{c.sessions}</b></div></section>)}</div>:<div className="cap-evidence"><section><div className="cap-panel-title"><h3>{t(m.selectAChannelTo,language)}</h3><span>3 RECORDS</span></div>{channels.map((c,i)=><button key={c.name} onClick={()=>setSelected(i)} aria-pressed={selected===i}><span style={{background:c.color}}/><div><strong>{c.name}</strong><small>{c.sessions} sessions · {c.rate} conversion</small></div><b>{c.revenue} ↗</b></button>)}</section><section className="cap-inspector"><span>RECORD / 0{selected+1}</span><h3>{row.name}</h3><dl><div><dt>{t(m.revenue3,language)}</dt><dd>{row.revenue}</dd></div><div><dt>{t(m.vsLastWeek,language)}</dt><dd>{row.delta}</dd></div><div><dt>{t(m.conversion,language)}</dt><dd>{row.rate}</dd></div></dl><p>{t(m.sourceSampleChannelSummary,language)}</p><small>{t(m.sameReportingPeriodAs,language)}</small></section></div>}
 <footer className="cap-bottom"><span>● {t(m.sampleDataForDesign,language)}</span><span>FORMA / GROWTH INTELLIGENCE</span></footer></div></div>;
}
// Labels on the explanatory diagrams; the Forma screens inside them are a sample product and keep their own English UI.
const art={signalFirst:{zh:'A / 先看异常',en:'A / SIGNAL FIRST'},compareFirst:{zh:'B / 先做比较',en:'B / COMPARE FIRST'},heroOnly:{zh:'只改首屏 ↖',en:'HERO ONLY ↖'},history:{zh:'版本记录',en:'VERSION HISTORY'},current:{zh:'当前',en:'CURRENT'},saved:{zh:'已保存',en:'SAVED'},oneRegion:{zh:'1 个区域',en:'1 REGION'},noTokenChanges:{zh:'tokens 未改动',en:'0 TOKEN CHANGES'}} satisfies Record<string,Localized>;
export function CapabilityStudies({language}:{language:Language}) {
 const zh=language==='zh';const [refined,setRefined]=useState(false);
 return <div className="cap-studies"><article><div className="cap-study-art"><div className="cap-stacked cap-stack-back" aria-hidden="true"><CapabilityShowcase direction="B" language={language}/></div><div className="cap-stacked cap-stack-front" aria-hidden="true"><CapabilityShowcase direction="A" language={language}/></div><span className="cap-art-tag">{t(art.signalFirst,language)} <span>{t(art.compareFirst,language)}</span></span></div><h3>{t(m.oneDatasetThreeWays,language)}</h3><p>{t(m.surfaceASignalCompare,language)}</p></article>
 <article><div className="cap-study-art"><div className="cap-edit-board"><div className="cap-edit-nav">◒ Forma <span>Overview / Growth</span></div><div className="cap-edit-region" data-refined={refined}><span>{t(art.heroOnly,language)}</span><h4>{refined?(t(m.paidSocialIsDown,language)):(t(m.knowWhatNeedsYour,language))}</h4><p>{t(m.threeChannelsOneGrowth,language)}</p></div><div className="cap-edit-kpis"><span>$42,340<small>{t(m.revenue,language)}</small></span><span>55,660<small>{t(m.sessions,language)}</small></span><span>01<small>{t(m.needsAttention,language)}</small></span></div></div><span className="cap-art-tag">{t(m.typeColorOtherRegions,language)}</span></div><h3>{t(m.aFocusedEditA,language)}</h3><p>{t(m.makeTheHeadlineMore,language)}</p><button className="cap-study-action" onClick={()=>setRefined(true)} disabled={refined}>{refined?(t(m.exampleEditApplied,language)):(t(m.tryTheHeadlineEdit,language))}</button></article>
 <article><div className="cap-study-art"><div className="cap-history-card"><header><span>↶</span><div>{t(art.history,language)}<small>{t(m.interactiveExample,language)}</small></div></header><ol><li data-current={!refined}><i/><div><strong>v01 <span>{t(m.originalHeadline,language)}</span></strong><p>{t(m.knowWhatNeedsYour,language)}</p></div><b>{t(!refined?art.current:art.saved,language)}</b></li><li data-current={refined}><i/><div><strong>v02 <span>{t(m.scopedEdit,language)}</span></strong><p>{refined?(t(m.headlineEditedOtherRegions,language)):(t(m.tryTheEditIn,language))}</p></div><b>{refined?t(art.current,language):'—'}</b></li></ol><footer><span>{t(art.oneRegion,language)}</span><span>{t(art.noTokenChanges,language)}</span></footer></div></div><h3>{t(m.aWayBackWhen,language)}</h3><p role="status">{refined?(t(m.v01IsPreservedUndo,language)):(t(m.currentlyAtV01This,language))}</p><button className="cap-study-action" onClick={()=>setRefined(false)} disabled={!refined}>{t(m.undoExampleEdit,language)}</button></article></div>;
}
