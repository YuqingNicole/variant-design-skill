# 「SaaS 首页」专题研究笔记逐条复核 — 2026-10-29

接 `2026-10-29-reference-topic-batch1.md`。那次只确认链接返回 HTTP 200；这次在浏览器里打开每个页面，对照条目的「研究什么 / 用在哪里」。

## 方法

- Playwright 驱动本机 Chrome，1440 × 900，`en-US`，加载后等待 4 秒；保存首屏截图，并提取标题、`h1`、前 12 个 `h2` 和首屏内的链接与按钮文字。
- 截图只留在本机，不进仓库，也不在网站托管（仍是仅链接模式）。
- 只看桌面首屏和标题结构，没有逐屏阅读全文；手机端仍未实测，条目的 `mobile` 保持 `not-tested`。

## 结果

| 条目 | 观察（首屏与标题结构） | 结论 |
|---|---|---|
| Linear | 主张 → 首屏内的产品界面（Inbox、My issues）→ Intake、Planning、AI、Build/review/ship 分段 | 与笔记一致 |
| Notion | 一句主张和两个按钮，下方是产品界面，之后按 AI、记录系统、问答、代理分段 | 与笔记一致 |
| Raycast | 「Your shortcut to everything」与下载入口在前，「There's an extension for that」在后 | 与笔记一致 |
| Cursor | 主张后直接展示代理完成「Build Landing Page」的具体任务 | 与笔记一致 |
| v0 | 首屏是输入框「What do you want to create?」，下方有示例起点和模板 | 与笔记一致 |
| Framer | 主张改为「website builder with a world-class design agent」，首屏是代理对话框，后续讲可编辑画布与发布 | 原笔记「设计、修改与发布」已过时，改为「设计代理 → 可编辑画布 → 发布上线」 |
| Obsidian | 主张后展示文件树、笔记和关系图 | 与笔记一致 |
| Plausible | 主张和两个按钮，下方仪表盘把核心指标放在第一行 | 与笔记一致 |
| Lovable | 自动化浏览器同样收到 Cloudflare 验证页（403） | 无法核对，仍不纳入专题，需要人工打开 |

上述 8 条的 `checkedAt` 改为 2026-10-29；其余 16 条仍为 2026-10-07。Linear 的截图因等待字体超时未保存，判断依据是页面文字结构。

## 局限

结论是一个人对首屏和标题结构的判断，没有第二人复核；页面随时会改版。这次复核不改变权限状态，也不代表用户能用这些参考完成任务，用户任务观察仍未进行。
