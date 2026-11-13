# 相近产品怎么拿流量（2026-11-13）

维护者问："参考下其他和我们相近的产品，是如何拿流量的。"本文记录公开可查的事实和对我们的推论，不判断谁做得好。对象分两类：设计参考站（Mobbin、Refero、recent.design、Land-book、Lapa Ninja、Design Spells、Godly、Awwwards）和给编码 Agent 用的设计工具（Impeccable、Lovable）。

## 方法和限制

- 只读公开网页：第三方流量估算页（Similarweb 免费页、Semrush 免费页）、对方自己的 newsletter 和博客、Product Hunt 页、第三方文章。每个网址一次普通请求，没有登录、没有批量抓取。
- **没有访问 recent.design 本身**：它的 `robots.txt` 禁止 AI 爬虫，我们在 `2026-11-11-robots-ai-training.md` 之后不再用程序读它；它的数据全部来自第三方页面。
- Similarweb 免费页的访问量标题是 "Total Visits Last 3 Months"，页面标注 2026 年 10 月；渠道排名只给桌面端、只显示第一名的百分比，其余要付费。所以下表的访问量按三个月总量理解，渠道只有名次。
- 各估算工具互相不一致（例如一家给 Mobbin 每月约 6 万自然搜索访问，另一家给三个月 260 万总访问），**只用来看数量级和渠道结构**，不是真实数据。按 TODO 第 3 组的规则，取不到的写"无法获得"。
- 我们自己的流量现在没有数据（TODO 第 7 组 B1：没有任何统计在收集）。

## 1. 数字对照

| 站点 | 访问量 | 第一渠道 | 第二 | 第三 | 来源 |
|---|---|---|---|---|---|
| mobbin.com | 260 万 / 3 个月 | 直接 56.4% | 自然搜索 | 社交 | [Similarweb](https://www.similarweb.com/website/mobbin.com/) |
| refero.design | 110 万 / 3 个月 | 直接 58.2% | 自然搜索 | 引荐 | [Similarweb](https://www.similarweb.com/website/refero.design/) |
| recent.design | 49.7 万 / 3 个月，环比 +6.5% | 直接 72.1% | **社交** | 自然搜索 | [Similarweb](https://www.similarweb.com/website/recent.design/)；引荐里第一名是 threads.com（占引荐的 7.0%） |
| land-book.com | 43.7 万 / 3 个月 | 直接 60.9% | 自然搜索 | 社交 | [Similarweb](https://www.similarweb.com/website/land-book.com/)；引荐里有 vercel.app、designeer.xyz、medium.com |
| lapa.ninja | 每月约 23.5–26.7 万（2025 年 7–9 月），环比 −14% | 无法获得 | | | [Semrush](https://zh.semrush.com/website/lapa.ninja/overview)（2025-10-12 快照） |
| designspells.com | 自报每月约 1.5 万（2024 年站点上线后） | 无法获得 | | | 对方 newsletter（见第 2.2 节） |
| variantdesign.xyz | **无数据** | | | | TODO B1 |

两点看得出来：

1. **每一家的第一渠道都是直接访问，占 56%–72%。** 这些站靠的是回访习惯（每天更新、收藏、newsletter），不是搜索。
2. **信息流型的站（recent.design）第二渠道是社交，引荐第一名是 Threads；参考库型的站（Mobbin、Refero、Land-book）第二渠道是自然搜索。** 我们的首页是信息流，详情页是参考库，两种都要。

## 2. 各家的渠道，按证据

### 2.1 Mobbin：免费层 + Product Hunt + 圈内口碑 + 搜索维度页 + 卖给 Agent

- 2018 年从一个 Dropbox 截图文件夹开始，三个月做出第一版；在 Product Hunt 上线，"很多用户从 Product Hunt 发现它"；在设计师圈子里分享，Meng To、Yangshun Tay 等人放大了传播；免费层 + Pro（约每人每月 $10）；接赞助。以上是 [Starter Story 文章](https://www.starterstory.com/mobbin-breakdown)作者的叙述，文中没有创始人直接引语，也没有流量或转化数字；"loved by over 1M designers" 来自创始人的 LinkedIn 帖。
- 搜索结构：公开的 [llms.txt](https://mobbin.com/llms.txt) 说 Explore 页"按平台、产品、分类、流程、屏幕模式、UI 元素浏览"。每个维度都是可索引的页面，这是参考库拿自然搜索的通常做法。
- 面向 Agent：MCP 在 Pro/Team/Enterprise 计划，REST API 在 Team/Enterprise，另有 `llms-full.txt` 和 OpenAPI 文档。把参考库卖进 Agent 工作流是付费功能，不是免费分发。
- 第三方估算 [instantdomainsearch](https://instantdomainsearch.com/directory/mobbin.com) 给每月约 6.0 万自然搜索访问、14.6 万反链；与 Similarweb 的数量级不一致，只记录不采信。

### 2.2 Design Spells：先有 X 账号，再有 newsletter，最后才有网站

- [Product Hunt 页](https://www.producthunt.com/products/design-spells)和对方 newsletter：2023 年 5 月 29 日以一个 X 账号开始；之后做双周 newsletter，订阅从 5,500+ 涨到 6,500+（不同期数的自报数）；网站 2024 年 3 月上线，自报每月约 1.5 万访客；2024 年 3 月 13 日上 Product Hunt，[拿到当日第一](https://designspells.com/newsletters/18)。
- 投稿入口是 Tally 表单、发推或私信、回复邮件（第 18 期）。内容全部来自社区投稿加作者筛选。
- 这是和我们形态最像、也最可复制的路径：**内容先在 X 上日更积累受众，网站只是归档**。

### 2.3 recent.design / Godly：社交信息流 + 赞助

- Godly 的 [info 页](https://godly.website/info)：2021 年 7 月创办、由 Rejiggle 策展；"广告主可以一次 30 天触达数千创意人"；投稿不保证收录。godly.website 现在跳转到 recent.design。
- recent.design 的赞助：30 天 $5,000，每次最多 4 个合作方（我们 2026-10-27 的分发核查记录）。第三方评测称其 newsletter 有 12.5 万订阅（[uiuxshowcase](https://uiuxshowcase.com/resources/recent-design-best-web-design-inspiration/)），**未经官方来源核实**。
- 渠道结构见第 1 节：直接 72%，社交第二，Threads 是引荐第一名。它的 X/Threads 账号粉丝数这次没有找到可引用的公开页面，写"无法获得"。

### 2.4 Lapa Ninja：十年存量 + 学习内容 + 周报

- 2015 年起积累 7,300+ 个落地页、15,000+ 张截图（[toolradar](https://toolradar.com/tools/lapa-ninja)、[postmake](https://postmake.io/tools/lapa)），每页一条、按分类和页码可索引，所以自然搜索有长尾。
- 站内有 "Learn Design" 栏目：免费设计书、UI/UX 技巧、字体指南。**参考站把教程内容当作第二个入口**，这和维护者 2026-11-13 提出的"教程性内容"方向一致。
- 唯一明说的回访机制是每周 newsletter。

### 2.5 Refero：把参考库做成 Agent 的工具

- 库从 6.5 万张涨到 11.2 万张，每周约 1,000 张新屏（[Product Hunt 3.0](https://hunted.space/product/refero-3-0)、[alternativeto](https://alternativeto.net/lists/44740/design-reference-libraries-for-real-world-inspiration/)）。
- 有 MCP 服务和一个公开的 skill 仓库（[referodesign/refero_skill](https://cdn.jsdelivr.net/gh/referodesign/refero_skill@master/SKILL.md)），[官方文档](https://doc.refero.design/skill/overview.md)说 skill 配合 MCP 效果最好；另有 "Refero Styles"：从真实网站提取的设计系统，打包成 `DESIGN.md` 给 Cursor、Claude Code 用（[第三方笔记](https://notes.nicolasdeville.com/ai/refero-styles/)）。
- 渠道结构：直接 58%，自然搜索第二，引荐第三。它是参考库里唯一把"被 Agent 调用"当成产品线的。

### 2.6 Awwwards：付费投稿 + 徽章反链

- 第三方指南给出投稿费约 $65 一站、$165 一年三站（[digidop](https://www.digidop.com/blog/complete-guide-awwards-digital-agencies)、[prismic](https://prismic.io/blog/how-to-win-award-for-website)）；[官方条款](https://awwwards.com/terms)说只有 Site of the Day 的分数会公开。
- 获奖站挂 Awwwards 徽章回链，形成反链网络；"Site of the Day 一周触达数十万设计师"是厂商博客的说法，未核实。
- 这条路靠的是**被收录方主动传播**：对方为了荣誉替平台做分发。

### 2.7 Lovable：产品里的传播回路

- 发布的应用带 "Edit with Lovable" 按钮，访客点进去就能 remix，形成"做 → 分享 → 新用户 → 再做"的循环；展示的项目都能当模板（[growthunhinged](https://www.growthunhinged.com/p/lovable-growth-story)、[overtheanthill](https://overtheanthill.substack.com/p/lovable)）。隐藏徽章是付费功能（Pro 及以上，[changelog](https://docs.lovable.dev/changelog?page=1)），所以免费层的每个站都在替它分发。
- 短视频："一条 TikTok 110 万播放"（[shotcast](https://shotcast.substack.com/p/from-zero-to-30m-arr-in-120-days)）；创始人持续发增长数字和转发用户成果。
- [Demand Curve](https://www.demandcurve.com/newsletters/growth-newsletter-267) 的反方观点：渠道故事被夸大，真正的驱动是产品本身可分享，估算 2025 年 1–2 月峰值周病毒系数约 1.24。以上用户数均为第三方估算。

### 2.8 Impeccable 和技能目录：被动收录

- 它从 Anthropic 的 frontend-design 技能扩展而来；2026 年 6 月作者 @pbakaus 的一条帖子约 30.3 万次浏览，宣布公司获 a16z 支持（[youmind 整理](https://youmind.com/uk-UA/landing/x-viral-articles/impeccable-design-ai-renaissance)）。我们 2026-11-02 核对 GitHub 时它约 9.98 万 star。
- 安装靠 `npx skills add pbakaus/impeccable`；此外它被十几个第三方技能目录自动收录（mcp.so、skillstore.io、ui-skills.com、agentskillsfinder.com、open-design.ai 等，见搜索结果）。这些目录**不需要投稿**，按 GitHub 和 skills.sh 的数据自动抓取；skills.sh 的榜单按安装量排（我们 2026-10-27 的核查）。
- 社区清单（awesome-claude-skills 一类，star 数在 6.3 万–7.4 万之间，不同快照）是另一个被动入口；"超过 2.4 万个仓库含 Claude Code 技能"来自[一份指南](https://designrevision.com/blog/awesome-claude-code-skills)，未核实。

## 3. 对我们意味着什么

先说前提：**没有统计就无法知道哪条渠道有效**。下面每条都以 B1（访问量）和 Search Console 建立为前提，这两项是【维护者】的。

按投入产出排序：

1. **开站点的 X 和 Threads 账号，日更一条。** 这是 recent.design 的第二渠道、Design Spells 的起点，也是我们现有内容最自然的出口：每条参考都已署名作者和出处，发出去时 @ 作者，作者转发就是分发。站上现在没有任何社交账号链接（只有 GitHub）。需要【维护者】开账号并决定由谁发；代理可以从 `inspiration-data.ts` 生成发帖队列（中英各一句，附详情页链接）。**先修一件事**：详情页全部缺 `og:image`（TODO 第 3 组），分享出去只有文字卡，社交分发会吃亏。
2. **回访机制：每周精选邮件或"本周新增"页**（TODO 第 3 组，待维护者定）。所有对标站的第一渠道都是直接访问，而我们现在只有 RSS。邮件涉及收集地址，隐私说明要先写。
3. **搜索维度页和教程。** 我们已有 7 个分类页和预渲染详情页，还缺 Mobbin 那种按"模式"和"元素"切的维度页；我们笔记里的"看什么"天然是维度（导航、定价页、加载态……）。教程走 `/guides`（现在 5 篇），参照 Lapa Ninja 的 Learn Design 做第二入口；这也是维护者 2026-11-13 提出的"教程性内容"的落点。前提是首页数据拆分（TODO 第 6 组）。
4. **发布节点。** Product Hunt 对 Mobbin、Design Spells、Refero 都起过作用，但要有东西可发：等"AI 作品"案例系列成型再发一次，不要拿现状发。免费目录（toools.design 的 [100 个灵感站清单](https://www.toools.design/blog-posts/ultimate-list-100-best-inspiration-sites-to-inspire-designers)一类）可以申请收录；技能侧的 claudemarketplaces.com 和 Codex 目录在 TODO 第 2 组。
5. **产品里的回路。** 技能生成的比较页和导出 HTML 是用户会分享的东西，现在不带任何指回本站的链接（`scripts/build-preview.mjs`、`scripts/react-preview.mjs` 里没有），可以带一行可去掉的 "Made with Variant Design" 链接（Lovable 的徽章、Awwwards 的徽章都是这个原理）。要【维护者】定：默认带不带、怎么去掉；按我们的诚实规则，必须可去掉且不收费。
6. **面向 Agent 的分发。** 我们已有 `llms.txt`、`llms-full.txt`。Mobbin 和 Refero 把 MCP 放在付费层，我们的参考库是 link-only 数据，可以免费开放一个 MCP 或技能让 Agent 查"带出处和核对日期的设计参考"，这是对方收费、我们能免费给的差异点，也接上 GEO 策略里的问题 9。

**这次没做、也做不了的：** 对方的真实流量、X/Threads 粉丝数、newsletter 订阅数都拿不到官方数字；Similarweb 的渠道只给名次；recent.design 没有直接读；没有任何一条是 A/B 验证过的结论。
