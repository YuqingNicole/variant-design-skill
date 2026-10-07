import { useState } from "react";
import type { Language } from "./direction-engine";
import "./direction-stage.css";

export function DirectionStage({ language }: { language: Language }) {
  const [active, setActive] = useState(1);
  const zh = language === "zh";
  const names = zh ? ["让人看懂", "让人体验", "让人开始"] : ["Understand", "Experience", "Get started"];
  return <aside className="direction-stage" aria-label={zh ? "三个设计方向" : "Three design directions"}>
    <div className="stage-caption"><span>{zh ? "一份命题 / 三种可能" : "ONE BRIEF / THREE POSSIBILITIES"}</span><span>01—03</span></div>
    <div className="stage-canvas" data-active={active}>
      <div className="stage-orbit" aria-hidden="true" /><span className="stage-cross cross-one" aria-hidden="true">+</span><span className="stage-cross cross-two" aria-hidden="true">+</span>
      {["A", "B", "C"].map((id, index) => <a key={id} className={`direction-sheet sheet-${id} ${active === index ? "sheet-active" : ""}`} href={`/variant-output/_preview/${id}.html?language=${language}`} onFocus={() => setActive(index)} aria-label={zh ? `打开 ${id} 方案` : `Open direction ${id}`}>
        <div className="sheet-top"><span>VARIANT / {id}</span><span>↗</span></div>
        <div className="sheet-art" aria-hidden="true"><span className="art-disc"/><span className="art-line"/><span className="art-line"/></div>
        <div className="sheet-title">{index === 0 ? <>Less noise.<br/><i>More meaning.</i></> : index === 1 ? <>Show the work.<br/><i>Make it real.</i></> : <>A clear path.<br/><i>Your next move.</i></>}</div>
        <div className="sheet-bottom"><span>{names[index]}</span><span>0{index + 1}</span></div>
      </a>)}
      <span className="stage-annotation">{zh ? "同一约束，不同答案。" : "Same constraints. Different answers."}</span>
    </div>
    <div className="stage-controls" role="group" aria-label={zh ? "切换方向示意" : "Switch direction illustration"}>{["A", "B", "C"].map((id, index) => <button key={id} type="button" aria-pressed={active === index} onClick={() => setActive(index)}><span>{id}</span>{names[index]}</button>)}</div>
    <p className="stage-note">{zh ? "方向示意 · 点击卡片打开真实页面" : "Direction studies · Open a card to see the real page"}</p>
  </aside>;
}
