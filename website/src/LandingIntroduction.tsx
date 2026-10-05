import type { Language } from "./direction-engine";
import "./landing-introduction.css";

export type LandingHeroConfig = {
  id: "A" | "B" | "C";
  layout: "story" | "proof" | "install";
  title: Record<Language, string[]>;
  description: Record<Language, string>;
  primary: "compare" | "install";
  label: Record<Language, string>;
  note: Record<Language, string>;
};
const compareUrl = "/variant-output/_compare.html";
const installCommand = "git clone https://github.com/YuqingNicole/variant-design-skill.git ~/.codex/skills/variant-design";
export { installCommand };

export function LandingIntroduction({ config, language, onInstall, copied }: {
  config: LandingHeroConfig; language: Language; onInstall: () => void; copied: boolean;
}) {
  const zh = language === "zh";
  const options = zh
    ? [["A", "理解优先", "多一点解释，少一点操作密度。"], ["B", "体验优先", "先看真实产物，再决定是否安装。"], ["C", "接入优先", "直接开始，方法说明随后再读。"]]
    : [["A", "Understanding first", "More explanation, fewer immediate controls."], ["B", "Experience first", "Inspect the work before deciding to install."], ["C", "Integration first", "Get started; read the method as you go."]];
  return <>
    <div className="hero-copy">
      <div className="hero-kicker"><span>VARIANT DESIGN</span><span>{zh ? "从比较到交付" : "FROM COMPARISON TO DELIVERY"}</span></div>
      <h1>{config.title[language].map((line, index) => index === 0 ? <span key={line}>{line}</span> : <em key={line}>{line}</em>)}</h1>
      <p className="hero-lede">{config.description[language]}</p>
      <div className="hero-actions">
        {config.primary === "install"
          ? <button className="button button-primary" onClick={onInstall}>{copied ? (zh ? "安装命令已复制" : "Install command copied") : config.label[language]}<span aria-hidden="true">↗</span></button>
          : <a className="button button-primary" href={compareUrl}>{config.label[language]}<span aria-hidden="true">→</span></a>}
        <a className="text-link" href={config.primary === "install" ? compareUrl : "#install"}>{zh ? (config.primary === "install" ? "先看看三版" : "安装到我的项目") : (config.primary === "install" ? "See the three versions" : "Install in my project")}</a>
      </div>
      <p className="hero-context">{config.note[language]}</p>
    </div>
    <aside className="landing-evidence" aria-label={zh ? "本站三版" : "Three versions of this site"}>
      <div className="evidence-heading"><span>{zh ? "真实案例 / 就是这个网站" : "REAL CASE / THIS VERY WEBSITE"}</span><span>01—03</span></div>
      {config.layout === "install" && <div className="hero-install"><p>{zh ? "完整目录安装 · Codex" : "Complete folder install · Codex"}</p><code>{installCommand}</code><button onClick={onInstall}>{copied ? (zh ? "已复制" : "Copied") : (zh ? "复制命令" : "Copy command")}</button><a href="https://github.com/YuqingNicole/variant-design-skill#installation">{zh ? "其他 agent 的安装方式 ↗" : "Install for another agent ↗"}</a></div>}
      <div className="landing-options">{options.map(([id, title, detail]) => <a key={id} href={`/variant-output/_preview/${id}.html`} className={`landing-option ${config.id === id ? "is-current" : ""}`}><b>{id}</b><span><strong>{title}</strong><small>{detail}</small></span><span aria-hidden="true">↗</span></a>)}</div>
      <p className="evidence-footnote">{zh ? "三个完整页面，共用现有品牌和功能。选择是在明确取舍，不是只换颜色。" : "Three complete pages share the existing brand and features. Compare what each direction prioritizes."}</p>
    </aside>
  </>;
}
