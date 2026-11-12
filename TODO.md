# TODO

维护者和编码代理共用的待办清单。做完的条目直接删掉，记录留在 PR 和 git 历史里。较大的工作仍然开 GitHub Issue。

排序依据：`docs/research/2026-11-02-competitor-comparison.md`（竞品对比）和 `docs/research/2026-11-02-geo-strategy.md`（GEO 策略）。标【维护者】的需要账号、付费、公开发布或措辞确认，代理只能起草。

## 1. 先修：诚实和定位

（本组已完成，决策记录见 `docs/drafts/positioning-and-availability.md`。）

## 2. 分发：先让人找得到

（2026-11-09 起使用自有域名 `https://variantdesign.xyz/`；原 `variant-design-skill.vercel.app` 仍可访问。）

- [ ] 【维护者】Search Console：为 `https://variantdesign.xyz/` 前缀完成站点验证并提交 sitemap，检查 `/en/...` 的索引和 `hreflang` 报告（不以 HTTP 200 为准）。静态核对已完成；Search Console 属性还未建立，原因与证据见 `docs/research/2026-11-07-search-console-readiness.md`。
- [ ] 【维护者】投稿到 claudemarketplaces.com 与 Codex 插件目录。skills.sh 已自动收录，不需要投稿；其余渠道的准备状态、文案与发布门槛见[投稿材料](docs/drafts/distribution-submissions.md)。
- [ ] 【维护者】第一次做 AI 搜索基线测量（GEO 策略里的 10 个问题），之后每两周一次，见“定期维护”。已准备 10 题 × 4 引擎方案；单次实时采集预估 $2.95 / 2,950 credits，需维护者批准后再运行，见 `docs/research/2026-11-08-geo-baseline-prep.md`。

## 3. 对标 recent.design：灵感内容产品

对标对象是 recent.design 公开呈现的内容产品（2026-11-08 按普通访客读首页：分类 Web、Interface、Branding、Motion、Illustration、Posters、Print；浏览入口 Launch Videos、Websites、OG Images、App Screenshots、App Icons；资源 Tools、Skills、Jobs；每条有 `/i/<id>-<slug>` 页和作者署名）。只对标形态和规模，不复制界面、文案和素材（RFC-008 §1）。现状：灵感库约 99 条，其中 60 条来自 recent.design 首页的 947 条；分类以 X 视频（practice 65）为主，landing 20、product 8、flow 4。数字以 `website/src/inspiration-data.ts` 为准，动手前先重数。

- [ ] 内容规模目标（维护者 2026-11-08 已定）：灵感库到 300 条，每周上线 40 条。2026-11-12 第四批加了 40 条（11 条 X、29 个网站），现在 169 条；按每周 40 条算还需约 4 周，实际以动手前重数为准。这是指标条目的基线。
- [ ] “收件箱到上线”的流程已跑过一轮（记录见 `docs/research/2026-11-12-reference-batch.md`）：筛 `x-post-inbox.json` → 看帧或原视频 → 中英文笔记 → 同一作者不重复 → `x-media.mjs` 取视频 → 上线；每条候选处理完把 `status` 改成 `published`（带 `entry`）或 `rejected`（带 `reason`）并写 `reviewedAt`，收件箱里不留 `pending`。还差：每周发现只有一组关键词，补插画、海报、品牌时要另搜；这次的加搜脚本是临时的，常态化要给 `x-discovery.mjs` 加可配置查询。
- [ ] 分类页已完成：网站 79、产品界面 12、交互 36、动效 29、品牌 13（2026-11-12 重数；互不重叠，各有 `/browse/<分类>`）。插画、海报、印刷还没有内容，所以没有 tab；收录第一条带 `Illustration`、`Poster`、`Print` 标签的参考后会自动出现。2026-11-12 按这三类关键词搜 X，返回的几乎都是教程录屏和 AI 工具清单，没有可收的作品帖；下次换数据源（设计师账号名单），或者接受这三类暂时没有 tab。还要决定要不要给投稿表单加分类选项（见 RFC-008 §8）。
- [ ] 【维护者】决定要不要增加 Websites 浏览入口，以及 Instagram 那 54 条的展示方式（现在没有对应形态）。App 图标和 OG 图不做（维护者 2026-11-08 决定）。授权规则不变：只给链接、官方嵌入或作者授权的媒体。
- [ ] 决定 `/tools` 要不要做，再动手。`/skills` 只有我们 1 条，与“只收实际跑过的技能”的评测条目放在第 4 组；这里只定 Tools 页的收录范围和是否值得做。
- [ ] 回访机制：RSS 已完成（`feed.xml` 含灵感与案例，页头有自动发现，页脚有可见的“订阅 RSS”链接）。剩下一件：【维护者】决定要不要做每周精选邮件或“本周新增页”（邮件涉及收集地址，先确认隐私说明）。
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

（定位、定价与发布措辞仍待维护者确认，见第 1 组。）

- [ ] 网站缩略图依赖 Vercel 图片优化器，而 `images.remotePatterns` 最多 50 个域名，2026-11-12 已满：之后新收的网站只能回退加载原图（`link-preview.mjs` 按引用次数排进名单，进不了的走原图）。300 条前要定方案：按域名合并、换不经优化器的缩略方式，或自己存缩略图（涉及授权）。
- [ ] 首页脚本随灵感库线性增长：参考数据整体打进首页的脚本（2026-11-12 为 169 条、45 KB gzip，约每 5 条多 1 KB），`tests/landing.spec.mjs` 的首页脚本上限已从 145 KB 提到 160 KB。到 300 条前要把参考数据拆开：首屏只带第一页，其余按分类或滚动再取；拆完把上限降回去。

## 7. 变现：先把度量做出来

目标是让广告主付费买本站的赞助位。现状是仓库里没有任何统计代码，赞助页自己写着"不写数字"和"网站目前还没有赞助位"，所以先做度量，之后才有版位和报价。完整拆解（45 个小闭环、关键路径、需要维护者定的 6 件事）见 [`docs/drafts/ads-revenue-loops.md`](docs/drafts/ads-revenue-loops.md)。本组是其中的阶段 B，按顺序做，后一条依赖前一条。版位、成交和交付三个阶段不在这里，等度量有了数字再排。

- [ ] 【维护者】访问量（B1）：2026-11-08 已核实，现在**没有任何数据在收集**（Web Analytics 没开，页面也没加载任何统计脚本，证据见 `docs/research/2026-11-08-analytics-state.md`）。到仪表盘决定用 Web Analytics 还是别的不用 cookie 的工具，并核对那份记录里列的 4 项；定了以后代理加脚本。做完后每周有一份访问量、独立访客和来源的记录，存到 `docs/research/`。
- [ ] 来源归因（B2）：区分 AI 引荐（chatgpt.com、perplexity.ai、claude.ai 等）、搜索、X 和直接访问，约定外链的 UTM 写法（初稿见 `docs/drafts/measurement-method.md` 第 1、2 节，要用第一个月的真实来源校正）。完成后能回答"流量从哪来"，并和"定期维护"里的 AI 搜索测量对得上。依赖 B1。
- [ ] 真人与爬虫分开（B3）：已知爬虫和 AI 抓取不计入对外报价的数字，口径写明（初稿见同一文件第 3 节）。AI 抓取是我们想要的，但广告主买的是真人访问。依赖 B1。
- [ ] 行为事件（B4）：给卡片点击、详情打开、"访问原站"点击、保存、生成参考指令、安装命令复制定名字和触发条件，每个事件有 Playwright 测试。这些是以后赞助位点击率的基线。依赖 B1，且不得破坏赞助页"不给读者数据"的承诺。
- [ ] 【维护者】隐私一致（B5）：统计工具不识别个人，补一页隐私说明，措辞要能被赞助页的承诺覆盖。站点现在存了什么、请求了什么，已从代码核对并列在 `docs/drafts/measurement-method.md` 第 5 节；统计工具那一项等 B1。法律措辞由维护者核对，代理只起草。依赖 B1。
- [ ] 统计口径页（B6）：把"访问量怎么数"写成一页，每个数字写明日期和来源，赞助页再链过去。赞助页现在说"洽谈时提供统计口径"，这一页让它有东西可给。数字清单和定义见 `docs/drafts/measurement-method.md` 第 4 节，现在每一项都是"尚无数据"。依赖 B1–B3。

## X 设计样本收集箱

把链接贴在这里，每条写一句好在哪。代理先把它登记进 `website/src/inspiration-data.ts`（带 `post` 字段），再运行 `node website/scripts/x-media.mjs` 取视频并提交 `website/src/x-media.json`：带视频的按标签进对应分类页并自动播放（标签对应分类见 RFC-008 §8），其他用 X 官方嵌入。加完就从这里删掉。

Ego Lite 每周一 09:00（Asia/Shanghai）搜索最近 7 天、互动数至少 100 的设计视频，把链接和互动数据放进 `website/content/x-post-inbox.json`。收件箱只供人工筛选；看过原帖并补齐中英文研究笔记后，才能加入公开灵感页。每条处理完要在收件箱里写明 `published`（带 `entry`）或 `rejected`（带 `reason`）和 `reviewedAt`。手动运行：`website/scripts/run-x-discovery.sh`（用 `PATH` 里的 `ego-browser`，或设 `EGO_BROWSER` 指向它）。

<!-- 格式：- https://x.com/<handle>/status/<id> — 好在哪（可选：分类） -->

- recent.design 首页的 947 条作品（维护者本地的 `Recent-Design首页作品链接.csv`，2026-06-11 至 10-31）：2026-11-02 已分两批精选 60 条带视频的 X 帖子加入；2026-11-11 又加入 20 条 X 帖子和 10 个网站（记录见 `docs/research/2026-11-11-reference-batch.md`），条目带 `via` 指回 recent.design。2026-11-12 的第四批没有用这个来源（收件箱 + 关键词加搜 + 手选网站，见 `docs/research/2026-11-12-reference-batch.md`）。其余按第 3 组的固定流程分批挑选：看过视频再写笔记，同一作者不重复；Instagram 的 54 条现在没有对应的展示方式，先不加。

## 定期维护

- 每两周按 GEO 策略里的 10 个问题测一次 AI 搜索是否提到并引用本站，结果记在 `docs/research/`。
- 每季度重看一次竞品对比，更新 `docs/research/` 里的记录（star 数、定价和功能变化很快）。
- X 视频只剩封面、不再播放时，运行 `node website/scripts/x-media.mjs` 刷新 `website/src/x-media.json`。
