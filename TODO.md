# TODO

维护者和编码代理共用的待办清单。做完的条目直接删掉，记录留在 PR 和 git 历史里。较大的工作仍然开 GitHub Issue。

## 待办

- [ ] RFC-005 第一阶段（文案改成按语言取值）的其余页面：灵感页、首页、作品页、分类页和 `/docs` 已完成，`node website/scripts/i18n-inventory.mjs` 列出剩下的文件，按计数从多到少做。英文已定为第一个可收录语言，下一步是 P2 和 P3。
- [ ] 改写两句口号：定价页「审美免费。连续性值得付费。」，/about 标题「你的品牌，可以如此不同。」。
- [ ] /about 页示意图里的英文小标签改成双语。
- [ ] GEO 第一层剩余两项（策略见 `docs/research/2026-11-02-geo-strategy.md`）：首页、`/docs`、`/inspiration` 的英文预渲染和 hreflang；GitHub 仓库的主页地址、描述和 topics（措辞先给维护者确认）。
- [ ] GEO 第二、三层：继续按真实提问写回答页（已有 3 篇，见 `website/src/guides-content.ts`）、公开实测页、投稿到 skill 资源合集和社区。回答页的英文要等 RFC-005 P3 才能被收录。

## X 设计样本收集箱

把链接贴在这里，每条写一句好在哪。代理先把它登记进 `website/src/inspiration-data.ts`（带 `post` 字段），再运行 `node website/scripts/x-media.mjs` 取视频并提交 `website/src/x-media.json`：带视频的进 Best practice 自动播放，其他用 X 官方嵌入。加完就从这里删掉。

<!-- 格式：- https://x.com/<handle>/status/<id> — 好在哪（可选：分类） -->

- recent.design 首页的 947 条作品（维护者本地的 `Recent-Design首页作品链接.csv`，2026-06-11 至 10-31）：2026-11-02 已分两批精选 60 条带视频的 X 帖子加入，条目带 `via` 指回 recent.design。其余按同样做法分批挑选：看过视频再写笔记，同一作者不重复；Instagram 的 54 条现在没有对应的展示方式，先不加。

## 定期维护

- 每两周按 GEO 策略里的 10 个问题测一次 AI 搜索是否提到并引用本站，结果记在 `docs/research/`。
- X 视频只剩封面、不再播放时，运行 `node website/scripts/x-media.mjs` 刷新 `website/src/x-media.json`。
