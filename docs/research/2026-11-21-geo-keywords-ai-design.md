# GEO 关键词清单：围绕 AI 设计（2026-11-21）

接着 `2026-11-09-keyword-candidates.md`（候选词，没有数据）和 `2026-11-14-keyword-candidates.md`（维护者给的六个带搜索量的英文词，以及当天改的页面）。GEO 的目标问题沿用 `2026-11-02-geo-strategy.md`。这份清单把范围放宽到“AI 设计”这个主题，按 AI 助手（ChatGPT、Perplexity、豆包、Kimi、元宝等）里常见的**问句**来写，并对到站点上应该回答它的页面。

## 1. 范围与局限

- **没有任何搜索量、难度或引用数据。** 没有用 Ahrefs、Semrush、Keyword Planner、Search Console，也没有在任何 AI 助手里实测这些问题会引用谁。排序是按与站点的相关度和站点能不能答好来判断的，是推测。
- 没有打开这些词的搜索结果页。
- “对应页面”是对照仓库里现有页面标题做的判断（`website/src/docs-articles.ts`、`website/src/guides-content.ts`、`website/scripts/prerender.mjs`），不是排名。标“缺口”的是现在没有页面专门回答的问题。
- 中英文问句不是逐字对译：每种语言用它自然的问法，页面标题仍要互为翻译（维护者规则，2026-11-12）。

## 2. 清单

### A. 核心词：站点是什么

| 中文 | 英文 | 对应页面 |
|---|---|---|
| AI 设计工具 / AI 界面设计 | AI design tool / AI UI design | 首页、`/about` |
| AI 前端设计 / AI 生成网页设计 | AI frontend design / AI website design generator | `/about`、`/docs/install` |
| AI 设计 Agent / 设计技能 | AI design agent / design skill for coding agents | `/skills`、`/about` |
| 一个需求出三版设计 | generate multiple design directions with AI | `/cases`、`/guides/compare-design-directions` |
| AI 设计灵感库 | AI design inspiration / curated design references | 首页、`/guides/design-references-with-sources` |

`ai design variations generator` 一类的通用词，11-09 的清单判断被同类产品占据，仍不建议主攻。

### B. 工具与流程（意图最高，离产品最近）

| 问句 | 对应页面 |
|---|---|
| 怎么用 Claude Code 做前端设计 / How to design UI with Claude Code | `/docs/install`（11-14 已把标题改为“在 Claude Code 和 Codex 里安装设计技能”）；还没有只讲 Claude Code 的实操文章 |
| Codex 能做前端设计吗 / Frontend design in Codex | `/docs/frontend-design-in-codex`（英文仍是草稿，生产环境不出） |
| AI 编码 Agent 怎么做设计探索 / Design exploration with AI coding agents | `/docs/design-exploration-with-ai-coding-agents` |
| AI 改了设计怎么撤回 / How to undo AI design changes | `/guides/undo-ai-design-changes`、`/guides/git-or-snapshot-undo` |
| 在现有项目里比较几个设计方向 / Compare design directions in an existing codebase | `/guides/compare-design-directions` |
| 怎么让 AI 只改界面的一部分、不动别的 / Edit one part of a UI with AI without touching the rest | **缺口**（区域编辑和“不覆盖没看过的改动”是产品的强项） |
| 选好的设计方向怎么接进代码、怎么回滚 / Integrate an AI design into your codebase and roll it back | **缺口** |
| 用 AI 提炼设计系统 / Generate a design system from a design with AI | 设计系统那篇文章（“AI 从选定的方向提炼设计系统”） |
| 做设计的 Claude 技能 / Agent skills for UI design | `/skills` |

### C. 质量问题（现有文章最强的一块）

| 问句 | 对应页面 |
|---|---|
| AI 生成的界面为什么千篇一律 / Why does AI-generated UI all look the same | `/guides/avoid-generic-ai-ui`、“三个 AI 方向为什么长得一样” |
| 怎么让 AI 做的界面更高级 / How to make AI-generated UI look premium | “让 AI 把界面做得‘高级’” |
| AI 生成的界面上线前怎么检查 / How to review AI-generated UI before shipping | `/docs/check-ai-generated-ui-before-you-ship` |
| AI 做的页面加载时会跳 / Layout shift on an AI-built page | 版面位移那篇文章 |
| AI 界面的动效该怎么定 / Motion guidelines for AI-generated UI | 动效规则那篇文章 |
| AI 生成的界面无障碍做得怎么样 / Accessibility of AI-generated UI | **缺口**；写的时候只能写实际跑过的检查，不能声称合规（`AGENTS.md`） |
| 设计需求怎么写给 AI / How to write a design brief or prompt for AI | **缺口**；量可能大、竞争也大，站点的“生成参考指令”可以接 |

### D. 灵感与参考（量大，靠具体内容取胜）

| 问句 | 对应页面 |
|---|---|
| 网站设计灵感 / landing page inspiration | `/browse/web` |
| SaaS 首页怎么设计 / SaaS homepage examples | SaaS 首页专题（`?topic=saas-home`） |
| 产品界面、仪表盘设计参考 / product UI inspiration, dashboard design examples | `/browse/interface` |
| 动效、微交互灵感 / UI animation, micro-interaction inspiration | `/browse/design-motion` |
| 品牌识别、标志动画灵感 / brand identity, logo animation inspiration | `/browse/design-motion?type=branding` |
| 「某某的网站是怎么设计的」/ "Linear website design" | 各条参考的详情页，标题已是“名字 — 网站设计灵感”的形式（`detailTitle`） |
| 带来源的设计参考 / design references with sources | `/guides/design-references-with-sources` |
| 创意视频、定格动画灵感 / creative video, stop-motion inspiration | `/browse/videos`；不在“AI 设计”主题内，能带流量但不是核心 |

### E. 对比与替代（AI 助手常答，要写得实事求是）

| 问句 | 备注 |
|---|---|
| v0 / Lovable / Bolt 的替代，能用在已有项目里的 / v0 alternative for existing projects | **缺口** |
| Figma AI 和在代码里用 AI 做设计有什么区别 / Figma AI vs AI design in code | **缺口** |
| 哪些 AI 工具适合做界面设计 / Best AI tools for UI design | **缺口** |
| design-shotgun、SuperDesign 的替代 | 11-09 清单 D 类已列，仍未写 |

写法：按“什么情况用哪个”来写，只用公开可查的事实和我们自己跑过的记录，不做对方条款禁止的测评，不用对方的品牌素材（`AGENTS.md` 第三方产品一节、`paper-design-comparison.md`）。

### F. 长尾场景（一个问题一篇，便于被引用）

- 用 AI 给 React / Vite 项目做设计 / AI design for a React or Vite project
- 用 AI 做创业公司落地页 / AI landing page design for a startup
- 用 AI 做仪表盘界面 / AI dashboard UI design
- 用 AI 加深色模式 / Add dark mode with AI
- 用 AI 做中文网站的排版 / Chinese web typography with AI（推测同类内容少，站点双语是优势）

## 3. 建议（推测，未核实）

1. **先补五个缺口**：设计需求怎么写给 AI；只改一部分、不动别的；选好的方向怎么接进代码和回滚；哪些 AI 工具适合做界面设计（对比）；只讲 Claude Code 的前端设计实操。前三个直接对应产品已有的能力。
2. **一页答一个主问题**：H1、第一段的直接回答和 FAQ 结构化数据都围绕同一个问句。我的印象是 AI 助手倾向于引用页面里最先出现的直接回答，没有核实过。
3. **中英文分开考虑问法**：中文助手和英文助手的常见问法不同；标题互为翻译，但各用该语言自然的问句。

## 4. 下一步

1. 用工具查这些词的搜索量（中文词尤其没有任何数据），补进本文并注明工具和日期。
2. 选 `2026-11-02-geo-strategy.md` 的测量方式，在几个 AI 助手里问 B、C 两类的问题，记下被引用的是谁、有没有我们的页面。
3. 维护者定先写哪几篇缺口文章。
