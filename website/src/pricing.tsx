import { useEffect, useState } from "react";
import type { Language } from "./direction-engine";
import { SiteHeader, SiteFooter } from "./SiteChrome";
import "./pricing.css";
import { useLocale } from './i18n/LocaleProvider';
import { localePath } from './i18n/locale-route';

type PricingPageProps = { repositoryUrl: string };
type Billing = "monthly" | "annual";

const pricingCopy = {
  zh: {
    pageTitle: "价格 — Variant Design", description: "本地开源技能免费可用。托管专业版和团队版仍在计划中，尚未开放购买或生成额度。",
    navLabel: "价格页导航", navMark: "价格 / 001", home: "返回工作台", github: "GitHub ↗", switchLabel: "切换到英文", switchText: "EN", title: ["本地技能开源免费。", "托管方案仍在计划中。"], lede: "本地技能现在可安装使用。Pro 和 Team 尚未开放购买、开通或生成额度；下列功能和报价都是草案，上线时间未定。",
    billingLabel: "报价周期", plansLabel: "本地版与托管计划", monthly: "月付", annual: "年付", annualNote: "报价草案", perMonth: "/ 月", perSeat: "/ 席位 / 月", billedAnnual: "年付报价草案", freeForever: "永久免费", earlyAccess: "计划中 · 尚未开放", recommended: "计划中", availableNow: "现在可用", proposedPrice: "报价草案", proposedFeatures: "以下为拟提供功能，尚未开放：",
    plans: [
      { name: "本地版", thesis: "使用你自己的编码 Agent。", priceMonthly: 0, priceAnnual: 0, suffix: "", cta: "免费开始", href: "/docs/install", tone: "plain", features: ["完整开源 Skill", "使用自己的 Agent 和模型账户", "三个可运行设计方向", "本地版本记录", "HTML 导出", "社区色板与更新"] },
      { name: "专业版", thesis: "拟探索托管生成与项目版本。", priceMonthly: 24, priceAnnual: 20, suffix: "", cta: "讨论专业版计划", href: "issues", tone: "accent", features: ["包含本地版全部功能", "托管生成额度", "私有项目与云端版本", "代码库上下文导入", "可分享预览链接", "GitHub PR 导出"] },
      { name: "团队版", thesis: "拟探索共享空间与协作记录。", priceMonthly: 49, priceAnnual: 41, suffix: "seat", cta: "讨论团队版计划", href: "issues", tone: "dark", features: ["包含专业版全部功能", "共享项目空间", "评论与方向决策记录", "角色与用量控制", "团队设计系统约束", "优先支持"] },
    ], principleTitle: "现在可用的是本地技能。", principles: [
      { index: "01", title: "开源部分保持开放", body: "本地 Skill、设计方法、色板和基础导出不进入付费墙。" },
      { index: "02", title: "托管功能仍是计划", body: "云端项目、共享记录和团队协作是候选方向，尚未作为付费服务提供。" },
      { index: "03", title: "模型成本透明", body: "本地使用你自己的模型账户。托管服务若开放，会另行确认价格和用量；本页不提供生成额度。" },
    ], compareTitle: "从一次答案，到一个项目。", compareBody: "本地技能支持生成、修改、撤回和接入。云端连续性与团队协作仍是计划，不是本页可以开通的服务。",
    faqTitle: "常见问题", faqs: [
      { q: "现在会扣款吗？", a: "不会。Pro 和 Team 尚未开放购买、开通或生成额度。讨论计划只会打开 GitHub Issue 编辑器，不会提交订单或自动发消息。" },
      { q: "本地版会被限制吗？", a: "核心设计流程由开源技能提供。你承担模型费用和本地运行环境；项目文件保存在自己的目录，模型请求使用你的 Agent 与供应商配置。" },
      { q: "为什么不是无限生成？", a: "真实生成有模型成本。明确额度比模糊的“无限”更诚实，也更适合高质量设计任务。" },
      { q: "团队方案按什么收费？", a: "活跃席位是待讨论的计费方式；席位定义、访客权限和正式价格都未确定，当前没有可购买的团队订阅。" },
    ],
    finalTitle: "先把方向做对。", finalBody: "先安装免费本地技能。你可以讨论托管需求；当前没有可购买的升级方案。", finalPrimary: "开始使用", finalSecondary: "查看源码 ↗", footer: "本地开源可用。托管方案计划中。",
  },
  en: {
    pageTitle: "Pricing — Variant Design", description: "The local open-source skill is free to use. Hosted Pro and Team plans are proposals, with no purchase or generation allowance available.",
    navLabel: "Pricing navigation", navMark: "PRICING / 001", home: "Back to studio", github: "GitHub ↗", switchLabel: "Switch to Chinese", switchText: "中文", title: ["The local skill is free.", "Hosted plans are proposals."], lede: "Install and use the local skill today. Pro and Team are not available to buy or activate, and provide no generation allowance. Features and prices below are proposals with no launch date.",
    billingLabel: "Proposed billing period", plansLabel: "Local skill and proposed hosted plans", monthly: "Monthly", annual: "Annual", annualNote: "Proposed prices", perMonth: "/ month", perSeat: "/ seat / month", billedAnnual: "proposed annual price", freeForever: "Free forever", earlyAccess: "Planned · not available", recommended: "Planned", availableNow: "Available now", proposedPrice: "Proposed price", proposedFeatures: "Proposed features, not available yet:",
    plans: [
      { name: "Local", thesis: "Use your own coding agent.", priceMonthly: 0, priceAnnual: 0, suffix: "", cta: "Start free", href: "/docs/install", tone: "plain", features: ["Full open-source skill", "Use your own agent and model account", "Three working design directions", "Local version history", "HTML export", "Community palettes and updates"] },
      { name: "Pro", thesis: "Proposed hosted generation and project history.", priceMonthly: 24, priceAnnual: 20, suffix: "", cta: "Discuss the Pro proposal", href: "issues", tone: "accent", features: ["Everything in Local", "Hosted generation allowance", "Private projects and cloud versions", "Repository context import", "Shareable preview links", "GitHub PR export"] },
      { name: "Team", thesis: "Proposed shared spaces and decision records.", priceMonthly: 49, priceAnnual: 41, suffix: "seat", cta: "Discuss the Team proposal", href: "issues", tone: "dark", features: ["Everything in Pro", "Shared project workspace", "Comments and decision history", "Roles and usage controls", "Team design-system constraints", "Priority support"] },
    ], principleTitle: "The local skill is available now.", principles: [
      { index: "01", title: "The open part stays open", body: "The local skill, method, palettes, and basic export do not move behind a paywall." },
      { index: "02", title: "Hosted features are proposals", body: "Cloud projects, shared records and team collaboration are possible directions, not services currently sold here." },
      { index: "03", title: "Model cost stays legible", body: "Local uses your own model account. Prices and usage limits would be confirmed before a hosted launch; this page provides no generation allowance." },
    ], compareTitle: "From one answer to a project.", compareBody: "The local skill supports generation, edits, undo and integration. Cloud continuity and collaboration remain proposals you cannot activate here.",
    faqTitle: "Questions", faqs: [
      { q: "Will I be charged now?", a: "No. Pro and Team are not available to buy or activate, and provide no generation allowance. Discussing a proposal opens GitHub’s issue editor; it places no order and sends no message automatically." },
      { q: "Will Local be crippled?", a: "The open-source skill provides the core workflow. You cover model usage and the local runtime. Files are stored in your project directory; model requests use your agent and provider configuration." },
      { q: "Why not unlimited generation?", a: "Real generation has a model cost. A clear allowance is more honest—and better aligned with high-quality design work—than vague unlimited usage." },
      { q: "How will Team billing work?", a: "Active seats are one proposed billing method. Seat definitions, guest access and final prices are undecided; no Team subscription is currently for sale." },
    ],
    finalTitle: "Get the direction right first.", finalBody: "Install the free local skill. You can discuss hosted needs; no paid upgrade is currently available.", finalPrimary: "Get started", finalSecondary: "View source ↗", footer: "LOCAL SKILL AVAILABLE. HOSTED PLANS PROPOSED.",
  },
} as const;

export function PricingPage({ repositoryUrl }: PricingPageProps) {
  const language = useLocale();
  const [billing, setBilling] = useState<Billing>("annual");
  const t = pricingCopy[language];

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.title = t.pageTitle;
    document.querySelector('meta[name="description"]')?.setAttribute("content", t.description);
  }, [language, t.description, t.pageTitle]);

  return <main className="pricing-page" data-language={language}>
    <section className="pricing-hero">
      <SiteHeader language={language} page="pricing"/>
      <div className="pricing-hero-grid shell">
        <div><h1>{t.title[0]}<em>{t.title[1]}</em></h1></div>
        <div className="pricing-hero-aside"><p>{t.lede}</p><div className="billing-switch" role="group" aria-label={t.billingLabel}><button type="button" aria-pressed={billing === "monthly"} onClick={() => setBilling("monthly")}>{t.monthly}</button><button type="button" aria-pressed={billing === "annual"} onClick={() => setBilling("annual")}>{t.annual}<span>{t.annualNote}</span></button></div></div>
      </div>
    </section>

    <section className="pricing-plans shell" aria-label={t.plansLabel}>
      {t.plans.map((plan, index) => {
        const price = billing === "annual" ? plan.priceAnnual : plan.priceMonthly;
        const href = plan.href === "issues" ? `${repositoryUrl}/issues/new` : plan.href;
        return <article className={`pricing-card is-${plan.tone}`} key={plan.name}>
          <header>{index > 0 && <b>{t.recommended}</b>}<h2>{plan.name}</h2><p>{plan.thesis}</p></header>
          <small>{index === 0 ? t.availableNow : t.proposedPrice}</small>
          <div className="price"><strong>${price}</strong><span>{plan.suffix === "seat" ? t.perSeat : t.perMonth}</span></div>
          <small>{index === 0 ? t.freeForever : billing === "annual" ? `${t.billedAnnual} · ${t.earlyAccess}` : t.earlyAccess}</small>
          {index > 0 && <p>{t.proposedFeatures}</p>}
          <ul>{plan.features.map((feature) => <li key={feature}><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5 6.5 11.5 12.5 4.5"/></svg>{feature}</li>)}</ul>
          <a className="pricing-button" href={localePath(href,language)} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}>{plan.cta}</a>
        </article>;
      })}
    </section>

    <section className="pricing-principles">
      <div className="shell pricing-principles-grid"><div><h2>{t.principleTitle}</h2></div><div>{t.principles.map((principle) => <article key={principle.index}><h3>{principle.title}</h3><p>{principle.body}</p></article>)}</div></div>
    </section>

    <section className="pricing-compare shell"><h2>{t.compareTitle}</h2><p>{t.compareBody}</p></section>

    <section className="pricing-faq shell"><h2>{t.faqTitle}</h2><div>{t.faqs.map((faq, index) => <details key={faq.q}><summary>{faq.q}<b><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 3v10M3 8h10"/></svg></b></summary><p>{faq.a}</p></details>)}</div></section>

    <section className="pricing-final"><div className="shell"><h2>{t.finalTitle}</h2><p>{t.finalBody}</p><div><a className="pricing-button" href={localePath('/docs/install',language)}>{t.finalPrimary}</a><a href={repositoryUrl} target="_blank" rel="noreferrer">{t.finalSecondary}</a></div></div></section>
    <SiteFooter language={language}/>
  </main>;
}
