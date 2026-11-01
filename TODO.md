# TODO

维护者和编码代理共用的待办清单。做完的条目直接删掉，记录留在 PR 和 git 历史里。较大的工作仍然开 GitHub Issue。

## 待办

- [ ] 灵感页的中英文切换（RFC-005 第一阶段，从 `/inspiration` 开始）。
- [ ] 改写两句口号：定价页「审美免费。连续性值得付费。」，/about 标题「你的品牌，可以如此不同。」。
- [ ] /about 页示意图里的英文小标签改成双语。

## X 设计样本收集箱

把链接贴在这里，每条写一句好在哪。代理会把它加到灵感页：带视频的进 Best practice 自动播放，其他用 X 官方嵌入。加完就从这里删掉。

<!-- 格式：- https://x.com/<handle>/status/<id> — 好在哪（可选：分类） -->

## 定期维护

- X 视频只剩封面、不再播放时，运行 `node website/scripts/x-media.mjs` 刷新 `website/src/x-media.json`。
