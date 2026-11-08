# TODO

维护者和编码代理共用的待办清单。做完的条目直接删掉，记录留在 PR 和 git 历史里。较大的工作仍然开 GitHub Issue。

排序依据：`docs/research/2026-11-02-competitor-comparison.md`（竞品对比）和 `docs/research/2026-11-02-geo-strategy.md`（GEO 策略）。标【维护者】的需要账号、付费、公开发布或措辞确认，代理只能起草。

## 1. 先修：诚实和定位

（本组已完成，决策记录见 `docs/drafts/positioning-and-availability.md`。）

## 2. 分发：先让人找得到

（2026-11-07 决定暂不购买自有域名，继续使用 `https://variant-design-skill.vercel.app/`。）

- [ ] 【维护者】Search Console：为当前 Vercel URL 前缀完成站点验证并提交 sitemap，检查 `/en/...` 的索引和 `hreflang` 报告（不以 HTTP 200 为准）。静态核对已完成；Search Console 属性还未建立，原因与证据见 `docs/research/2026-11-07-search-console-readiness.md`。
- [ ] 【维护者】投稿到 claudemarketplaces.com 与 Codex 插件目录。skills.sh 已自动收录，不需要投稿；其余渠道的准备状态、文案与发布门槛见[投稿材料](docs/drafts/distribution-submissions.md)。
- [ ] 【维护者】第一次做 AI 搜索基线测量（GEO 策略里的 10 个问题），之后每两周一次，见“定期维护”。已准备 10 题 × 4 引擎方案；单次实时采集预估 $2.95 / 2,950 credits，需维护者批准后再运行，见 `docs/research/2026-11-08-geo-baseline-prep.md`。

## 3. 对标 recent.design：灵感内容产品

对标对象是 recent.design 公开呈现的内容产品（2026-11-08 按普通访客读首页：分类 Web、Interface、Branding、Motion、Illustration、Posters、Print；浏览入口 Launch Videos、Websites、OG Images、App Screenshots、App Icons；资源 Tools、Skills、Jobs；每条有 `/i/<id>-<slug>` 页和作者署名）。只对标形态和规模，不复制界面、文案和素材（RFC-008 §1）。现状：灵感库约 99 条，其中 60 条来自 recent.design 首页的 947 条；分类以 X 视频（practice 65）为主，landing 20、product 8、flow 4。数字以 `website/src/inspiration-data.ts` 为准，动手前先重数。

- [ ] 内容规模目标（维护者 2026-11-08 已定）：灵感库到 300 条，每周上线 40 条。起点以动手前重数的条数为准；按每周 40 条算，从现有约 99 条到 300 条约需 5 周，实际周期以重数结果为准。这是指标条目的基线。
- [ ] 把“收件箱到上线”写成固定流程并落到 `website/content/`：筛 `x-post-inbox.json` → 看过原视频 → 中英文笔记 → 同一作者不重复 → `x-media.mjs` 取视频 → 上线。每批在 `docs/research/` 记录条数、剔除原因和用时。
- [ ] 【维护者】决定要不要补齐分类：Interface、Branding、Illustration、Posters、Print。先看现有 99 条在这些类别下各有几条，缺口大的类别再定收录标准；决定“不做”也写明原因。
- [ ] 【维护者】决定要不要增加 Websites 浏览入口，以及 Instagram 那 54 条的展示方式（现在没有对应形态）。App 图标和 OG 图不做（维护者 2026-11-08 决定）。授权规则不变：只给链接、官方嵌入或作者授权的媒体。
- [ ] 决定 `/tools` 要不要做，再动手。`/skills` 只有我们 1 条，与“只收实际跑过的技能”的评测条目放在第 4 组；这里只定 Tools 页的收录范围和是否值得做。
- [ ] 回访机制：RSS 已完成（`feed.xml` 含灵感与案例，页头有自动发现；页面上还没有可见的订阅入口）。剩下两件：在页脚或灵感页加一个可见的订阅链接；【维护者】决定要不要做每周精选邮件或“本周新增页”（邮件涉及收集地址，先确认隐私说明）。
- [ ] 详情页分享卡片：2026-11-08 核对 97 个预渲染详情页，标题、描述、`canonical`、`hreflang`、`og:title/description/url` 都有，但全部缺 `og:image`，分享时只出文字卡。原因是仓库不存对方截图（授权规则）；要不要用站点预览图、作者授权媒体或我们自己画的分析卡做分享图，需要【维护者】定。作者署名还没在详情页的 HTML 里核对。
- [ ] 【维护者】定对标指标并建基线：收录条数、每周新增、详情页被搜索收录数（Search Console）、回访或订阅数。没有指标，“对标”无法验证；指标取不到的（如对方的流量）不编，写“无法获得”。

## 4. 内容：选对手还没答好的问题

- [ ] 【维护者】审阅 `/guides` 的英文（5 篇）。2026-11-04 代理已做事实和语言初审：修正 Git、旧快照和授权说明，改写的 3 篇英文标为 `draft`，生产模式的列表与直达页面也遵守该状态；2 篇未改的旧英文保留原状态。均不算人工审定，审完改成 `complete` 并写 `reviewedAt`。审阅包见 `docs/research/2026-11-04-content-review.md`。
- [ ] 【维护者】确认对比页草稿 `docs/drafts/compare-page.md`（Impeccable、Taste Skill、frontend-design，2026-11-04 已重新核对公开文档和源码许可证；不算实际运行），决定放在 `/compare` 还是 `/guides`，确认后由代理做成页面。涉及 Anthropic 的发布条款仍待确认。
- [ ] `/skills` 只有我们自己 1 条，和“只收实际跑过的技能”的承诺不相称。用 `evals/run.mjs` 在一次性项目里跑 Impeccable、Taste Skill、UI UX Pro Max，公开记录后收录。发布涉及 Anthropic 技能的对比前，先由【维护者】确认条款。

## 5. 产品

- [ ] 决定要不要做“在比较页上直接选某个区域”：Impeccable 的 Live Mode、Subframe 和 Claude Design 都让用户在页面上点选。先决定做还是明确不做，再动手。
- [ ] 完善账号体系：先定匿名使用与登录账号的边界，再规划注册/登录、个人资料、收藏与灵感同步、数据导出和删除；实现前明确认证服务、隐私说明和账号数据归属。
- [ ] 【维护者】决定要不要做公开的界面代码检查页。评估见 `docs/research/2026-11-02-antipattern-catalog-evaluation.md`：建议做成一页、先把规则改成共用数据，不仿 `/slop` 做视觉目录。

## 6. 网站维护

（当前没有等待代理执行的已实现网站维护 PR；定位、定价与发布措辞仍待维护者确认，见第 1 组。）

## X 设计样本收集箱

把链接贴在这里，每条写一句好在哪。代理先把它登记进 `website/src/inspiration-data.ts`（带 `post` 字段），再运行 `node website/scripts/x-media.mjs` 取视频并提交 `website/src/x-media.json`：带视频的进 Best practice 自动播放，其他用 X 官方嵌入。加完就从这里删掉。

Ego Lite 每周一 09:00（Asia/Shanghai）搜索最近 7 天、互动数至少 100 的设计视频，把链接和互动数据放进 `website/content/x-post-inbox.json`。收件箱只供人工筛选；看过原帖并补齐中英文研究笔记后，才能加入公开灵感页。手动运行：`website/scripts/run-x-discovery.sh`。

<!-- 格式：- https://x.com/<handle>/status/<id> — 好在哪（可选：分类） -->

- recent.design 首页的 947 条作品（维护者本地的 `Recent-Design首页作品链接.csv`，2026-06-11 至 10-31）：2026-11-02 已分两批精选 60 条带视频的 X 帖子加入，条目带 `via` 指回 recent.design。其余按第 3 组的固定流程分批挑选：看过视频再写笔记，同一作者不重复；Instagram 的 54 条现在没有对应的展示方式，先不加。

## 定期维护

- 每两周按 GEO 策略里的 10 个问题测一次 AI 搜索是否提到并引用本站，结果记在 `docs/research/`。
- 每季度重看一次竞品对比，更新 `docs/research/` 里的记录（star 数、定价和功能变化很快）。
- X 视频只剩封面、不再播放时，运行 `node website/scripts/x-media.mjs` 刷新 `website/src/x-media.json`。
