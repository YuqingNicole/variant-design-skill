# 组件规格与交接规则实测记录 — 2026-10-27

验证 #37、#50 合并的规则在真实 CLI 里是否被执行：
- #37：数值必须有来源，未知写 `[TBD]`；嵌套圆角按公式计算；component 路线按需加载这些说明。
- #50：交接与验收要求、实现细节清单、三条新的质量检查规则。

## 方法

- 宿主：Claude Code 2.1.311，`claude -p`，跳过权限确认，非交互运行，每个任务一轮。
- 安装：在项目级目录 `.claude/skills/variant-design` 克隆了 master `ca6aaae`。实际运行时两轮读取的都是全局目录 `~/.claude/skills/variant-design`，见发现 3。全局目录是指向维护者工作树的软链接，当时也停在 `ca6aaae`，所以两边内容一致。
- 项目 **Larkshop**：纯 HTML + CSS 的商品卡片，`styles/tokens.css` 注明品牌锁定。为了测试规则，故意留了几处问题：
  - 卡片外圆角 16、边框 1、内边距 12，媒体区圆角却用 12（按公式应为 3）；
  - 没有定义标题截断、状态和断点；
  - 字体 Figtree 写进了 token，但没有加载。
- 任务（两个任务各用一份从同一基准克隆的项目，互不影响）：
  1. "用 variant-design 给 index.html 里的商品卡片写一份组件规格，要交接给工程师实现，写到 docs/product-card-spec.md。"
  2. "用 variant-design 为 Larkshop 设计一个按钮组件系统（主要、次要、文字、危险四种，sm/md/lg 三个尺寸），沿用 styles/tokens.css 的品牌 tokens。"

## 结果

| 检查项 | 任务 1：规格与交接 | 任务 2：按钮系统 |
|---|---|---|
| 耗时 / 费用 | API 121 s，$0.60，10 轮 | API 263 s，$1.42，29 轮 |
| 加载的说明 | component 路线 → `ux-component-specs.md` → 只读 `ux-design-tokens.md` 的 Nested Radius 一节，以及 `ux-content-strategy.md` 的文本扩展一节 | component 路线、`code-output.md`、`project-discovery.md`、`quality-baseline.md` 等；没有加载规格和圆角说明（这次不需要） |
| 数值有来源 | ✓ 每个值都引用 token 或源码，并用无头 Chrome 的 `getComputedStyle` 实测 1280 / 390 两种宽度 | ✓ 尺寸、内边距全部引用 token |
| 未知值写 `[TBD]` | ✓ 19 处，并写明该由谁补齐：状态、截断、缺货、断点、动效时长等 | 不适用 |
| 公式 | ✓ 用 `W_outer = W_c + 2·S_pad + 2·B` 等公式推算，与实测值逐项核对：306、345.39 等 | 不适用 |
| 嵌套圆角 | ✓ 算出应为 3px，现状 12px 被列为待决问题，给了两种方案，没有改 token | 不适用 |
| 交接内容 | ✓ 内容、多语言（40% 扩展）、加载与缺失状态、断点、动效、理由都有；附验收清单，要求按"规格 vs 实际 @ 视口"记录 | — |
| 质量扫描 | — | ✓ `--strict` 0 错误 0 警告 |
| 实现细节 | — | ✓ 过渡属性逐个列出；用 `aria-live="polite"` 播报状态；按钮可能截断的容器加了 `min-inline-size: 0`；删除先确认，再给 10 秒撤销；有 `prefers-reduced-motion` 处理 |
| 品牌锁定 | ✓ 没有改 `tokens.css` | ✓ 没有改；token 里没有危险色，所以在组件层新增 `--lk-danger`，并请设计团队确认 |
| 额外发现 | Figtree 没有加载；按钮高度 38px 低于 44px；`content-box` 会让工程实现时卡片窄 26px | Figtree 没有加载；`--color-border` 在白底上只有 1.35:1，不适合做次要按钮描边 |
| context | 不适用 | ✓ `.variant-context.json` 符合 v2 结构 |

## 发现

| # | 发现 | 证据 | 处理 |
|---|---|---|---|
| 1 | 两轮都把临时文件写在项目外：`/tmp/lark-measure`、`/tmp/cr.mjs`、`/tmp/lkcheck`，没有放进 `.variant-work/`。任务 1 自己删掉了，任务 2 留下了，由记录者事后清理 | 两轮的工具调用记录 | 待处理：在 `code-output.md` 写明，测量和检查脚本也要放在 `.variant-work/` |
| 2 | 任务 2 为了在浏览器里检查，借用了技能自带的 `tests/node_modules` 里的 Playwright，又试了 3 次才找到可用的浏览器路径。正常安装的用户没有这个目录。任务 1 直接用系统 Chrome 的 `--headless --dump-dom`，更通用 | 任务 2 的工具调用记录 | 待处理：在说明里给出一种不依赖技能目录的浏览器检查方式 |
| 3 | 全局和项目级同时装了 variant-design 时，CLI 读取的是全局目录。所以 AGENTS.md 里"用项目级安装来隔离"的做法，在装了全局技能的机器上不能保证测到的是项目里那一份 | 两轮的 Bash 调用路径都是 `/Users/nicole/.claude/skills/variant-design/...` | 本次两边内容一致，不影响结论。以后要测未合并的改动时，需要先确认实际读取的是哪个目录 |

## 没有验证的

- 每个任务只跑了一轮，也没有用 #37 之前的版本做对照，所以只能说"新规则被执行了"，不能说"比以前好多少"。
- 只测了 Claude Code，没有测 Codex。
- 没有让真实设计师或工程师使用这份规格；任务 2 的按钮没有在触屏真机、Safari、Firefox 或屏幕阅读器上测试。
