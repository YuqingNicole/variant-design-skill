# TODO

维护者和编码代理共用的待办清单。做完的条目直接删掉，记录留在 PR 和 git 历史里。较大的工作仍然开 GitHub Issue。

排序依据：`docs/research/2026-11-02-competitor-comparison.md`（竞品对比）和 `docs/research/2026-11-02-geo-strategy.md`（GEO 策略）。标【维护者】的需要账号、付费、公开发布或措辞确认，代理只能起草。

## 1. 先修：诚实和定位

- [ ] 【维护者】改掉 README、`README_CN.md` 和 GitHub 描述里的“受 Variant（variant.com）设计社区启发”，避免读者以为和这个商业产品有关联。同时把 GitHub 主页地址改成官网、补 topics。建议的描述：Open-source agent skill for Codex and Claude Code that turns one design brief into three comparable directions (A/B/C) inside your own project.
- [ ] 【维护者】价格页在卖“托管生成额度”，`llms.txt` 却写着没有托管服务。二选一：把付费档标成“计划中”，或者先拿掉。
- [ ] 核对 Impeccable（Apache-2.0）的署名义务：README 写着“powered by the Impeccable design system”，确认有没有复制它的文字、是否需要 NOTICE；把 README 开头改成和 `llms.txt` 一致的定位句。
- [ ] 不再说“一次出三版”是独有的（Impeccable 默认也出 3 个变体）。对外说法改成“同一任务的三个完整方向和取舍”和“可撤回、不覆盖未看过的改动”。逐个检查官网、README 和 `llms.txt` 的措辞。

## 2. 分发：先让人找得到

- [ ] 【维护者】自有域名：买好后在 Vercel 绑定，代理负责改 `SITE_URL`、`library-data.ts` 里写死的地址，并把旧地址 301 过去。越晚做，已被收录的旧地址越多。
- [ ] 【维护者】Search Console：用新域名验证并提交 sitemap，检查 `/en/...` 的索引和 `hreflang` 报告（不以 HTTP 200 为准）。
- [ ] 【维护者】投稿到 claudemarketplaces.com（免费，可以投技能仓库或插件市场仓库）、Codex 插件合集和 skills.sh 一类目录。
- [ ] 【维护者】第一次做 AI 搜索基线测量（GEO 策略里的 10 个问题），之后每两周一次，见“定期维护”。

## 3. 内容：选对手还没答好的问题

- [ ] 【维护者】审阅 `/guides` 的英文（5 篇）。目前由代理撰写，已经发布在 `/en/guides/...`。
- [ ] 对比页：Variant Design 和 Impeccable、Taste Skill、frontend-design 的区别（完整方向和撤回，对比元素级变体）。只用公开事实，不用对方的品牌素材；代理起草，【维护者】确认后发布。
- [ ] `/skills` 只有我们自己 1 条，和“只收实际跑过的技能”的承诺不相称。用 `evals/run.mjs` 在一次性项目里跑 Impeccable、Taste Skill、UI UX Pro Max，公开记录后收录。发布涉及 Anthropic 技能的对比前，先由【维护者】确认条款。
- [ ] 案例页加一个总览：每个 A/B/C 案例一张三联图。

## 4. 产品

- [ ] 决定要不要做“在比较页上直接选某个区域”：Impeccable 的 Live Mode、Subframe 和 Claude Design 都让用户在页面上点选。先决定做还是明确不做，再动手。
- [ ] 给 `Refine premium` 和形容词翻译加 eval fixture：让真实 Agent 把一个页面“做得更高级”，评分检查 `style-budget.mjs` 计数下降、没有改成深色加金色（`docs/research/2026-11-02-premium-style-budget.md`）。
- [ ] 评估把 `quality-gate.mjs` 的规则整理成公开的反模式目录（参考 Impeccable 的 `/slop` 这种做法，不复制它的文字）。

## 5. 网站维护

- [ ] 实现 RFC-005 §3.5 的逐条翻译状态（`draft` 不进线上构建）。
- [ ] 改写两句口号：定价页「审美免费。连续性值得付费。」，/about 标题「你的品牌，可以如此不同。」。
- [ ] /about 页示意图里的英文小标签改成双语。
- [ ] 用 `scripts/style-budget.mjs` 量其他页面：`/docs`（11 个字号）、`/inspiration`（9 个）、`/sponsor`（9 个），按首页的做法收敛。

## X 设计样本收集箱

把链接贴在这里，每条写一句好在哪。代理先把它登记进 `website/src/inspiration-data.ts`（带 `post` 字段），再运行 `node website/scripts/x-media.mjs` 取视频并提交 `website/src/x-media.json`：带视频的进 Best practice 自动播放，其他用 X 官方嵌入。加完就从这里删掉。

<!-- 格式：- https://x.com/<handle>/status/<id> — 好在哪（可选：分类） -->

- recent.design 首页的 947 条作品（维护者本地的 `Recent-Design首页作品链接.csv`，2026-06-11 至 10-31）：2026-11-02 已分两批精选 60 条带视频的 X 帖子加入，条目带 `via` 指回 recent.design。其余按同样做法分批挑选：看过视频再写笔记，同一作者不重复；Instagram 的 54 条现在没有对应的展示方式，先不加。

## 定期维护

- 每两周按 GEO 策略里的 10 个问题测一次 AI 搜索是否提到并引用本站，结果记在 `docs/research/`。
- 每季度重看一次竞品对比，更新 `docs/research/` 里的记录（star 数、定价和功能变化很快）。
- X 视频只剩封面、不再播放时，运行 `node website/scripts/x-media.mjs` 刷新 `website/src/x-media.json`。
