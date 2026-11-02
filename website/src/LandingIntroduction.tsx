import { t, type Localized } from './i18n/localized';
import { DirectionStage } from "./DirectionStage";
import type { Language } from "./direction-engine";
import { installCommand } from "./docs-content";
import "./landing-introduction.css";
const m={fromComparisonToDelivery:{zh:"从比较到交付",en:"FROM COMPARISON TO DELIVERY"},
 installCommandCopied:{zh:"安装命令已复制",en:"Install command copied"},
 exploreTheThreeDirections:{zh:"看三版，跟着试一次",en:"Explore the three directions"},
 threeVersionsOfThis:{zh:"本站三版",en:"Three versions of this site"},
 realCaseThisVery:{zh:"真实案例 / 就是这个网站",en:"REAL CASE / THIS VERY WEBSITE"},
 completeFolderInstallCodex:{zh:"完整目录安装 · Codex",en:"Complete folder install · Codex"},
 copied:{zh:"已复制",en:"Copied"},
 copyCommand:{zh:"复制命令",en:"Copy command"},
 installForAnotherAgent:{zh:"其他 agent 的安装方式 ↗",en:"Install for another agent ↗"},
 threeCompletePagesShare:{zh:"三个完整页面，共用现有品牌和功能。选择是在明确取舍，不是只换颜色。",en:"Three complete pages share the existing brand and features. Compare what each direction prioritizes."}} satisfies Record<string,Localized>;

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
export { installCommand };

export function LandingIntroduction({ config, language, onInstall, copied, guided = false }: {
  config: LandingHeroConfig; language: Language; onInstall: () => void; copied: boolean; guided?: boolean;
}) {
  const zh = language === "zh";
  const options = t({zh:[["A", "理解优先", "多一点解释，少一点操作密度。"], ["B", "体验优先", "先看真实产物，再决定是否安装。"], ["C", "接入优先", "直接开始，方法说明随后再读。"]],en:[["A", "Understanding first", "More explanation, fewer immediate controls."], ["B", "Experience first", "Inspect the work before deciding to install."], ["C", "Integration first", "Get started; read the method as you go."]]},language);
  return <>
    <div className="hero-copy">
      <div className="hero-kicker"><span>VARIANT DESIGN</span><span>{t(m.fromComparisonToDelivery,language)}</span></div>
      <h1>{config.title[language].map((line, index) => index === 0 ? <span key={line}>{line}</span> : <em key={line}>{line}</em>)}</h1>
      <p className="hero-lede">{config.description[language]}</p>
      <div className="hero-actions">
        {config.primary === "install"
          ? <button className="button button-primary" onClick={onInstall}>{copied ? (t(m.installCommandCopied,language)) : config.label[language]}<span aria-hidden="true">↗</span></button>
          : <a className="button button-primary" href={guided ? "#guided-demo" : compareUrl}>{guided ? (t(m.exploreTheThreeDirections,language)) : config.label[language]}<span aria-hidden="true">→</span></a>}
        <a className="text-link" href={config.primary === "install" ? compareUrl : "#install"}>{t({zh:(config.primary === "install" ? "先看看三版" : "安装到我的项目"),en:(config.primary === "install" ? "See the three versions" : "Install in my project")},language)}</a>
      </div>
      <p className="hero-context">{config.note[language]}</p>
    </div>
    {guided ? <DirectionStage language={language} /> : <aside className="landing-evidence" aria-label={t(m.threeVersionsOfThis,language)}>
      <div className="evidence-heading"><span>{t(m.realCaseThisVery,language)}</span><span>01—03</span></div>
      {config.layout === "install" && <div className="hero-install"><p>{t(m.completeFolderInstallCodex,language)}</p><code>{installCommand}</code><button onClick={onInstall}>{copied ? (t(m.copied,language)) : (t(m.copyCommand,language))}</button><a href="https://github.com/YuqingNicole/variant-design-skill#installation">{t(m.installForAnotherAgent,language)}</a></div>}
      <div className="landing-options">{options.map(([id, title, detail]) => <a key={id} href={`/variant-output/_preview/${id}.html`} className={`landing-option ${config.id === id ? "is-current" : ""}`}><b>{id}</b><span><strong>{title}</strong><small>{detail}</small></span><span aria-hidden="true">↗</span></a>)}</div>
      <p className="evidence-footnote">{t(m.threeCompletePagesShare,language)}</p>
    </aside>}
  </>;
}
