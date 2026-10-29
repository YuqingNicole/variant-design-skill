# 首页去 AI 痕迹 — 2026-10-29

维护者看过 #84 上线的导航站首页后，认为"有点 AI slop"，并提到 Impeccable 插件（`pbakaus/impeccable`）。插件需要维护者自己在 Claude Code 里用 `/plugin marketplace add` 安装，这次没有安装。改为读取它的公开仓库（Apache-2.0，提交 `5e745ac`），以 `skill/reference/craft-floor.md` 的检查项作为依据，并用 `npx impeccable@4.8.0 detect --json <URL>` 扫描本地构建的首页。

## 检测结果

| | 发现数 | 分类 |
|---|---|---|
| 修改前（master `61c58ec`） | 31 | low-contrast 12、undersized-ui-text 13、hero-eyebrow-chip 1、tiny-text 2、wide-tracking 2、overused-font 1 |
| 修改后 | 3 | low-contrast 2（页眉与页脚 logo 字标的浅色部分）、overused-font 1 |

检测器只覆盖可以机械判断的规则。下面按 craft-floor 手工处理的几项，检测器不一定能发现。

## 改了什么

- 删除首页所有标题上方的小号大写标签（eyebrow）：首屏、精选技能、A/B/C 演示、案例流。
- 删除"从你要做的事开始"中的 01–04 编号，把四张相同的卡片改为两栏列表。
- 展示卡去掉黄色标注条与连线、卡内标签和阴影（之前同时有边框和阴影，即"幽灵卡片"）。事实改成一行正文：发布方、仅链接、核对日期、设计者未知等。切换按钮去掉斜杠前缀和等宽字体。
- 计数从等宽字的数字行改为正文中的一句话。
- 首页链接和按钮去掉 → ↗ ↓ 字符。参考笔记里表示顺序的箭头属于内容，保留。
- 标题字距从 -0.045em 收到 -0.03em。小于 13px 的说明文字放大，浅灰改为站点的 `--site-muted`。
- 内容页的文字选中、光标、原生控件和键盘焦点改用站点绿色（`site-system.css`）。
- 回归测试：首页没有 `.content-kicker`；首页的链接和按钮文字不含箭头字符。

## 没有处理

- **字体。**检测器报告首页约 92% 的文字使用 Arial（站点正文与导航的字体栈是 `Arial, "PingFang SC"`）。craft-floor 要求自托管一款与品牌相符的字体，这会影响整个网站，需要维护者先选定字体。
- **Logo 字标对比度。**"variant design" 中浅色的 "design" 是字标的一部分；WCAG 对 logo 文字不作对比度要求，保留。
- **其他页面。**`/inspiration`、`/skills`、案例详情页仍有 eyebrow 和箭头，没有在这次处理。
