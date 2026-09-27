import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { BorderBeam } from "border-beam";
import "./styles.css";

const repositoryUrl = "https://github.com/YuqingNicole/variant-design-skill";
const installCommand = "claude skill install https://github.com/YuqingNicole/variant-design-skill";
type Language = "zh" | "en";

const copy = {
  zh: {
    pageTitle: "Variant Design — 第一稿不是答案。", pageDescription: "一个提示词，生成三种有明确立场的视觉方向。比较、批判、变化，再交付真正值得保留的方案。",
    navLabel: "主导航", homeLabel: "Variant Design 首页", issue: "第 01 期 / 2026", navWork: "作品", navMethod: "方法", switchLabel: "切换到英文", switchText: "EN",
    kickerA: "做方向", kickerB: "不做默认", heroLines: ["别把", "第一稿", "当答案。"], heroLede: "一个提示词，变成三种有明确立场的视觉方案。保留张力，质疑显而易见的选择，最后交付真正有观点的方向。",
    installSkill: "安装技能", commandCopied: "命令已复制", fieldNotes: "阅读设计笔记 ↗", principlesLabel: "项目原则", principles: ["解决空白画布。", "一份命题，三个工作室。", "审美始终参与判断。"],
    workbenchLabel: "交互式提示词演示", liveProof: "现场验证", run: "方案生成 / 001", ready: "就绪", diverging: "发散中", promptLabel: "给空白画布一个问题。", defaultPrompt: "为一款创意编程工具设计发布页", directionsCode: "3 个方向 / 可运行代码", working: "生成中…", diverge: "开始发散", statusReady: "等待你的命题", statusBuilding: "正在构建三种视觉主张…", statusDone: "三个方向已就绪——选择一个继续推进",
    marquee: ["生成", "批判", "变化", "交付"], directionEyebrow: "同一命题 / 不同立场", directionTitle: ["三种方案。", "不做填充。"], directionNote: "同一份命题，三种主张", directionBody: "不是把同一套模板换三种颜色。每个方向都会改变层级、字体、密度、节奏和交互。",
    directions: [
      { id: "A", label: "编辑式克制", sub: "留白与叙事", image: "/sample-A-editorial.png", alt: "使用表达性衬线字体和大量留白的编辑式网站方案", tone: "衬线 / 安静 / 叙事" },
      { id: "B", label: "运营式清晰", sub: "密度与秩序", image: "/sample-B-dashboard.png", alt: "呈现密集运营数据的深色基础设施仪表盘方案", tone: "高密 / 技术 / 果断" },
      { id: "C", label: "面向转化的温度", sub: "人性与行动", image: "/sample-C-saas.png", alt: "使用绿色强调色和亲和字体的温暖软件产品发布页方案", tone: "人性 / 平静 / 转化" },
    ],
    manifestoA: "AI 可以生成选项。", manifestoB: "审美决定什么值得留下。", methodEyebrow: "工作方法", methodTitle: ["这项技能，", "有一根编辑主线。"], methodBody: "Variant Design 不是情绪板机器。每一次运行都带着设计系统、反套路标准和批判循环。",
    methods: [
      { title: "界定问题", body: "在接触视觉表面之前，先识别产品类型、技术框架、受众和限制。", tag: "定位" },
      { title: "强制发散", body: "三个方向必须坚持不同的设计主张，而不是提供表面上的变化。", tag: "发散" },
      { title: "审问作品", body: "检查启发式原则、无障碍、认知负荷、设计令牌，以及 AI 审美留下的惯性痕迹。", tag: "判断" },
      { title: "交付立场", body: "变化、混合、打磨，再把胜出的方向导出为符合项目技术栈的可运行代码。", tag: "落地" },
    ],
    commandEyebrow: "一句话改变方向", commandTitle: ["像创意总监一样", "说话。"], commandBody: "没有面板，没有层层嵌套的控件。用短而明确的指令，让设计对话继续向前。", commandLabel: "现场笔记 / 快速动作", commandsLabel: "示例指令", commands: ["A 再大胆一点", "B 重混配色", "C → 移动端", "混合 A + B", "批判", "提取 A 的令牌"], boardNote: "推到它开始承担风险为止",
    startHere: "04 / 从这里开始", installTitle: ["第一稿", "来得", "太容易。"], installBody: "安装这项技能，带来一份命题，然后拒绝第一个看起来还不错的答案。", copy: "复制 ↗", copied: "已复制 ✓", documentation: "使用文档 ↗", chineseReadme: "中文说明 ↗", license: "MIT / 开源", footerMotto: "创造选项。保留审美。",
  },
  en: {
    pageTitle: "Variant Design — The first answer is too easy.", pageDescription: "One prompt becomes three visual arguments. Critique, vary, and ship the direction with a point of view.",
    navLabel: "Primary navigation", homeLabel: "Variant Design home", issue: "ISSUE 01 / 2026", navWork: "Work", navMethod: "Method", switchLabel: "Switch to Chinese", switchText: "中文",
    kickerA: "Design in directions", kickerB: "not defaults", heroLines: ["DON'T SHIP", "THE FIRST", "IDEA."], heroLede: "One prompt becomes three visual arguments. Keep the tension, question the obvious, and export the direction that actually has a point of view.",
    installSkill: "INSTALL THE SKILL", commandCopied: "COMMAND COPIED", fieldNotes: "Read the field notes ↗", principlesLabel: "Project principles", principles: ["Blank canvas, solved.", "Three studios, one brief.", "Taste stays in the loop."],
    workbenchLabel: "Interactive prompt demonstration", liveProof: "LIVE PROOF", run: "VARIANT RUN / 001", ready: "READY", diverging: "DIVERGING", promptLabel: "Give the blank canvas a problem.", defaultPrompt: "A launch page for a creative coding tool", directionsCode: "3 directions / real code", working: "Working…", diverge: "Make it diverge", statusReady: "Ready for a brief", statusBuilding: "Building three visual arguments…", statusDone: "Three directions ready — choose what to push",
    marquee: ["GENERATE", "CRITIQUE", "VARY", "SHIP"], directionEyebrow: "Same brief / different convictions", directionTitle: ["THREE TAKES.", "NO FILLER."], directionNote: "One brief, three positions", directionBody: "Not three palettes pasted onto one template. Each direction changes hierarchy, typography, density, rhythm, and interaction.",
    directions: [
      { id: "A", label: "Editorial restraint", sub: "Space and narrative", image: "/sample-A-editorial.png", alt: "Editorial website variation with expressive serif typography and generous whitespace", tone: "Serif-led / quiet / narrative" },
      { id: "B", label: "Operational clarity", sub: "Density and order", image: "/sample-B-dashboard.png", alt: "Dark infrastructure dashboard variation with dense operational data", tone: "Dense / technical / decisive" },
      { id: "C", label: "SaaS warmth", sub: "Human and actionable", image: "/sample-C-saas.png", alt: "Warm SaaS landing page variation with green accents and friendly typography", tone: "Human / calm / conversion-led" },
    ],
    manifestoA: "AI can generate options.", manifestoB: "Taste decides what survives.", methodEyebrow: "The working method", methodTitle: ["A skill with", "an editorial spine."], methodBody: "Variant Design is not a moodboard machine. It carries a design system, an anti-slop gate, and a critique loop into every run.",
    methods: [
      { title: "Frame the problem", body: "Detect the product type, framework, audience, and constraints before touching the surface.", tag: "FRAME" },
      { title: "Force divergence", body: "Three directions commit to different design arguments—not cosmetic alternatives.", tag: "DIVERGE" },
      { title: "Interrogate the work", body: "Critique heuristics, accessibility, cognitive load, tokens, and the tell-tale fingerprints of AI taste.", tag: "JUDGE" },
      { title: "Ship the conviction", body: "Vary, mix, polish, and export the winner as working code in the project’s own stack.", tag: "SHIP" },
    ],
    commandEyebrow: "One-line direction changes", commandTitle: ["Talk like a", "creative director."], commandBody: "No panels. No nested controls. Keep the design conversation moving with short, opinionated commands.", commandLabel: "FIELD NOTES / QUICK MOVES", commandsLabel: "Example commands", commands: ["A vary strong", "B remix colors", "C → mobile", "mix A + B", "critique", "tokens A"], boardNote: "push it until it has something to lose",
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusKey, setStatusKey] = useState<"ready" | "building" | "done">("ready");
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
    setLanguage(next); setPrompt(copy[next].defaultPrompt); setStatusKey("ready"); setCopied(false); setIsGenerating(false);
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }

  function generate(event: React.FormEvent) {
    event.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true); setStatusKey("building");
    timerRef.current = window.setTimeout(() => {
      setIsGenerating(false); setStatusKey("done");
      document.querySelector("#directions")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    }, 3400);
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
          <div className="hero-notes" aria-label={t.principlesLabel}>{t.principles.map((principle, index) => <p key={principle}><span>0{index + 1}</span>{principle}</p>)}</div>
          <div className="workbench" aria-label={t.workbenchLabel}>
            <div className="workbench-tape">{t.liveProof}</div>
            <div className="workbench-head"><span>{t.run}</span><span className="run-state"><i className={isGenerating ? "is-live" : ""} /> {isGenerating ? t.diverging : t.ready}</span></div>
            <form onSubmit={generate}>
              <label htmlFor="design-prompt">{t.promptLabel}</label>
              <BorderBeam size="line" colorVariant="sunset" active={isGenerating && !reducedMotion} strength={0.9} theme="dark" className="prompt-beam">
                <div className="prompt-surface">
                  <textarea id="design-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} aria-busy={isGenerating} rows={4} />
                  <div className="prompt-footer"><span>{t.directionsCode}</span><button type="submit" disabled={isGenerating || !prompt.trim()}>{isGenerating ? t.working : t.diverge}<span aria-hidden="true">→</span></button></div>
                </div>
              </BorderBeam>
            </form>
            <div className="workbench-status"><p role="status" aria-live="polite">{status}</p><span>HTML / REACT / VUE / ASTRO / SVELTE</span></div>
          </div>
        </div>
        <div className="hero-marquee" aria-hidden="true">{t.marquee.map((item, index) => <span className="marquee-item" key={item}>{item}{index < t.marquee.length - 1 && <i>→</i>}</span>)}</div>
      </section>

      <section className="directions-section" id="directions">
        <div className="section-number" aria-hidden="true">02</div>
        <div className="shell">
          <header className="section-heading">
            <div><p className="eyebrow">{t.directionEyebrow}</p><h2>{t.directionTitle[0]}<br /><em>{t.directionTitle[1]}</em></h2></div>
            <div className="heading-note"><span>{t.directionNote}</span><p>{t.directionBody}</p></div>
          </header>
          <div className="contact-sheet">
            {t.directions.map((direction, index) => <article className={`direction-card card-${index + 1}`} key={direction.id}>
              <div className="card-pin" aria-hidden="true" /><div className="direction-meta"><span className="direction-id">{direction.id}</span><div><h3>{direction.label}</h3><p>{direction.sub}</p></div></div>
              <img src={direction.image} alt={direction.alt} loading="lazy" width="1280" height="800" /><div className="card-caption"><span>{direction.tone}</span><b>0{index + 1}</b></div>
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

