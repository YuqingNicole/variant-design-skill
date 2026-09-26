import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { BorderBeam } from "border-beam";
import "./styles.css";

const repositoryUrl = "https://github.com/YuqingNicole/variant-design-skill";
const installCommand = "claude skill install https://github.com/YuqingNicole/variant-design-skill";

const directions = [
  { id: "A", label: "Editorial restraint", zh: "留白与叙事", image: "/sample-A-editorial.png", alt: "Editorial website variation with expressive serif typography and generous whitespace", tone: "Serif-led / quiet / narrative" },
  { id: "B", label: "Operational clarity", zh: "密度与秩序", image: "/sample-B-dashboard.png", alt: "Dark infrastructure dashboard variation with dense operational data", tone: "Dense / technical / decisive" },
  { id: "C", label: "SaaS warmth", zh: "温度与转化", image: "/sample-C-saas.png", alt: "Warm SaaS landing page variation with green accents and friendly typography", tone: "Human / calm / conversion-led" },
];

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
  const [prompt, setPrompt] = useState("A launch page for a creative coding tool");
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState("Ready for a brief");
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  function generate(event: React.FormEvent) {
    event.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setStatus("Building three visual arguments…");
    timerRef.current = window.setTimeout(() => {
      setIsGenerating(false);
      setStatus("Three directions ready — choose what to push");
      document.querySelector("#directions")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    }, 3400);
  }

  async function copyInstall() {
    await navigator.clipboard.writeText(installCommand);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main>
      <section className="hero" id="top">
        <nav className="nav shell" aria-label="Primary navigation">
          <a className="signature" href="#top" aria-label="Variant Design home">
            <b>YN</b><span>Yuqing Nicole<br />variant.design</span>
          </a>
          <div className="nav-index" aria-hidden="true">ISSUE 01 / 2026</div>
          <div className="nav-links">
            <a href="#directions">Work</a><a href="#method">Method</a><a href={repositoryUrl} target="_blank" rel="noreferrer">GitHub ↗</a>
          </div>
        </nav>

        <div className="hero-grid shell">
          <div className="hero-copy">
            <div className="hero-kicker"><span>Design in directions</span><span>not defaults</span></div>
            <h1><span>DON'T SHIP</span><span>THE FIRST</span><em>IDEA.</em></h1>
            <p className="cn-stamp">一稿不是答案</p>
            <p className="hero-lede">One prompt becomes three visual arguments. Keep the tension, question the obvious, and export the direction that actually has a point of view.</p>
            <div className="hero-actions">
              <button className="button button-primary" onClick={copyInstall}>{copied ? "COMMAND COPIED" : "INSTALL THE SKILL"}<span aria-hidden="true">{copied ? "✓" : "↗"}</span></button>
              <a className="text-link" href={repositoryUrl} target="_blank" rel="noreferrer">Read the field notes ↗</a>
            </div>
          </div>

          <div className="hero-notes" aria-label="Project principles">
            <p><span>01</span> Blank canvas, solved.</p><p><span>02</span> Three studios, one brief.</p><p><span>03</span> Taste stays in the loop.</p>
          </div>

          <div className="workbench" aria-label="Interactive prompt demonstration">
            <div className="workbench-tape">LIVE PROOF</div>
            <div className="workbench-head"><span>VARIANT RUN / 001</span><span className="run-state"><i className={isGenerating ? "is-live" : ""} /> {isGenerating ? "DIVERGING" : "READY"}</span></div>
            <form onSubmit={generate}>
              <label htmlFor="design-prompt">Give the blank canvas a problem.</label>
              <BorderBeam size="line" colorVariant="sunset" active={isGenerating && !reducedMotion} strength={0.9} theme="dark" className="prompt-beam">
                <div className="prompt-surface">
                  <textarea id="design-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} aria-busy={isGenerating} rows={4} />
                  <div className="prompt-footer"><span>3 directions / real code</span><button type="submit" disabled={isGenerating || !prompt.trim()}>{isGenerating ? "Working…" : "Make it diverge"}<span aria-hidden="true">→</span></button></div>
                </div>
              </BorderBeam>
            </form>
            <div className="workbench-status"><p role="status" aria-live="polite">{status}</p><span>HTML / REACT / VUE / ASTRO / SVELTE</span></div>
          </div>
        </div>

        <div className="hero-marquee" aria-hidden="true"><span>GENERATE</span><i>→</i><span>CRITIQUE</span><i>→</i><span>VARY</span><i>→</i><span>SHIP</span></div>
      </section>

      <section className="directions-section" id="directions">
        <div className="section-number" aria-hidden="true">02</div>
        <div className="shell">
          <header className="section-heading">
            <div><p className="eyebrow">Same brief / different convictions</p><h2>THREE TAKES.<br /><em>NO FILLER.</em></h2></div>
            <div className="heading-note"><span>同一份 brief，三种主张</span><p>Not three palettes pasted onto one template. Each direction changes hierarchy, typography, density, rhythm, and interaction.</p></div>
          </header>
          <div className="contact-sheet">
            {directions.map((direction, index) => (
              <article className={`direction-card card-${index + 1}`} key={direction.id}>
                <div className="card-pin" aria-hidden="true" />
                <div className="direction-meta"><span className="direction-id">{direction.id}</span><div><h3>{direction.label}</h3><p>{direction.zh}</p></div></div>
                <img src={direction.image} alt={direction.alt} loading="lazy" width="1280" height="800" />
                <div className="card-caption"><span>{direction.tone}</span><b>0{index + 1}</b></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="manifesto"><div className="shell manifesto-grid"><div className="manifesto-mark">※</div><p>AI can generate options.</p><p><em>Taste</em> decides what survives.</p><span>把审美判断留在流程里。</span></div></section>

      <section className="method-section shell" id="method">
        <div className="method-intro"><p className="eyebrow">The working method</p><h2>A skill with<br />an editorial spine.</h2><p>Variant Design is not a moodboard machine. It carries a design system, an anti-slop gate, and a critique loop into every run.</p></div>
        <div className="method-list">
          <article><span>01</span><div><h3>Frame the problem</h3><p>Detect the product type, framework, audience, and constraints before touching the surface.</p></div><b>定位</b></article>
          <article><span>02</span><div><h3>Force divergence</h3><p>Three directions commit to different design arguments—not cosmetic alternatives.</p></div><b>发散</b></article>
          <article><span>03</span><div><h3>Interrogate the work</h3><p>Critique heuristics, accessibility, cognitive load, tokens, and the tell-tale fingerprints of AI taste.</p></div><b>判断</b></article>
          <article><span>04</span><div><h3>Ship the conviction</h3><p>Vary, mix, polish, and export the winner as working code in the project’s own stack.</p></div><b>落地</b></article>
        </div>
      </section>

      <section className="commands-section">
        <div className="commands-index" aria-hidden="true">03</div>
        <div className="shell commands-grid">
          <div className="command-copy"><p className="eyebrow eyebrow-light">One-word direction changes</p><h2>Talk like a<br />creative director.</h2><p>No panels. No nested controls. Keep the design conversation moving with short, opinionated commands.</p></div>
          <div className="command-board" aria-label="Example commands">
            <div className="board-label">FIELD NOTES / QUICK MOVES</div>
            {["A vary strong", "B remix colors", "C → mobile", "mix A + B", "critique", "tokens A"].map((command, index) => <div className="command-row" key={command}><span>{String(index + 1).padStart(2, "0")}</span><code>{command}</code><i aria-hidden="true">↗</i></div>)}
            <p className="board-note">push it until it has something to lose</p>
          </div>
        </div>
      </section>

      <section className="install-section">
        <div className="shell install-grid">
          <div className="install-title"><span>04 / START HERE</span><h2>THE FIRST<br />ANSWER IS<br /><em>TOO EASY.</em></h2></div>
          <div className="install-panel"><p>Install the skill. Bring a brief. Refuse the first competent answer.</p><div className="install-command"><code>{installCommand}</code><button onClick={copyInstall}>{copied ? "COPIED ✓" : "COPY ↗"}</button></div><div className="install-links"><a href={repositoryUrl} target="_blank" rel="noreferrer">Documentation ↗</a><a href={`${repositoryUrl}/blob/master/README_CN.md`} target="_blank" rel="noreferrer">中文说明 ↗</a><span>MIT / OPEN SOURCE</span></div></div>
        </div>
      </section>

      <footer className="footer shell"><span>YUQING NICOLE / VARIANT DESIGN</span><span>MAKE OPTIONS. KEEP TASTE.</span><a href={repositoryUrl} target="_blank" rel="noreferrer">GITHUB ↗</a></footer>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
