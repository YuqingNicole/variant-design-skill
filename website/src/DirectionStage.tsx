import { t, type Localized } from './i18n/localized';
import { useState } from "react";
import type { Language } from "./direction-engine";
import "./direction-stage.css";
const m={threeDesignDirections:{zh:"三个设计方向",en:"Three design directions"},
 oneBriefThreePossibilities:{zh:"一份命题 / 三种可能",en:"ONE BRIEF / THREE POSSIBILITIES"},
 sameConstraintsDifferentAnswers:{zh:"同一约束，不同答案。",en:"Same constraints. Different answers."},
 switchDirectionIllustration:{zh:"切换方向示意",en:"Switch direction illustration"},
 directionStudiesOpenA:{zh:"方向示意 · 点击卡片打开真实页面",en:"Direction studies · Open a card to see the real page"}} satisfies Record<string,Localized>;

export function DirectionStage({ language }: { language: Language }) {
  const [active, setActive] = useState(1);
  const zh = language === "zh";
  const names = t({zh:["让人看懂", "让人体验", "让人开始"],en:["Understand", "Experience", "Get started"]},language);
  return <aside className="direction-stage" aria-label={t(m.threeDesignDirections,language)}>
    <div className="stage-caption"><span>{t(m.oneBriefThreePossibilities,language)}</span><span>01—03</span></div>
    <div className="stage-canvas" data-active={active}>
      <div className="stage-orbit" aria-hidden="true" /><span className="stage-cross cross-one" aria-hidden="true">+</span><span className="stage-cross cross-two" aria-hidden="true">+</span>
      {["A", "B", "C"].map((id, index) => <a key={id} className={`direction-sheet sheet-${id} ${active === index ? "sheet-active" : ""}`} href={`/variant-output/_preview/${id}.html?language=${language}`} onFocus={() => setActive(index)} aria-label={t({zh:`打开 ${id} 方案`,en:`Open direction ${id}`},language)}>
        <div className="sheet-top"><span>VARIANT / {id}</span><span>↗</span></div>
        <div className="sheet-art" aria-hidden="true"><span className="art-disc"/><span className="art-line"/><span className="art-line"/></div>
        <div className="sheet-title">{index === 0 ? <>Less noise.<br/><i>More meaning.</i></> : index === 1 ? <>Show the work.<br/><i>Make it real.</i></> : <>A clear path.<br/><i>Your next move.</i></>}</div>
        <div className="sheet-bottom"><span>{names[index]}</span><span>0{index + 1}</span></div>
      </a>)}
      <span className="stage-annotation">{t(m.sameConstraintsDifferentAnswers,language)}</span>
    </div>
    <div className="stage-controls" role="group" aria-label={t(m.switchDirectionIllustration,language)}>{["A", "B", "C"].map((id, index) => <button key={id} type="button" aria-pressed={active === index} onClick={() => setActive(index)}><span>{id}</span>{names[index]}</button>)}</div>
    <p className="stage-note">{t(m.directionStudiesOpenA,language)}</p>
  </aside>;
}
