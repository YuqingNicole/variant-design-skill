# GEO 策略：让 AI 搜索读得到、愿意引用 Variant Design

日期：2026-11-02。基线：master `236a7bf`，线上站 https://variant-design-skill.vercel.app 。

GEO（生成式引擎优化）指让 ChatGPT、Perplexity、Claude、Google AI Overviews 这类 AI 搜索在回答问题时找到、读懂并引用我们的页面。它们主要读两样东西：不执行 JavaScript 也能读到的 HTML，以及 GitHub 等第三方页面上关于我们的内容。

## 1. 现状审计（2026-11-02，用 curl 读线上页面）

| 项目 | 结果 | 影响 |
|---|---|---|
| robots.txt | 允许所有爬虫，指向 sitemap | 正常 |
| sitemap.xml | 111 个地址 | 正常 |
| 作品页、分类页、灵感详情页 | 有独立标题、描述、canonical、分享卡片和可读正文 | 正常 |
| `/docs` | 预渲染正文为空，去掉标签后只剩 4 个词 | "怎么安装"这类最常见的问题，AI 读不到答案 |
| `/llms.txt`、`/llms-full.txt` | 不存在，但返回 200 和首页 HTML | AI 工具读到的是错的内容；其他不存在的文件也一样（软 404） |
| 结构化数据 | 全站没有 JSON-LD | AI 不容易认出这是什么类型的项目、怎么装 |
| 英文 | 预渲染只有中文，没有 hreflang | 英文提问很少能引用到本站 |
| GitHub 仓库 | `homepageUrl` 是仓库自己；描述写着 "inspired by the Variant design community"；47 star | 仓库和官网没有互相指向；描述可能让人误以为和 Variant 有关 |

## 2. 策略

按投入产出排序，分三层。

### 第一层：让 AI 读得到

1. `/docs` 预渲染完整安装指南：前置条件、各 Agent 的安装命令、确认步骤、首次指令、比较与接入命令、常见问题。**本次已完成。**
2. 构建时生成 `llms.txt`（英文概述、安装命令、关键事实、案例和文档链接）和 `llms-full.txt`（完整安装指南，英文和中文各一份）。**本次已完成。**
3. JSON-LD：首页 `WebSite` + `SoftwareSourceCode`（版本号读取 `VERSION`），`/docs` 用 `HowTo` + `FAQPage`，作品页用 `CreativeWork`。**本次已完成。**
4. 带扩展名但不存在的路径返回 404，不再返回首页。**本次已完成。**
5. 关键页面（首页、`/docs`、`/inspiration`）的英文预渲染版本和 hreflang。需要先定英文页面的地址方案（RFC-005），待做。
6. GitHub 元数据：主页地址改成官网；描述改成一句可以直接引用的定位；补 `agent-skill`、`codex` 等 topics。改的是公开信息，措辞需维护者确认，待做。

### 第二层：写 AI 愿意引用的内容

AI 偏好开头就给结论、后面有证据的段落，以及对比表和具体数字。

1. **统一定位句。** README、官网、llms.txt 和 GitHub 描述用同一句话。目前 llms.txt 用的是："Variant Design is an open-source agent skill for Codex and Claude Code that turns one design brief into three distinct, comparable directions (A/B/C) inside your own project, with scoped edits, snapshot undo and an integration step you can roll back."
2. **按真实提问写回答页。** 例如"Claude Code 怎么一次生成多个设计方案""Codex 的设计技能怎么装""AI 生成的界面怎么避免千篇一律"。每页开头两三句直接回答，后面放步骤和真实案例（Pulse、Harbor）。
3. **公开实测证据。** `docs/research/` 里已有 eval 基线和 dogfood 记录，整理成网站上的实测页面。只写实际跑过的结果。
4. **对比页。** 只用公开可查的事实，不做对方条款禁止的测评，不用对方品牌素材（见 `paper-design-comparison.md`）。

### 第三层：让别处提到我们

AI 的回答很依赖第三方提及。

1. 投稿到 Claude Code、Codex 和 agent skills 的资源合集与目录。
2. 在 Reddit、Hacker News（Show HN）、V2EX、少数派、即刻发真实案例，每篇带一张 A/B/C 对比图和仓库链接。
3. 灵感页收录的作品已注明出处，可以告知原作者；对方转发就是自然的外链。
4. 社区：Discord 里的聊天内容搜索引擎和 AI 都读不到，对 GEO 没有直接帮助。如果开 Discord，同时开 GitHub Discussions，把问答留在能被读到的地方。

### 进度（2026-11-02，分支 `codex/seo-foundations`）

- `/about`、`/pricing`、`/skills`、`/submit`、`/inspiration` 之前预渲染正文为空，现在构建时用 React 直接渲染现有组件（`website/src/ssr-pages.tsx`），不跑 JavaScript 也能读到。`/inspiration` 只输出首屏 24 条，其余详情页靠 sitemap 发现。
- `/lab`、`/lab/forma`、`/variant-output/` 和兜底页 `app.html` 加 `noindex`，`/lab` 移出 sitemap。不存在的路径仍返回 200，但不会被收录。
- 第二层第 2 项先写了 3 篇回答页（`/guides`）：比较方向、撤回修改、避免千篇一律。事实只来自技能文档和本目录的实测记录。目前只有中文被预渲染，英文可在页面内切换，但没有独立地址。

## 3. 怎么衡量

- 每两周用下面 10 个问题分别问 ChatGPT、Perplexity、Claude 和 Google（AI 模式），记录有没有提到 Variant Design、引用了哪个页面，结果按日期记在本目录：
  1. 有没有能一次生成多个设计方向的 Claude Code 技能？
  2. Codex 有哪些做 UI 设计的技能？
  3. 怎么让 AI 生成的网页设计不千篇一律？
  4. 怎么用 AI 在现有项目里比较几种设计方案？
  5. variant-design 技能怎么安装？
  6. Claude Code design skill that generates A/B/C variations
  7. How to install a skill in Codex
  8. Open-source alternatives for AI design exploration in a codebase
  9. 有哪些标注了来源的设计灵感网站？
  10. 怎么撤回 AI 对设计的修改？
- Vercel Analytics 里看来自 chatgpt.com、perplexity.ai、claude.ai 等来源的访问。
- 第一次测量尽快做，作为基线；AI 搜索重新抓取需要时间，之后的变化要按几周看。
