import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./design-system.css";
import "./styles.css";
import { createDirections, type DesignDirection, type Language } from "./direction-engine";

const repositoryUrl = "https://github.com/YuqingNicole/variant-design-skill";
const installCommand = "claude skill install https://github.com/YuqingNicole/variant-design-skill";

const copy = {
  zh: {
    pageTitle: "Variant Design — 第一稿不是答案。", pageDescription: "一个提示词，生成三种有明确立场的视觉方向。比较、批判、变化，再交付真正值得保留的方案。",
    navLabel: "主导航", homeLabel: "Variant Design 首页", issue: "第 01 期 / 2026", navWork: "作品", navMethod: "方法", switchLabel: "切换到英文", switchText: "EN",
    kickerA: "一份命题", kickerB: "三种立场", heroLines: ["别把", "第一稿", "当答案。"], heroLede: "把一份设计命题变成三个有明确取舍的方向。比较它们，批判它们，再推进真正值得交付的那一个。",
    installSkill: "安装技能", commandCopied: "命令已复制", fieldNotes: "阅读设计笔记 ↗", principlesLabel: "项目原则", principles: ["解决空白画布。", "一份命题，三个工作室。", "审美始终参与判断。"],
    workbenchLabel: "交互式提示词演示", liveProof: "现场验证", run: "方向引擎 / 001", ready: "就绪", diverging: "分析中", promptLabel: "描述产品、用户和你不想要的感觉。", defaultPrompt: "为一款面向独立开发者的 AI 财务工具设计首页，专业但不要像传统银行", directionsCode: "3 个定制方向", working: "分析中…", diverge: "生成三个方向", regenerate: "重新生成", statusReady: "等待你的设计命题", statusBuilding: "正在拆解产品、受众与视觉张力…", statusDone: "三个定制方向已就绪", emptyPrompt: "请先输入一个具体的设计命题。", longPrompt: "命题请控制在 600 个字符以内。", failedPrompt: "方向生成失败，请修改命题后重试。",
    marquee: ["理解", "发散", "比较", "推进"], directionEyebrow: "02 / 有纪律的发散", directionTitle: ["一份命题。", "三套系统。"], directionNote: "同一份命题，三种主张", directionBody: "每个方向改变视觉立场，但使用相同的评估维度，因此差异清晰、结果可比较。",
    generatedFor: "本轮命题", thesisLabel: "设计主张", typeLabel: "字体", densityLabel: "密度", layoutLabel: "布局", motionLabel: "动效", reasonLabel: "为什么适合",
    directions: [
      { id: "A", label: "编辑式克制", sub: "留白与叙事", image: "/sample-A-editorial.png", alt: "使用表达性衬线字体和大量留白的编辑式网站方案", tone: "衬线 / 安静 / 叙事" },
      { id: "B", label: "运营式清晰", sub: "密度与秩序", image: "/sample-B-dashboard.png", alt: "呈现密集运营数据的深色基础设施仪表盘方案", tone: "高密 / 技术 / 果断" },
      { id: "C", label: "面向转化的温度", sub: "人性与行动", image: "/sample-C-saas.png", alt: "使用绿色强调色和亲和字体的温暖软件产品发布页方案", tone: "人性 / 平静 / 转化" },
    ],
    manifestoA: "没有规则的变化只是噪音。", manifestoB: "系统让选择变得清晰。", methodEyebrow: "03 / 约束系统", methodTitle: ["发散需要", "共同的规则。"], methodBody: "所有方向共享同一组评估维度：层级、字体、密度、布局、动效和理由。这样审美判断才有可比较的基础。",
    methods: [
      { title: "界定问题", body: "在接触视觉表面之前，先识别产品类型、技术框架、受众和限制。", tag: "定位" },
      { title: "强制发散", body: "三个方向必须坚持不同的设计主张，而不是提供表面上的变化。", tag: "发散" },
      { title: "审问作品", body: "检查启发式原则、无障碍、认知负荷、设计令牌，以及 AI 审美留下的惯性痕迹。", tag: "判断" },
      { title: "交付立场", body: "变化、混合、打磨，再把胜出的方向导出为符合项目技术栈的可运行代码。", tag: "落地" },
    ],
    commandEyebrow: "04 / 继续推进", commandTitle: ["改变方向，", "不是操作界面。"], commandBody: "用简短、明确的语言继续设计对话。系统负责维护规范，你只需要表达判断。", commandLabel: "快速动作", commandsLabel: "示例指令", commands: ["A 再大胆一点", "B 重混配色", "C → 移动端", "混合 A + B", "批判", "提取 A 的令牌"], boardNote: "每一次变化，都保留可追溯的设计理由",
    startHere: "04 / 从这里开始", installTitle: ["第一稿", "来得", "太容易。"], installBody: "安装这项技能，带来一份命题，然后拒绝第一个看起来还不错的答案。", copy: "复制 ↗", copied: "已复制 ✓", documentation: "使用文档 ↗", chineseReadme: "中文说明 ↗", license: "MIT / 开源", footerMotto: "创造选项。保留审美。",
  },
  en: {
    pageTitle: "Variant Design — The first answer is too easy.", pageDescription: "One prompt becomes three visual arguments. Critique, vary, and ship the direction with a point of view.",
    navLabel: "Primary navigation", homeLabel: "Variant Design home", issue: "ISSUE 01 / 2026", navWork: "Work", navMethod: "Method", switchLabel: "Switch to Chinese", switchText: "中文",
    kickerA: "One brief", kickerB: "three positions", heroLines: ["DON'T SHIP", "THE FIRST", "IDEA."], heroLede: "Turn one brief into three directions with explicit trade-offs. Compare them, critique them, then push the one worth shipping.",
    installSkill: "INSTALL THE SKILL", commandCopied: "COMMAND COPIED", fieldNotes: "Read the field notes ↗", principlesLabel: "Project principles", principles: ["Blank canvas, solved.", "Three studios, one brief.", "Taste stays in the loop."],
    workbenchLabel: "Interactive prompt demonstration", liveProof: "LIVE PROOF", run: "DIRECTION ENGINE / 001", ready: "READY", diverging: "ANALYSING", promptLabel: "Describe the product, its users, and what it should not feel like.", defaultPrompt: "Design a homepage for an AI finance tool for indie developers—professional, but nothing like a traditional bank", directionsCode: "3 tailored directions", working: "Analysing…", diverge: "Generate three directions", regenerate: "Regenerate", statusReady: "Ready for a design brief", statusBuilding: "Reading the product, audience, and visual tension…", statusDone: "Three tailored directions are ready", emptyPrompt: "Start with a specific design brief.", longPrompt: "Keep the brief under 600 characters.", failedPrompt: "Direction generation failed. Revise the brief and try again.",
    marquee: ["READ", "DIVERGE", "COMPARE", "PUSH"], directionEyebrow: "02 / Disciplined divergence", directionTitle: ["ONE BRIEF.", "THREE SYSTEMS."], directionNote: "One brief, three positions", directionBody: "Each direction changes its visual position but uses the same evaluation dimensions, making differences clear and results comparable.",
    generatedFor: "CURRENT BRIEF", thesisLabel: "Thesis", typeLabel: "Typography", densityLabel: "Density", layoutLabel: "Layout", motionLabel: "Motion", reasonLabel: "Why it fits",
    directions: [
      { id: "A", label: "Editorial restraint", sub: "Space and narrative", image: "/sample-A-editorial.png", alt: "Editorial website variation with expressive serif typography and generous whitespace", tone: "Serif-led / quiet / narrative" },
      { id: "B", label: "Operational clarity", sub: "Density and order", image: "/sample-B-dashboard.png", alt: "Dark infrastructure dashboard variation with dense operational data", tone: "Dense / technical / decisive" },
      { id: "C", label: "SaaS warmth", sub: "Human and actionable", image: "/sample-C-saas.png", alt: "Warm SaaS landing page variation with green accents and friendly typography", tone: "Human / calm / conversion-led" },
    ],
    manifestoA: "Variation without rules is noise.", manifestoB: "A system makes choices clear.", methodEyebrow: "03 / Constraint system", methodTitle: ["Divergence needs", "shared rules."], methodBody: "Every direction uses the same evaluation dimensions: hierarchy, typography, density, layout, motion, and rationale. That gives taste a comparable foundation.",
    methods: [
      { title: "Frame the problem", body: "Detect the product type, framework, audience, and constraints before touching the surface.", tag: "FRAME" },
      { title: "Force divergence", body: "Three directions commit to different design arguments—not cosmetic alternatives.", tag: "DIVERGE" },
      { title: "Interrogate the work", body: "Critique heuristics, accessibility, cognitive load, tokens, and the tell-tale fingerprints of AI taste.", tag: "JUDGE" },
      { title: "Ship the conviction", body: "Vary, mix, polish, and export the winner as working code in the project’s own stack.", tag: "SHIP" },
    ],
    commandEyebrow: "04 / Push the work", commandTitle: ["Change the direction,", "not the interface."], commandBody: "Continue the design conversation in short, decisive language. The system protects the rules; you provide the judgment.", commandLabel: "QUICK MOVES", commandsLabel: "Example commands", commands: ["A vary strong", "B remix colors", "C → mobile", "mix A + B", "critique", "tokens A"], boardNote: "every change keeps a traceable design reason",
    startHere: "04 / START HERE", installTitle: ["THE FIRST", "ANSWER IS", "TOO EASY."], installBody: "Install the skill. Bring a brief. Refuse the first competent answer.", copy: "COPY ↗", copied: "COPIED ✓", documentation: "Documentation ↗", chineseReadme: "Chinese guide ↗", license: "MIT / OPEN SOURCE", footerMotto: "MAKE OPTIONS. KEEP TASTE.",
  },
} as const;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const update = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

function App() {
  const [language, setLanguage] = useState<Language>(() => window.localStorage.getItem("variant-language") === "en" ? "en" : "zh");
  const t = copy[language];
  const [prompt, setPrompt] = useState<string>(t.defaultPrompt);
  const [directions, setDirections] = useState<DesignDirection[]>(() => createDirections(t.defaultPrompt, language));
  const [generatedBrief, setGeneratedBrief] = useState<string>(t.defaultPrompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusKey, setStatusKey] = useState<"ready" | "building" | "done">("ready");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const status = statusKey === "ready" ? t.statusReady : statusKey === "building" ? t.statusBuilding : t.statusDone;

  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current); }, []);
  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.title = t.pageTitle;
    document.querySelector('meta[name="description"]')?.setAttribute("content", t.pageDescription);
    window.localStorage.setItem("variant-language", language);
  }, [language, t.pageDescription, t.pageTitle]);

  function switchLanguage() {
    const next = language === "zh" ? "en" : "zh";
    const nextPrompt = copy[next].defaultPrompt;
    setLanguage(next); setPrompt(nextPrompt); setDirections(createDirections(nextPrompt, next)); setGeneratedBrief(nextPrompt); setStatusKey("ready"); setError(null); setCopied(false); setIsGenerating(false);
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }

  function generate(event: React.FormEvent) {
    event.preventDefault();
    if (isGenerating) return;
    if (!prompt.trim()) { setError(t.emptyPrompt); setStatusKey("ready"); return; }
    if (prompt.trim().length > 600) { setError(t.longPrompt); setStatusKey("ready"); return; }
    setIsGenerating(true); setError(null); setStatusKey("building");
    timerRef.current = window.setTimeout(() => {
      try {
        setDirections(createDirections(prompt, language)); setGeneratedBrief(prompt.trim()); setStatusKey("done");
        document.querySelector("#directions")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      } catch { setError(t.failedPrompt); setStatusKey("ready"); }
      finally { setIsGenerating(false); }
    }, 700);
  }

  async function copyInstall() {
    await navigator.clipboard.writeText(installCommand); setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main data-language={language}>
      <section className="hero" id="top">
        <nav className="nav shell" aria-label={t.navLabel}>
          <a className="signature" href="#top" aria-label={t.homeLabel}><b>YN</b><span>Yuqing Nicole<br />variant.design</span></a>
          <div className="nav-index" aria-hidden="true">{t.issue}</div>
          <div className="nav-links">
            <a href="#directions">{t.navWork}</a><a href="#method">{t.navMethod}</a><a href={repositoryUrl} target="_blank" rel="noreferrer">GitHub ↗</a>
            <button className="language-switch" type="button" onClick={switchLanguage} aria-label={t.switchLabel}>{t.switchText}</button>
          </div>
        </nav>

        <div className="hero-grid shell">
          <div className="hero-copy">
            <div className="hero-kicker"><span>{t.kickerA}</span><span>{t.kickerB}</span></div>
            <h1><span>{t.heroLines[0]}</span><span>{t.heroLines[1]}</span><em>{t.heroLines[2]}</em></h1>
            <p className="hero-lede">{t.heroLede}</p>
            <div className="hero-actions">
              <button className="button button-primary" onClick={copyInstall}>{copied ? t.commandCopied : t.installSkill}<span aria-hidden="true">{copied ? "✓" : "↗"}</span></button>
              <a className="text-link" href={repositoryUrl} target="_blank" rel="noreferrer">{t.fieldNotes}</a>
            </div>
          </div>
          <div className="workbench" aria-label={t.workbenchLabel}>
            <div className="workbench-tape">{t.liveProof}</div>
            <div className="workbench-head"><span>{t.run}</span><span className="run-state"><i className={isGenerating ? "is-live" : ""} /> {isGenerating ? t.diverging : t.ready}</span></div>
            <form onSubmit={generate}>
              <label htmlFor="design-prompt">{t.promptLabel}</label>
              <div className={`prompt-surface ${error ? "has-error" : ""}`}>
                <textarea id="design-prompt" value={prompt} onChange={(event) => { setPrompt(event.target.value); if (error) setError(null); }} aria-busy={isGenerating} aria-invalid={Boolean(error)} aria-describedby={error ? "prompt-error" : undefined} rows={4} />
                <div className="prompt-footer"><span>{t.directionsCode}</span><button type="submit" disabled={isGenerating}>{isGenerating ? t.working : statusKey === "done" ? t.regenerate : t.diverge}<span aria-hidden="true">→</span></button></div>
              </div>
            </form>
            <div className="workbench-status"><p id={error ? "prompt-error" : undefined} role="status" aria-live="polite" className={error ? "status-error" : ""}>{error ?? status}</p><span>HTML / REACT / VUE / ASTRO / SVELTE</span></div>
          </div>
        </div>
        <div className="hero-marquee" aria-hidden="true">{t.marquee.map((item, index) => <span className="marquee-item" key={item}>{item}{index < t.marquee.length - 1 && <i>→</i>}</span>)}</div>
      </section>

      <section className="directions-section" id="directions">
        <div className="section-number" aria-hidden="true">02</div>
        <div className="shell">
          <header className="section-heading">
            <div><p className="eyebrow">{t.directionEyebrow}</p><h2>{t.directionTitle[0]}<br /><em>{t.directionTitle[1]}</em></h2></div>
            <div className="heading-note"><span>{statusKey === "done" ? t.generatedFor : t.directionNote}</span><p>{statusKey === "done" ? generatedBrief : t.directionBody}</p></div>
          </header>
          <div className="contact-sheet">
            {directions.map((direction, index) => <article className={`direction-card card-${index + 1}`} key={`${direction.id}-${direction.name}`}>
              <div className="direction-meta"><span className="direction-id">{direction.id}</span><div><h3>{direction.name}</h3><p>{direction.layoutLabel}</p></div></div>
              <div className={`direction-preview preview-${direction.layout}`} style={{ "--preview-ink": direction.colors[0], "--preview-paper": direction.colors[1], "--preview-accent": direction.colors[2], "--preview-pop": direction.colors[3] } as React.CSSProperties}>
                <div className="preview-top"><span>0{index + 1}</span><i /></div><strong>{direction.sampleTitle}</strong><div className="preview-lines"><i /><i /><i /></div><small>{direction.sampleMeta}</small>
              </div>
              <p className="direction-thesis"><b>{t.thesisLabel}</b>{direction.thesis}</p>
              <dl className="direction-specs"><div><dt>{t.typeLabel}</dt><dd>{direction.typography}</dd></div><div><dt>{t.densityLabel}</dt><dd>{direction.density}</dd></div><div><dt>{t.layoutLabel}</dt><dd>{direction.layoutLabel}</dd></div><div><dt>{t.motionLabel}</dt><dd>{direction.motion}</dd></div></dl>
              <div className="palette" aria-label="Color palette">{direction.colors.map((color) => <span key={color} style={{ background: color }} title={color} />)}</div>
              <div className="direction-reason"><b>{t.reasonLabel}</b><p>{direction.reason}</p></div><div className="card-caption"><span>{direction.name}</span><b>0{index + 1}</b></div>
            </article>)}
          </div>
        </div>
      </section>

      <section className="manifesto"><div className="shell manifesto-grid"><div className="manifesto-mark">※</div><p>{t.manifestoA}</p><p><em>{t.manifestoB}</em></p></div></section>

      <section className="method-section shell" id="method">
        <div className="method-intro"><p className="eyebrow">{t.methodEyebrow}</p><h2>{t.methodTitle[0]}<br />{t.methodTitle[1]}</h2><p>{t.methodBody}</p></div>
        <div className="method-list">{t.methods.map((method, index) => <article key={method.title}><span>0{index + 1}</span><div><h3>{method.title}</h3><p>{method.body}</p></div><b>{method.tag}</b></article>)}</div>
      </section>

      <section className="commands-section">
        <div className="commands-index" aria-hidden="true">03</div>
        <div className="shell commands-grid">
          <div className="command-copy"><p className="eyebrow eyebrow-light">{t.commandEyebrow}</p><h2>{t.commandTitle[0]}<br />{t.commandTitle[1]}</h2><p>{t.commandBody}</p></div>
          <div className="command-board" aria-label={t.commandsLabel}><div className="board-label">{t.commandLabel}</div>
            {t.commands.map((command, index) => <div className="command-row" key={command}><span>{String(index + 1).padStart(2, "0")}</span><code>{command}</code><i aria-hidden="true">↗</i></div>)}
            <p className="board-note">{t.boardNote}</p>
          </div>
        </div>
      </section>

      <section className="install-section"><div className="shell install-grid">
        <div className="install-title"><span>{t.startHere}</span><h2>{t.installTitle[0]}<br />{t.installTitle[1]}<br /><em>{t.installTitle[2]}</em></h2></div>
        <div className="install-panel"><p>{t.installBody}</p><div className="install-command"><code>{installCommand}</code><button onClick={copyInstall}>{copied ? t.copied : t.copy}</button></div><div className="install-links"><a href={repositoryUrl} target="_blank" rel="noreferrer">{t.documentation}</a><a href={`${repositoryUrl}/blob/master/README_CN.md`} target="_blank" rel="noreferrer">{t.chineseReadme}</a><span>{t.license}</span></div></div>
      </div></section>

      <footer className="footer shell"><span>YUQING NICOLE / VARIANT DESIGN</span><span>{t.footerMotto}</span><a href={repositoryUrl} target="_blank" rel="noreferrer">GITHUB ↗</a></footer>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
