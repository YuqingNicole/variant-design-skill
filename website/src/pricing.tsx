import { useEffect, useState } from "react";
import type { Language } from "./direction-engine";
import "./pricing.css";

type PricingPageProps = { repositoryUrl: string };
type Billing = "monthly" | "annual";

const pricingCopy = {
  zh: {
    pageTitle: "价格 — Variant Design", description: "开源 Skill 永久免费。为托管生成、项目连续性与团队协作付费。",
    navLabel: "价格页导航", navMark: "价格 / 001", home: "返回工作台", github: "GitHub ↗", switchLabel: "切换到英文", switchText: "EN",
    eyebrow: "价格 / 一个清晰的交换", title: ["审美免费。", "连续性值得付费。"], lede: "开源 Skill 和设计方法不会被锁起来。付费层只解决昂贵的部分：托管模型、保存项目、团队决策和可靠交付。",
    billingLabel: "计费周期", plansLabel: "价格方案", monthly: "月付", annual: "年付", annualNote: "省两个月", perMonth: "/ 月", perSeat: "/ 席位 / 月", billedAnnual: "按年结算", freeForever: "永久免费", earlyAccess: "早期访问 · 暂不扣款", recommended: "建议个人使用",
    plans: [
      { name: "本地版", thesis: "自己掌控工具和密钥。", priceMonthly: 0, priceAnnual: 0, suffix: "", cta: "免费开始", href: "/#top", tone: "plain", features: ["完整开源 Skill", "自带 Anthropic 或 OpenAI 密钥", "三个可运行设计方向", "本地版本记录", "HTML 导出", "社区色板与更新"] },
      { name: "专业版", thesis: "不用维护基础设施，持续推进真实项目。", priceMonthly: 24, priceAnnual: 20, suffix: "", cta: "申请早期访问", href: "issues", tone: "accent", features: ["包含本地版全部功能", "托管生成额度", "私有项目与云端版本", "代码库上下文导入", "可分享预览链接", "GitHub PR 导出"] },
      { name: "团队版", thesis: "让设计选择成为团队资产。", priceMonthly: 49, priceAnnual: 41, suffix: "seat", cta: "讨论团队方案", href: "issues", tone: "dark", features: ["包含专业版全部功能", "共享项目空间", "评论与方向决策记录", "角色与用量控制", "团队设计系统约束", "优先支持"] },
    ],
    principleEyebrow: "定价原则", principleTitle: "不为一次生成收费。", principles: [
      { index: "01", title: "开源部分保持开放", body: "本地 Skill、设计方法、色板和基础导出不进入付费墙。" },
      { index: "02", title: "付费购买连续性", body: "真正有价值的是跨会话项目、可追溯版本和不会丢失的团队判断。" },
      { index: "03", title: "模型成本透明", body: "Local 使用自己的密钥；托管方案包含明确额度，不伪装成无限生成。" },
    ],
    compareEyebrow: "真正的升级", compareTitle: "从一次答案，到一个项目。", compareBody: "免费层帮助你生成和导出。付费层把每一次选择、修改和理由保留下来，让它们可以被团队继续使用。",
    faqTitle: "常见问题", faqs: [
      { q: "现在会扣款吗？", a: "不会。Pro 和 Team 仍处于早期访问阶段，这个页面表达计划边界，不是假装已经上线的结账页。" },
      { q: "本地版会被限制吗？", a: "不会锁定核心设计流程。你承担自己的模型费用和本地运行环境，项目数据留在本机。" },
      { q: "为什么不是无限生成？", a: "真实生成有模型成本。明确额度比模糊的“无限”更诚实，也更适合高质量设计任务。" },
      { q: "团队方案按什么收费？", a: "计划按活跃席位收费；访客查看和公开分享不占席位。正式价格会在收费前确认。" },
    ],
    finalTitle: "先把方向做对。", finalBody: "从免费本地版开始。需要保存、分享和共同决策时，再升级。", finalPrimary: "打开工作台", finalSecondary: "查看源码 ↗", footer: "开放方法。为连续性付费。",
  },
  en: {
    pageTitle: "Pricing — Variant Design", description: "The open-source skill stays free. Pay for hosted generation, project continuity, and team collaboration.",
    navLabel: "Pricing navigation", navMark: "PRICING / 001", home: "Back to studio", github: "GitHub ↗", switchLabel: "Switch to Chinese", switchText: "中文",
    eyebrow: "Pricing / a clear exchange", title: ["TASTE IS FREE.", "CONTINUITY IS WORTH PAYING FOR."], lede: "The open-source skill and design method stay open. Paid plans cover the expensive parts: hosted models, persistent projects, team decisions, and reliable delivery.",
    billingLabel: "Billing period", plansLabel: "Pricing plans", monthly: "Monthly", annual: "Annual", annualNote: "Two months free", perMonth: "/ month", perSeat: "/ seat / month", billedAnnual: "billed annually", freeForever: "Free forever", earlyAccess: "Early access · no charge yet", recommended: "Recommended for individuals",
    plans: [
      { name: "Local", thesis: "Own the tool and the model key.", priceMonthly: 0, priceAnnual: 0, suffix: "", cta: "Start free", href: "/#top", tone: "plain", features: ["Full open-source skill", "Bring your Anthropic or OpenAI key", "Three working design directions", "Local version history", "HTML export", "Community palettes and updates"] },
      { name: "Pro", thesis: "Keep real projects moving without running infrastructure.", priceMonthly: 24, priceAnnual: 20, suffix: "", cta: "Request early access", href: "issues", tone: "accent", features: ["Everything in Local", "Hosted generation allowance", "Private projects and cloud versions", "Repository context import", "Shareable preview links", "GitHub PR export"] },
      { name: "Team", thesis: "Turn design decisions into team memory.", priceMonthly: 49, priceAnnual: 41, suffix: "seat", cta: "Discuss a team plan", href: "issues", tone: "dark", features: ["Everything in Pro", "Shared project workspace", "Comments and decision history", "Roles and usage controls", "Team design-system constraints", "Priority support"] },
    ],
    principleEyebrow: "Pricing principles", principleTitle: "We do not charge for one answer.", principles: [
      { index: "01", title: "The open part stays open", body: "The local skill, method, palettes, and basic export do not move behind a paywall." },
      { index: "02", title: "Pay for continuity", body: "The durable value is cross-session projects, traceable versions, and team judgment that does not disappear." },
      { index: "03", title: "Model cost stays legible", body: "Local uses your own key. Hosted plans include explicit allowances instead of pretending generation is unlimited." },
    ],
    compareEyebrow: "The actual upgrade", compareTitle: "From one answer to a project.", compareBody: "Free helps you generate and export. Paid plans preserve every choice, revision, and rationale so the work can continue across a team.",
    faqTitle: "Questions", faqs: [
      { q: "Will I be charged now?", a: "No. Pro and Team are in early access. This page defines the intended product boundary; it is not a pretend checkout flow." },
      { q: "Will Local be crippled?", a: "No core workflow is locked. You cover your model usage and local runtime, and the project data stays on your machine." },
      { q: "Why not unlimited generation?", a: "Real generation has a model cost. A clear allowance is more honest—and better aligned with high-quality design work—than vague unlimited usage." },
      { q: "How will Team billing work?", a: "The plan is active-seat pricing. View-only guests and public shares will not consume seats. Final pricing will be confirmed before billing starts." },
    ],
    finalTitle: "GET THE DIRECTION RIGHT FIRST.", finalBody: "Start with Local. Upgrade when the work needs persistence, sharing, and collective judgment.", finalPrimary: "Open the studio", finalSecondary: "View source ↗", footer: "OPEN METHOD. PAID CONTINUITY.",
  },
} as const;

export function PricingPage({ repositoryUrl }: PricingPageProps) {
  const [language, setLanguage] = useState<Language>(() => window.localStorage.getItem("variant-language") === "en" ? "en" : "zh");
  const [billing, setBilling] = useState<Billing>("annual");
  const t = pricingCopy[language];

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.title = t.pageTitle;
    document.querySelector('meta[name="description"]')?.setAttribute("content", t.description);
    window.localStorage.setItem("variant-language", language);
  }, [language, t.description, t.pageTitle]);

  return <main className="pricing-page" data-language={language}>
    <section className="pricing-hero">
      <nav className="pricing-nav shell" aria-label={t.navLabel}>
        <a className="signature" href="/" aria-label="Variant Design"><b>YN</b><span>Yuqing Nicole<br />variant.design</span></a>
        <span className="pricing-nav-mark">{t.navMark}</span>
        <div><a href="/">← {t.home}</a><a href={repositoryUrl} target="_blank" rel="noreferrer">{t.github}</a><button className="language-switch" type="button" aria-label={t.switchLabel} onClick={() => setLanguage(language === "zh" ? "en" : "zh")}>{t.switchText}</button></div>
      </nav>
      <div className="pricing-hero-grid shell">
        <div><p className="pricing-eyebrow">{t.eyebrow}</p><h1>{t.title[0]}<em>{t.title[1]}</em></h1></div>
        <div className="pricing-hero-aside"><p>{t.lede}</p><div className="billing-switch" role="group" aria-label={t.billingLabel}><button type="button" aria-pressed={billing === "monthly"} onClick={() => setBilling("monthly")}>{t.monthly}</button><button type="button" aria-pressed={billing === "annual"} onClick={() => setBilling("annual")}>{t.annual}<span>{t.annualNote}</span></button></div></div>
      </div>
    </section>

    <section className="pricing-plans shell" aria-label={t.plansLabel}>
      {t.plans.map((plan, index) => {
        const price = billing === "annual" ? plan.priceAnnual : plan.priceMonthly;
        const href = plan.href === "issues" ? `${repositoryUrl}/issues/new` : plan.href;
        return <article className={`pricing-card is-${plan.tone}`} key={plan.name}>
          <header><span>0{index + 1}</span>{index === 1 && <b>{t.recommended}</b>}<h2>{plan.name}</h2><p>{plan.thesis}</p></header>
          <div className="price"><strong>${price}</strong><span>{plan.suffix === "seat" ? t.perSeat : t.perMonth}</span></div>
          <small>{index === 0 ? t.freeForever : billing === "annual" ? `${t.billedAnnual} · ${t.earlyAccess}` : t.earlyAccess}</small>
          <ul>{plan.features.map((feature) => <li key={feature}><span>✓</span>{feature}</li>)}</ul>
          <a className="pricing-button" href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}>{plan.cta}<span>↗</span></a>
        </article>;
      })}
    </section>

    <section className="pricing-principles">
      <div className="shell pricing-principles-grid"><div><p className="pricing-eyebrow">{t.principleEyebrow}</p><h2>{t.principleTitle}</h2></div><div>{t.principles.map((principle) => <article key={principle.index}><span>{principle.index}</span><div><h3>{principle.title}</h3><p>{principle.body}</p></div></article>)}</div></div>
    </section>

    <section className="pricing-compare shell"><p className="pricing-eyebrow">{t.compareEyebrow}</p><div><h2>{t.compareTitle}</h2><p>{t.compareBody}</p></div></section>

    <section className="pricing-faq shell"><h2>{t.faqTitle}</h2><div>{t.faqs.map((faq, index) => <details key={faq.q}><summary><span>0{index + 1}</span>{faq.q}<b>+</b></summary><p>{faq.a}</p></details>)}</div></section>

    <section className="pricing-final"><div className="shell"><h2>{t.finalTitle}</h2><p>{t.finalBody}</p><div><a className="pricing-button" href="/">{t.finalPrimary}<span>→</span></a><a href={repositoryUrl} target="_blank" rel="noreferrer">{t.finalSecondary}</a></div></div></section>
    <footer className="pricing-footer shell"><span>YUQING NICOLE / VARIANT DESIGN</span><span>{t.footer}</span><a href={repositoryUrl} target="_blank" rel="noreferrer">GITHUB ↗</a></footer>
  </main>;
}
