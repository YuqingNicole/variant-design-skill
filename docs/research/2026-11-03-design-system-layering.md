# 2026-11-03 · 成熟设计系统怎样分层：token、组件与模式

问题：Variant Design 从选定方向提炼设计系统时，只写一个 `variant-output/design-system.css`（primitive + semantic 两层），没有组件 token 层和模式层；`scripts/ds-check.mjs` 靠 token 名字猜文字和底色怎么配对。考虑改成分层结构之前，先看成熟系统的官方文档怎么做。

Primer（base/functional/component 三层）、Carbon（core 与 component token、layer-01/02/03 和 field-0x、border-subtle-0x 的配对）、Atlassian（`foundation.property.modifier` 命名和“按含义选 token”）已在之前收集，本文不重复。

## 方法

2026-11-03 用 WebFetch 和 WebSearch 手动读公开文档页面，没有抓取、逆向或基准测试任何服务（AGENTS.md → Third-party products）。WebFetch 返回的是经小模型整理的页面内容，下面的引文都出自这些整理结果，只摘短句，没有逐字核对原网页。

读取受阻的情况：

- m3.material.io 的页面都只返回标题（单页应用，没有渲染），`/foundations/design-tokens/how-to-read-tokens` 返回 404。Material 3 的内容改读官方仓库 `material-components/material-web` 的文档和 token 源文件。
- Polaris 的旧文档站（polaris.shopify.com、polaris-react.shopify.com）现在 301 跳到 shopify.dev/docs/api/polaris（Web Components 版），新页面上没有 token 文档。改读 GitHub `Shopify/polaris` 仓库里文档站的源文件和 `polaris-tokens` 源码；这些是旧文档的存档，不一定代表现行版本。
- atlassian.design/patterns 返回空页面。

## 结果

### 1. 分几层，各层能引用什么，产品代码能不能用底层

| 系统 | 层级 | 引用规则 | 产品代码能否直接用底层 |
|---|---|---|---|
| Material 3（material-web） | Reference（`--md-ref-*`）→ System（`--md-sys-*`）→ Component（无前缀，如 `--md-filled-button-container-color`） | “Each component token maps to a system token, which has a concrete reference value.” 组件 token “can be system tokens or concrete values” | 文档没明说禁止；示例都是用 system token 覆盖 component token（`--md-filled-button-container-color: var(--md-sys-color-error)`）。material-web “does not currently support `--md-ref-palette` tokens”，即 Web 实现里 palette 这层根本不暴露 |
| Polaris（旧文档源文件） | 源码里有 primitive 色阶（如 `colors.gray[6]`），对外文档只讲 semantic token | `color-bg` → `colors.gray[6]`，`color-text-link` → `colors.blue[13]` | 文档只说 token “provide a layer of abstraction from the hex values themselves”；对外只发布 semantic token（`--p-color-*`），没找到明文禁令。专用 token “should never be used for anything other than the concept they're referencing” |
| Atlassian | semantic token（`color.text.danger`、`space.100` 等） | — | lint 规则 `ensure-design-token-usage`：“Using anything other than design tokens such as hardcoded values or legacy theme colors will be considered violations.” 被标错的例子包括旧色板 `import { B100 } from '@atlaskit/theme/colors'`。颜色 “All experiences must use color tokens”，间距和形状 token 只是 “strongly recommended”。色板页只给 “If you aren't using design tokens” 的团队用（转述自 foundations/color 页） |
| Radix Themes / Colors | 12 级色阶（`--accent-1…12`、`--gray-1…12`、alpha 版 `--red-a1…a12`）+ 少量功能色（`--accent-surface`、`--accent-indicator`、`--accent-track`、`--accent-contrast`）+ 页面级（`--color-background`、`--color-panel-solid`、`--color-surface`、`--color-overlay`） | 没有 semantic 别名层，色阶的每一级本身就规定了用途（见下节） | 可以，色阶就是给产品用的 |
| shadcn/ui | 只有一层 semantic CSS 变量（`--background`、`--primary`、`--border`、`--radius`…），通过 `@theme inline` 映射到 Tailwind | 新增 token：“define it under `:root` and `.dark`, then expose it to Tailwind with `@theme inline`” | 没有 primitive 层可用 |
| Figma Variables | 工具不规定层级；collection（“a set of variables and modes”）+ mode（“storing one value per variable”）+ 别名（“A variable can reference another variable”，同类型才行） | 别名链由作者组织 | scoping 只限制变量可用于哪些属性（“can only be applied to corner radius”），不能把 primitive 从选择器里藏起来；“发布时隐藏”的做法只在社区论坛看到，官方帮助页没读到（**未核实**） |
| DTCG 2025.10 | 规范不定义 primitive/semantic/component 层 | group 是没有 `$value` 的对象，“tools SHOULD NOT use them to infer the type or purpose”；别名可以链式（“Aliases MAY reference other aliases”），不能成环；有 `$description`、`$deprecated`（group 上的会继承给子 token）、`$extends`（group 继承） | 不涉及 |

### 2. 文字和底色怎样配对

| 系统 | 编码方式 |
|---|---|
| Material 3 | 名字里编码：`on-<role>`。“All tokens have a corresponding `--md-sys-color-on-<token>` for content color with accessible contrast.” 角色：primary/secondary/tertiary/error 各有 `X` 和 `X-container`，neutral 有 background、surface 和多级 surface-container，内容用 `on-surface` / `on-surface-variant`。组件 token 也照此引用（filled button 的 `focus-label-text-color` → `on-primary`） |
| Polaris | 名字里编码：`text-<role>-on-bg-fill[-state]`，描述直接写配对。例：`color-text-brand-on-bg-fill`：“Use for text on bg-fill-brand, like primary buttons.” 连状态也成对（`-hover`、`-active`、`-disabled`）。元素分为 `bg`、`bg-surface`、`bg-fill`、`text`、`border`、`icon` |
| shadcn/ui | 名字里编码：“We use semantic background and foreground pairs.”“`primary` pairs with `primary-foreground`.” 但不完整：默认主题的 `destructive` 没有 `destructive-foreground` |
| Radix Colors | 按级数编码：11、12 级在同色阶第 2 级上 “guaranteed to Lc 60 and Lc 90 APCA contrast”（用 APCA，不是 WCAG 2 比值）。每级用途：1 App background，2 Subtle background，3–5 UI 元素背景（常态/hover/选中），6–8 边框（细分隔线/元素边框与 focus ring/hover 边框），9–10 Solid backgrounds（及 hover），11 Low-contrast text，12 High-contrast text |
| Atlassian | 用 `inverse` 修饰词：`color.text.inverse` 用在 bold 背景上；黄色警告的 bold 背景有专门的 `warning.inverse`。没有完整的配对矩阵，靠每个 token 的描述（转述自 foundations/color 页） |
| DTCG / Figma | 格式本身没有配对字段，只能写进 `$description` 或扩展字段 |

### 3. 组件 token

| 系统 | 情况 |
|---|---|
| Material 3 | 有。material-web 的 filled button 文档只列 4 个可调 token（container-color、container-shape、label-text-color、label-text-font），但源文件 `_md-comp-filled-button.scss`（v0_192）里约 36 个键，覆盖 hover、focus、pressed、disabled 和 with-icon。即“公开可调的”远少于“内部定义的” |
| Polaris | 源码里的 color token 约 200 个（WebFetch 页面截断，估计值），多数是 semantic；组件级覆盖没核实 |
| shadcn/ui、Radix | 没有组件 token。shadcn 组件直接用 semantic 变量；Radix 组件直接用色阶的某一级 |
| DTCG | 不涉及 |

### 4. 模式怎么写

所有找到的模式都是写成指南，不是 token。

- Carbon：“Patterns differ from components, which are already designed, coded, and ready to be imported into a UI.” 模式页列了 14 项（Common actions、Dialogs、Disabled states、Disclosures、Empty states、Filtering、Forms、Global header、Loading、Login、Notifications、Read-only states、Search、Text toolbar）。Empty states 写成纯指南，分三类：“Basic empty states for first use, user action confirmation, and error management”，只链接 Button、Data table、Tile 等组件。
- Carbon 的危险确认在 Dialogs 模式里：“If the action is destructive or irreversible then use a transactional danger modal.”“Use descriptive words for the actions like Add, Delete, Save and avoid vague words like Done or OK.” 没提“输入名称确认”。
- Material 3 的 dialogs 指南页没渲染，**未核实**。Polaris、Atlassian 的模式页没读到，**未核实**。

### 5. 小团队怎么起步

没找到任何官方文档给出“最小可用设计系统”的建议。相近的只有：

- Material：从生成器出发。material-web 推荐 “use the Material theme builder Figma plugin to generate a color scheme”，或运行时用 `material-color-utilities` 生成整套角色。
- Radix：“If you want a neutral vibe, or you want to keep things simple, `gray` will work well with any hue”；语义色 “For most projects, you will need colors to communicate semantic meaning”，并给出错误/成功/警告/信息各自适合的色阶。
- shadcn：一个基础色 + 一个 `--radius`，“Changing `--radius` updates the entire radius scale.”
- 非官方：Design Systems Collective《You Don't Need All Those Tokens (Yet)》主张先两层、有了“同一个值要改 12 处”的痛点再加 token。只是个人观点，不作依据。

## 对 Variant Design 的含义

1. **配对写进名字，不再猜。** Material（`on-X`）、Polaris（`text-X-on-bg-fill`）、shadcn（`X` / `X-foreground`）都把配对编码在名字里。`ds-check.mjs` 可以只认一种明确约定（例如 `--color-on-X` 对 `--color-X`，或 shadcn 式 `-foreground`），把现在按 `text`/`bg` 关键词猜的做法降为兜底，没配对的文字色在报告里列为“未检查”，而不是静默跳过。
2. **semantic 层是产品代码唯一入口。** Atlassian 用 lint 把旧色板标为违规，material-web 根本不暴露 palette。`delivery-check` 可以加一条警告：方向代码直接引用 primitive（如 `--blue-500`）而不是 semantic token。primitive 仍写在同一个 CSS 文件里，只是不给组件用。
3. **组件 token 先不做或只做极少几个。** 小系统（shadcn、Radix）完全没有组件 token；Material 公开可调的也只有每个组件几个，36 个键是内部实现。从单一方向提炼时，组件 token 多半只是 semantic token 的改名，增加维护量而没有收益。真有需要时只给按钮、输入框这类状态多的组件加，并只引用 semantic 层。
4. **模式写进 `DESIGN.md`，不做成 token。** 所有读到的系统都把空状态、危险确认写成指南。`DESIGN.md` 可以加一小节模式规则（危险操作按钮用动词、说明后果，空状态区分首次使用/操作结果/错误），引用已有的 semantic token 和组件，不新增层。
5. **借鉴 Radix“每一级有用途”。** 提炼时给每个 semantic 色写一行用途（相当于 DTCG `$description`），导出到 DTCG 时带上；`DESIGN.md` 的用法规则也可以由此生成，而不是另写一份。注意 Radix 的对比度保证用的是 APCA，我们的检查是 WCAG 2 的 4.5:1，引用时不能混用。
6. **分层是命名和引用约定，不需要多个文件。** DTCG 不规定层级，group 也不能用来推断用途；Figma 也是靠 collection 和别名组织。保持单个 CSS 文件，用分区注释和前缀区分 primitive / semantic（和可选的 component），导出时映射成 DTCG group 与别名链即可。

## 来源

- material-web 主题文档：https://github.com/material-components/material-web/blob/main/docs/theming/README.md
- material-web 颜色文档：https://github.com/material-components/material-web/blob/main/docs/theming/color.md
- material-web 按钮文档：https://github.com/material-components/material-web/blob/main/docs/components/button.md
- material-web filled button token 源文件：https://github.com/material-components/material-web/blob/main/tokens/versions/v0_192/_md-comp-filled-button.scss
- m3.material.io（未渲染或 404）：https://m3.material.io/foundations/design-tokens/overview ，https://m3.material.io/components/dialogs/guidelines
- Polaris 颜色 token 文档源文件：https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/design/colors/color-tokens.mdx
- Polaris token 源码：https://github.com/Shopify/polaris/blob/main/polaris-tokens/src/themes/base/color.ts
- Polaris tokens README：https://github.com/Shopify/polaris/blob/main/polaris-tokens/README.md
- Atlassian 在代码中使用 token：https://atlassian.design/foundations/tokens/use-tokens-in-code
- Atlassian lint 规则：https://atlassian.design/components/eslint-plugin-design-system/ensure-design-token-usage/usage
- Atlassian 颜色：https://atlassian.design/foundations/color ，色板：https://atlassian.design/foundations/color/color-palette
- Atlassian design tokens：https://atlassian.design/foundations/tokens/design-tokens
- Radix Colors 色阶用途：https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale
- Radix Colors 组合色板：https://www.radix-ui.com/colors/docs/palette-composition/composing-a-palette
- Radix Themes 颜色：https://www.radix-ui.com/themes/docs/theme/color
- shadcn/ui 主题：https://ui.shadcn.com/docs/theming
- Figma 变量概览：https://help.figma.com/hc/en-us/articles/14506821864087-Overview-of-variables-collections-and-modes
- Figma 创建和管理变量：https://help.figma.com/hc/en-us/articles/15145852043927-Create-and-manage-variables-and-collections
- DTCG 2025.10 格式：https://www.designtokens.org/tr/2025.10/format/
- Carbon 模式总览：https://carbondesignsystem.com/patterns/overview/ ，空状态：https://carbondesignsystem.com/patterns/empty-states-pattern/ ，对话框：https://carbondesignsystem.com/patterns/dialog-pattern/
- 非官方观点（不作依据）：https://www.designsystemscollective.com/you-dont-need-all-those-tokens-yet-df9e78a157d2
