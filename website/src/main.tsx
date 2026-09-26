import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { BorderBeam } from "border-beam";
import "./styles.css";

const repositoryUrl = "https://github.com/YuqingNicole/variant-design-skill";
const installCommand = "claude skill install https://github.com/YuqingNicole/variant-design-skill";

const directions = [
  {
    id: "A",
    label: "Editorial restraint",
    image: "/sample-A-editorial.png",
    alt: "Editorial website variation with expressive serif typography and generous whitespace",
    tone: "Serif-led · quiet · narrative",
  },
  {
    id: "B",
    label: "Operational clarity",
    image: "/sample-B-dashboard.png",
    alt: "Dark infrastructure dashboard variation with dense operational data",
    tone: "Dense · technical · decisive",
  },
  {
    id: "C",
    label: "SaaS warmth",
    image: "/sample-C-saas.png",
    alt: "Warm SaaS landing page variation with green accents and friendly typography",
    tone: "Human · calm · conversion-led",
  },
];

function App() {
  const [prompt, setPrompt] = useState("A launch page for a creative coding tool");
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState("Three directions ready to explore");
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  function generate(event: React.FormEvent) {
    event.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setStatus("Generating three distinct directions…");
    timerRef.current = window.setTimeout(() => {
      setIsGenerating(false);
      setStatus("Three directions ready — pick one to refine");
      document.querySelector("#directions")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 3400);
  }

  async function copyInstall() {
    await navigator.clipboard.writeText(installCommand);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main>
      <nav className="nav shell" aria-label="Primary navigation">
        <a className="wordmark" href="#top" aria-label="Variant Design home">
          <span className="wordmark-mark">V</span>
          <span>variant.design</span>
        </a>
        <div className="nav-links">
          <a href="#directions">Examples</a>
          <a href="#system">How it works</a>
          <a className="nav-github" href={repositoryUrl} target="_blank" rel="noreferrer">
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </div>
      </nav>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span>Design skill</span> for Claude Code</p>
          <h1>One brief.<br />Three <em>opinions.</em></h1>
          <p className="hero-lede">
            Leave the blank canvas behind. Variant Design turns a prompt into three genuinely different design directions, then lets you critique, vary, and export the one worth shipping.
          </p>
          <div className="hero-actions">
            <button className="button button-primary" onClick={copyInstall}>
              {copied ? "Copied to clipboard" : "Copy install command"}
              <span aria-hidden="true">{copied ? "✓" : "↗"}</span>
            </button>
            <a className="button button-ghost" href={repositoryUrl} target="_blank" rel="noreferrer">View source</a>
          </div>
          <p className="hero-note">Zero template lock-in · HTML, React, Vue, Astro, and Svelte</p>
        </div>

        <div className="workbench" aria-label="Interactive prompt demonstration">
          <div className="workbench-topline">
            <span>NEW DESIGN RUN</span>
            <span className="run-state"><i className={isGenerating ? "is-live" : ""} /> {isGenerating ? "WORKING" : "READY"}</span>
          </div>
          <form onSubmit={generate}>
            <label htmlFor="design-prompt">What are we designing?</label>
            <BorderBeam
              size="line"
              colorVariant="sunset"
              active={isGenerating}
              strength={0.9}
              theme="dark"
              className="prompt-beam"
            >
              <div className="prompt-surface">
                <textarea
                  id="design-prompt"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  aria-busy={isGenerating}
                  rows={4}
                />
                <div className="prompt-footer">
                  <span>3 directions · full interaction</span>
                  <button type="submit" disabled={isGenerating || !prompt.trim()}>
                    {isGenerating ? "Generating…" : "Generate"}
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            </BorderBeam>
          </form>
          <p className="generation-status" role="status" aria-live="polite">{status}</p>
          <div className="mini-directions" aria-hidden="true">
            {directions.map((direction) => (
              <div className="mini-card" key={direction.id}>
                <span>{direction.id}</span>
                <div />
                <small>{direction.label}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="proof-section" id="directions">
        <div className="shell">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Same brief, different studios</p>
              <h2>Divergence you can see.</h2>
            </div>
            <p>Not three color swaps. Each direction changes hierarchy, typography, density, rhythm, and interaction to make a real argument.</p>
          </div>
          <div className="direction-grid">
            {directions.map((direction) => (
              <article className="direction-card" key={direction.id}>
                <div className="direction-meta">
                  <span className="direction-id">{direction.id}</span>
                  <div>
                    <h3>{direction.label}</h3>
                    <p>{direction.tone}</p>
                  </div>
                </div>
                <img src={direction.image} alt={direction.alt} loading="lazy" width="1280" height="800" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="system-section shell" id="system">
        <div className="section-heading system-heading">
          <div>
            <p className="eyebrow">A complete design loop</p>
            <h2>From instinct to a system.</h2>
          </div>
          <p>Generate, interrogate, and refine without losing the decisions that made a direction distinctive.</p>
        </div>
        <div className="steps">
          <article>
            <span>01 / FRAME</span>
            <h3>Detect the context</h3>
            <p>The skill reads the product type, framework, and constraints before choosing its references and output format.</p>
          </article>
          <article>
            <span>02 / DIVERGE</span>
            <h3>Make three arguments</h3>
            <p>Each variation commits to a different visual thesis, with working interactions and production-shaped content.</p>
          </article>
          <article>
            <span>03 / DECIDE</span>
            <h3>Critique, vary, export</h3>
            <p>Push a direction, remix its palette, audit the UX, extract tokens, or export the winner to your stack.</p>
          </article>
        </div>
      </section>

      <section className="command-section">
        <div className="shell command-layout">
          <div>
            <p className="eyebrow eyebrow-light">Small commands, big turns</p>
            <h2>Keep the conversation moving.</h2>
            <p className="command-copy">Once a direction lands, iterate in plain language. The system keeps the context while you change the degree.</p>
          </div>
          <div className="command-list" aria-label="Example commands">
            {["A vary strong", "B remix colors", "C → mobile", "mix A + B", "critique", "tokens A"].map((command, index) => (
              <div key={command}><span>{String(index + 1).padStart(2, "0")}</span><code>{command}</code><i aria-hidden="true">↗</i></div>
            ))}
          </div>
        </div>
      </section>

      <section className="install-section shell">
        <p className="eyebrow">Open source · MIT</p>
        <h2>Stop choosing from the first idea.</h2>
        <div className="install-row">
          <code>{installCommand}</code>
          <button onClick={copyInstall}>{copied ? "Copied" : "Copy"}</button>
        </div>
        <div className="install-links">
          <a href={repositoryUrl} target="_blank" rel="noreferrer">Read the documentation ↗</a>
          <a href={`${repositoryUrl}/blob/master/README_CN.md`} target="_blank" rel="noreferrer">中文文档 ↗</a>
        </div>
      </section>

      <footer className="footer shell">
        <span>Variant Design</span>
        <span>Prompt → diverge → refine → ship</span>
        <a href={repositoryUrl} target="_blank" rel="noreferrer">YuqingNicole / GitHub ↗</a>
      </footer>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
