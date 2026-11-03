# 2026-11-03 · 成熟设计语言怎样规定按钮，以及怎样用代码把按钮做好

问题：Variant Design 生成的设计系统里，按钮不好看。我们自己的产出里看到过：按钮文字用了正文衬线体（Georgia）；圆角是 3px 的近直角或随手写的值；次要按钮有一圈深色 1px 粗边；同一视图里主按钮和危险按钮都是饱和的实色块，互相抢；禁用态是发浑的米色；focus ring 是很粗的双层边框；状态用一排假按钮展示，上面标着 “Hover example”；高度、水平内边距、字号、字重之间没有比例关系。

改按钮规则之前，先看成熟设计语言的官方文档怎么规定按钮，再看官方 Web 平台文档里哪些实现手段能用、各要付出什么代价。

## 方法

2026-11-03 用 WebFetch、WebSearch 手动读公开文档页面，部分组件源码用 `gh api` 从官方公开 GitHub 仓库读单个文件。没有抓取、逆向或基准测试任何服务（AGENTS.md → Third-party products）。WebFetch 返回的是小模型整理后的页面内容，引文只摘短句，没有逐字核对原网页。源码里的数值是直接从文件里读的，比整理后的页面可靠。

读取受阻的情况：

- **Apple HIG**：页面是单页应用，只返回标题。改读同一页面的官方数据文件 `developer.apple.com/tutorials/data/design/human-interface-guidelines/buttons.json`。这份数据里**没有** filled / tinted / gray / plain 这几种样式的名字，只讲“prominent style”和 role；这四种样式名来自 SwiftUI/UIKit 的 API，本文没有读到对应官方页面，**未核实**。
- **Material 3**：m3.material.io 的 specs 页只返回标题。改读官方 Web 实现 `material-components/material-web` 的文档和 token 源文件（`tokens/versions/v0_192`），这是 M3 基线版按钮，不是 2025 年的 M3 Expressive。Expressive 的五档尺寸（XS–XL）只在搜索结果里看到有这五档，具体高度**未核实**。
- **Polaris**：旧文档站跳到 shopify.dev 的 Web Components 版。规则读自 shopify.dev 的 `s-button` 页面，数值读自 GitHub `Shopify/polaris` 仓库里的旧文档源文件和 `polaris-react` 源码，那是存档，不一定是现行实现。
- **Atlassian**：usage 页正文被截断，只读到前半部分（主按钮数量、排列、文案、禁用）；appearance 说明改读 examples 页。高度、圆角等数值没读到，**未核实**。
- **Vercel Geist**：页面只给类型、尺寸名和形状，没有数值。
- **Radix Themes**：文档页没有数值，数值读自 `radix-ui/themes` 源码（`base-button.css`、`button.css` 和 tokens）。
- Rive、Lottie 的官方文档没有写包体积。

## 一、设计语言怎样规定按钮

### 1. 变体层级和主按钮数量

| 系统 | 变体（由强到弱） | 主按钮数量 | 原文 |
|---|---|---|---|
| Apple HIG | prominent（强调色底）/ 其他样式；role：primary、cancel、destructive | 每个视图 1–2 个 | “Keep the number of prominent buttons to one or two per view.”“Use style — not size — to visually distinguish the preferred choice” |
| Material 3（material-web） | filled → filled tonal → elevated → outlined → text | 文档没给数字；filled 留给“完成流程的最终动作” | filled：“important, final actions that complete a flow”；text：“lowest priority actions”；elevated 只在需要和花纹背景分开时用 |
| Radix Themes | solid（默认）、classic、soft、surface、outline、ghost；可加 `highContrast` | 文档没说 | ghost：“a button without chrome” |
| Primer | primary、default（secondary）、invisible、danger、link | 一组里最多 1 个，一页里很少超过 1 个 | “Never put more than one in a group of buttons, and rarely use more than one per page.” |
| Atlassian | primary、default、subtle、warning、danger、discovery（另有 Rovo） | 每页或每区域 1 个 | “Only include one primary button or call to action (CTA) in a page or area.” |
| Vercel Geist | default、secondary、tertiary、error、warning | 页面没说 | — |
| Polaris | primary、secondary、tertiary（旧版另有 plain、monochromePlain）；tone：critical、neutral | 每个区块或屏幕 1 个 | “Don’t use more than one primary button in a section or screen”（旧文档源文件） |

共识：只有一个最强的按钮，其余按钮按强度往下排。层级靠样式区分，不靠尺寸（Apple 原文）。大多数系统除了实色主按钮，还给出两到三档弱变体：有底色但不饱和的（tonal / soft / default），只有描边的（outlined / outline / surface），没有容器的（text / ghost / invisible / plain）。

### 2. 尺寸：高度、内边距、字号、字重、图标

| 系统 · 尺寸 | 高度 | 水平内边距 | 内边距/高度 | 字号 / 字重 | 图标 / 间距 |
|---|---|---|---|---|---|
| Material filled（唯一尺寸） | 40px | 24px；带前置图标 16 / 24 | 0.6 | label-large：14px（0.875rem）/ medium，tracking 0.1px（0.00625rem），行高 20px | 18px / 8px；最小宽度 64px |
| Radix size 1 | 24px | 8px | 0.33 | 12px / 500，letter-spacing 0.0025em | 间距 4px |
| Radix size 2（默认） | 32px | 12px | 0.375 | 14px / 500，0 | 8px |
| Radix size 3 | 40px | 16px | 0.4 | 16px / 500，0 | 12px |
| Radix size 4 | 48px | 24px | 0.5 | 18px / 500，−0.0025em | 12px |
| Primer small | 28px | 8px（condensed） | 0.29 | small body / medium | 间距 4px（control-small-gap） |
| Primer medium（默认） | 32px | 12px（normal） | 0.375 | medium body（14px）/ medium | 8px |
| Primer large | 40px | 16px（spacious） | 0.4 | — / medium | 8px |
| Polaris medium | 32px（窄屏），28px（md 断点以上） | 12px，上下 6px | 0.375–0.43 | — / medium | — |
| Polaris large | 36px → 32px | 12px | 0.33–0.375 | — / medium | — |
| Polaris micro | 28px → 24px | 8px，上下 4px | 0.29–0.33 | — | — |
| Apple | 点击区至少 44×44pt（visionOS 60×60pt）；visionOS 尺寸 28 / 32 / 44 / 52 / 64pt | — | — | — | macOS 图片按钮约 10px 内边距 |
| Atlassian | default 和 compact（compact 用于表格），数值未读到 | — | — | — | — |
| Geist | tiny（仅图标按钮）/ small / medium（默认）/ large，数值未给 | — | — | — | — |

规律：

- 默认按钮高度集中在 **32–40px**，字号 **14px**，字重 **500（medium）**。
- 水平内边距约为高度的 **0.33–0.6**。Radix 和 Primer 在 32px 上都是 12px，比值随尺寸增大略升（Radix 从 0.33 到 0.5）。
- 字号、内边距、间距跟高度一起走同一档尺寸，没有哪个系统让它们各自取值。Radix 每档同时定义 gap、font-size、line-height、letter-spacing、padding、高度。

### 3. 形状：圆角和高度的关系

| 系统 | 圆角 |
|---|---|
| Material | 全胶囊：`corner-full`；focus ring 也跟着用 full |
| Radix | 随尺寸升档：24/32/40/48px 高度对应 `radius-1…4` = 3/4/6/8px（radius="medium" 时，即高度的 1/8）；主题可选 none / small（×0.75）/ medium / large（×1.5）/ full（9999px），由一个 `--radius-factor` 统一缩放 |
| Primer | 所有尺寸都用 `borderRadius.medium` = 6px（small 3px，large 12px，full 9999px） |
| Polaris | 8px（`border-radius-200`）；plain 按钮的 focus 用 12px |
| Apple（visionOS） | 只有图标：圆形；只有文字：圆角矩形或胶囊；图标加文字：胶囊。“In general, prefer circular or capsule-shape buttons.” 竖排用圆角矩形，横排用胶囊 |
| Geist | 默认之外可选 rounded（配 `shadow`，用于营销页）；图标按钮可选 square / circle |

共识：圆角来自全局形状 token，不在按钮上随手写。Radix 的 3px 只用在 24px 高的最小档；32px 以上的按钮在这些系统里是 4–8px 或全胶囊。圆角和高度的比值大约是 0.12–0.25，或直接是 0.5（胶囊）。

### 4. 按钮文字

| 系统 | 大小写 | 字重 / 字距 | 字体 |
|---|---|---|---|
| Material | 文档没说（M3 不再全大写，未核实） | medium，0.1px | label 样式用 `md-ref-typeface.plain`，和标题用的 `brand` 字体分开 |
| Radix | — | 500；大档略收紧字距 | `--default-font-family`（系统无衬线）；em/quote 才用衬线 |
| Primer | — | medium | 系统无衬线 |
| Atlassian | sentence case，不加标点，不加冠词，以动词开头 | — | — |
| Polaris | sentence case（“Buy new domain”，不是 “Buy New Domain”），动词开头 | medium | — |
| Apple | title-style capitalization，动词开头（“Add to Cart”）；打开新窗口的按钮加省略号 | — | — |

没有哪个系统把按钮文字设成衬线体。Material 在 token 里把“plain”（界面用字体）和“brand”（品牌展示字体）明确分开，按钮 label 用 plain；这是“品牌字体只给标题，按钮用界面无衬线”最直接的依据。其他系统用的是全局默认字体，而默认字体都是无衬线。

### 5. 状态怎样推导

| 系统 | hover | pressed | disabled | focus ring | loading |
|---|---|---|---|---|---|
| Material | state layer：在容器上叠一层文字色，透明度 0.08 | 叠层透明度 0.12（focus 也是 0.12，v0_192） | 容器 = on-surface × 12% 透明度，文字 = on-surface × 38%；forced-colors 下改用 `GrayText` | 3px 宽、外扩 2px、颜色 `secondary`、跟随容器的 full 圆角；出现时先长到 8px 再缩回（时长 `duration-long4`） | — |
| Radix solid | accent-9 → accent-10（色阶下一级） | accent-10 + `filter: brightness(0.92) saturate(1.1)`（暗色主题用 brightness(1.08)） | 文字 `gray-a8`，底 `gray-a3`：换成中性灰，不是降透明度 | `2px solid var(--focus-8)`，offset 2px | spinner 替换内容，尺寸不变，同时禁用 |
| Radix soft / outline / ghost | 透明色阶升一级：soft a3→a4，outline 透明→a2，ghost 透明→a3 | 再升一级：a5 / a3 / a4 | soft 和 solid 相同；outline 边框改 `gray-a7` | 2px，offset −1px（画在内侧） | 同上 |
| Radix classic | 背景加渐变 | 内容下移 1–2px（`padding-top`） | — | 同 solid | — |
| Primer | 每个变体有独立 token（`bgColor-hover`、`borderColor-hover`） | `bgColor-active`；`:active` 时 `transition: none`（即时反馈） | 独立 disabled token；文档：“Avoid disabling buttons” | `2px solid`，offset −2px；强调底（primary）上再加 `inset 0 0 0 3px fgColor-onEmphasis`，即环内一圈白 | spinner 只替换图标位置，文字保留，`aria-disabled` 并保留焦点 |
| Polaris | 换 bg token，box-shadow 不变 | 换成内凹 shadow（`shadow-button-inset`） | `bg-fill-disabled` + `text-disabled`，独立 token | 2px（`border-width-050`），offset 1px，`border-focus` 色 | 替换内容为加载指示，并禁用 |
| Apple | visionOS 不支持自定义 hover | “Always include a press state for a custom button.” | — | — | 不能立刻完成的动作显示活动指示，“Checkout”变为“Checking out…” |

过渡：Primer 只对 `color, fill, background-color, border-color` 做 80ms `cubic-bezier(0.65, 0, 0.35, 1)` 过渡，按下时取消过渡。所有读到的系统都**没有**在按下时用 `transform: scale()`；按下的反馈是更深一级的色、滤镜、内凹阴影或 1–2px 下移。

禁用：Primer、Atlassian、Polaris（Web Components 版）都建议尽量不禁用按钮，因为禁用按钮会离开 tab 序列，改用校验和错误提示。Atlassian：“Never put tooltips on disabled buttons.”（Geist 的建议相反：禁用按钮配一个解释原因的 Tooltip。）禁用的视觉做法有两种：Material 用透明度，Radix、Primer、Polaris 换成中性灰 token；没有系统用暖色或米色表示禁用。

描边：Radix outline 用 `inset 0 0 0 1px var(--accent-a8)`（半透明强调色），Material outlined 用 `md-sys-color-outline`（中灰），Primer default 用 `control-borderColor-rest`（浅灰）。没有系统给次要按钮用深色描边。

### 6. 危险操作

| 系统 | 做法 |
|---|---|
| Primer | danger 在常态下是默认按钮的底色和边框，只有文字是红色（`bgColor.rest` = `control.bgColor.rest`）；hover 才变成实心红（`bgColor.danger.emphasis`）。文档：“Used sparingly for destructive actions, typically prompt a confirmation dialog.” |
| Atlassian | danger “appears as a final confirmation”；warning 用于可能造成重大改变的确认，常见于确认弹窗 |
| Polaris | 两档：plain critical（红字，不实心）用于不常用的危险动作，例如卡片里的操作；primary critical（实心红）用于确认，“should trigger a confirmation dialog”。示例：次要的 Cancel 配实心红的 “Delete variant” |
| Apple | destructive role 用系统红；“Don’t assign the primary role to a button that performs a destructive action, even if that action is the most likely choice.” |
| Geist | 有 error 类型，页面没讲用法 |

共识：实心红只出现在确认这一步，通常在对话框里，旁边是一个次要的取消按钮。在普通页面里，危险入口是红字（Polaris plain critical），或者是只在 hover 时变红的默认按钮（Primer）。这样页面上任何时候只有一个饱和实色块。

### 7. 文档怎样展示状态

- Radix、Primer、Atlassian、Polaris、Geist 的文档页都放可交互的真组件：读者把鼠标移上去、按 Tab 就能看到 hover 和 focus。各种变体、尺寸、loading、disabled 并排列出，但 hover / pressed 不做成静态假按钮。
- Material 和 Apple 的规范页用图示说明状态（Material 的状态层示意图、Apple 的截图）。这两处页面这次没有渲染出来，以上是**二手印象，未核实**。
- 没有看到哪个系统用一排写着 “Hover example” 的静态按钮来展示状态。

## 二、用代码把按钮做好：实现手段

前提：Variant Design 把代码写进用户项目，复用项目自己的 React 和 Vite，不新增依赖，除非项目里已经有，或者用户要求。

### 1. 用一个 token 推导所有状态

| 手段 | 能给按钮什么 | 支持情况（来源原话） | 代价 |
|---|---|---|---|
| `color-mix()` | 从一个强调色算出 hover、pressed、半透明底：`color-mix(in oklab, var(--accent), black 8%)`；和 `transparent` 混合就得到半透明色 | MDN：“Widely available”，“available across browsers since May 2023” | 无依赖；默认插值空间是 oklab |
| 相对颜色语法 `oklch(from var(--accent) calc(l - 0.06) c h)` | 只调亮度或透明度，色相和彩度不变，比混黑更干净 | MDN 页面没有 Baseline 标注；web.dev 2024-07 平台更新：Chrome 119、Firefox 128、Safari 18 都已支持 | 无依赖；需要 `@supports (color: oklch(from red l c h))` 兜底；Safari 18 之前不支持 |
| Material 式 state layer | 在按钮上叠一层文字色，透明度 0.08（hover）/ 0.12（pressed、focus）。可以用 `::before` 叠层，或直接算：`background: color-mix(in srgb, var(--btn-bg), var(--btn-fg) 8%)` | 同 `color-mix()` | 无依赖；任何变体（实心、tonal、ghost）用同一条规则，不用为每个变体单独挑 hover 色 |

state layer 的透明度数值来自 material-web 的 `_md-sys-state.scss`；用 `color-mix` 实现叠层是本文的推论，不是 Material 文档给的写法。

### 2. 动效

| 手段 | 能给按钮什么 | 支持情况 | 代价 |
|---|---|---|---|
| `linear()` 缓动 | 用一串采样点近似弹簧或回弹 | MDN：“Widely available”，“since December 2023” | 无依赖；Chrome 文档说点少了曲线“rougher on the edges”，回弹示例约 30 个点，需要生成工具；只复现曲线形状，不感知速度，不能被打断后接着弹 |
| `@property` | 注册自定义属性的类型后，渐变位置、角度这类值才能过渡（光泽扫过、进度填充） | MDN：“Baseline 2024 Newly available”，“Since July 2024” | 无依赖；旧浏览器上直接跳变，不会报错 |
| `@starting-style` | 元素第一次出现时从指定样式过渡进来（如按钮内的确认气泡、loading 标记） | MDN：“Baseline 2024 Newly available”，“Since August 2024” | 无依赖 |
| `transition-behavior: allow-discrete` | 让 `display`、`overlay` 也能参与过渡，弹层退出时先播完动画再消失 | MDN 页面写的是 “Limited availability”（2026-11-03 读取；和 `@starting-style` 同期发布，标注可能未更新，**待复核**） | 无依赖；不支持时退化为立即消失 |
| `prefers-reduced-motion` | 用户要求减少动效时，把位移、缩放换成淡入淡出或直接取消 | MDN：“Widely available”，“since January 2020” | 无依赖；MDN 指出缩放、平移大物体可能触发前庭不适 |

### 3. 更丰富的反馈

| 手段 | 能给按钮什么 | 支持情况 | 代价 |
|---|---|---|---|
| SVG 滤镜（`feTurbulence` + `feDisplacementMap`） | 纹理、溶解、扭曲，例如删除时的颗粒消散 | `feTurbulence`：MDN “Widely available”，“since July 2015” | 无依赖；滤镜每帧重算，动画时开销大，需要手调参数 |
| Canvas / WebGL 粒子 | “灰尘”式删除动画（参见 Best practice 里的 Dust delete 案例） | Canvas 2D、WebGL 长期可用（本文没有单独查 Baseline） | 无依赖但代码量大；要处理 DPR、清理、`prefers-reduced-motion`，对读屏用户没有信息 |
| View Transitions API（`document.startViewTransition`） | 按钮触发的界面变化（列表项删除、展开）在新旧状态间自动过渡 | MDN：“Baseline 2025 Newly available”，“Since October 2025”（同文档 SPA 版） | 无依赖；需要判断 `document.startViewTransition` 是否存在并兜底 |

### 4. 动画库

| 库 | 能给按钮什么 | 体积（官方文档原数） | 代价 |
|---|---|---|---|
| Motion（motion.dev，原 Framer Motion） | `whileHover`、`whileTap` 手势动画；弹簧有物理参数（stiffness、damping、mass）和时长参数（`duration` + `bounce`，`visualDuration`）两种写法，可打断、继承速度 | `motion` 组件 tree shaking 后仍不低于 43kb；`m` + `LazyMotion` 首屏略超 5kb，`domAnimation` 再加 24kb，`domMax` 加 38kb；`useAnimate` mini 3.3kb | 新依赖 |
| Rive | 设计师在编辑器里做状态机（文档示例正是按钮的 Idle、Hovered、Clicked），运行时按输入切换 | 文档没给数字；`@rive-app/canvas-lite` 是“the smallest Rive web package”；`@rive-app/webgl` 已弃用 | 新依赖 + wasm 运行时 + `.riv` 资源文件；需要设计师在 Rive 里制作 |
| Lottie（lottie-web） | 播放 After Effects 导出的 JSON 动画，渲染器可选 svg / canvas / html | README 没给体积，只提醒生产环境 gzip | 新依赖 + JSON 资源；只播放时间线，交互状态要自己接 |

## 对 Variant Design 的含义

下面每条都能在生成的 `design-system.css` 或预览页里检查。

1. **按钮文字用界面无衬线，不用品牌衬线。** 按钮 `font-family` 指向一个 UI sans token（如 `--font-ui`）。品牌衬线只用于标题和展示文字，依据是 Material 区分 plain 和 brand 字体。字重 500–600，字号 13–15px，sentence case，不全大写，不加 letter-spacing（或在 ±0.01em 以内）。可检查：按钮计算后的 `font-family` 不含 serif 字体。
2. **尺寸成套定义，内边距按高度取比值。** 至少定义 sm / md / lg 三档，每档同时写高度、水平内边距、字号、图标、间距。默认档是 36–40px 高（交互密集界面可用 32px）。水平内边距 = 高度 × 0.35–0.6，图标和文字间距 6–8px，图标 16–18px。可检查：每档内边距和高度的比值落在这个范围内；正文区域的按钮点击区不小于 44px，或者有足够的周围间距。
3. **圆角来自全局形状 token，并和高度挂钩。** 只用两种取法：一是固定比例，圆角 = 高度 × 0.15–0.25（36px 按钮约 6–8px，Primer 6px、Polaris 8px 都在附近），所有控件共用；二是全胶囊（9999px）。只有方向本身是硬朗风格时才用 0。不许出现 32px 以上按钮配 2–3px 圆角这种两头不靠的值。
4. **变体固定为一个实色主按钮 + 二到三档弱变体。** primary（实色）、secondary（tonal/soft 底色，或浅色细描边）、ghost（无容器）。每个视图或分组最多一个 primary。描边用中性浅灰或半透明强调色，1px，不能用接近文字色的深色。可检查：预览页同一区块里实色按钮不超过一个。
5. **状态由一个基色推导，不另挑颜色。** hover / pressed 用 state layer：`color-mix(in oklab, var(--btn-bg), var(--btn-fg) 8%)` 和 12%；也可以用 `oklch(from …)` 调亮度，并加 `@supports` 兜底。只对颜色类属性做 80–150ms 过渡，按下时不用 `scale()`，用更深一级的颜色或 1px 下移。动效放在 `prefers-reduced-motion: no-preference` 里。
6. **focus ring 是单层 2px outline。** `outline: 2px solid var(--focus)`，`outline-offset: 2px`（实色按钮）或 −2px / −1px（描边和无容器按钮）。只在 `:focus-visible` 上显示。不要双层边框；如果实色按钮上 ring 看不清，按 Primer 的做法在环内加一圈 `inset` 的底色描边。可检查：focus ring 与相邻背景的对比度不低于 3:1。
7. **禁用态用中性灰或统一透明度，并优先不禁用。** 二选一：容器和文字都换成中性灰 token（Radix：文字 gray-a8，底 gray-a3），或者容器 12%、文字 38% 透明度（Material）。不用暖色或米色。表单提交按钮默认不禁用，改为校验后提示；必须禁用时，界面上写清原因。loading 时保持按钮尺寸不变，在按钮内显示 spinner，并保留焦点。
8. **危险按钮平时不做实心红。** 在页面里，危险入口是红字的 secondary 或 ghost 按钮（Polaris plain critical；Primer 的 danger 平时也是默认底色加红字）。实心红只出现在确认对话框里，旁边放一个次要的“取消”。同一视图不同时出现实心 primary 和实心 danger。预览页要展示真实可交互的按钮，让读者自己 hover 和按 Tab；不要做一排写着 “Hover example” 的假按钮。需要静态对照时，用 `data-state` 强制状态并注明是强制显示的。

**实现手段的默认和可选：**

- 默认使用，都是 CSS，不加依赖：`color-mix()`（2023 起 Widely available），`:focus-visible` + `outline`，`prefers-reduced-motion`，`linear()` 做轻微回弹，`@property` 做光泽和进度（不支持时直接跳变，可以接受）。相对颜色语法和 `@starting-style` 也可以用，但要有兜底。
- 用户要求或场景确实需要时再用，仍然不加依赖：View Transitions（2025 年 10 月才 Newly available，需要特性检测），SVG 滤镜，Canvas 粒子（如删除时的灰尘效果）。用的时候都要处理 reduced motion 和读屏用户。
- 只在项目里已经有，或者用户点名时才用：Motion（最少约 5kb，完整 `motion` 组件 43kb 以上）、Rive（wasm 运行时加资源文件）、Lottie（运行时加 JSON 资源）。

## 来源

设计语言：

- Apple HIG Buttons（页面未渲染）：https://developer.apple.com/design/human-interface-guidelines/buttons ；同一页面的官方数据文件：https://developer.apple.com/tutorials/data/design/human-interface-guidelines/buttons.json
- Material 3 按钮规范（未渲染）：https://m3.material.io/components/buttons/specs
- material-web 按钮文档：https://github.com/material-components/material-web/blob/main/docs/components/button.md
- material-web token：https://github.com/material-components/material-web/blob/main/tokens/versions/v0_192/_md-comp-filled-button.scss ，https://github.com/material-components/material-web/blob/main/tokens/versions/v0_192/_md-sys-state.scss ，https://github.com/material-components/material-web/blob/main/tokens/versions/v0_192/_md-sys-typescale.scss ，https://github.com/material-components/material-web/blob/main/tokens/_md-comp-filled-button.scss ，https://github.com/material-components/material-web/blob/main/tokens/_md-comp-focus-ring.scss
- material-web 按钮实现：https://github.com/material-components/material-web/blob/main/button/internal/_shared.scss
- M3 Expressive 尺寸（仅搜索结果，未核实）：https://developer.android.com/reference/kotlin/androidx/compose/material3/ButtonDefaults
- Radix Themes Button：https://www.radix-ui.com/themes/docs/components/button
- Radix Themes 源码：https://github.com/radix-ui/themes/blob/main/packages/radix-ui-themes/src/components/_internal/base-button.css ，https://github.com/radix-ui/themes/blob/main/packages/radix-ui-themes/src/components/button.css ，tokens：https://github.com/radix-ui/themes/tree/main/packages/radix-ui-themes/src/styles/tokens
- Primer Button：https://primer.style/product/components/button/
- Primer React 按钮样式：https://github.com/primer/react/blob/main/packages/react/src/Button/ButtonBase.module.css ；focus mixin：https://github.com/primer/react/blob/main/packages/postcss-preset-primer/src/mixins/focusOutline.css ，https://github.com/primer/react/blob/main/packages/postcss-preset-primer/src/mixins/focusOutlineOnEmphasis.css
- Primer Primitives：https://github.com/primer/primitives/blob/main/src/tokens/functional/size/size.json5 ，https://github.com/primer/primitives/blob/main/src/tokens/functional/size/radius.json5 ，https://github.com/primer/primitives/blob/main/src/tokens/functional/size/border.json5 ，https://github.com/primer/primitives/blob/main/src/tokens/component/button.json5
- Atlassian Button：https://atlassian.design/components/button/usage （正文截断），https://atlassian.design/components/button/examples
- Vercel Geist Button：https://vercel.com/geist/button
- Polaris（Web Components 版）Button：https://shopify.dev/docs/api/app-home/polaris-web-components/actions/button
- Polaris 旧文档源文件：https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/components/actions/button.mdx ；实现：https://github.com/Shopify/polaris/blob/main/polaris-react/src/components/Button/Button.module.css ；token：https://github.com/Shopify/polaris/tree/main/polaris-tokens/src/themes/base

实现手段：

- MDN `color-mix()`：https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix
- MDN 相对颜色：https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_colors/Relative_colors ；`oklch()`：https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch
- web.dev 2024 年 7 月平台更新（相对颜色语法各浏览器版本）：https://web.dev/blog/web-platform-07-2024
- MDN `linear()`：https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function/linear ；Chrome 文档：https://developer.chrome.com/docs/css-ui/css-linear-easing-function
- MDN `@property`：https://developer.mozilla.org/en-US/docs/Web/CSS/@property
- MDN `@starting-style`：https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style ；`transition-behavior`：https://developer.mozilla.org/en-US/docs/Web/CSS/transition-behavior
- MDN `prefers-reduced-motion`：https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- MDN `feTurbulence`：https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feTurbulence
- MDN View Transition API：https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API ；`startViewTransition`：https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition
- Motion 包体积：https://motion.dev/docs/react-reduce-bundle-size ；手势：https://motion.dev/docs/react-gestures ；过渡与弹簧：https://motion.dev/docs/react-transitions
- Rive Web 运行时：https://rive.app/docs/runtimes/web/canvas-vs-webgl ；状态机：https://rive.app/docs/editor/state-machine/state-machine
- lottie-web README：https://github.com/airbnb/lottie-web （文档站 https://lottie.airbnb.tech/ 未渲染）

## 试跑：按新按钮规则生成 Harbor 的设计系统（同日补充）

按上面 8 条重写 `references/ux/component-specs.md` → Button，并接入 `system-decisions.md` §4、`quality-baseline.md` 和 `variant-component` 路由；Step 1 示例里的按钮 token 改成从一个色推导状态（8% / 12%）。随后用 Codex（CLI 0.166.0-alpha.5.1）跑 `harbor-chain --turns generate,pick`：14/14 通过，364 s，约 121 万 token。这一轮 pick 没有改动 B，Step 1b 补充的“pick 不修改”这次生效了。

和上一版（`v4`，同日）比较：

| 规则 | 上一版 | 这一版 |
|---|---|---|
| 按钮文字字体 | Georgia（衬线） | `--font-ui`（`system-ui`），字重 600 |
| 圆角 | 3px（按钮 44px 高） | 8px，所有控件共用一个 token（约为高度的 0.18） |
| 状态 | 一排写着 “Hover example” 的假按钮 | 真实按钮；hover 用 `color-mix(… 8%)`，按下用 `brightness(.92)`；预览写明“悬停、按下、焦点可以在上面的控件上直接试” |
| 危险操作 | 页面上就有实心红按钮 | 实心红只出现在移除确认框里 |
| 主按钮 | 每处都是实心 | 每组只有一个实心主按钮 |

仍然有问题：
- 次要按钮描边用的是输入框的深色边框（`#64765a`）。规范已改为：次要按钮用分隔线的 token，不用输入框边框。
- “取消改角色”和“确认改角色”是两个一样的描边按钮，看不出哪个是下一步。规范已加一条：成对按钮里，完成这一步的那个更强。
- 主按钮是 B 的荧光黄绿配深色文字，字体保留 `system-ui`，理由是“沿用宿主系统字体”。这两点都还是 B 的方向本身带来的。
- 没有写按钮的组件层 token。

以上补充都还没有复测。
