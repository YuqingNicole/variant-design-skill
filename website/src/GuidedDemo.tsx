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

const styleOptions = {
 zh: {
 A: ["杂志编辑 / Editorial", "用材质感与叙事建立品牌价值。", "视觉节奏舒缓，信息密度较低。", "精品品牌、生活方式、创意工作室。"],
 B: ["实验海报 / Unconventional", "以大胆排版和撞色制造记忆点。", "态度鲜明，不适合保守的品牌语气。", "文化活动、新消费、独立创作者。"],
 C: ["未来数字 / Future-facing", "用空间感与数字质感传达探索精神。", "氛围较强，需要简洁而清晰的文案。", "设计工具、科技产品、数字艺术。"]
 },
 en: {
 A: ["Editorial warmth", "Build brand value through texture and storytelling.", "A slower pace with less information density.", "Boutique brands, lifestyle and creative studios."],
 B: ["Unconventional energy", "Create recall through bold type and clashing color.", "A strong attitude that may not fit conservative brands.", "Culture, consumer brands and independent creators."],
 C: ["Digital frontier", "Express exploration through space and digital materials.", "Atmospheric visuals need clear, concise copy.", "Design tools, technology and digital art."]
 }
};
const previewUrl=(id:Id,language:Language,expressive:boolean)=>expressive ? `/directions?direction=${id}&language=${language}` : `/variant-output/_preview/${id}.html?language=${language}`;

function Preview({ id, language, expressive }: { id: Id; language: Language; expressive:boolean }) {
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
    <iframe src={previewUrl(id,language,expressive)} title={`${id} ${language === "zh" ? "真实页面缩略预览" : "live page thumbnail"}`} loading="lazy" tabIndex={-1} aria-hidden="true" style={{ transform: `scale(${scale})` }} />
  </div>;
}

export function GuidedDemo({ language, expressive=false }: { language: Language; expressive?:boolean }) {
  const zh = language === "zh";
  const choices = expressive ? styleOptions : options;
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
  if (expressive) {
    prompts[0] += zh ? ` 参考本站 ${viewing}（${styleOptions.zh[viewing][0]}）的视觉表达；它是风格参考，不是当前项目的已生成文件。先检查现有品牌约束，再生成项目自己的三版。` : ` Use gallery direction ${viewing} (${styleOptions.en[viewing][0]}) as visual inspiration, not as an existing project file. Check brand constraints, then generate my project's own variants.`;
    for (let i=1;i<prompts.length;i++) prompts[i]=(zh ? "先完成第 1 步，以下操作针对当前项目新生成的方案。" : "Complete step 1 first. The following action targets the newly generated project variants. ")+prompts[i];
  }
  async function copyPrompt(text: string) {
    try { await navigator.clipboard.writeText(text); setNotice(zh ? "已复制，粘贴到项目的 Agent 对话中继续。" : "Copied. Paste into your project's agent chat to continue."); }
    catch { setNotice(zh ? "无法访问剪贴板，请在下方文本框中选择并复制指令。" : "Clipboard unavailable. Select and copy the prompt below."); }
  }
  return <section className="guided-demo shell" id="guided-demo" aria-labelledby="demo-title">
    <header className="demo-heading"><p className="eyebrow">{expressive ? (zh ? "自由探索 / 三种鲜明表达" : "CREATIVE EXPLORATION / THREE DISTINCT WORLDS") : (zh ? "真实项目 / 跟着走一遍" : "REAL PROJECT / WALK THROUGH THE LOOP")}</p><h2 id="demo-title">{expressive ? (zh ? "你的品牌，可以如此不同。" : "Your brand could feel this different.") : (zh ? "先看结果，再做选择。" : "See the work. Make a choice.")}</h2><p>{expressive ? (zh ? "同一个创意工作室，三种自由探索方向。字体、色彩、构图与材质一起变化，保留作品介绍与咨询路径。打开完整页面，感受哪种表达更适合你；已有品牌的项目仍可锁定设计系统。" : "One creative studio. Three expressive directions. Type, color, composition and materials change together while the portfolio and inquiry paths remain. Explore each page to find your fit; existing brands can still lock their design system.") : zh ? "同一份需求：让访客理解 Variant Design，看到实际效果，并开始在自己的项目里使用。三版共用品牌、内容和必要功能，改变首屏的信息优先级。" : "One brief: help visitors understand Variant Design, inspect real results and start using it in their project. All three share the brand, content and essential features, with different priorities in the hero."}</p></header>
    <div className="demo-cards">{ids.map(id => <article className="demo-card" key={id} data-viewing={viewing === id}>
      <div className="demo-card-top"><b>{id}</b><h3>{choices[language][id][0]}</h3>{id === "B" && <span>{zh ? "本站推荐" : "Recommended"}</span>}</div>
      <a className="demo-preview-link" href={previewUrl(id,language,expressive)} target="_blank" rel="noreferrer" aria-label={zh ? `打开完整方案 ${id}（新标签页）` : `Open full direction ${id} (new tab)`}><Preview id={id} language={language} expressive={expressive} /><span>{zh ? "打开完整页面 ↗" : "Open full page ↗"}</span></a>
      <dl>{(zh ? ["优化", "取舍", "适合"] : ["Optimizes", "Tradeoff", "Fits"]).map((label, index) => <div key={label}><dt>{label}</dt><dd>{choices[language][id][index + 1]}</dd></div>)}</dl>
      <button type="button" aria-pressed={viewing === id} onClick={() => { setViewing(id); setNotice(""); }}>{viewing === id ? (zh ? `正在查看 ${id}` : `Viewing ${id}`) : (zh ? `用 ${id} 继续演示` : `Continue with ${id}`)}</button>
    </article>)}</div>
    <p className="demo-recommendation">{expressive ? (zh ? "怎么选：A 适合细腻叙事，B 适合大胆表达，C 适合数字产品。以展示视觉跨度为目标，我们优先推荐 B；实际项目应按品牌与受众选择。查看不代表最终选定。" : "Choose A for an editorial story, B for bold expression, C for a digital product. We favor B here to demonstrate visual range; choose for your own brand and audience. Viewing does not select a winner.") : zh ? "为什么推荐 B：这个网站需要先证明能交付什么，真实页面比更多方法说明更能帮助首次访问者判断。推荐与查看均不代表最终选定。" : "Why B: this site needs to demonstrate what it delivers. Real pages help first-time visitors judge the result. Neither a recommendation nor viewing a direction selects a final winner."} {!expressive && <a href="/variant-output/_compare.html">{zh ? "桌面 / 手机并排比较 →" : "Compare desktop / mobile →"}</a>}</p>
    <div className="demo-handoff"><header><p className="eyebrow">{zh ? `下一步 / 用 ${viewing} 继续` : `NEXT / CONTINUE WITH ${viewing}`}</p><h3>{zh ? "把这次比较带进项目。" : "Take the comparison into your project."}</h3><p>{zh ? "网页提供预览与操作指令。复制后在你的项目 Agent 对话中执行；点击复制不会修改本站，也不会自动安装技能。" : "This page provides previews and prompts. Run them in your project's agent chat. Copying does not edit this site or install the skill."}</p></header>
      <div className="demo-steps">{prompts.map((prompt, index) => <details key={`${language}-${viewing}-${index}`} open={index === 0}>
        <summary><span>0{index + 1}</span>{(zh ? ["安装并生成我的三版", `只修改 ${viewing} 的 hero`, `撤回 ${viewing} 的上次修改`, `将 ${viewing} 接入项目`] : ["Install and generate my three directions", `Edit only ${viewing}'s hero`, `Undo ${viewing}'s last edit`, `Integrate ${viewing} into my project`])[index]}</summary>
        <textarea readOnly aria-label={zh ? `第 ${index + 1} 步指令` : `Step ${index + 1} prompt`} value={prompt} rows={4} /><button type="button" onClick={() => copyPrompt(prompt)}>{zh ? "复制指令" : "Copy prompt"}</button>
      </details>)}</div><p className="demo-notice" role="status" aria-live="polite">{notice}</p>
    </div>
    <footer className="demo-proof"><strong>{zh ? "另一个真实项目，已验证完整流程。" : "A separate real project has verified the full loop."}</strong><p>{zh ? "B 的 hero 局部修改 → 撤回 → 重新应用 → 接入项目首页（上一轮案例）。已验证其他区域与字体保持一致，并通过构建与回归测试。这里展示的是已完成案例，不是当前操作的执行状态。" : "B's hero was edited, undone, reapplied and integrated into the project homepage in the previous iteration. Other sections and fonts were verified unchanged; build and regression tests passed. This is a completed case, not the status of your current actions."}</p><a href={`${repository}/pull/10`} target="_blank" rel="noreferrer">{zh ? "查看案例的代码与验证记录 ↗" : "See the case code and verification ↗"}</a><p>{zh ? "交付：可运行页面、比较理由、独立版本和接入代码。示例预览无需模型配置；生成你自己的方案使用 Agent 的模型能力。" : "Deliverables: working pages, tradeoffs, independent versions and integration code. Example previews need no model setup; generating your own uses your agent's model."}</p></footer>
  </section>;
}
