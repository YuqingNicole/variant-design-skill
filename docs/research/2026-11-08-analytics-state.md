# 统计现状核实（2026-11-08）

对应 TODO 第 7 组的 B1。目的：弄清楚本站现在有没有在收集访问数据，再决定下一步。

## 核实方法

对线上站点发了几个只读的 GET 请求（`curl`），没有登录 Vercel，也没有改任何设置。

| 请求 | 结果 | 含义 |
|---|---|---|
| `/_vercel/insights/script.js`（Web Analytics） | 404 `NOT_FOUND` | 这个项目**没有开启** Web Analytics |
| `/_vercel/speed-insights/script.js`（Speed Insights） | 200，返回约 12.5KB 的 JS | 这个脚本地址存在。我推断是项目里打开了 Speed Insights 开关，**没有在仪表盘里确认** |
| 首页 HTML 里是否引用任一脚本 | 没有 | 即使开关打开了，页面也没有加载脚本，所以没有任何数据在收集 |
| 仓库里是否有统计代码 | 没有 | 在 `website/package.json`、`index.html`、`src` 里搜过 |

## 结论

- 现在没有任何访问数据。GEO 策略第 3 节写的"用 Vercel Analytics 看来自 chatgpt.com、perplexity.ai、claude.ai 的访问"目前做不到。
- 赞助页写"访问量和来源还在积累"，实际上连积累都没有开始。
- 不是写几行代码就能解决：Web Analytics 要先在 Vercel 仪表盘里开启，脚本地址才会有内容；开启前加脚本只会产生 404。

## 还没核实的（需要维护者看仪表盘或 Vercel 文档）

1. 仪表盘里 Web Analytics 和 Speed Insights 各自的开关状态，以及项目所在套餐。
2. 自定义事件（B4 要用）是否属于当前套餐。
3. Vercel 文档对 cookie、个人数据、已知机器人过滤的说明。B5 的隐私说明要以文档为准，不凭记忆写。
4. 来源和 UTM 报告在当前套餐里能看到多细。

## 下一步

- 【维护者】在仪表盘里决定用 Web Analytics 还是别的工具，并核对上面 4 项。
- 工具定了以后，代理加脚本、写事件并配测试（B1、B4），再回头校正 `docs/drafts/measurement-method.md`。
