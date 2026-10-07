import { useEffect, useRef, useState } from "react";
import type { Language } from "./direction-engine";
import "./guided-demo.css";

type Id = "A" | "B" | "C";
const ids: Id[] = ["A", "B", "C"];
const repository = "https://github.com/YuqingNicole/variant-design-skill";
const options = {
  zh: {
    A: ["理解优先", "让首次访问的人理解产品。", "首屏容纳的操作较少。", "产品概念需要解释时。"],
    B: ["体验优先", "尽快看到实际交付的页面。", "留给方法解释的篇幅较少。", "用户想先确认效果时。"],
    C: ["接入优先", "缩短从了解产品到安装的路径。", "需要用户已经理解技能的用途。", "熟悉 Agent 的回访用户。"],
  },
  en: {
    A: ["Understanding first", "Explain the product to a first-time visitor.", "Fewer actions in the first screen.", "When the concept needs explanation."],
    B: ["Experience first", "Show the actual deliverable sooner.", "Less space for explaining the method.", "When visitors want proof before installing."],
    C: ["Integration first", "Shorten the path to installation.", "Assumes familiarity with the skill.", "Returning users familiar with agents."],
  },
};

function Preview({ id, language }: { id: Id; language: Language }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / 1200));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div className="demo-preview" ref={ref} style={{ height: 760 * scale }}>
    <iframe src={`/variant-output/_preview/${id}.html?language=${language}`} title={`${id} ${language === "zh" ? "真实页面缩略预览" : "live page thumbnail"}`} loading="lazy" tabIndex={-1} aria-hidden="true" style={{ transform: `scale(${scale})` }} />
  </div>;
}

export function GuidedDemo({ language }: { language: Language }) {
  const zh = language === "zh";
  const [viewing, setViewing] = useState<Id>("B");
  const [notice, setNotice] = useState("");
  const prompts = zh ? [
    `使用 ${repository} 中的完整 Variant Design 技能。如果尚未安装，先安装完整目录。在当前项目生成三个保留核心任务和必要功能的方案；沿用已有品牌。启动可直接打开的三版预览，解释各版优化什么、牺牲什么、适合谁，并给出推荐。先不要替我选定最终方案。`,
    `正在试改 ${viewing}，不是最终选定。只修改 ${viewing} 的 hero，让主标题更具体、主要行动更明确；保持其他区域、字体和颜色 tokens 不变。修改前保存快照，完成后提供预览并验证修改范围。`,
    `撤回 ${viewing} 的上次修改，恢复对应文件与 tokens；不要改动其他方案，也不要改变最终选择。打开恢复后的预览。`,
    `将 ${viewing} 作为本次接入版本，导出并接入当前项目；覆盖前备份，运行项目现有类型检查与构建，返回可打开的地址和修改清单。这次接入不代表最终选定方案。`,
  ] : [
    `Use the complete Variant Design skill from ${repository}. Install the full directory if needed. Generate three directions for my current project, preserving its core tasks, features and existing brand. Open working previews, explain each direction's benefits, tradeoffs and fit, and recommend one without selecting a final winner.`,
    `Try a local edit of ${viewing}, without selecting a winner. Change only its hero to make the headline more specific and primary action clearer. Preserve other sections, fonts and color tokens. Save a snapshot first, open the preview and verify the edit boundary.`,
    `Undo the last change to ${viewing}, restoring its files and tokens. Leave the other directions and final selection unchanged. Open the restored preview.`,
    `Export ${viewing} for integration into my current project. Back up before overwriting, run the project's existing typecheck and build, and return a working URL and change summary. This integration does not select a final winner.`,
  ];
  async function copyPrompt(text: string) {
    try { await navigator.clipboard.writeText(text); setNotice(zh ? "已复制，粘贴到项目的 Agent 对话中继续。" : "Copied. Paste into your project's agent chat to continue."); }
    catch { setNotice(zh ? "无法访问剪贴板，请在下方文本框中选择并复制指令。" : "Clipboard unavailable. Select and copy the prompt below."); }
  }
  return <section className="guided-demo shell" id="guided-demo" aria-labelledby="demo-title">
    <header className="demo-heading"><p className="eyebrow">{zh ? "真实项目 / 跟着走一遍" : "REAL PROJECT / WALK THROUGH THE LOOP"}</p><h2 id="demo-title">{zh ? "先看结果，再做选择。" : "See the work. Make a choice."}</h2><p>{zh ? "同一份需求：让访客理解 Variant Design，看到实际效果，并开始在自己的项目里使用。三版共用品牌、内容和必要功能，改变首屏的信息优先级。" : "One brief: help visitors understand Variant Design, inspect real results and start using it in their project. All three share the brand, content and essential features, with different priorities in the hero."}</p></header>
    <div className="demo-cards">{ids.map(id => <article className="demo-card" key={id} data-viewing={viewing === id}>
      <div className="demo-card-top"><b>{id}</b><h3>{options[language][id][0]}</h3>{id === "B" && <span>{zh ? "本站推荐" : "Recommended"}</span>}</div>
      <a className="demo-preview-link" href={`/variant-output/_preview/${id}.html?language=${language}`} target="_blank" rel="noreferrer" aria-label={zh ? `打开完整方案 ${id}（新标签页）` : `Open full direction ${id} (new tab)`}><Preview id={id} language={language} /><span>{zh ? "打开完整页面 ↗" : "Open full page ↗"}</span></a>
      <dl>{(zh ? ["优化", "取舍", "适合"] : ["Optimizes", "Tradeoff", "Fits"]).map((label, index) => <div key={label}><dt>{label}</dt><dd>{options[language][id][index + 1]}</dd></div>)}</dl>
      <button type="button" aria-pressed={viewing === id} onClick={() => { setViewing(id); setNotice(""); }}>{viewing === id ? (zh ? `正在查看 ${id}` : `Viewing ${id}`) : (zh ? `用 ${id} 继续演示` : `Continue with ${id}`)}</button>
    </article>)}</div>
    <p className="demo-recommendation">{zh ? "为什么推荐 B：这个网站需要先证明能交付什么，真实页面比更多方法说明更能帮助首次访问者判断。推荐与查看均不代表最终选定。" : "Why B: this site needs to demonstrate what it delivers. Real pages help first-time visitors judge the result. Neither a recommendation nor viewing a direction selects a final winner."} <a href="/variant-output/_compare.html">{zh ? "桌面 / 手机并排比较 →" : "Compare desktop / mobile →"}</a></p>
    <div className="demo-handoff"><header><p className="eyebrow">{zh ? `下一步 / 用 ${viewing} 继续` : `NEXT / CONTINUE WITH ${viewing}`}</p><h3>{zh ? "把这次比较带进项目。" : "Take the comparison into your project."}</h3><p>{zh ? "网页提供预览与操作指令。复制后在你的项目 Agent 对话中执行；点击复制不会修改本站，也不会自动安装技能。" : "This page provides previews and prompts. Run them in your project's agent chat. Copying does not edit this site or install the skill."}</p></header>
      <div className="demo-steps">{prompts.map((prompt, index) => <details key={`${language}-${viewing}-${index}`} open={index === 0}>
        <summary><span>0{index + 1}</span>{(zh ? ["安装并生成我的三版", `只修改 ${viewing} 的 hero`, `撤回 ${viewing} 的上次修改`, `将 ${viewing} 接入项目`] : ["Install and generate my three directions", `Edit only ${viewing}'s hero`, `Undo ${viewing}'s last edit`, `Integrate ${viewing} into my project`])[index]}</summary>
        <textarea readOnly aria-label={zh ? `第 ${index + 1} 步指令` : `Step ${index + 1} prompt`} value={prompt} rows={4} /><button type="button" onClick={() => copyPrompt(prompt)}>{zh ? "复制指令" : "Copy prompt"}</button>
      </details>)}</div><p className="demo-notice" role="status" aria-live="polite">{notice}</p>
    </div>
    <footer className="demo-proof"><strong>{zh ? "这个案例已经走完一遍。" : "This case has completed the loop."}</strong><p>{zh ? "B 的 hero 局部修改 → 撤回 → 重新应用 → 接入项目首页（上一轮案例）。已验证其他区域与字体保持一致，并通过构建与回归测试。这里展示的是已完成案例，不是当前操作的执行状态。" : "B's hero was edited, undone, reapplied and integrated into the project homepage in the previous iteration. Other sections and fonts were verified unchanged; build and regression tests passed. This is a completed case, not the status of your current actions."}</p><a href={`${repository}/pull/10`} target="_blank" rel="noreferrer">{zh ? "查看案例的代码与验证记录 ↗" : "See the case code and verification ↗"}</a><p>{zh ? "交付：可运行页面、比较理由、独立版本和接入代码。示例预览无需模型配置；生成你自己的方案使用 Agent 的模型能力。" : "Deliverables: working pages, tradeoffs, independent versions and integration code. Example previews need no model setup; generating your own uses your agent's model."}</p></footer>
  </section>;
}
