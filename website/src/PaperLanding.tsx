import { useEffect, useRef, useState } from "react";
import { CapabilityStudies, type ShowcaseDirection } from "./CapabilityShowcase";
import { GuidedDemo } from "./GuidedDemo";
import type { Language } from "./direction-engine";
import { useLandingMotion } from "./useLandingMotion";
import "./paper-landing.css";

const repo = "https://github.com/YuqingNicole/variant-design-skill";
export function PaperLanding() {
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem('variant-language') === 'en' ? 'en' : 'zh');
  const [direction, setDirection] = useState<ShowcaseDirection>('A');
  const [scale, setScale] = useState(1);
  const viewport = useRef<HTMLDivElement>(null);
  const zh = language === 'zh';
  useLandingMotion(true);
  useEffect(() => {
    document.documentElement.lang = zh ? 'zh-CN' : 'en';
    document.title = zh ? 'Variant Design — 好设计，从看见可能开始。' : 'Variant Design — See the possibilities.';
    document.querySelector('meta[name="description"]')?.setAttribute('content', zh ? '在真实代码项目中比较三个设计方向，局部打磨、保留历史，再接入你的产品。' : 'Compare three design directions in your code project. Refine locally, preserve history and integrate the result.');
    localStorage.setItem('variant-language', language);
  }, [language, zh]);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / 1200));
    if (viewport.current) observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);
  return <main className="paper-home">
    <nav className="paper-nav paper-shell" aria-label={zh ? '主导航' : 'Main navigation'}>
      <a className="paper-wordmark" href="#"><span aria-hidden="true">▧</span> variant<span className="wordmark-light">design</span></a>
      <div className="paper-nav-links"><a href="#canvas">{zh ? '看方案' : 'Explore'}</a><a href="#workflow">{zh ? '如何工作' : 'Workflow'}</a><a href="#guided-demo">{zh ? '开始使用' : 'Get started'}</a></div>
      <button className="paper-language" aria-label={zh ? '切换到英文' : 'Switch to Chinese'} onClick={() => setLanguage(zh ? 'en' : 'zh')}>{zh ? 'EN' : '中文'}</button>
    </nav>
    <header className="paper-hero paper-shell hero-copy">
      <p className="paper-kicker">DESIGN WITH POSSIBILITIES</p>
      <h1>{zh ? '好设计，' : 'Good design.'}<br/><span>{zh ? '从看见可能开始。' : 'More possibilities.'}</span></h1>
      <p className="paper-lede">{zh ? '把一个想法，展开成三个值得比较的方向。和你的 Agent 一起选择、打磨，让设计走进真实项目。' : 'Explore three considered directions from one idea. Compare and refine with your agent, then bring the design into your real project.'}</p>
      <div className="paper-actions"><a className="paper-button" href="#guided-demo">{zh ? '在我的项目中开始' : 'Start in my project'} <span>↗</span></a><a href="#canvas">{zh ? '先看看真实方案' : 'Explore the real directions'} <span>↓</span></a></div>
      <div className="paper-margin-note" aria-hidden="true"><span>ONE BRIEF</span><i/><span>THREE DIRECTIONS</span></div>
    </header>
    <section className="paper-shell paper-product" id="canvas" aria-label={zh ? '真实设计画布' : 'Live design canvas'}>
      <div className="canvas-chrome"><span className="canvas-dots" aria-hidden="true">● ● ●</span><span>forma / growth-overview</span><span className="canvas-live">{zh ? '可运行预览' : 'LIVE PREVIEW'}</span></div>
      <div className="canvas-layout"><aside className="canvas-sidebar"><p>{zh ? '项目方向' : 'DIRECTIONS'}</p>{['A','B','C'].map((id,i) => <button key={id} aria-pressed={direction===id} onClick={()=>setDirection(id as ShowcaseDirection)}><span>{id}</span>{(zh ? ['发现异常','比较渠道','追溯证据'] : ['Spot signals','Compare','Inspect'])[i]}</button>)}<div className="canvas-lock"><span>↳</span><p>{zh ? '同一品牌\n同一任务\n三种取舍' : 'One brand\nOne task\nThree tradeoffs'}</p></div></aside>
        <div className="canvas-workspace"><div className="canvas-ruler" aria-hidden="true">0 <span>400</span><span>800</span><span>1200</span></div><div className="canvas-label"><span>{zh ? `方案 ${direction} / 桌面画板` : `Direction ${direction} / Desktop artboard`}</span><a href={`/showcase?direction=${direction}&language=${language}`} target="_blank" rel="noreferrer">{zh ? '完整打开 ↗' : 'Open full page ↗'}</a></div><div ref={viewport} className="paper-preview" style={{height:760*scale}}><iframe key={`${direction}-${language}`} src={`/showcase?direction=${direction}&language=${language}`} title={zh ? `方案 ${direction} 实时预览` : `Direction ${direction} live preview`} style={{transform:`scale(${scale})`}} /></div><div className="canvas-tradeoff" aria-live="polite"><p><strong>{zh ? "设计取舍 / " : "TRADEOFF / "}</strong>{(zh ? {A:"先定位异常；渠道细节需要进一步查看。适合每日巡检。",B:"同屏比较渠道；异常提醒的权重降低。适合周度复盘。",C:"逐条检查来源；全局趋势的呈现减少。适合核对判断依据。"}:{A:"Find anomalies first; channel detail takes another step. Best for daily checks.",B:"Compare channels side by side; alerts get less emphasis. Best for weekly reviews.",C:"Inspect each record; less space for global trends. Best for checking evidence."})[direction]}</p></div></div>
      </div>
      <div className="canvas-caption"><span>{zh ? '设计能力示例：Forma 增长看板 · 示例数据' : 'DESIGN STUDY: FORMA GROWTH DASHBOARD · SAMPLE DATA'}</span><span>{zh ? '查看不会选定最终方案' : 'Viewing does not select a winner'}</span></div>
    </section>
    <div className="paper-compat paper-shell"><p>{zh ? '在你已经使用的工具里工作' : 'WORK WHERE YOU ALREADY BUILD'}</p><div><span>Codex</span><span>React</span><span>HTML / CSS</span><span>Git</span><span>{zh ? '你的设计系统' : 'Your design system'}</span></div></div>
    <section className="paper-story paper-shell" id="workflow">
      <header className="section-heading"><p className="paper-kicker">FROM OPTIONS TO YOUR PROJECT</p><h2>{zh ? <>让每一次选择，<br/><span>都有继续生长的空间。</span></> : <>Room to explore.<br/><span>A path to ship.</span></>}</h2><p>{zh ? '设计不止是第一张好看的图。保留选择的理由，也保留重新选择的余地。' : 'Keep the reasoning behind a design—and the room to change your mind.'}</p></header>
      <CapabilityStudies language={language}/>
    </section>
    <GuidedDemo language={language} expressive/>
    <section className="paper-closing paper-shell"><p className="paper-kicker">YOUR NEXT GOOD IDEA</p><h2>{zh ? '让第一稿，成为起点。' : 'Make the first draft a beginning.'}</h2><a className="paper-button" href="#guided-demo">{zh ? '开始我的三版设计' : 'Explore my three directions'} ↗</a><p>{zh ? '开源技能 · 在你的代码项目里运行' : 'Open-source skill · Runs in your code project'}</p></section>
    <footer className="paper-footer paper-shell"><span>variant design / Yuqing Nicole</span><div><a href={repo} target="_blank" rel="noreferrer">GitHub ↗</a><a href="/workbench">{zh ? '在线实验室' : 'Online lab'}</a><a href="/pricing">{zh ? '价格' : 'Pricing'}</a></div></footer>
  </main>;
}
