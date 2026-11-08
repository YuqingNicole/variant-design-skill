# 统计口径草稿

2026-11-08，代理起草。对应 TODO 第 7 组的 B2、B3、B5、B6。这是**初稿**：来源分组要用第一个月的真实来源校正，所有数字在工具定下来之前都是"尚无数据"。

## 1. 来源分组（B2）

按 `Referer` 的主机名分组。分不清的归"其他"，不猜。

| 分组 | 主机名 |
|---|---|
| AI 助手 | `chatgpt.com`、`chat.openai.com`、`perplexity.ai`、`claude.ai`、`gemini.google.com`、`copilot.microsoft.com` |
| 搜索 | `google.*`、`bing.com`、`duckduckgo.com`、`baidu.com` |
| 社交 | `x.com`、`t.co`、`twitter.com` |
| 直接 | 没有 `Referer` |
| 其他 | 以上都不是 |

这张表是起点：AI 助手常常不带 `Referer`，会落进"直接"，所以"AI 引荐占比"只能说"至少"。第一个月用真实数据看一遍，再决定要不要加主机名。

## 2. UTM 写法（B2）

我们自己放出去的链接都带参数，方便区分。

`?utm_source=<来源名>&utm_medium=<类型>&utm_campaign=<短名>`

| utm_medium | 用在哪里 |
|---|---|
| `social` | 我们自己在 X 等平台发的链接 |
| `outreach` | 收录后通知作者的链接（TODO A7，只通知，不要求外链） |
| `newsletter` | 以后的每周精选邮件 |
| `rss` | RSS 订阅里的链接 |

外部网站给我们的链接不加参数，由 `Referer` 区分。

## 3. 真人和爬虫（B3）

- 对外报价和媒体包里的数字，只用"工具已排除已知机器人"的数据。
- AI 抓取（我们希望被抓取的流量）单独看，不并进访问量。来源是服务器日志，不是统计工具，具体怎么取要等确认 Vercel 能提供什么。
- 对外的口径句（待工具确定后改写）：**"访问量只统计真人浏览器的页面访问，不含已知的搜索和 AI 爬虫。"**
- 目前不知道工具对机器人的排除有多全。在核实之前，对外只说"已知机器人"，不说"不含机器人"。

## 4. 对外可以给广告主的数字（B6）

每一项都要写明日期、来源和计算方法。现在都**没有数据**。

| 数字 | 定义 | 来源 | 现状 |
|---|---|---|---|
| 月页面浏览数 | 真人页面访问次数 | 统计工具 | 尚无 |
| 月独立访客 | 以工具的定义为准，不自己定义 | 统计工具 | 尚无 |
| AI 引荐至少占比 | 来源为"AI 助手"的访问 ÷ 全部访问 | 统计工具 | 尚无 |
| 详情页到"访问原站"的点击率 | "访问原站"点击 ÷ 详情打开 | B4 的事件 | 尚无 |
| 收录条数和每周新增 | 站内数据 | `inspiration-data.ts` | 97 条，目标每周 40 条（2026-11-08） |

没有数据的项在媒体包里不写，也不用估计值代替。

## 5. 站点现在存了什么、请求了什么（B5 的事实部分）

只列从代码里核对过的。**不含 Vercel 平台自己可能设置的内容**，这部分要看 Vercel 文档（见 `docs/research/2026-11-08-analytics-state.md`）。

| 项目 | 内容 |
|---|---|
| Cookie | 站点代码里没有设置 cookie |
| `localStorage` | `variant-inspiration-pack-v1`（用户的参考包和笔记，只在浏览器里）、`variant-heading-font`（标题字体选择）、`variant-language`、`variant-canvas-language`、`variant-canvas-project`、`variant-workspace-v2`（后三项属于 `/lab`） |
| `sessionStorage` / `indexedDB` | `/lab` 画布使用 |
| 第三方请求 | X 的视频和图片（`video.twimg.com`、`pbs.twimg.com`）和嵌入脚本（`platform.twitter.com`），X 可能记录这次访问；预览图经 Vercel 图片服务（`/_vercel/image`）从来源站取；字体是站内自带 |
| 已有的说明 | 灵感页的"披露"一栏已经写了 X 记录访问和预览图来源 |

隐私页要覆盖的话：以上每一项一句话，再加统计工具这一项。措辞由维护者核对。
