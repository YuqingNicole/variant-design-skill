import { t, type Localized } from './i18n/localized';
import { useEffect, useRef, useState } from "react";
import { CapabilityStudies, type ShowcaseDirection } from "./CapabilityShowcase";
import { SiteHeader, SiteFooter } from "./SiteChrome";
import { GuidedDemo } from "./GuidedDemo";
import type { Language } from "./direction-engine";
import { useLandingMotion } from "./useLandingMotion";
import "./paper-landing.css";
import { useLocale } from './i18n/LocaleProvider';
import { localePath } from './i18n/locale-route';
import { Testimonials } from './Testimonials';
const m={variantDesignOneBrief:{zh:'Variant Design — 一份需求，三个能运行的方向',en:'Variant Design — One brief, three directions that run'},
 compareThreeDesignDirections:{zh:'在真实代码项目中比较三个设计方向，局部打磨、保留历史，再接入你的产品。',en:'Compare three design directions in your code project. Refine locally, preserve history and integrate the result.'},
 oneBrief:{zh:'一份需求，',en:'One brief,'},
 threeDirectionsThatRun:{zh:'三个能运行的方向。',en:'three directions that run.'},
 exploreThreeConsideredDirections:{zh:'把一个想法，展开成三个值得比较的方向。和你的 Agent 一起选择、打磨，让设计走进真实项目。',en:'Explore three considered directions from one idea. Compare and refine with your agent, then bring the design into your real project.'},
 startInMyProject:{zh:'在我的项目中开始',en:'Start in my project'},
 exploreTheRealDirections:{zh:'先看看真实方案',en:'Explore the real directions'},
 liveDesignCanvas:{zh:'真实设计画布',en:'Live design canvas'},
 livePreview:{zh:'可运行预览',en:'LIVE PREVIEW'},
 directions:{zh:'项目方向',en:'DIRECTIONS'},
 oneBrandOneTask:{zh:'同一品牌\n同一任务\n三种取舍',en:'One brand\nOne task\nThree tradeoffs'},
 openFullPage:{zh:'完整打开',en:'Open full page ↗'},
 tradeoff:{zh:"设计取舍 / ",en:"TRADEOFF / "},
 designStudyFormaGrowth:{zh:'设计能力示例：Forma 增长看板 · 示例数据',en:'DESIGN STUDY: FORMA GROWTH DASHBOARD · SAMPLE DATA'},
 viewingDoesNotSelect:{zh:'查看不会选定最终方案',en:'Viewing does not select a winner'},
 eachEditSavesA:{zh:'每次修改先存快照，只动你指定的区域；不满意就回到上一个版本。',en:'Each edit saves a snapshot first and touches only the region you name; undo returns the previous version.'},
 tryItInYour:{zh:'在你的项目里试一次。',en:'Try it in your project.'},
 exploreMyThreeDirections:{zh:'开始我的三版设计',en:'Explore my three directions'},
 openSourceSkillRuns:{zh:'开源技能 · 在你的代码项目里运行',en:'Open-source skill · Runs in your code project'}} satisfies Record<string,Localized>;

export function PaperLanding() {
  const language = useLocale();
  const [direction, setDirection] = useState<ShowcaseDirection>('A');
  const [scale, setScale] = useState(1);
  const viewport = useRef<HTMLDivElement>(null);
  const zh = language === 'zh';
  useLandingMotion(true);
  useEffect(() => {
    document.documentElement.lang = t({zh:'zh-CN',en:'en'},language);
    document.title = t(m.variantDesignOneBrief,language);
    document.querySelector('meta[name="description"]')?.setAttribute('content', t(m.compareThreeDesignDirections,language));
  }, [language, zh]);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / 1200));
    if (viewport.current) observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);
  return <main className="paper-home">
    <SiteHeader language={language}/>
    <header className="paper-hero paper-shell hero-copy">
      <h1>{t(m.oneBrief,language)}<br/><span>{t(m.threeDirectionsThatRun,language)}</span></h1>
      <p className="paper-lede">{t(m.exploreThreeConsideredDirections,language)}</p>
      <div className="paper-actions"><a className="paper-button" href={localePath('/docs/install',language)}>{t(m.startInMyProject,language)}</a><a href="#canvas">{t(m.exploreTheRealDirections,language)}</a></div>
    </header>
    <section className="paper-shell paper-product" id="canvas" aria-label={t(m.liveDesignCanvas,language)}>
      <div className="canvas-chrome"><span>forma / growth-overview</span><span className="canvas-live">{t(m.livePreview,language)}</span></div>
      <div className="canvas-layout"><aside className="canvas-sidebar"><p>{t(m.directions,language)}</p>{['A','B','C'].map((id,i) => <button key={id} aria-pressed={direction===id} onClick={()=>setDirection(id as ShowcaseDirection)}><span>{id}</span>{(t({zh:['发现异常','比较渠道','追溯证据'],en:['Spot signals','Compare','Inspect']},language))[i]}</button>)}<div className="canvas-lock"><span>↳</span><p>{t(m.oneBrandOneTask,language)}</p></div></aside>
        <div className="canvas-workspace"><div className="canvas-label"><span>{t({zh:`方案 ${direction} / 桌面画板`,en:`Direction ${direction} / Desktop artboard`},language)}</span><a href={localePath(`/showcase?direction=${direction}&language=${language}`,language)} target="_blank" rel="noreferrer">{t(m.openFullPage,language)}</a></div><div ref={viewport} className="paper-preview" style={{height:760*scale}}><iframe key={`${direction}-${language}`} src={`/showcase?direction=${direction}&language=${language}`} title={t({zh:`方案 ${direction} 实时预览`,en:`Direction ${direction} live preview`},language)} style={{transform:`scale(${scale})`}} /></div><div className="canvas-tradeoff" aria-live="polite"><p><strong>{t(m.tradeoff,language)}</strong>{(t({zh:{A:"先定位异常；渠道细节需要进一步查看。适合每日巡检。",B:"同屏比较渠道；异常提醒的权重降低。适合周度复盘。",C:"逐条检查来源；全局趋势的呈现减少。适合核对判断依据。"},en:{A:"Find anomalies first; channel detail takes another step. Best for daily checks.",B:"Compare channels side by side; alerts get less emphasis. Best for weekly reviews.",C:"Inspect each record; less space for global trends. Best for checking evidence."}},language))[direction]}</p></div></div>
      </div>
      <div className="canvas-caption"><span>{t(m.designStudyFormaGrowth,language)}</span><span>{t(m.viewingDoesNotSelect,language)}</span></div>
    </section>
    <section className="paper-story paper-shell" id="workflow">
      <header className="section-heading"><h2>{t({zh:<>选定之后，<br/><span>还能局部改、能撤回。</span></>,en:<>After you choose,<br/><span>edit one part, or undo.</span></>},language)}</h2><p>{t(m.eachEditSavesA,language)}</p></header>
      <CapabilityStudies language={language}/>
    </section>
    <GuidedDemo language={language} expressive/>
    <Testimonials language={language}/>
    <section className="paper-closing paper-shell"><h2>{t(m.tryItInYour,language)}</h2><a className="paper-button" href="#guided-demo">{t(m.exploreMyThreeDirections,language)}</a><p>{t(m.openSourceSkillRuns,language)}</p></section>
    <SiteFooter language={language}/>
  </main>;
}
