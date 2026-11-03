# 2026-11-03 · 选定后提炼设计系统：试跑

改动：`pick B` 之后，从 B 提炼完整的设计系统，生成预览后停下，等用户 `ds confirm`（`skills/variant-design-system/ROUTE.md` Step 1b）。品牌已锁定的项目只补品牌没规定的部分，用 `var(--…)` 引用品牌变量，确认后记入 `designSystem.extensions`。定位依据见 RFC-006 §1、§4。

## 方法

取本日 Codex 评测已生成 A/B/C 的项目（harbor：没有品牌约束；ledger：`app/globals.css` 品牌锁定），换装当前分支的技能，再用同样的隔离参数执行 `codex exec`，提示词为 `pick B（这是无人值守运行：用 react-preview.mjs --static 生成可直接打开的预览，不要启动常驻服务器；需要我确认的地方停下来汇报。）`。Codex CLI 0.166.0-alpha.5.1。两个项目原来都推荐 A，所以 `pick B` 也检验“用户的选择优先于推荐”。

## 结果

| 项目 | `selectedVariant` | `designSystem` | 产物 | 停在确认点 |
|---|---|---|---|---|
| harbor | B | 未改（仍为空） | `design-system.css`（142 行）、`design-system-preview.html` | 是，回复 `ds confirm` 或 `ds edit` |
| ledger（第一次） | B | 未改（仍指向 `app/globals.css`） | `design-system.css`（37 行，扩展）、`design-system-preview.html` | 是 |

- harbor：文件开头列出了归整清单，例如 9/10/11px 的辅助文字统一为 12px，零散间距统一到 4px 步长，34/38px 头像统一为 40px。正文色 `#76604c` 在浅色底上对比度只有 4.47:1，改成 `#745e4a`。B 原来没有阴影和动效，系统补上了，并注明是新增的。
- ledger 第一次：没有重新定义任何品牌变量（逐个检查了 `app/globals.css` 里的变量名）。但扩展部分只是盘点：B 用到的每个值都成了 token（例如 13 个间距 token，其中有 `--space-select:14px`），文件里写着“Normalizations: none”。于是在 Step 1b 的品牌锁定段补了一句：这些层要成体系，不是清单，要像第 2 步一样归整到刻度上，并列出归整了哪些值。

## 重跑 ledger（规则收紧后）

第一次重跑没给 stdin，`codex exec` 一直在等输入，跑了 15 分钟以上；这次的结果作废。加上 `< /dev/null` 后重跑：

- `selectedVariant` 为 B，`designSystem` 仍指向 `app/globals.css`，停在确认点，没有替用户确认。
- 扩展文件 52 行，开头列出归整清单，例如 `9/10/11px gaps → 12px`、`15/17/18px spacing → 16px`、`22/25/26/28/30px spacing → 24/32px`，字号也归整到刻度上。间距 token 从 13 个减到 11 个，而且落在 4px 步长上。
- 没有重新定义任何品牌变量（逐个检查）。
- 不足：品牌里没有红色，所以错误和警告色都映射到正文色 `--color-ink`，只靠文字和图标区分（文件里写明了“never color alone”）。这是品牌本身的限制，技能没有擅自加颜色；要不要补语义色，应该由用户决定。下一步可以在报告里明确提出这个问题。
- ledger 是 Next 项目，`react-preview.mjs --static` 因缺少 Vite、npm 访问网络失败而没成功，agent 改用 Next 静态导出生成了预览。

## 未覆盖

- 只用了 Codex，Claude Code 和 dsh 没跑这一步。
- 没有测 `ds confirm` 之后的 `apply ds B`，也没有测确认后新页面是否真的只用系统 token（RFC-006 §4.3 的 `ds-check.mjs` 还没写）。
- 设计系统的好坏要人看预览；这里只检查了流程承诺、对比度修正和品牌变量没被覆盖。
