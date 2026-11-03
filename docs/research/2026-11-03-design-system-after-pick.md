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

## token 一致性检查（同日补充）

`delivery-check` 新增两项：品牌锁定时读取 `designSystem.extensions`（扩展重定义品牌变量算错误）；系统确认后，间距、字号、圆角不在刻度上的值（CSS 和 JSX 样式对象都查，`clamp()`、`calc()`、`var()` 跳过）记为警告，并给出最接近的 token。

在真实产出上试：用 Codex 重新生成 harbor（6/6 通过，推荐 A，28.3 万 token，219 s），再 `pick B`，然后在副本里手动把系统标成已确认（`source: "B"`）后运行检查：

- 第一版把 A、C 也拿来对照 B 的系统：A 有 7 个颜色和 19 个长度不在系统里，C 有 8 个颜色，全是噪音，因为 A、C 是系统出现之前的探索。改为：系统记录了 `source` 时只检查那个方向。
- 改后只剩一条有用的警告：B 有 19 个长度不在刻度上（例如 `13px (nearest --text-xs 12px)`），提示 `apply ds B` 会换成 token。B 的颜色没有警告，因为系统保留了 B 的原色。
- 网站自己的 `website/variant-output/`（已确认的 `src/design-system.css`，18 个刻度 token）新旧检查都是 0 条警告：那三个方向用的是网站的 class，没有内联长度。
- 这次 `pick B` 写入了 `designSystem: {confirmed: false}`，而 Step 1b 要求不改 `designSystem`。不会造成锁定（检查只认 `confirmed: true`），但和说明不符；Step 1b 补了“不要写草稿条目”。

## DTCG 导出（同日补充）

`scripts/ds-export.mjs` 把设计系统的 CSS 变量导出为 DTCG 2025.10 JSON。格式按官方 2025.10 报告核对：颜色是 `{colorSpace, components, alpha?, hex?}`（sRGB 分量 0–1，OKLCH 的 L 为 0–1、H 为 0–360），尺寸是 `{value, unit}` 且只允许 px、rem，时长是 ms、s，阴影可以带 `inset`，引用写成 `{group.token}`，文件扩展名用 `.tokens.json`。

真实输入：

| 来源 | 导出 | 未导出 |
|---|---|---|
| Codex 为 harbor 从 B 提炼的系统 | 114 个：颜色 44、尺寸 38、数字 12、阴影 5、时长 5、字重 4、字体 3、缓动 3 | 7 个：1 个 `clamp()` 字号、4 个 `em` 字距、`--shadow-none: none`、1 个 transition 简写 |
| 网站自己的 `website/src/design-system.css` | 38 个，`font-display` 正确导出为对 `font-serif` 的引用 | 7 个：3 个 `clamp()`、2 个 `em` 字距、2 个 border 简写 |

逐组看过，没有分错类型的 token。没有把导出文件导入 Figma 验证；Figma 只支持 DTCG 的部分类型（研究记录 `2026-11-03-design-product-architectures.md`），这一步还要人在 Figma 里试。

## 对比度检查（同日补充）

`scripts/ds-check.mjs` 按 token 名字配对（`text`/`ink`/`fg` 对 `bg`/`surface`/`paper`/`canvas`，`on-X` 对 `X`），按 WCAG 2 相对亮度算对比度，低于 4.5:1 报出；半透明颜色跳过，OKLCH 经 OKLab 换算。测试里的两个期望值先是估算的，跑出来不一致后手算核对（`#777` 对 `#f2f2f2` 为 4.0:1，白色对 `#e85d04` 为 3.50:1），确认代码正确、改了测试。

真实输入：Codex 为 harbor 提炼的系统找到 11 组，最低是 `--color-text-muted` 在 `--color-surface-2` 上 4.62:1，全部通过；网站自己的系统找到 3 组，全部通过。局限：只认名字里带这些词的 token，网站的 `--color-muted` 不在检查范围内，所以 Step 1b 要求按这种方式命名。

已确认系统的不合格组合在 `delivery-check` 里是警告不是错误：用户确认过的系统按规则优先级（用户约束高于无障碍建议）不阻断，但必须报出来。

## 未覆盖

- 只用了 Codex，Claude Code 和 dsh 没跑这一步。
- 没有测 `ds confirm` 之后的 `apply ds B`，也没有测确认后新页面是否真的只用系统 token（RFC-006 §4.3 的 `ds-check.mjs` 还没写）。
- 设计系统的好坏要人看预览；这里只检查了流程承诺、对比度修正和品牌变量没被覆盖。
