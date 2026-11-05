# RFC-007 · 设计系统分层：决策、基础值、语义、组件与模式

- 状态：P0/P1 已实现；修复后的 Codex 完整 harbor-chain 与 ledger-pick 通过。Claude 账号验证、维护者截图验收和 §7 的未决选择仍待完成；默认 DTCG 按类型分组，按层导出已作为选项提供。证据见 `docs/research/2026-11-04-design-system-validation.md`。
- 日期：2026-11-03。
- 依据：
  - `docs/research/2026-11-03-design-system-layering.md`：Material 3、Polaris、Atlassian、Radix、shadcn/ui、Carbon、Figma Variables、DTCG 2025.10 的公开文档；
  - `docs/research/2026-11-03-design-system-after-pick.md` →“多轮测试场景与‘AI 味’”：生成的系统 AI 味重的诊断和复测。
- 关联：RFC-006 §4.1（选定后提炼设计系统）；`skills/variant-design-system/ROUTE.md` Step 1、1b、2；`references/design-system/system-decisions.md`；`scripts/ds-check.mjs`、`ds-export.mjs`、`delivery-check.mjs`。

## 1. 问题

RFC-006 把“选定之后给用户一套完善的设计系统”定为核心卖点。现在的产出离“完善”还差两件事。

**第一，AI 味重。** 原因是技能的说明在让模型填模板。2026-11-03 当天已经做了一轮修正，引入了 `system-decisions.md`：先写决策、审查来源方向里的套路、token 只写用得到的、预览展示使用场景。复测中 token 从 108 个降到 34 个，预览也改为用真实内容展示。这一轮只是说明文字的修正，没有改变系统的结构。

**第二，没有分层。** 现在 `design-system.css` 只有基础值和语义两类 token，而且两者混在一起。

| 缺什么 | 后果 |
|---|---|
| 文字色和底色的配对规则 | `ds-check` 只能按名字里的 `text`、`bg` 猜配对；猜不到的文字色（例如 `--color-muted`）不会被检查，也不会报告 |
| “产品代码只能用语义 token” 的约束 | 方向代码可以直接引用 `--p-brand-500`，以后改色板时，改动面无法控制 |
| 组件这一层 | 按钮、输入框的状态只在预览里演示，后来写的页面没有共同的依据 |
| 模式这一层 | 危险确认、空状态这类规则只散落在 `DESIGN.md` 的文字里 |

## 2. 外部做法（摘要，详见研究记录）

- **层级是约定，不是格式。** DTCG 不定义 primitive、semantic、component 这些层，Figma 也只提供 collection 和别名。各家都是用命名和引用规则来分层。
- **配对写在名字里。** Material 用 `on-X`，Polaris 用 `text-X-on-bg-fill`，shadcn 用 `X` 和 `X-foreground`。
- **产品代码不用基础色板。** Atlassian 用 lint 把直接用旧色板标为违规；material-web 不对外暴露 palette 这一层。
- **组件 token 不多。** Material 的填充按钮公开可调的只有 4 个，内部定义约 36 个；shadcn 和 Radix 完全没有组件 token。
- **模式都写成指南，不做成 token。** Carbon 有 14 个模式，其中空状态分 3 类，危险操作用 “transactional danger modal”。
- **没有找到“小团队最小可用系统”的官方建议。**

## 3. 方案：五层，层数随产品规模增减

| 层 | 写在哪 | 命名 | 能引用 | 谁能用 | 什么时候写 |
|---|---|---|---|---|---|
| 0 决策 | `design-system.css` 文件开头的注释、`DESIGN.md` 的 Overview | 编号列出 | — | 人和 agent | 总是写，3–5 条，每条写明排除什么 |
| 1 基础值 | `design-system.css` 的 Primitives 区 | `--p-<hue>-<step>`，例如 `--p-clay-600` | 原始值 | **只有第 2、3 层** | 只在一个颜色被多个语义 token 共用，或产品确实需要一组连续色阶时才写。否则语义 token 直接写原始值 |
| 2 语义 | Semantic 区 | 颜色：`--color-<role>[-<state>]`，配对用 `--color-on-<role>`。其余按用途命名：`--text-<role>`、`--space-<n>`、`--radius-<kind>`、`--shadow-<what>`、`--duration-<what>` | 第 1 层或原始值 | 产品代码、组件 | 总是写 |
| 3 组件 | Components 区 | `--<component>-<variant>-<property>[-<state>]`，例如 `--button-primary-bg-hover`（参考 Primer 的命名顺序） | **只引用第 2 层** | 只有该组件自己的 CSS | 只给产品里状态多（≥3 个）、而且会被后续页面复用的组件写，例如按钮、输入框、选择器。B 只出现一次的东西不写 |
| 4 模式 | `DESIGN.md` → Components 下的 Patterns 小节 | 用名称描述，例如“移除权限确认”“空状态：首次使用” | 第 2、3 层 token 和组件 | 人和 agent | 只写产品里出现过的模式，每个写清：何时用、结构、文案规则、用哪些 token。不做成 token |

还有两条规则：

- **用途说明。** 每个第 2 层 token 的行尾写一个 `/* use: … */` 注释，写产品里的具体位置（如“成员姓名”“移除权限确认框”），不写抽象的层名。`ds-export` 把它导出为 DTCG 的 `$description`；`DESIGN.md` 的 Colors 和 Typography 规则由这些说明整理而来，不另外凭空写。
- **一个文件。** 继续用单个 `design-system.css`，用分区注释区分各层。原因：
  - DTCG 和 Figma 都不要求按层拆文件；
  - `delivery-check`、`ds-export`、`apply ds` 和品牌锁定的 `extensions` 都假定设计系统是单个文件；
  - 拆成多个文件只增加引用路径，换不来能力。

**层数随产品规模增减。** 像 Harbor 这样的小产品，通常是：决策 + 语义层（约 30 个）+ 2–3 个组件的组件 token + 3–4 个模式。只有确实需要第 1 层时才写。不要求每层都填满；这一点和 `system-decisions.md` §3 的规则一致。

**品牌锁定时**：品牌文件的命名不受我们控制，分层规则只用在我们写的扩展文件上。扩展文件的组件 token 引用品牌变量。

## 4. 检查怎么改

| 脚本 | 改动 |
|---|---|
| `ds-check.mjs` | 优先按 `--color-on-<role>` 对 `--color-<role>` 配对。没有配对的文字色列为“未检查”，不再静默跳过。按名字猜的旧规则只用于品牌文件。新增一项：第 3 层引用了第 2 层以外的值时报错 |
| `delivery-check.mjs` | 对技能生成并已确认的系统：方向代码或后续页面直接引用 `--p-*`，或直接引用其他组件的 token 时，给出警告并提示改用的语义 token。品牌文件不做这项检查 |
| `ds-export.mjs` | 导出 `/* use: … */` 为 `$description`；保留别名链。DTCG 文件按类型分组还是按层分组见 §7 第 2 项 |
| `evals/grade.mjs`（`harbor-chain`） | `pick` 一轮新增：文件开头有决策；所有语义颜色都有用途说明；第 3 层只引用第 2 层。`component` 一轮新增：新组件没有直接引用 `--p-*` |

## 5. 不在本 RFC 范围

- **生成方向本身的 AI 味。**（2026-11-03 已按下文处理：`quality-baseline.md` → Generator habits，`quality-gate` 的 `review` 规则，以及生成说明的修改；记录见 `docs/research/2026-11-03-design-system-after-pick.md`。） 复测里 B 仍有口号式标题、装饰数字、大写眉标和“情绪化”配色，问题出在生成 A/B/C 的那一步。设计系统这一步能把这些套路丢掉，但治不了本。要单独处理：把 `system-decisions.md` §2 的套路清单用到生成方向时的自查，并考虑让 `quality-gate` 识别其中可以机械判断的几项（例如大写字母间距眉标、装饰性大数字）。
- 暗色模式和多主题（Figma modes）。等有了分层再做。
- 改网站自己的设计系统（`docs/design-system.md`）。

## 6. 实施与验收

| 阶段 | 内容 | 验收 |
|---|---|---|
| P0 | 改 `system-decisions.md` 和 ROUTE Step 1、1b，写入分层、命名、用途说明和模式；Step 1 的模板改为分层示例 | `harbor-chain --turns generate,pick` 用 Codex 和 Claude Code 各跑一次：配对和用途说明齐全，第 3 层只引用第 2 层，B 中出现过的模式写进了 `DESIGN.md`；维护者看过截图 |
| P1 | 按 §4 改 `ds-check`、`delivery-check`、`ds-export`，补测试；评分器按 §4 新增检查 | 单元测试；完整六轮 `harbor-chain` 两个 agent 各通过一次；`ledger`（品牌锁定）的 `pick` 一轮不会误报 |
| P2 | 生成方向时的套路自查（§5） | 另开 RFC 或 PRD 处理 |

审美判断不能自动化：每个阶段都要附截图，由维护者确认后才算完成。

## 7. 待维护者决定

1. **组件 token 写多少？** 我建议：只给状态 ≥3 个、并且后续页面会复用的组件写，每个组件只写对外可调的那几个。另一个选择是完全不做组件 token（shadcn 的做法），只在 `DESIGN.md` 里写组件规则。
2. **DTCG 文件怎么分组？** 按层（`primitive`、`semantic`、`component`）分组，导入 Figma 时更接近 collection；按类型分组是现状，和 DTCG 的 `$type` 继承一致。我倾向按层分组，在每个 token 上写 `$type`。
3. **对比度标准。** 继续用 WCAG 2 的 4.5:1。Radix 用的是 APCA，我们不混用；如果以后要支持 APCA，需要另外决定。

## 8. P1 后续实现（2026-11-04，待完整验收）

`codex/design-system-validation` 补齐明确配对、未验证清单、组件层约束与品牌来源区分。共享文字色可用尾随 `/* on: --color-bg --color-surface */` 声明多个底色；只有明确的非文字色才可用 `contrast: non-text`。组件 token 是单一语义或品牌变量别名；组合字体和状态比例先写入语义层。旧品牌文件用 `--brand` 指定，扩展遵守新规则。

DTCG 新增可审阅的 `--group-by layer`，当前默认仍按类型分组，§7.2 的默认切换决定未收到答复。真实 CLI 链路及截图验收尚未完成。契约、负向基线和验证记录见 [设计系统检查记录](../research/2026-11-04-design-system-validation.md)。
